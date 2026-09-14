"""BikePOS backend API tests - Sales CRUD & soft delete."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://cost-to-sales-pro.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created_ids():
    return []


# ---- Health ----
class TestHealth:
    def test_root(self, api_client):
        r = api_client.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("message") == "BikePOS API"


# ---- Sales CRUD ----
class TestSalesCRUD:
    def test_create_sale_full_payload(self, api_client, created_ids):
        payload = {
            "tanggal_penjualan": "12 Juni 2026",
            "nama_pembeli": "TEST_Budi",
            "nama_barang": "TEST_Sepeda Lipat",
            "kode_barang": "TEST-SPD-001",
            "ukuran_warna": "26 inci, Merah",
            "kode_huruf": "YVK",
            "harga_modal": 1350000,
            "harga_jual": 1600000,
            "margin": 250000,
        }
        r = api_client.post(f"{API}/sales", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"]
        assert data["nama_pembeli"] == "TEST_Budi"
        assert data["harga_modal"] == 1350000
        assert data["harga_jual"] == 1600000
        assert data["margin"] == 250000
        assert data["kode_huruf"] == "YVK"
        assert data["deleted_at"] is None
        assert "created_at" in data
        assert "_id" not in data  # ObjectId must be excluded
        created_ids.append(data["id"])

    def test_create_sale_all_optional_empty(self, api_client, created_ids):
        r = api_client.post(f"{API}/sales", json={})
        assert r.status_code == 200
        data = r.json()
        assert data["id"]
        assert data["nama_barang"] is None
        assert data["harga_modal"] is None
        created_ids.append(data["id"])

    def test_get_sale_by_id(self, api_client, created_ids):
        sid = created_ids[0]
        r = api_client.get(f"{API}/sales/{sid}")
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == sid
        assert data["nama_pembeli"] == "TEST_Budi"
        assert "_id" not in data

    def test_get_sale_not_found(self, api_client):
        r = api_client.get(f"{API}/sales/does-not-exist-xyz")
        assert r.status_code == 404

    def test_list_sales_contains_created(self, api_client, created_ids):
        r = api_client.get(f"{API}/sales")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        ids = {s["id"] for s in arr}
        for cid in created_ids:
            assert cid in ids
        # No ObjectId leak
        for s in arr:
            assert "_id" not in s
            assert s.get("deleted_at") is None

    def test_delete_sale_soft(self, api_client, created_ids):
        sid = created_ids[0]
        r = api_client.delete(f"{API}/sales/{sid}")
        assert r.status_code == 200
        assert r.json().get("ok") is True

        # GET should now 404 (filters deleted_at)
        r2 = api_client.get(f"{API}/sales/{sid}")
        assert r2.status_code == 404

        # List should not contain it
        r3 = api_client.get(f"{API}/sales")
        assert sid not in {s["id"] for s in r3.json()}

    def test_delete_already_deleted_returns_404(self, api_client, created_ids):
        sid = created_ids[0]  # already deleted above
        r = api_client.delete(f"{API}/sales/{sid}")
        assert r.status_code == 404

    def test_cleanup(self, api_client, created_ids):
        # Soft delete remaining
        for sid in created_ids[1:]:
            api_client.delete(f"{API}/sales/{sid}")
