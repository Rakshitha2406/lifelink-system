import datetime
from werkzeug.security import generate_password_hash

DEFAULT_HOSPITALS = [
    {
        'id': 'HOSP-001',
        'name': 'Metro Emergency & Trauma Care',
        'email': 'emergency@metrocare.org',
        'phone': '+91 86742 55900',
        'address': 'Main Hospital Road, Gudlavalleru Sector 2',
        'city': 'Gudlavalleru',
        'lat': 16.3470,
        'lng': 81.0420,
        'rep_name': 'Dr. K. S. Sharma (Trauma Lead)',
        'license_no': 'HOSP-AP-2023-8821'
    },
    {
        'id': 'HOSP-002',
        'name': 'Machilipatnam Coastal Care Hospital',
        'email': 'requisitions@coastalcare.in',
        'phone': '+91 86722 24500',
        'address': 'Collectorate Junction, Machilipatnam',
        'city': 'Machilipatnam',
        'lat': 16.1820,
        'lng': 81.1350,
        'rep_name': 'Dr. P. V. Rao (Chief Medical Officer)',
        'license_no': 'HOSP-AP-2021-4190'
    },
    {
        'id': 'HOSP-003',
        'name': 'Vijayawada Apex Institute of Medical Sciences',
        'email': 'blood.order@vijayawadaapex.org',
        'phone': '+91 86625 90120',
        'address': 'Ring Road, Near Benz Circle, Vijayawada',
        'city': 'Vijayawada',
        'lat': 16.5062,
        'lng': 80.6480,
        'rep_name': 'Dr. Ananya Reddy (Blood Bank Liaison)',
        'license_no': 'HOSP-AP-2020-1104'
    },
    {
        'id': 'HOSP-004',
        'name': 'Tenali Multi-Speciality Care Hospital',
        'email': 'emergency@tenalicare.in',
        'phone': '+91 86442 33110',
        'address': 'Station Road, Tenali',
        'city': 'Tenali',
        'lat': 16.2430,
        'lng': 80.6400,
        'rep_name': 'Dr. M. Sridhar (ICU Superintendent)',
        'license_no': 'HOSP-AP-2022-7741'
    }
]

