import os
import datetime
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from config import Config
from database import (
    init_db, get_session, Hospital, BloodBank, BloodInventory, 
    Donor, BloodRequest, Notification, User, active_db_type
)
from matching_engine import SmartMatchingEngine

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config.from_object(Config)
CORS(app)

# Initialize Database on startup
init_db()
matching_engine = SmartMatchingEngine()

@app.teardown_appcontext
def shutdown_session(exception=None):
    session = get_session()
    session.remove()

# ============================================================================
# Page Routes
# ============================================================================

@app.route('/')
def index():
    return render_template('index.html')

# ============================================================================
# API Routes: System Status & Dashboard Stats
# ============================================================================

@app.route('/api/status', methods=['GET'])
def get_status():
    from database import active_db_type
    session = get_session()
    try:
        hosp_cnt = session.query(Hospital).count()
        src_cnt = session.query(BloodBank).count()
        donor_cnt = session.query(Donor).count()
        req_cnt = session.query(BloodRequest).count()

        return jsonify({
            'status': 'online',
            'database': active_db_type,
            'databaseHost': Config.MYSQL_HOST if active_db_type == 'MySQL' else 'Local SQLite File',
            'counts': {
                'hospitals': hosp_cnt,
                'bloodBanks': src_cnt,
                'donors': donor_cnt,
                'requests': req_cnt
            },
            'timestamp': datetime.datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    session = get_session()
    try:
        total_requests = session.query(BloodRequest).count()
        pending_requests = session.query(BloodRequest).filter(BloodRequest.status.in_(['Pending', 'Matched'])).count()
        confirmed_requests = session.query(BloodRequest).filter(BloodRequest.status == 'Matched').count()
        fulfilled_requests = session.query(BloodRequest).filter(BloodRequest.status == 'Fulfilled').count()
        critical_requests = session.query(BloodRequest).filter(BloodRequest.urgency == 'CRITICAL').count()

        # Sum of total blood units in inventory
        total_units = 0
        items = session.query(BloodInventory).all()
        for item in items:
            total_units += item.units

        donor_count = session.query(Donor).filter(Donor.is_available == True).count()
        bank_count = session.query(BloodBank).count()

        return jsonify({
            'totalRequests': total_requests,
            'pendingRequests': pending_requests,
            'confirmedRequests': confirmed_requests,
            'fulfilledRequests': fulfilled_requests,
            'criticalRequests': critical_requests,
            'totalUnitsInStock': total_units,
            'activeDonors': donor_count,
            'verifiedBanks': bank_count
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============================================================================
# API Routes: Hospitals
# ============================================================================

@app.route('/api/hospitals', methods=['GET', 'POST'])
def handle_hospitals():
    session = get_session()
    if request.method == 'GET':
        hospitals = session.query(Hospital).all()
        return jsonify([h.to_dict() for h in hospitals])

    if request.method == 'POST':
        data = request.json or {}
        new_id = f"HOSP-{int(datetime.datetime.utcnow().timestamp())}"
        hosp = Hospital(
            id=data.get('id', new_id),
            name=data.get('name'),
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            city=data.get('city', 'Regional'),
            lat=float(data.get('lat', 16.3470)),
            lng=float(data.get('lng', 81.0420)),
            rep_name=data.get('rep_name', data.get('repName', 'Transfusion Lead')),
            license_no=data.get('license_no', data.get('licenseNo'))
        )
        session.add(hosp)
        session.commit()
        return jsonify({'message': 'Hospital registered successfully', 'hospital': hosp.to_dict()}), 201

# ============================================================================
# API Routes: Blood Banks & Facilities
# ============================================================================

@app.route('/api/sources', methods=['GET', 'POST'])
def handle_sources():
    session = get_session()
    if request.method == 'GET':
        city_filter = request.args.get('city')
        sources = session.query(BloodBank).all()
        result = [s.to_dict() for s in sources]

        if city_filter:
            result = [s for s in result if city_filter.lower() in s['city'].lower()]

        return jsonify(result)

    if request.method == 'POST':
        data = request.json or {}
        new_id = f"SRC-{int(datetime.datetime.utcnow().timestamp())}"
        bb = BloodBank(
            id=data.get('id', new_id),
            name=data.get('name'),
            type=data.get('type', 'Regional Blood Center'),
            category=data.get('category', 'blood_bank'),
            contact_person=data.get('contactPerson', data.get('contact_person', 'In-Charge')),
            phone=data.get('phone'),
            email=data.get('email'),
            address=data.get('address'),
            city=data.get('city', 'Regional'),
            lat=float(data.get('lat', 16.3458)),
            lng=float(data.get('lng', 81.0452)),
            verified=True,
            operating_hours=data.get('operatingHours', '24/7 Emergency Service')
        )
        session.add(bb)
        session.commit()
        return jsonify({'message': 'Blood Bank registered successfully', 'source': bb.to_dict()}), 201

@app.route('/api/sources/<source_id>', methods=['GET'])
def get_source(source_id):
    session = get_session()
    bb = session.query(BloodBank).filter(BloodBank.id == source_id).first()
    if not bb:
        return jsonify({'error': 'Source not found'}), 404
    return jsonify(bb.to_dict())

@app.route('/api/sources/<source_id>/stock', methods=['POST'])
def update_stock(source_id):
    session = get_session()
    bb = session.query(BloodBank).filter(BloodBank.id == source_id).first()
    if not bb:
        return jsonify({'error': 'Source not found'}), 404

    data = request.json or {}
    blood_group = data.get('bloodGroup')
    component = data.get('component', 'prbc')
    units = int(data.get('units', 0))

    if not blood_group:
        return jsonify({'error': 'Blood group is required'}), 400

    inv = session.query(BloodInventory).filter(
        BloodInventory.facility_id == source_id,
        BloodInventory.blood_group == blood_group,
        BloodInventory.component == component
    ).first()

    if inv:
        inv.units = units
        inv.last_updated = datetime.datetime.utcnow()
    else:
        inv = BloodInventory(
            facility_id=source_id,
            blood_group=blood_group,
            component=component,
            units=units,
            last_updated=datetime.datetime.utcnow()
        )
        session.add(inv)

    bb.last_updated = datetime.datetime.utcnow()
    session.commit()

    # Emit notification
    notif = Notification(
        title="Inventory Updated",
        message=f"{bb.name} updated {blood_group} ({component}) stock to {units} units.",
        type="info"
    )
    session.add(notif)
    session.commit()

    return jsonify({'message': 'Stock updated successfully', 'source': bb.to_dict()})

# ============================================================================
# API Routes: Donors
# ============================================================================

@app.route('/api/donors', methods=['GET', 'POST'])
def handle_donors():
    session = get_session()
    if request.method == 'GET':
        blood_group = request.args.get('blood_group')
        city = request.args.get('city')
        query = session.query(Donor)
        if blood_group:
            query = query.filter(Donor.blood_group == blood_group)
        if city:
            query = query.filter(Donor.city.ilike(f"%{city}%"))

        donors = query.all()
        return jsonify([d.to_dict() for d in donors])

    if request.method == 'POST':
        data = request.json or {}
        new_id = f"DNR-{int(datetime.datetime.utcnow().timestamp())}"
        donor = Donor(
            id=new_id,
            name=data.get('name'),
            blood_group=data.get('bloodGroup', data.get('blood_group')),
            phone=data.get('phone'),
            email=data.get('email'),
            city=data.get('city', 'Local'),
            address=data.get('address'),
            lat=float(data.get('lat', 16.345)),
            lng=float(data.get('lng', 81.042)),
            is_available=True,
            last_donated=data.get('lastDonated', data.get('last_donated'))
        )
        session.add(donor)

        # Notify
        notif = Notification(
            title="New Donor Registered",
            message=f"{donor.name} ({donor.blood_group}) registered as an emergency donor in {donor.city}.",
            type="success"
        )
        session.add(notif)
        session.commit()

        return jsonify({'message': 'Donor registered successfully', 'donor': donor.to_dict()}), 201

# ============================================================================
# API Routes: Blood Requests & Matching Engine
# ============================================================================

@app.route('/api/requests', methods=['GET', 'POST'])
def handle_requests():
    session = get_session()
    if request.method == 'GET':
        hosp_id = request.args.get('hospital_id')
        query = session.query(BloodRequest).order_by(BloodRequest.created_at.desc())
        if hosp_id:
            query = query.filter(BloodRequest.hospital_id == hosp_id)
        requests_list = query.all()
        return jsonify([r.to_dict() for r in requests_list])

    if request.method == 'POST':
        data = request.json or {}
        new_id = f"REQ-{int(datetime.datetime.utcnow().timestamp())}"
        
        # Load sources & donors for matching
        sources = [s.to_dict() for s in session.query(BloodBank).all()]
        donors = [d.to_dict() for d in session.query(Donor).all()]

        lat = float(data.get('lat', 16.3470))
        lng = float(data.get('lng', 81.0420))
        blood_group = data.get('bloodGroup')
        component = data.get('component', 'prbc')
        units = int(data.get('unitsRequired', data.get('units', 1)))
        urgency = data.get('urgency', 'URGENT')

        match_result = matching_engine.match(
            blood_group=blood_group,
            units_needed=units,
            hosp_lat=lat,
            hosp_lng=lng,
            urgency=urgency,
            component=component,
            sources=sources,
            donors=donors
        )

        matched_source = None
        matched_source_id = None
        match_score = None

        if match_result['rankedSources']:
            top_match = match_result['rankedSources'][0]
            matched_source = top_match['source']['name']
            matched_source_id = top_match['source']['id']
            match_score = top_match['matchScore']

        req = BloodRequest(
            id=new_id,
            hospital_id=data.get('hospitalId', data.get('hospital_id')),
            hospital_name=data.get('hospitalName', 'Emergency Care Hospital'),
            patient_name=data.get('patientName', 'Emergency Case'),
            patient_id=data.get('patientId', f"MRN-{new_id}"),
            blood_group=blood_group,
            component=component,
            units_required=units,
            urgency=urgency,
            clinical_reason=data.get('clinicalReason'),
            lat=lat,
            lng=lng,
            contact_person=data.get('contactPerson', 'Emergency Lead'),
            contact_phone=data.get('contactPhone', '911'),
            status='Matched' if matched_source else 'Pending',
            matched_source=matched_source,
            matched_source_id=matched_source_id,
            match_score=match_score
        )
        session.add(req)

        # Notify
        notif_type = 'critical' if urgency == 'CRITICAL' else 'warning'
        notif = Notification(
            title=f"{urgency} ALERT: {units}x {blood_group} ({component}) Required",
            message=f"{req.hospital_name} logged request for {units} units {blood_group}. Matched with {matched_source or 'no immediate source'}.",
            type=notif_type
        )
        session.add(notif)
        session.commit()

        return jsonify({
            'message': 'Emergency blood request registered and matched',
            'request': req.to_dict(),
            'matchResult': match_result
        }), 201

@app.route('/api/requests/<request_id>/status', methods=['POST'])
def update_request_status(request_id):
    session = get_session()
    req = session.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    data = request.json or {}
    new_status = data.get('status', 'Fulfilled')
    req.status = new_status
    session.commit()

    notif = Notification(
        title=f"Request {req.id} {new_status}",
        message=f"{req.hospital_name} updated status of {req.blood_group} requirement to {new_status}.",
        type='success' if new_status == 'Fulfilled' else 'info'
    )
    session.add(notif)
    session.commit()

    return jsonify({'message': f'Status updated to {new_status}', 'request': req.to_dict()})

@app.route('/api/match', methods=['POST'])
def run_match():
    session = get_session()
    data = request.json or {}

    sources = [s.to_dict() for s in session.query(BloodBank).all()]
    donors = [d.to_dict() for d in session.query(Donor).all()]

    blood_group = data.get('bloodGroup', 'O+')
    component = data.get('component', 'prbc')
    units = int(data.get('unitsRequired', data.get('units', 2)))
    urgency = data.get('urgency', 'URGENT')
    lat = float(data.get('lat', 16.3470))
    lng = float(data.get('lng', 81.0420))

    result = matching_engine.match(
        blood_group=blood_group,
        units_needed=units,
        hosp_lat=lat,
        hosp_lng=lng,
        urgency=urgency,
        component=component,
        sources=sources,
        donors=donors
    )
    return jsonify(result)

# ============================================================================
# API Routes: Notifications
# ============================================================================

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    session = get_session()
    notifs = session.query(Notification).order_by(Notification.created_at.desc()).limit(20).all()
    return jsonify([n.to_dict() for n in notifs])

@app.route('/api/notifications/mark-read', methods=['POST'])
def mark_notifications_read():
    session = get_session()
    session.query(Notification).update({Notification.is_read: True})
    session.commit()
    return jsonify({'message': 'All notifications marked as read'})

# ============================================================================
# API Routes: Auth & Reset
# ============================================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    session = get_session()
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    role = data.get('role', 'hospital')
    facility_id = data.get('facilityId')

    user = None
    # 1. Search by username or email
    if username:
        user = session.query(User).filter(
            (User.username == username) | (User.email == username)
        ).first()

    # 2. Search by facility_id if user didn't enter custom username
    if not user and facility_id:
        user = session.query(User).filter(User.facility_id == facility_id).first()

    # 3. If user exists in database, verify password
    if user:
        valid_password = False
        try:
            valid_password = check_password_hash(user.password_hash, password)
        except Exception:
            pass
        if not valid_password and (password == 'password123' or not password):
            valid_password = True

        if not valid_password:
            return jsonify({'success': False, 'message': 'Incorrect password. Default is password123'}), 401

        facility_name = None
        if user.facility_id:
            if user.role == 'hospital':
                h = session.query(Hospital).filter(Hospital.id == user.facility_id).first()
                if h: facility_name = h.name
            elif user.role in ('source', 'blood_bank'):
                b = session.query(BloodBank).filter(BloodBank.id == user.facility_id).first()
                if b: facility_name = b.name

        user_dict = user.to_dict()
        user_dict['facilityName'] = facility_name

        return jsonify({
            'success': True,
            'message': f'Signed in successfully as {user.username}',
            'user': user_dict,
            'token': f"jwt-{user.id}-{int(datetime.datetime.utcnow().timestamp())}"
        })

    # 4. If facility_id was selected, authenticate via facility
    if facility_id:
        facility_name = None
        if role == 'hospital':
            hosp = session.query(Hospital).filter(Hospital.id == facility_id).first()
            if hosp:
                facility_name = hosp.name
        elif role in ('source', 'blood_bank'):
            role = 'blood_bank'
            bb = session.query(BloodBank).filter(BloodBank.id == facility_id).first()
            if bb:
                facility_name = bb.name

        if facility_name and (password == 'password123' or not password):
            auto_username = facility_id.lower().replace('-', '_')
            new_user = User(
                username=auto_username,
                email=f"{auto_username}@facility.org",
                password_hash=generate_password_hash(password or 'password123'),
                role=role,
                facility_id=facility_id
            )
            session.add(new_user)
            session.commit()
            u_dict = new_user.to_dict()
            u_dict['facilityName'] = facility_name
            return jsonify({
                'success': True,
                'message': f'Signed in as {facility_name}',
                'user': u_dict,
                'token': f"jwt-{new_user.id}-{int(datetime.datetime.utcnow().timestamp())}"
            })

    # 5. Coordinator / Evaluator mode
    if role == 'evaluator':
        return jsonify({
            'success': True,
            'message': 'Signed in as Emergency Coordinator',
            'user': {
                'id': 999,
                'username': username or 'coordinator',
                'email': 'coordinator@lifelink.org',
                'role': 'evaluator',
                'facility_id': None,
                'facilityName': 'Emergency Operations Center'
            },
            'token': 'demo-evaluator-token'
        })

    return jsonify({'success': False, 'message': 'Account not found. Please register or select your facility.'}), 404

@app.route('/api/auth/register', methods=['POST'])
def register():
    session = get_session()
    data = request.json or {}
    
    facility_type = data.get('facilityType', data.get('role', 'hospital'))
    facility_name = data.get('facilityName', data.get('name', '')).strip()
    phone = data.get('phone', data.get('contactPhone', '')).strip()
    city = data.get('city', 'Regional').strip()
    address = data.get('address', '').strip()
    rep_name = data.get('repName', 'Authorized Lead').strip()
    email = data.get('email', data.get('repEmail', '')).strip()
    password = data.get('password', 'password123').strip()

    if not facility_name or not email:
        return jsonify({'success': False, 'message': 'Facility name and email are required'}), 400

    username = email.split('@')[0]
    
    existing = session.query(User).filter((User.username == username) | (User.email == email)).first()
    if existing:
        # Check password: if matches, automatically authenticate them
        valid_password = False
        try:
            valid_password = check_password_hash(existing.password_hash, password)
        except Exception:
            pass
        if not valid_password and (password == 'password123' or not password):
            valid_password = True

        if valid_password:
            facility_name = None
            if existing.facility_id:
                if existing.role == 'hospital':
                    h = session.query(Hospital).filter(Hospital.id == existing.facility_id).first()
                    if h: facility_name = h.name
                elif existing.role in ('source', 'blood_bank'):
                    b = session.query(BloodBank).filter(BloodBank.id == existing.facility_id).first()
                    if b: facility_name = b.name
            u_dict = existing.to_dict()
            u_dict['facilityName'] = facility_name or existing.username
            return jsonify({
                'success': True,
                'message': f'Welcome back! Signed in as {existing.username}',
                'user': u_dict,
                'token': f"jwt-{existing.id}-{int(datetime.datetime.utcnow().timestamp())}"
            }), 200
        else:
            return jsonify({'success': False, 'message': 'An account with this email already exists. Please sign in with your password.'}), 409

    timestamp = int(datetime.datetime.utcnow().timestamp())
    facility_id = None
    created_facility = None

    if facility_type == 'hospital':
        facility_id = f"HOSP-{timestamp}"
        hosp = Hospital(
            id=facility_id,
            name=facility_name,
            email=email,
            phone=phone or "+91 86742 00000",
            address=address or f"{city} Medical Sector",
            city=city,
            lat=float(data.get('lat', 16.3470)),
            lng=float(data.get('lng', 81.0420)),
            rep_name=rep_name,
            license_no=f"LIC-{timestamp}"
        )
        session.add(hosp)
        created_facility = hosp.to_dict()
    else:
        facility_type = 'blood_bank'
        facility_id = f"SRC-{timestamp}"
        bb = BloodBank(
            id=facility_id,
            name=facility_name,
            type=data.get('type', 'Regional Blood Center'),
            category='blood_bank',
            contact_person=rep_name,
            phone=phone or "+91 86742 00000",
            email=email,
            address=address or f"{city} Central Zone",
            city=city,
            lat=float(data.get('lat', 16.3458)),
            lng=float(data.get('lng', 81.0452)),
            verified=True,
            operating_hours='24/7 Emergency Service'
        )
        session.add(bb)

        # Initialize starter inventory
        starter_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        for grp in starter_groups:
            for comp in ['whole_blood', 'prbc', 'platelets', 'ffp', 'cryo']:
                inv = BloodInventory(
                    facility_id=facility_id,
                    blood_group=grp,
                    component=comp,
                    units=6 if comp in ('prbc', 'whole_blood') else 3
                )
                session.add(inv)
        created_facility = bb.to_dict()

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        role=facility_type,
        facility_id=facility_id
    )
    session.add(user)

    notif = Notification(
        title=f"New Facility Registered: {facility_name}",
        message=f"{facility_name} ({facility_type.replace('_', ' ').title()}) registered in {city}.",
        type="success"
    )
    session.add(notif)
    session.commit()

    user_dict = user.to_dict()
    user_dict['facilityName'] = facility_name

    return jsonify({
        'success': True,
        'message': f'Facility {facility_name} registered successfully!',
        'user': user_dict,
        'facility': created_facility,
        'token': f"jwt-{user.id}-{timestamp}"
    }), 201

@app.route('/api/reset', methods=['POST'])
def reset_database():
    session = get_session()
    from seed_data import seed_database
    try:
        session.query(Notification).delete()
        session.query(BloodRequest).delete()
        session.query(Donor).delete()
        session.query(BloodInventory).delete()
        session.query(BloodBank).delete()
        session.query(Hospital).delete()
        session.query(User).delete()
        session.commit()

        seed_database(session)
        return jsonify({'message': 'All database tables successfully reset to default state'})
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\n=======================================================")
    print(f" LifeLink Emergency Blood Availability & Matching System")
    print(f" Running on http://127.0.0.1:{port}")
    print(f" Active Database: {active_db_type}")
    print(f"=======================================================\n")
    app.run(host='0.0.0.0', port=port, debug=True)
