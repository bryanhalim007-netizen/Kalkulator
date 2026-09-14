# Backend tests for PUT /api/sales/{id} (Edit Penjualan feature)
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
def created_sale(api_client):
    payload = {
        "tanggal_penjualan": "10 januari 2026",
        "nama_pembeli": "TEST_Original Buyer",
        "nama_barang": "TEST_Sepeda Lipat",
        "kode_barang": "TEST-SPD-001",
        "ukuran_warna": "20 inci, Biru",
        "kode_huruf": "YVK",
        "harga_modal": 1000000,
        "harga_jual": 1500000,
        "margin": 500000,
        "metode_pembayaran": "Cash",
        "sudah_diambil": "Belum",
        "metode_pengambilan": "Pick up Sendiri",
        "alamat_pengiriman": None,
    }
    r = api_client.post(f"{API}/sales", json=payload)
    assert r.status_code == 200, f"POST failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["id"]
    assert data["nama_pembeli"] == "TEST_Original Buyer"
    yield data
    # cleanup
    api_client.delete(f"{API}/sales/{data['id']}")


# --- PUT /api/sales/{id} ---
class TestUpdateSale:
    def test_put_updates_fields_and_persists(self, api_client, created_sale):
        sale_id = created_sale["id"]
        updated_payload = {
            "tanggal_penjualan": "10 januari 2026",
            "nama_pembeli": "TEST_Updated Buyer",
            "nama_barang": "TEST_Sepeda Lipat",
            "kode_barang": "TEST-SPD-001",
            "ukuran_warna": "20 inci, Biru",
            "kode_huruf": "YVK",
            "harga_modal": 1000000,
            "harga_jual": 1750000,  # changed
            "margin": 750000,       # changed
            "metode_pembayaran": "Transfer",  # changed
            "sudah_diambil": "Belum",
            "metode_pengambilan": "Pick up Sendiri",
            "alamat_pengiriman": None,
        }
        r = api_client.put(f"{API}/sales/{sale_id}", json=updated_payload)
        assert r.status_code == 200, f"PUT failed: {r.status_code} {r.text}"
        data = r.json()
        assert data["id"] == sale_id
        assert data["nama_pembeli"] == "TEST_Updated Buyer"
        assert data["harga_jual"] == 1750000
        assert data["margin"] == 750000
        assert data["metode_pembayaran"] == "Transfer"

        # GET to confirm persistence
        g = api_client.get(f"{API}/sales/{sale_id}")
        assert g.status_code == 200
        got = g.json()
        assert got["nama_pembeli"] == "TEST_Updated Buyer"
        assert got["harga_jual"] == 1750000
        assert got["margin"] == 750000
        assert got["metode_pembayaran"] == "Transfer"

    def test_put_nonexistent_returns_404(self, api_client):
        r = api_client.put(
            f"{API}/sales/nonexistent-id-xyz-123",
            json={"nama_pembeli": "TEST_ghost"},
        )
        assert r.status_code == 404, f"expected 404 got {r.status_code}: {r.text}"

    def test_put_preserves_id_and_created_at(self, api_client, created_sale):
        sale_id = created_sale["id"]
        original_created_at = created_sale["created_at"]
        r = api_client.put(
            f"{API}/sales/{sale_id}",
            json={"nama_pembeli": "TEST_Second Update"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == sale_id
        assert data["created_at"] == original_created_at


# --- Regression: create + delete still work ---
class TestSalesCRUDRegression:
    def test_create_then_delete(self, api_client):
        payload = {
            "nama_pembeli": "TEST_Regression",
            "nama_barang": "TEST_Bike",
            "harga_jual": 500000,
        }
        r = api_client.post(f"{API}/sales", json=payload)
        assert r.status_code == 200
        sid = r.json()["id"]

        d = api_client.delete(f"{API}/sales/{sid}")
        assert d.status_code == 200

        # GET should now 404
        g = api_client.get(f"{API}/sales/{sid}")
        assert g.status_code == 404