DEFAULT_BLOOD_BANKS = [
    {
        'id': 'SRC-001',
        'name': 'Central Life Community Blood Bank',
        'type': 'Community Blood Center',
        'category': 'blood_bank',
        'contact_person': 'Dr. K. Srinivas (In-Charge)',
        'phone': '+91 86742 55101',
        'email': 'central.bb@lifelink-network.in',
        'address': 'Main Road, Near Bus Stand, Gudlavalleru',
        'city': 'Gudlavalleru',
        'lat': 16.3458,
        'lng': 81.0452,
        'verified': True,
        'operating_hours': '24/7 Emergency Service',
        'inventory': {
            'A+':  {'whole_blood': 6,  'prbc': 12, 'platelets': 5,  'ffp': 8,  'cryo': 2},
            'A-':  {'whole_blood': 1,  'prbc': 3,  'platelets': 1,  'ffp': 2,  'cryo': 0},
            'B+':  {'whole_blood': 8,  'prbc': 14, 'platelets': 6,  'ffp': 10, 'cryo': 4},
            'B-':  {'whole_blood': 2,  'prbc': 2,  'platelets': 0,  'ffp': 1,  'cryo': 0},
            'AB+': {'whole_blood': 4,  'prbc': 6,  'platelets': 3,  'ffp': 4,  'cryo': 1},
            'AB-': {'whole_blood': 0,  'prbc': 1,  'platelets': 0,  'ffp': 1,  'cryo': 0},
            'O+':  {'whole_blood': 10, 'prbc': 20, 'platelets': 8,  'ffp': 12, 'cryo': 5},
            'O-':  {'whole_blood': 2,  'prbc': 4,  'platelets': 2,  'ffp': 3,  'cryo': 1}
        }
    },
    {
        'id': 'SRC-002',
        'name': 'District Red Cross Society Blood Center',
        'type': 'Red Cross Society Center',
        'category': 'blood_bank',
        'contact_person': 'M. Lakshmi Narayana (Transfusion Officer)',
        'phone': '+91 86722 22890',
        'email': 'redcross.mtm@lifelink-network.in',
        'address': 'Near District Hospital, Machilipatnam',
        'city': 'Machilipatnam',
        'lat': 16.1875,
        'lng': 81.1389,
        'verified': True,
        'operating_hours': '24/7 Emergency Service',
        'inventory': {
            'A+':  {'whole_blood': 4,  'prbc': 8,  'platelets': 3,  'ffp': 5,  'cryo': 1},
            'A-':  {'whole_blood': 2,  'prbc': 2,  'platelets': 1,  'ffp': 2,  'cryo': 0},
            'B+':  {'whole_blood': 7,  'prbc': 11, 'platelets': 4,  'ffp': 6,  'cryo': 2},
            'B-':  {'whole_blood': 1,  'prbc': 1,  'platelets': 0,  'ffp': 1,  'cryo': 0},
            'AB+': {'whole_blood': 3,  'prbc': 5,  'platelets': 2,  'ffp': 3,  'cryo': 1},
            'AB-': {'whole_blood': 1,  'prbc': 2,  'platelets': 0,  'ffp': 1,  'cryo': 0},
            'O+':  {'whole_blood': 9,  'prbc': 15, 'platelets': 6,  'ffp': 9,  'cryo': 3},
            'O-':  {'whole_blood': 3,  'prbc': 5,  'platelets': 1,  'ffp': 2,  'cryo': 1}
        }
    },
    {
        'id': 'SRC-003',
        'name': 'Government General Hospital Apex Blood Bank',
        'type': 'Apex Tertiary Blood Centre',
        'category': 'hospital_center',
        'contact_person': 'Dr. V. Ramana Rao (HOD Blood Bank)',
        'phone': '+91 86625 78441',
        'email': 'ggh.vijayawada@lifelink-network.in',
        'address': 'Hanumanpet, Opposite Railway Station, Vijayawada',
        'city': 'Vijayawada',
        'lat': 16.5131,
        'lng': 80.6325,
        'verified': True,
        'operating_hours': '24/7 Apex Facility',
        'inventory': {
            'A+':  {'whole_blood': 15, 'prbc': 30, 'platelets': 12, 'ffp': 25, 'cryo': 10},
            'A-':  {'whole_blood': 4,  'prbc': 8,  'platelets': 3,  'ffp': 6,  'cryo': 2},
            'B+':  {'whole_blood': 18, 'prbc': 35, 'platelets': 14, 'ffp': 28, 'cryo': 8},
            'B-':  {'whole_blood': 3,  'prbc': 6,  'platelets': 2,  'ffp': 4,  'cryo': 1},
            'AB+': {'whole_blood': 8,  'prbc': 16, 'platelets': 6,  'ffp': 10, 'cryo': 4},
            'AB-': {'whole_blood': 2,  'prbc': 4,  'platelets': 1,  'ffp': 3,  'cryo': 1},
            'O+':  {'whole_blood': 22, 'prbc': 45, 'platelets': 18, 'ffp': 35, 'cryo': 12},
            'O-':  {'whole_blood': 5,  'prbc': 10, 'platelets': 4,  'ffp': 7,  'cryo': 3}
        }
    },
    {
        'id': 'SRC-004',
        'name': 'City Emergency Regional Blood Center',
        'type': 'Accredited Hospital Blood Store',
        'category': 'hospital_center',
        'contact_person': 'Sister Grace K. (Shift Supervisor)',
        'phone': '+91 86624 33000',
        'email': 'cityemergency.bb@lifelink-network.in',
        'address': 'Suryaraopet, Governorpet, Vijayawada',
        'city': 'Vijayawada',
        'lat': 16.5090,
        'lng': 80.6400,
        'verified': True,
        'operating_hours': '24/7 Transfusion Wing',
        'inventory': {
            'A+':  {'whole_blood': 5,  'prbc': 10, 'platelets': 4,  'ffp': 7,  'cryo': 2},
            'A-':  {'whole_blood': 1,  'prbc': 2,  'platelets': 0,  'ffp': 1,  'cryo': 0},
            'B+':  {'whole_blood': 6,  'prbc': 12, 'platelets': 5,  'ffp': 8,  'cryo': 3},
            'B-':  {'whole_blood': 0,  'prbc': 1,  'platelets': 0,  'ffp': 1,  'cryo': 0},
            'AB+': {'whole_blood': 2,  'prbc': 4,  'platelets': 2,  'ffp': 3,  'cryo': 1},
            'AB-': {'whole_blood': 0,  'prbc': 0,  'platelets': 0,  'ffp': 0,  'cryo': 0},
            'O+':  {'whole_blood': 8,  'prbc': 16, 'platelets': 6,  'ffp': 11, 'cryo': 4},
            'O-':  {'whole_blood': 1,  'prbc': 2,  'platelets': 1,  'ffp': 1,  'cryo': 0}
        }
    },
    {
        'id': 'SRC-005',
        'name': 'Tenali Sub-District Blood Bank',
        'type': 'Government Sub-District Blood Center',
        'category': 'blood_bank',
        'contact_person': 'P. Bapuji (Senior Lab Tech)',
        'phone': '+91 86442 27715',
        'email': 'tenali.sdh@lifelink-network.in',
        'address': 'Near Taluka Karyalayam, Tenali',
        'city': 'Tenali',
        'lat': 16.2410,
        'lng': 80.6475,
        'verified': True,
        'operating_hours': '8:00 AM - 8:00 PM (On-Call Night Service)',
        'inventory': {
            'A+':  {'whole_blood': 3,  'prbc': 5,  'platelets': 1,  'ffp': 4,  'cryo': 0},
            'A-':  {'whole_blood': 0,  'prbc': 1,  'platelets': 0,  'ffp': 1,  'cryo': 0},
            'B+':  {'whole_blood': 4,  'prbc': 7,  'platelets': 2,  'ffp': 5,  'cryo': 1},
            'B-':  {'whole_blood': 1,  'prbc': 1,  'platelets': 0,  'ffp': 0,  'cryo': 0},
            'AB+': {'whole_blood': 2,  'prbc': 3,  'platelets': 1,  'ffp': 2,  'cryo': 0},
            'AB-': {'whole_blood': 0,  'prbc': 0,  'platelets': 0,  'ffp': 0,  'cryo': 0},
            'O+':  {'whole_blood': 5,  'prbc': 9,  'platelets': 3,  'ffp': 6,  'cryo': 2},
            'O-':  {'whole_blood': 1,  'prbc': 1,  'platelets': 0,  'ffp': 1,  'cryo': 0}
        }
    },
    {
        'id': 'SRC-006',
        'name': 'Guntur Apex Blood Storage & Component Unit',
        'type': 'Rotary Club Blood Bank',
        'category': 'blood_bank',
        'contact_person': 'Dr. C. Venkatesh (Medical Director)',
        'phone': '+91 86322 34488',
        'email': 'rotary.guntur@lifelink-network.in',
        'address': 'Old Club Road, Kothapet, Guntur',
        'city': 'Guntur',
        'lat': 16.3067,
        'lng': 80.4365,
        'verified': True,
        'operating_hours': '24/7 Emergency Service',
        'inventory': {
            'A+':  {'whole_blood': 8,  'prbc': 16, 'platelets': 7,  'ffp': 14, 'cryo': 5},
            'A-':  {'whole_blood': 2,  'prbc': 4,  'platelets': 1,  'ffp': 3,  'cryo': 1},
            'B+':  {'whole_blood': 10, 'prbc': 20, 'platelets': 8,  'ffp': 16, 'cryo': 6},
            'B-':  {'whole_blood': 2,  'prbc': 3,  'platelets': 1,  'ffp': 2,  'cryo': 0},
            'AB+': {'whole_blood': 4,  'prbc': 8,  'platelets': 3,  'ffp': 5,  'cryo': 2},
            'AB-': {'whole_blood': 1,  'prbc': 2,  'platelets': 0,  'ffp': 1,  'cryo': 0},
            'O+':  {'whole_blood': 12, 'prbc': 25, 'platelets': 10, 'ffp': 20, 'cryo': 7},
            'O-':  {'whole_blood': 3,  'prbc': 6,  'platelets': 2,  'ffp': 4,  'cryo': 2}
        }
    }
]

