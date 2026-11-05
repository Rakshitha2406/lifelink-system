import os
import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Float, Boolean, 
    DateTime, ForeignKey, UniqueConstraint, inspect, text
)
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session, relationship
from config import Config

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default='hospital')  # 'hospital', 'blood_bank', 'donor', 'admin'
    facility_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'facility_id': self.facility_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Hospital(Base):
    __tablename__ = 'hospitals'
    id = Column(String(50), primary_key=True)
    name = Column(String(150), nullable=False)
    email = Column(String(120), nullable=False)
    phone = Column(String(30), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(80), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    rep_name = Column(String(100), nullable=False)
    license_no = Column(String(80), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'lat': self.lat,
            'lng': self.lng,
            'rep_name': self.rep_name,
            'license_no': self.license_no
        }

class BloodBank(Base):
    __tablename__ = 'blood_banks'
    id = Column(String(50), primary_key=True)
    name = Column(String(150), nullable=False)
    type = Column(String(80), nullable=False)
    category = Column(String(50), default='blood_bank')
    contact_person = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=False)
    email = Column(String(120), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(80), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    verified = Column(Boolean, default=True)
    operating_hours = Column(String(100), default='24/7 Emergency Service')
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    inventory_items = relationship("BloodInventory", back_populates="blood_bank", cascade="all, delete-orphan")

    def to_dict(self):
        inv_dict = {}
        for item in self.inventory_items:
            if item.blood_group not in inv_dict:
                inv_dict[item.blood_group] = {}
            inv_dict[item.blood_group][item.component] = item.units

        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'category': self.category,
            'contactPerson': self.contact_person,
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'city': self.city,
            'lat': self.lat,
            'lng': self.lng,
            'verified': self.verified,
            'operatingHours': self.operating_hours,
            'lastUpdated': self.last_updated.isoformat() if self.last_updated else None,
            'inventory': inv_dict
        }

class BloodInventory(Base):
    __tablename__ = 'blood_inventory'
    id = Column(Integer, primary_key=True, autoincrement=True)
    facility_id = Column(String(50), ForeignKey('blood_banks.id', ondelete='CASCADE'), nullable=False)
    blood_group = Column(String(10), nullable=False)
    component = Column(String(30), nullable=False)
    units = Column(Integer, default=0, nullable=False)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    blood_bank = relationship("BloodBank", back_populates="inventory_items")

    __table_args__ = (
        UniqueConstraint('facility_id', 'blood_group', 'component', name='uq_facility_group_comp'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'facility_id': self.facility_id,
            'blood_group': self.blood_group,
            'component': self.component,
            'units': self.units,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }

class Donor(Base):
    __tablename__ = 'donors'
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    blood_group = Column(String(10), nullable=False)
    phone = Column(String(30), nullable=False)
    email = Column(String(120), nullable=False)
    city = Column(String(80), nullable=False)
    address = Column(String(255), nullable=True)
    lat = Column(Float, default=16.345)
    lng = Column(Float, default=81.042)
    is_available = Column(Boolean, default=True)
    last_donated = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'bloodGroup': self.blood_group,
            'phone': self.phone,
            'email': self.email,
            'city': self.city,
            'address': self.address,
            'lat': self.lat,
            'lng': self.lng,
            'isAvailable': self.is_available,
            'lastDonated': self.last_donated,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

class BloodRequest(Base):
    __tablename__ = 'blood_requests'
    id = Column(String(50), primary_key=True)
    hospital_id = Column(String(50), nullable=True)
    hospital_name = Column(String(150), nullable=False)
    patient_name = Column(String(100), default='Emergency Case')
    patient_id = Column(String(50), default='MRN-EMERGENCY')
    blood_group = Column(String(10), nullable=False)
    component = Column(String(30), default='prbc')
    units_required = Column(Integer, default=1, nullable=False)
    urgency = Column(String(20), default='URGENT')  # 'CRITICAL', 'URGENT', 'STANDARD'
    clinical_reason = Column(String(255), nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    contact_person = Column(String(100), nullable=False)
    contact_phone = Column(String(30), nullable=False)
    status = Column(String(20), default='Pending')  # 'Pending', 'Matched', 'Fulfilled', 'Cancelled'
    matched_source = Column(String(150), nullable=True)
    matched_source_id = Column(String(50), nullable=True)
    match_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'hospitalId': self.hospital_id,
            'hospitalName': self.hospital_name,
            'patientName': self.patient_name,
            'patientId': self.patient_id,
            'bloodGroup': self.blood_group,
            'component': self.component,
            'unitsRequired': self.units_required,
            'urgency': self.urgency,
            'clinicalReason': self.clinical_reason,
            'lat': self.lat,
            'lng': self.lng,
            'contactPerson': self.contact_person,
            'contactPhone': self.contact_phone,
            'status': self.status,
            'matchedSource': self.matched_source,
            'matchedSourceId': self.matched_source_id,
            'matchScore': self.match_score,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(20), default='info')  # 'critical', 'warning', 'success', 'info'
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            'id': f"NOTIF-{self.id}",
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'read': self.is_read,
            'timestamp': self.created_at.isoformat() if self.created_at else None
        }

# Database Engine & Session Provider
db_session = None
engine = None
active_db_type = 'unknown'

def init_db():
    global engine, db_session, active_db_type

    # Try connecting to MySQL first
    mysql_connected = False
    try:
        mysql_engine = create_engine(
            Config.MYSQL_URI, 
            pool_recycle=3600, 
            pool_pre_ping=True,
            connect_args={'connect_timeout': 3}
        )
        with mysql_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = mysql_engine
        active_db_type = 'MySQL'
        mysql_connected = True
        print(f"[LifeLink DB] Successfully connected to MySQL database: {Config.MYSQL_DB} on {Config.MYSQL_HOST}:{Config.MYSQL_PORT}")
    except Exception as e:
        # Fallback gracefully to SQLite
        sqlite_engine = create_engine(
            Config.SQLITE_URI, 
            connect_args={"check_same_thread": False}
        )
        engine = sqlite_engine
        active_db_type = 'SQLite'
        print(f"[LifeLink DB] MySQL not available ({e}). Using local SQLite database: {Config.SQLITE_URI}")
        print("[LifeLink DB] Tip: To use MySQL, ensure your MySQL service is started and configure credentials in config.py or .env")

    db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

    # Create tables
    Base.metadata.create_all(bind=engine)

    # Check if seed data needed
    seed_if_empty()
    return engine

def get_session():
    global db_session
    if db_session is None:
        init_db()
    return db_session

def seed_if_empty():
    from seed_data import seed_database
    session = db_session()
    try:
        hospital_count = session.query(Hospital).count()
        if hospital_count == 0:
            print("[LifeLink DB] Tables are empty. Seeding initial healthcare data...")
            seed_database(session)
    except Exception as e:
        print(f"[LifeLink DB] Seeding error: {e}")
        session.rollback()
    finally:
        session.close()
