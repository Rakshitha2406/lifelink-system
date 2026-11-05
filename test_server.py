import json
from app import app

def test_endpoints():
    print("=" * 60)
    print("Testing Flask Application Endpoints & Database Integration")
    print("=" * 60)

    client = app.test_client()

    # 1. Test Root Page HTML
    res = client.get('/')
    assert res.status_code == 200, f"Root returned {res.status_code}"
    html = res.data.decode('utf-8')
    assert "LifeLink" in html, "LifeLink brand missing from root HTML"
    assert "Seshadri" not in html, "College name found in root HTML!"
    assert "CSP Report" not in html, "CSP Report found in root HTML!"
    assert "Feedback" not in html, "Feedback found in root HTML!"
    print("[OK] GET / -> 200 OK (Clean HTML without college/CSP details)")

    # 2. Test /api/status
    res = client.get('/api/status')
    assert res.status_code == 200
    status_data = json.loads(res.data)
    print(f"[OK] GET /api/status -> 200 OK (DB: {status_data.get('database')}, Counts: {status_data.get('counts')})")

    # 3. Test /api/sources (Blood Banks)
    res = client.get('/api/sources')
    assert res.status_code == 200
    sources = json.loads(res.data)
    assert len(sources) >= 6, f"Expected at least 6 sources, got {len(sources)}"
    print(f"[OK] GET /api/sources -> 200 OK ({len(sources)} facilities loaded)")

    # 4. Test /api/donors
    res = client.get('/api/donors')
    assert res.status_code == 200
    donors = json.loads(res.data)
    assert len(donors) >= 8, f"Expected at least 8 donors, got {len(donors)}"
    print(f"[OK] GET /api/donors -> 200 OK ({len(donors)} voluntary donors loaded)")

    # 5. Test /api/hospitals
    res = client.get('/api/hospitals')
    assert res.status_code == 200
    hospitals = json.loads(res.data)
    assert len(hospitals) >= 4, f"Expected at least 4 hospitals, got {len(hospitals)}"
    print(f"[OK] GET /api/hospitals -> 200 OK ({len(hospitals)} hospitals loaded)")

    # 6. Test /api/requests (GET)
    res = client.get('/api/requests')
    assert res.status_code == 200
    reqs = json.loads(res.data)
    assert len(reqs) >= 3, f"Expected at least 3 initial requests, got {len(reqs)}"
    print(f"[OK] GET /api/requests -> 200 OK ({len(reqs)} active requisitions loaded)")

    # 7. Test /api/requests (POST new requisition)
    new_req_payload = {
        'hospitalId': 'HOSP-001',
        'hospitalName': 'Metro Emergency & Trauma Care',
        'patientName': 'Integration Test Patient',
        'patientId': 'MRN-TEST-100',
        'bloodGroup': 'O+',
        'component': 'prbc',
        'unitsRequired': 2,
        'urgency': 'CRITICAL',
        'clinicalReason': 'Emergency test trauma resuscitation',
        'contactPerson': 'Dr. Test Lead',
        'contactPhone': '+91 99999 88888',
        'lat': 16.3470,
        'lng': 81.0420
    }
    res = client.post('/api/requests', json=new_req_payload)
    assert res.status_code == 201, f"POST /api/requests returned {res.status_code}"
    post_data = json.loads(res.data)
    assert 'request' in post_data
    assert 'matchResult' in post_data
    print(f"[OK] POST /api/requests -> 201 Created (Matched with: {post_data['request'].get('matchedSource')})")

    # 8. Test /api/sources/<id>/stock (POST inventory update)
    stock_payload = {
        'bloodGroup': 'O+',
        'component': 'prbc',
        'units': 25
    }
    res = client.post('/api/sources/SRC-001/stock', json=stock_payload)
    assert res.status_code == 200
    print("[OK] POST /api/sources/SRC-001/stock -> 200 OK (Database stock updated to 25)")

    # 9. Test /api/donors (POST register donor)
    new_donor = {
        'name': 'Test Voluntary Donor',
        'bloodGroup': 'O-',
        'phone': '+91 98765 43210',
        'email': 'test.donor@example.com',
        'city': 'Vijayawada',
        'address': 'Ring Road Sector 1'
    }
    res = client.post('/api/donors', json=new_donor)
    assert res.status_code == 201
    print("[OK] POST /api/donors -> 201 Created (Persisted new donor into database)")

    # 10. Test /api/match (Matching calculation)
    match_payload = {
        'bloodGroup': 'O-',
        'component': 'prbc',
        'unitsRequired': 5,
        'urgency': 'CRITICAL',
        'lat': 16.3470,
        'lng': 81.0420
    }
    res = client.post('/api/match', json=match_payload)
    assert res.status_code == 200
    match_data = json.loads(res.data)
    assert 'rankedSources' in match_data
    assert match_data.get('isShortage') is True, "Shortage pooling should trigger for 5 units O-"
    print(f"[OK] POST /api/match -> 200 OK (Multi-source pooling: {len(match_data.get('poolingPlan'))} centers pooled)")

    print("=" * 60)
    print("ALL API & DATABASE INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    test_endpoints()