DEFAULT_DONORS = [
    {
        'id': 'DNR-001',
        'name': 'Rajesh Kumar Verma',
        'blood_group': 'O-',
        'phone': '+91 98480 12345',
        'email': 'rajesh.verma@example.com',
        'city': 'Gudlavalleru',
        'address': 'Near Bus Depot, Ward 4',
        'lat': 16.3465,
        'lng': 81.0435,
        'is_available': True,
        'last_donated': '2025-11-12'
    },
    {
        'id': 'DNR-002',
        'name': 'Sowmya Priya K.',
        'blood_group': 'A+',
        'phone': '+91 98492 54321',
        'email': 'sowmya.k@example.com',
        'city': 'Gudlavalleru',
        'address': 'Main Market Road',
        'lat': 16.3480,
        'lng': 81.0460,
        'is_available': True,
        'last_donated': '2025-08-20'
    },
    {
        'id': 'DNR-003',
        'name': 'Venkatesh Prasad',
        'blood_group': 'B+',
        'phone': '+91 94401 77889',
        'email': 'v.prasad@example.com',
        'city': 'Machilipatnam',
        'address': 'Robertsonpet, Machilipatnam',
        'lat': 16.1850,
        'lng': 81.1370,
        'is_available': True,
        'last_donated': '2026-01-10'
    },
    {
        'id': 'DNR-004',
        'name': 'Naveen Chandra',
        'blood_group': 'AB+',
        'phone': '+91 97005 33221',
        'email': 'naveen.c@example.com',
        'city': 'Vijayawada',
        'lat': 16.5080,
        'lng': 80.6410,
        'is_available': True,
        'last_donated': '2025-10-05'
    },
    {
        'id': 'DNR-005',
        'name': 'Fatima Begum',
        'blood_group': 'O+',
        'phone': '+91 99887 66554',
        'email': 'fatima.b@example.com',
        'city': 'Vijayawada',
        'address': 'One Town, Vijayawada',
        'lat': 16.5150,
        'lng': 80.6280,
        'is_available': True,
        'last_donated': '2025-12-01'
    },
    {
        'id': 'DNR-006',
        'name': 'Kalyan Chakravarthy',
        'blood_group': 'A-',
        'phone': '+91 98661 44332',
        'email': 'kalyan.c@example.com',
        'city': 'Tenali',
        'address': 'Morrispet, Tenali',
        'lat': 16.2440,
        'lng': 80.6450,
        'is_available': True,
        'last_donated': '2025-09-15'
    },
    {
        'id': 'DNR-007',
        'name': 'Anuradha Devi',
        'blood_group': 'B-',
        'phone': '+91 98488 22114',
        'email': 'anuradha.d@example.com',
        'city': 'Guntur',
        'address': 'Brodipet 4th Line, Guntur',
        'lat': 16.3050,
        'lng': 80.4400,
        'is_available': True,
        'last_donated': '2026-02-14'
    },
    {
        'id': 'DNR-008',
        'name': 'Siddharth Rao',
        'blood_group': 'AB-',
        'phone': '+91 94900 88776',
        'email': 'siddharth.r@example.com',
        'city': 'Vijayawada',
        'address': 'Moghalrajpuram, Vijayawada',
        'lat': 16.5010,
        'lng': 80.6550,
        'is_available': True,
        'last_donated': '2025-07-22'
    }
]

