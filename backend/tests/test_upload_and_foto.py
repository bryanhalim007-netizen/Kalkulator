"""SKBike backend tests - image upload + sale foto_path persistence."""
import io
import os
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://cost-to-sales-pro.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _tiny_png_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (8, 8), color=(200, 40, 60)).save(buf, format="PNG")
    return buf.getvalue()


def _tiny_jpg_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (8, 8), color=(10, 200, 90)).save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture(scope="module")
def created_ids():
    return []


# ---- /api/upload ----
class TestUpload:
    def test_upload_png_returns_path(self):
        r = requests.post(f"{API}/upload", files={"file": ("t.png", _tiny_png_bytes(), "image/png")}, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "path" in data and data["path"]
        assert data["path"].endswith(".png")
        # Store for next test
        TestUpload.png_path = data["path"]

    def test_download_png_returns_image(self):
        path = TestUpload.png_path
        r = requests.get(f"{API}/files/{path}", timeout=60)
        assert r.status_code == 200, r.text
        assert r.headers.get("Content-Type", "").startswith("image/")
        assert len(r.content) > 0

    def test_upload_jpg_returns_path(self):
        r = requests.post(f"{API}/upload", files={"file": ("t.jpg", _tiny_jpg_bytes(), "image/jpeg")}, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["path"].endswith(".jpg")
        TestUpload.jpg_path = data["path"]

    def test_upload_empty_file_returns_400(self):
        r = requests.post(f"{API}/upload", files={"file": ("empty.jpg", b"", "image/jpeg")}, timeout=30)
        assert r.status_code == 400, r.text
        assert "kosong" in r.json().get("detail", "").lower()

    def test_download_nonexistent_returns_404(self):
        r = requests.get(f"{API}/files/skbike/uploads/shop/does-not-exist-xyz.jpg", timeout=30)
        assert r.status_code == 404


# ---- Sale + foto_path persistence ----
class TestSaleFotoPath:
    def test_create_sale_with_foto_path_persists(self, created_ids):
        # Upload first
        up = requests.post(f"{API}/upload", files={"file": ("s.jpg", _tiny_jpg_bytes(), "image/jpeg")}, timeout=60)
        assert up.status_code == 200
        foto_path = up.json()["path"]

        payload = {
            "nama_pembeli": "TEST_FotoBuyer",
            "nama_barang": "TEST_FotoBike",
            "kode_barang": "TEST-FOTO-1",
            "harga_modal": 1000000,
            "harga_jual": 1250000,
            "margin": 250000,
            "foto_path": foto_path,
        }
        r = requests.post(f"{API}/sales", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        sale = r.json()
        assert sale["foto_path"] == foto_path
        created_ids.append(sale["id"])
        TestSaleFotoPath.sale_id = sale["id"]
        TestSaleFotoPath.foto_path = foto_path

        # GET verifies persistence
        g = requests.get(f"{API}/sales/{sale['id']}", timeout=30)
        assert g.status_code == 200
        assert g.json()["foto_path"] == foto_path

    def test_put_keeps_foto_path(self):
        sid = TestSaleFotoPath.sale_id
        foto_path = TestSaleFotoPath.foto_path
        payload = {
            "nama_pembeli": "TEST_FotoBuyer_Updated",
            "nama_barang": "TEST_FotoBike",
            "harga_modal": 1000000,
            "harga_jual": 1300000,
            "margin": 300000,
            "foto_path": foto_path,  # keep
        }
        r = requests.put(f"{API}/sales/{sid}", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        sale = r.json()
        assert sale["foto_path"] == foto_path
        assert sale["nama_pembeli"] == "TEST_FotoBuyer_Updated"
        assert sale["harga_jual"] == 1300000

    def test_put_changes_foto_path(self):
        sid = TestSaleFotoPath.sale_id
        # Upload a new image
        up = requests.post(f"{API}/upload", files={"file": ("s2.png", _tiny_png_bytes(), "image/png")}, timeout=60)
        assert up.status_code == 200
        new_path = up.json()["path"]
        assert new_path != TestSaleFotoPath.foto_path

        payload = {"nama_pembeli": "TEST_FotoBuyer_Updated", "foto_path": new_path}
        r = requests.put(f"{API}/sales/{sid}", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["foto_path"] == new_path

        g = requests.get(f"{API}/sales/{sid}", timeout=30)
        assert g.json()["foto_path"] == new_path

    def test_put_clears_foto_path_when_null(self):
        sid = TestSaleFotoPath.sale_id
        payload = {"nama_pembeli": "TEST_FotoBuyer_Updated", "foto_path": None}
        r = requests.put(f"{API}/sales/{sid}", json=payload, timeout=30)
        assert r.status_code == 200
        assert r.json()["foto_path"] is None

    def test_cleanup(self, created_ids):
        for sid in created_ids:
            requests.delete(f"{API}/sales/{sid}", timeout=30)
