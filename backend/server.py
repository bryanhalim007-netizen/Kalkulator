from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Response
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ---------------------------------------------------------------------------
# Emergent Object Storage
# ---------------------------------------------------------------------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "skbike"
storage_key = None


def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple:
    global storage_key
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    if resp.status_code == 503:
        storage_key = None
        key = init_storage()
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60,
        )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class Sale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tanggal_penjualan: Optional[str] = None
    nama_pembeli: Optional[str] = None
    nama_barang: Optional[str] = None
    kode_barang: Optional[str] = None
    ukuran_warna: Optional[str] = None
    kode_huruf: Optional[str] = None
    harga_modal: Optional[float] = None
    harga_jual: Optional[float] = None
    margin: Optional[float] = None
    metode_pembayaran: Optional[str] = None
    sudah_diambil: Optional[str] = None
    metode_pengambilan: Optional[str] = None
    alamat_pengiriman: Optional[str] = None
    foto_path: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    deleted_at: Optional[str] = None


class SaleCreate(BaseModel):
    tanggal_penjualan: Optional[str] = None
    nama_pembeli: Optional[str] = None
    nama_barang: Optional[str] = None
    kode_barang: Optional[str] = None
    ukuran_warna: Optional[str] = None
    kode_huruf: Optional[str] = None
    harga_modal: Optional[float] = None
    harga_jual: Optional[float] = None
    margin: Optional[float] = None
    metode_pembayaran: Optional[str] = None
    sudah_diambil: Optional[str] = None
    metode_pengambilan: Optional[str] = None
    alamat_pengiriman: Optional[str] = None
    foto_path: Optional[str] = None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "BikePOS API"}


EXT_BY_TYPE = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
}


@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File kosong")
    content_type = file.content_type or "image/jpeg"
    ext = EXT_BY_TYPE.get(content_type, "jpg")
    path = f"{APP_NAME}/uploads/shop/{uuid.uuid4()}.{ext}"
    try:
        await run_in_threadpool(put_object, path, content, content_type)
    except requests.HTTPError as e:
        status = e.response.status_code if e.response is not None else 500
        if status == 402:
            raise HTTPException(status_code=402, detail="Kuota penyimpanan habis")
        raise HTTPException(status_code=502, detail="Gagal mengunggah gambar")
    await db.uploads.insert_one({"path": path, "content_type": content_type, "created_at": now_iso()})
    return {"path": path}


@api_router.get("/files/{path:path}")
async def download_file(path: str):
    doc = await db.uploads.find_one({"path": path})
    if not doc:
        raise HTTPException(status_code=404, detail="File tidak ditemukan")
    try:
        data, content_type = await run_in_threadpool(get_object, path)
    except requests.HTTPError:
        raise HTTPException(status_code=404, detail="File tidak ditemukan")
    return Response(content=data, media_type=content_type)


@api_router.post("/sales", response_model=Sale)
async def create_sale(payload: SaleCreate):
    sale = Sale(**payload.dict())
    await db.sales.insert_one(sale.dict())
    return sale


@api_router.get("/sales", response_model=List[Sale])
async def list_sales():
    docs = await db.sales.find({"deleted_at": None}).sort("created_at", -1).to_list(1000)
    return [Sale(**{k: v for k, v in doc.items() if k != "_id"}) for doc in docs]


@api_router.get("/sales/{sale_id}", response_model=Sale)
async def get_sale(sale_id: str):
    doc = await db.sales.find_one({"id": sale_id, "deleted_at": None})
    if not doc:
        raise HTTPException(status_code=404, detail="Penjualan tidak ditemukan")
    return Sale(**{k: v for k, v in doc.items() if k != "_id"})


@api_router.put("/sales/{sale_id}", response_model=Sale)
async def update_sale(sale_id: str, payload: SaleCreate):
    doc = await db.sales.find_one({"id": sale_id, "deleted_at": None})
    if not doc:
        raise HTTPException(status_code=404, detail="Penjualan tidak ditemukan")
    await db.sales.update_one({"id": sale_id}, {"$set": payload.dict()})
    updated = await db.sales.find_one({"id": sale_id})
    return Sale(**{k: v for k, v in updated.items() if k != "_id"})


@api_router.delete("/sales/{sale_id}")
async def delete_sale(sale_id: str):
    result = await db.sales.update_one(
        {"id": sale_id, "deleted_at": None},
        {"$set": {"deleted_at": now_iso()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Penjualan tidak ditemukan")
    return {"ok": True}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_init_storage():
    try:
        await run_in_threadpool(init_storage)
        logger.info("Object storage initialized")
    except Exception as e:
        logger.warning(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