DEFAULT_REQUESTS = [
    {
        'id': 'REQ-101',
        'hospital_id': 'HOSP-001',
        'hospital_name': 'Metro Emergency & Trauma Care',
        'patient_name': 'Ramesh Kumar (Polytrauma)',
        'patient_id': 'MRN-2026-8812',
        'blood_group': 'O+',
        'component': 'prbc',
        'units_required': 2,
        'urgency': 'CRITICAL',
        'clinical_reason': 'Compound pelvic trauma with active hemorrhagic shock',
        'lat': 16.3470,
        'lng': 81.0420,
        'contact_person': 'Dr. K. S. Sharma',
        'contact_phone': '+91 86742 55900',
        'status': 'Matched',
        'matched_source': 'Central Life Community Blood Bank',
        'matched_source_id': 'SRC-001',
        'match_score': 98.5
    },
    {
        'id': 'REQ-102',
        'hospital_id': 'HOSP-002',
        'hospital_name': 'Machilipatnam Coastal Care Hospital',
        'patient_name': 'Venkata Lakshmi (Oncology)',
        'patient_id': 'MRN-2026-4401',
        'blood_group': 'AB-',
        'component': 'platelets',
        'units_required': 3,
        'urgency': 'URGENT',
        'clinical_reason': 'Post-chemotherapy severe thrombocytopenia',
        'lat': 16.1820,
        'lng': 81.1350,
        'contact_person': 'Dr. P. V. Rao',
        'contact_phone': '+91 86722 24500',
        'status': 'Pending',
        'matched_source': 'District Red Cross Society Blood Center',
        'matched_source_id': 'SRC-002',
        'match_score': 88.0
    },
    {
        'id': 'REQ-103',
        'hospital_id': 'HOSP-003',
        'hospital_name': 'Vijayawada Apex Institute of Medical Sciences',
        'patient_name': 'G. Satyanarayana (Cardiac Surgery)',
        'patient_id': 'MRN-2026-9055',
        'blood_group': 'A+',
        'component': 'whole_blood',
        'units_required': 4,
        'urgency': 'STANDARD',
        'clinical_reason': 'Scheduled CABG open-heart operation reserve',
        'lat': 16.5062,
        'lng': 80.6480,
        'contact_person': 'Dr. Ananya Reddy',
        'contact_phone': '+91 86625 90120',
        'status': 'Fulfilled',
        'matched_source': 'Government General Hospital Apex Blood Bank',
        'matched_source_id': 'SRC-003',
        'match_score': 96.0
    }
]

