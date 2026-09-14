from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
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


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "BikePOS API"}


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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
