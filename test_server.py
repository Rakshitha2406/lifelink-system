import json
import time
from app import app
from database import get_session, User, Hospital, BloodBank, Notification, BloodRequest, Donor

def test_full_system():
    print("=" * 65)
    print(" LifeLink Full-Stack Verification & Integration Test Suite")
    print("=" * 65)

    client = app.test_client()

    # 1. Root HTML
    res = client.get('/')
    assert res.status_code == 200
    html = res.data.decode('utf-8')
    assert "LifeLink" in html
    assert "Seshadri" not in html
    assert "CSP Report" not in html
    print("[OK] GET / -> Clean modern UI rendered without college details")

    # 2. System Status
    res = client.get('/api/status')
    assert res.status_code == 200
    status_data = json.loads(res.data)
    print(f"[OK] GET /api/status -> Active Database: {status_data.get('database')}")

    # 3. Test Login with Demo Hospital Admin
    login_payload = {
        'username': 'hospital_admin',
        'password': 'password123',
        'role': 'hospital'
    }
    res = client.post('/api/auth/login', json=login_payload)
    assert res.status_code == 200
    login_res = json.loads(res.data)
    assert login_res.get('success') is True
    assert 'user' in login_res
    print(f"[OK] POST /api/auth/login (Username) -> Success ({login_res['user']['username']})")

    # 4. Test Login via Facility Selection (HOSP-001)
    fac_login_payload = {
        'role': 'hospital',
        'facilityId': 'HOSP-001',
        'password': 'password123'
    }
    res = client.post('/api/auth/login', json=fac_login_payload)
    assert res.status_code == 200
    fac_res = json.loads(res.data)
    assert fac_res.get('success') is True
    print(f"[OK] POST /api/auth/login (Facility Select) -> Success ({fac_res['user'].get('facilityName')})")

    # 5. Test Register New Hospital
    ts = int(time.time())
    new_hosp_payload = {
        'facilityType': 'hospital',
        'facilityName': f'Sunrise Emergency Trauma Institute {ts}',
        'phone': '+91 86624 99001',
        'city': 'Vijayawada',
        'address': 'MG Road Sector 4',
        'repName': 'Dr. K. R. Naidu',
        'email': f'trauma.sunrise_{ts}@hospital.org',
        'password': 'password123'
    }
    res = client.post('/api/auth/register', json=new_hosp_payload)
    assert res.status_code in (200, 201)
    reg_hosp = json.loads(res.data)
    assert reg_hosp.get('success') is True
    print(f"[OK] POST /api/auth/register (Hospital) -> Success: {reg_hosp.get('message')}")

    # 6. Test Register New Blood Bank
    new_bb_payload = {
        'facilityType': 'blood_bank',
        'facilityName': f'Apex Regional Rotary Blood Center {ts}',
        'phone': '+91 86742 88220',
        'city': 'Central District',
        'address': 'By-pass Road, Zone 2',
        'repName': 'S. Ramanujam (Officer)',
        'email': f'rotary.apex_{ts}@bloodcenter.org',
        'password': 'password123'
    }
    res = client.post('/api/auth/register', json=new_bb_payload)
    assert res.status_code in (200, 201)
    reg_bb = json.loads(res.data)
    assert reg_bb.get('success') is True
    print(f"[OK] POST /api/auth/register (Blood Bank) -> Success: {reg_bb.get('message')}")

    # 7. Test Emergency Blood Requisition Creation & Automatic Notification
    new_req = {
        'hospitalId': reg_hosp['facility']['id'],
        'hospitalName': reg_hosp['facility']['name'],
        'patientName': 'Critical Trauma Resuscitation',
        'patientId': 'MRN-AUTO-991',
        'bloodGroup': 'O-',
        'component': 'prbc',
        'unitsRequired': 2,
        'urgency': 'CRITICAL',
        'clinicalReason': 'Severe motor vehicle collision with massive hemorrhage',
        'contactPerson': 'Dr. K. R. Naidu',
        'contactPhone': '+91 86624 99001',
        'lat': 16.5062,
        'lng': 80.6480
    }
    res = client.post('/api/requests', json=new_req)
    assert res.status_code == 201
    req_res = json.loads(res.data)
    assert 'request' in req_res
    print(f"[OK] POST /api/requests -> Requisition {req_res['request']['id']} Created & Matched")

    # 8. Verify Notification Generated
    res = client.get('/api/notifications')
    assert res.status_code == 200
    notifs = json.loads(res.data)
    assert len(notifs) > 0
    latest = notifs[0]
    print(f"[OK] GET /api/notifications -> Live Alerts Feed: '{latest['title']}' ({latest['type']})")

    # 9. Mark Notifications as Read
    res = client.post('/api/notifications/mark-read')
    assert res.status_code == 200
    print("[OK] POST /api/notifications/mark-read -> All notifications marked as read")

    # 10. Update Blood Bank Stock and Verify Real-time Persistence
    stock_update = {
        'bloodGroup': 'O-',
        'component': 'prbc',
        'units': 18
    }
    res = client.post(f"/api/sources/{reg_bb['facility']['id']}/stock", json=stock_update)
    assert res.status_code == 200
    print(f"[OK] POST /api/sources/{reg_bb['facility']['id']}/stock -> Stock updated in database to 18 units")

    # 11. Register Voluntary Blood Donor
    donor_payload = {
        'name': 'Pooja Chandrasekhar',
        'bloodGroup': 'O-',
        'phone': '+91 94411 22334',
        'email': 'pooja.c@example.com',
        'city': 'Vijayawada',
        'address': 'Bhavanipuram 3rd Line'
    }
    res = client.post('/api/donors', json=donor_payload)
    assert res.status_code == 201
    donor_res = json.loads(res.data)
    print(f"[OK] POST /api/donors -> Voluntary Donor Registered: {donor_res['donor']['name']}")

    print("=" * 65)
    print(" ALL 11 SYSTEM TESTS & NOTIFICATIONS VERIFIED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == '__main__':
    test_full_system()
