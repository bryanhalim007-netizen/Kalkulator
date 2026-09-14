"""Backend tests for /api/sales with the new fields:
metode_pembayaran, sudah_diambil, metode_pengambilan, alamat_pengiriman.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://cost-to-sales-pro.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created_ids():
    ids = []
    yield ids
    # cleanup
    for _id in ids:
        try:
            requests.delete(f"{BASE_URL}/api/sales/{_id}", timeout=10)
        except Exception:
            pass


# --- Health/root ---
def test_root(api_client):
    r = api_client.get(f"{BASE_URL}/api/", timeout=10)
    assert r.status_code == 200
    assert r.json().get("message")


# --- Create sale with all new fields ---
def test_create_sale_with_new_fields(api_client, created_ids):
    payload = {
        "tanggal_penjualan": "05 Januari 2026",
        "nama_pembeli": "TEST_Buyer",
        "nama_barang": "TEST_Bike",
        "kode_barang": "TEST-001",
        "ukuran_warna": "26 inci, Merah",
        "kode_huruf": "YVK",
        "harga_modal": 1000000,
        "harga_jual": 1500000,
        "margin": 500000,
        "metode_pembayaran": "Cash",
        "sudah_diambil": "Sudah",
        "metode_pengambilan": "Travel",
        "alamat_pengiriman": "Jl. Merdeka No. 1, Surabaya",
    }
    r = api_client.post(f"{BASE_URL}/api/sales", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    created_ids.append(data["id"])

    # Validate all new fields are echoed
    assert data["metode_pembayaran"] == "Cash"
    assert data["sudah_diambil"] == "Sudah"
    assert data["metode_pengambilan"] == "Travel"
    assert data["alamat_pengiriman"] == "Jl. Merdeka No. 1, Surabaya"
    assert data["tanggal_penjualan"] == "05 Januari 2026"
    assert data["id"] and data["created_at"]


# --- Persistence: GET /sales/{id} ---
def test_get_sale_persisted(api_client, created_ids):
    assert created_ids, "prior create test must run first"
    sid = created_ids[0]
    r = api_client.get(f"{BASE_URL}/api/sales/{sid}", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data["metode_pembayaran"] == "Cash"
    assert data["sudah_diambil"] == "Sudah"
    assert data["metode_pengambilan"] == "Travel"
    assert data["alamat_pengiriman"] == "Jl. Merdeka No. 1, Surabaya"


# --- List returns new fields ---
def test_list_sales_contains_new_fields(api_client, created_ids):
    sid = created_ids[0]
    r = api_client.get(f"{BASE_URL}/api/sales", timeout=10)
    assert r.status_code == 200
    items = r.json()
    match = next((x for x in items if x["id"] == sid), None)
    assert match is not None, "created sale not in list"
    for k in ("metode_pembayaran", "sudah_diambil", "metode_pengambilan", "alamat_pengiriman"):
        assert k in match


# --- Create with all optional fields None ---
def test_create_sale_all_optional_none(api_client, created_ids):
    r = api_client.post(f"{BASE_URL}/api/sales", json={}, timeout=10)
    assert r.status_code == 200
    data = r.json()
    created_ids.append(data["id"])
    assert data["metode_pembayaran"] is None
    assert data["sudah_diambil"] is None
    assert data["metode_pengambilan"] is None
    assert data["alamat_pengiriman"] is None


# --- Partial new fields ---
def test_create_sale_partial_new_fields(api_client, created_ids):
    payload = {
        "nama_barang": "TEST_Partial",
        "metode_pembayaran": "Transfer",
        "sudah_diambil": "Belum",
    }
    r = api_client.post(f"{BASE_URL}/api/sales", json=payload, timeout=10)
    assert r.status_code == 200
    data = r.json()
    created_ids.append(data["id"])
    assert data["metode_pembayaran"] == "Transfer"
    assert data["sudah_diambil"] == "Belum"
    assert data["metode_pengambilan"] is None
    assert data["alamat_pengiriman"] is None


# --- Soft delete works ---
def test_delete_sale(api_client, created_ids):
    sid = created_ids[-1]
    r = api_client.delete(f"{BASE_URL}/api/sales/{sid}", timeout=10)
    assert r.status_code == 200
    r2 = api_client.get(f"{BASE_URL}/api/sales/{sid}", timeout=10)
    assert r2.status_code == 404
    created_ids.remove(sid)