DEFAULT_NOTIFICATIONS = [
    {
        'title': 'CRITICAL ALERT: O+ PRBC Required',
        'message': 'Metro Emergency & Trauma Care logged Critical Code Red for 2 units O+ PRBC. Central Life Community Blood Bank matched.',
        'type': 'critical'
    },
    {
        'title': 'New Donor Registered',
        'message': 'Rajesh Kumar Verma (O-) registered as active voluntary donor in Gudlavalleru.',
        'type': 'success'
    },
    {
        'title': 'Inventory Updated',
        'message': 'District Red Cross Blood Center refreshed daily stock levels.',
        'type': 'info'
    }
]

def seed_database(session):
    from database import Hospital, BloodBank, BloodInventory, Donor, BloodRequest, Notification, User

    # 1. Hospitals
    for h in DEFAULT_HOSPITALS:
        hosp = Hospital(
            id=h['id'],
            name=h['name'],
            email=h['email'],
            phone=h['phone'],
            address=h['address'],
            city=h['city'],
            lat=h['lat'],
            lng=h['lng'],
            rep_name=h['rep_name'],
            license_no=h.get('license_no')
        )
        session.add(hosp)

    # 2. Blood Banks & Inventories
    for b in DEFAULT_BLOOD_BANKS:
        bb = BloodBank(
            id=b['id'],
            name=b['name'],
            type=b['type'],
            category=b.get('category', 'blood_bank'),
            contact_person=b['contact_person'],
            phone=b['phone'],
            email=b['email'],
            address=b['address'],
            city=b['city'],
            lat=b['lat'],
            lng=b['lng'],
            verified=b.get('verified', True),
            operating_hours=b.get('operating_hours', '24/7 Emergency Service')
        )
        session.add(bb)

        # Inventory
        inv_data = b.get('inventory', {})
        for grp, comps in inv_data.items():
            for comp, units in comps.items():
                inv = BloodInventory(
                    facility_id=b['id'],
                    blood_group=grp,
                    component=comp,
                    units=units
                )
                session.add(inv)

    # 3. Donors
    for d in DEFAULT_DONORS:
        donor = Donor(
            id=d['id'],
            name=d['name'],
            blood_group=d['blood_group'],
            phone=d['phone'],
            email=d['email'],
            city=d['city'],
            address=d.get('address'),
            lat=d.get('lat', 16.345),
            lng=d.get('lng', 81.042),
            is_available=d.get('is_available', True),
            last_donated=d.get('last_donated')
        )
        session.add(donor)

    # 4. Blood Requests
    for r in DEFAULT_REQUESTS:
        req = BloodRequest(
            id=r['id'],
            hospital_id=r.get('hospital_id'),
            hospital_name=r['hospital_name'],
            patient_name=r.get('patient_name', 'Emergency Case'),
            patient_id=r.get('patient_id', 'MRN-EMERGENCY'),
            blood_group=r['blood_group'],
            component=r.get('component', 'prbc'),
            units_required=r.get('units_required', 1),
            urgency=r.get('urgency', 'URGENT'),
            clinical_reason=r.get('clinical_reason'),
            lat=r['lat'],
            lng=r['lng'],
            contact_person=r['contact_person'],
            contact_phone=r['contact_phone'],
            status=r.get('status', 'Pending'),
            matched_source=r.get('matched_source'),
            matched_source_id=r.get('matched_source_id'),
            match_score=r.get('match_score')
        )
        session.add(req)

    # 5. Notifications
    for n in DEFAULT_NOTIFICATIONS:
        notif = Notification(
            title=n['title'],
            message=n['message'],
            type=n.get('type', 'info')
        )
        session.add(notif)

    # 6. Default Demo Users
    demo_users = [
        {'username': 'hospital_admin', 'email': 'admin@hospital.org', 'role': 'hospital', 'facility_id': 'HOSP-001'},
        {'username': 'bloodbank_admin', 'email': 'admin@bloodbank.org', 'role': 'blood_bank', 'facility_id': 'SRC-001'},
        {'username': 'super_admin', 'email': 'admin@lifelink.org', 'role': 'admin', 'facility_id': None},
        {'username': 'donor_rajesh', 'email': 'rajesh.verma@example.com', 'role': 'donor', 'facility_id': 'DNR-001'}
    ]
    for u in demo_users:
        user = User(
            username=u['username'],
            email=u['email'],
            password_hash=generate_password_hash('password123'),
            role=u['role'],
            facility_id=u['facility_id']
        )
        session.add(user)

    session.commit()
    print("[LifeLink DB] Initial seed data successfully committed!")
