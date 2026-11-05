-- ============================================================================
-- LifeLink — Smart Emergency Blood Availability & Matching System
-- MySQL Relational Database Schema & Seed Data Script
-- ============================================================================

CREATE DATABASE IF NOT EXISTS lifelink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lifelink_db;

-- 1. Users Table (Authentication & Access Control)
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('hospital', 'blood_bank', 'donor', 'admin') DEFAULT 'hospital',
    facility_id VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Hospitals Table
DROP TABLE IF EXISTS hospitals;
CREATE TABLE hospitals (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(80) NOT NULL,
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL,
    rep_name VARCHAR(100) NOT NULL,
    license_no VARCHAR(80) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Blood Banks / Regional Facilities Table
DROP TABLE IF EXISTS blood_banks;
CREATE TABLE blood_banks (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(80) NOT NULL,
    category VARCHAR(50) DEFAULT 'blood_bank',
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(80) NOT NULL,
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL,
    verified BOOLEAN DEFAULT TRUE,
    operating_hours VARCHAR(100) DEFAULT '24/7 Emergency Service',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Blood Inventory Table (Per Facility, Blood Group, Component)
DROP TABLE IF EXISTS blood_inventory;
CREATE TABLE blood_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    facility_id VARCHAR(50) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    component VARCHAR(30) NOT NULL,
    units INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_facility FOREIGN KEY (facility_id) REFERENCES blood_banks(id) ON DELETE CASCADE,
    UNIQUE KEY uq_facility_group_comp (facility_id, blood_group, component)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Voluntary Blood Donors Table
DROP TABLE IF EXISTS donors;
CREATE TABLE donors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL,
    address VARCHAR(255) NULL,
    lat DOUBLE DEFAULT 16.345,
    lng DOUBLE DEFAULT 81.042,
    is_available BOOLEAN DEFAULT TRUE,
    last_donated VARCHAR(30) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Emergency Blood Requests Requisitions Table
DROP TABLE IF EXISTS blood_requests;
CREATE TABLE blood_requests (
    id VARCHAR(50) PRIMARY KEY,
    hospital_id VARCHAR(50) NULL,
    hospital_name VARCHAR(150) NOT NULL,
    patient_name VARCHAR(100) DEFAULT 'Emergency Case',
    patient_id VARCHAR(50) DEFAULT 'MRN-EMERGENCY',
    blood_group VARCHAR(10) NOT NULL,
    component VARCHAR(30) DEFAULT 'prbc',
    units_required INT NOT NULL DEFAULT 1,
    urgency ENUM('CRITICAL', 'URGENT', 'STANDARD') DEFAULT 'URGENT',
    clinical_reason VARCHAR(255) NULL,
    lat DOUBLE NOT NULL,
    lng DOUBLE NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    status ENUM('Pending', 'Matched', 'Fulfilled', 'Cancelled') DEFAULT 'Pending',
    matched_source VARCHAR(150) NULL,
    matched_source_id VARCHAR(50) NULL,
    match_score DOUBLE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. System Emergency Notifications Table
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- SEED INITIAL DATA
-- ============================================================================

-- Seed Hospitals
INSERT INTO hospitals (id, name, email, phone, address, city, lat, lng, rep_name, license_no) VALUES
('HOSP-001', 'Metro Emergency & Trauma Care', 'emergency@metrocare.org', '+91 86742 55900', 'Main Hospital Road, Gudlavalleru Sector 2', 'Gudlavalleru', 16.3470, 81.0420, 'Dr. K. S. Sharma (Trauma Lead)', 'HOSP-AP-2023-8821'),
('HOSP-002', 'Machilipatnam Coastal Care Hospital', 'requisitions@coastalcare.in', '+91 86722 24500', 'Collectorate Junction, Machilipatnam', 'Machilipatnam', 16.1820, 81.1350, 'Dr. P. V. Rao (Chief Medical Officer)', 'HOSP-AP-2021-4190'),
('HOSP-003', 'Vijayawada Apex Institute of Medical Sciences', 'blood.order@vijayawadaapex.org', '+91 86625 90120', 'Ring Road, Near Benz Circle, Vijayawada', 'Vijayawada', 16.5062, 80.6480, 'Dr. Ananya Reddy (Blood Bank Liaison)', 'HOSP-AP-2020-1104'),
('HOSP-004', 'Tenali Multi-Speciality Care Hospital', 'emergency@tenalicare.in', '+91 86442 33110', 'Station Road, Tenali', 'Tenali', 16.2430, 80.6400, 'Dr. M. Sridhar (ICU Superintendent)', 'HOSP-AP-2022-7741');

-- Seed Blood Banks
INSERT INTO blood_banks (id, name, type, category, contact_person, phone, email, address, city, lat, lng, verified, operating_hours) VALUES
('SRC-001', 'Central Life Community Blood Bank', 'Community Blood Center', 'blood_bank', 'Dr. K. Srinivas (In-Charge)', '+91 86742 55101', 'central.bb@lifelink-network.in', 'Main Road, Near Bus Stand, Gudlavalleru', 'Gudlavalleru', 16.3458, 81.0452, TRUE, '24/7 Emergency Service'),
('SRC-002', 'District Red Cross Society Blood Center', 'Red Cross Society Center', 'blood_bank', 'M. Lakshmi Narayana (Transfusion Officer)', '+91 86722 22890', 'redcross.mtm@lifelink-network.in', 'Near District Hospital, Machilipatnam', 'Machilipatnam', 16.1875, 81.1389, TRUE, '24/7 Emergency Service'),
('SRC-003', 'Government General Hospital Apex Blood Bank', 'Apex Tertiary Blood Centre', 'hospital_center', 'Dr. V. Ramana Rao (HOD Blood Bank)', '+91 86625 78441', 'ggh.vijayawada@lifelink-network.in', 'Hanumanpet, Opposite Railway Station, Vijayawada', 'Vijayawada', 16.5131, 80.6325, TRUE, '24/7 Apex Facility'),
('SRC-004', 'City Emergency Regional Blood Center', 'Accredited Hospital Blood Store', 'hospital_center', 'Sister Grace K. (Shift Supervisor)', '+91 86624 33000', 'cityemergency.bb@lifelink-network.in', 'Suryaraopet, Governorpet, Vijayawada', 'Vijayawada', 16.5090, 80.6400, TRUE, '24/7 Transfusion Wing'),
('SRC-005', 'Tenali Sub-District Blood Bank', 'Government Sub-District Blood Center', 'blood_bank', 'P. Bapuji (Senior Lab Tech)', '+91 86442 27715', 'tenali.sdh@lifelink-network.in', 'Near Taluka Karyalayam, Tenali', 'Tenali', 16.2410, 80.6475, TRUE, '8:00 AM - 8:00 PM (On-Call Night Service)'),
('SRC-006', 'Guntur Apex Blood Storage & Component Unit', 'Rotary Club Blood Bank', 'blood_bank', 'Dr. C. Venkatesh (Medical Director)', '+91 86322 34488', 'rotary.guntur@lifelink-network.in', 'Old Club Road, Kothapet, Guntur', 'Guntur', 16.3067, 80.4365, TRUE, '24/7 Emergency Service');

-- Seed Inventory for SRC-001 (Central Life)
INSERT INTO blood_inventory (facility_id, blood_group, component, units) VALUES
('SRC-001', 'A+', 'whole_blood', 6), ('SRC-001', 'A+', 'prbc', 12), ('SRC-001', 'A+', 'platelets', 5), ('SRC-001', 'A+', 'ffp', 8), ('SRC-001', 'A+', 'cryo', 2),
('SRC-001', 'A-', 'whole_blood', 1), ('SRC-001', 'A-', 'prbc', 3),  ('SRC-001', 'A-', 'platelets', 1), ('SRC-001', 'A-', 'ffp', 2), ('SRC-001', 'A-', 'cryo', 0),
('SRC-001', 'B+', 'whole_blood', 8), ('SRC-001', 'B+', 'prbc', 14), ('SRC-001', 'B+', 'platelets', 6), ('SRC-001', 'B+', 'ffp', 10),('SRC-001', 'B+', 'cryo', 4),
('SRC-001', 'B-', 'whole_blood', 2), ('SRC-001', 'B-', 'prbc', 2),  ('SRC-001', 'B-', 'platelets', 0), ('SRC-001', 'B-', 'ffp', 1), ('SRC-001', 'B-', 'cryo', 0),
('SRC-001', 'AB+', 'whole_blood', 4),('SRC-001', 'AB+', 'prbc', 6), ('SRC-001', 'AB+', 'platelets', 3),('SRC-001', 'AB+', 'ffp', 4),('SRC-001', 'AB+', 'cryo', 1),
('SRC-001', 'AB-', 'whole_blood', 0),('SRC-001', 'AB-', 'prbc', 1), ('SRC-001', 'AB-', 'platelets', 0),('SRC-001', 'AB-', 'ffp', 1),('SRC-001', 'AB-', 'cryo', 0),
('SRC-001', 'O+', 'whole_blood', 10),('SRC-001', 'O+', 'prbc', 20), ('SRC-001', 'O+', 'platelets', 8), ('SRC-001', 'O+', 'ffp', 12),('SRC-001', 'O+', 'cryo', 5),
('SRC-001', 'O-', 'whole_blood', 2), ('SRC-001', 'O-', 'prbc', 4),  ('SRC-001', 'O-', 'platelets', 2), ('SRC-001', 'O-', 'ffp', 3), ('SRC-001', 'O-', 'cryo', 1);

-- Seed Inventory for SRC-002 (District Red Cross)
INSERT INTO blood_inventory (facility_id, blood_group, component, units) VALUES
('SRC-002', 'A+', 'whole_blood', 4), ('SRC-002', 'A+', 'prbc', 8),  ('SRC-002', 'A+', 'platelets', 3), ('SRC-002', 'A+', 'ffp', 5), ('SRC-002', 'A+', 'cryo', 1),
('SRC-002', 'A-', 'whole_blood', 2), ('SRC-002', 'A-', 'prbc', 2),  ('SRC-002', 'A-', 'platelets', 1), ('SRC-002', 'A-', 'ffp', 2), ('SRC-002', 'A-', 'cryo', 0),
('SRC-002', 'B+', 'whole_blood', 7), ('SRC-002', 'B+', 'prbc', 11), ('SRC-002', 'B+', 'platelets', 4), ('SRC-002', 'B+', 'ffp', 6), ('SRC-002', 'B+', 'cryo', 2),
('SRC-002', 'B-', 'whole_blood', 1), ('SRC-002', 'B-', 'prbc', 1),  ('SRC-002', 'B-', 'platelets', 0), ('SRC-002', 'B-', 'ffp', 1), ('SRC-002', 'B-', 'cryo', 0),
('SRC-002', 'AB+', 'whole_blood', 3),('SRC-002', 'AB+', 'prbc', 5), ('SRC-002', 'AB+', 'platelets', 2),('SRC-002', 'AB+', 'ffp', 3),('SRC-002', 'AB+', 'cryo', 1),
('SRC-002', 'AB-', 'whole_blood', 1),('SRC-002', 'AB-', 'prbc', 2), ('SRC-002', 'AB-', 'platelets', 0),('SRC-002', 'AB-', 'ffp', 1),('SRC-002', 'AB-', 'cryo', 0),
('SRC-002', 'O+', 'whole_blood', 9), ('SRC-002', 'O+', 'prbc', 15), ('SRC-002', 'O+', 'platelets', 6), ('SRC-002', 'O+', 'ffp', 9), ('SRC-002', 'O+', 'cryo', 3),
('SRC-002', 'O-', 'whole_blood', 3), ('SRC-002', 'O-', 'prbc', 5),  ('SRC-002', 'O-', 'platelets', 1), ('SRC-002', 'O-', 'ffp', 2), ('SRC-002', 'O-', 'cryo', 1);

-- Seed Inventory for SRC-003 (GGH Apex)
INSERT INTO blood_inventory (facility_id, blood_group, component, units) VALUES
('SRC-003', 'A+', 'whole_blood', 15),('SRC-003', 'A+', 'prbc', 30), ('SRC-003', 'A+', 'platelets', 12),('SRC-003', 'A+', 'ffp', 25),('SRC-003', 'A+', 'cryo', 10),
('SRC-003', 'A-', 'whole_blood', 4), ('SRC-003', 'A-', 'prbc', 8),  ('SRC-003', 'A-', 'platelets', 3), ('SRC-003', 'A-', 'ffp', 6), ('SRC-003', 'A-', 'cryo', 2),
('SRC-003', 'B+', 'whole_blood', 18),('SRC-003', 'B+', 'prbc', 35), ('SRC-003', 'B+', 'platelets', 14),('SRC-003', 'B+', 'ffp', 28),('SRC-003', 'B+', 'cryo', 8),
('SRC-003', 'B-', 'whole_blood', 3), ('SRC-003', 'B-', 'prbc', 6),  ('SRC-003', 'B-', 'platelets', 2), ('SRC-003', 'B-', 'ffp', 4), ('SRC-003', 'B-', 'cryo', 1),
('SRC-003', 'AB+', 'whole_blood', 8),('SRC-003', 'AB+', 'prbc', 16),('SRC-003', 'AB+', 'platelets', 6), ('SRC-003', 'AB+', 'ffp', 10),('SRC-003', 'AB+', 'cryo', 4),
('SRC-003', 'AB-', 'whole_blood', 2),('SRC-003', 'AB-', 'prbc', 4), ('SRC-003', 'AB-', 'platelets', 1), ('SRC-003', 'AB-', 'ffp', 3), ('SRC-003', 'AB-', 'cryo', 1),
('SRC-003', 'O+', 'whole_blood', 22),('SRC-003', 'O+', 'prbc', 45), ('SRC-003', 'O+', 'platelets', 18),('SRC-003', 'O+', 'ffp', 35),('SRC-003', 'O+', 'cryo', 12),
('SRC-003', 'O-', 'whole_blood', 5), ('SRC-003', 'O-', 'prbc', 10), ('SRC-003', 'O-', 'platelets', 4), ('SRC-003', 'O-', 'ffp', 7), ('SRC-003', 'O-', 'cryo', 3);

-- Seed Donors
INSERT INTO donors (id, name, blood_group, phone, email, city, address, lat, lng, is_available, last_donated) VALUES
('DNR-001', 'Rajesh Kumar Verma', 'O-', '+91 98480 12345', 'rajesh.verma@example.com', 'Gudlavalleru', 'Near Bus Depot, Ward 4', 16.3465, 81.0435, TRUE, '2025-11-12'),
('DNR-002', 'Sowmya Priya K.', 'A+', '+91 98492 54321', 'sowmya.k@example.com', 'Gudlavalleru', 'Main Market Road', 16.3480, 81.0460, TRUE, '2025-08-20'),
('DNR-003', 'Venkatesh Prasad', 'B+', '+91 94401 77889', 'v.prasad@example.com', 'Machilipatnam', 'Robertsonpet, Machilipatnam', 16.1850, 81.1370, TRUE, '2026-01-10'),
('DNR-004', 'Naveen Chandra', 'AB+', '+91 97005 33221', 'naveen.c@example.com', 'Vijayawada', 'Benz Circle, Vijayawada', 16.5080, 80.6410, TRUE, '2025-10-05'),
('DNR-005', 'Fatima Begum', 'O+', '+91 99887 66554', 'fatima.b@example.com', 'Vijayawada', 'One Town, Vijayawada', 16.5150, 80.6280, TRUE, '2025-12-01'),
('DNR-006', 'Kalyan Chakravarthy', 'A-', '+91 98661 44332', 'kalyan.c@example.com', 'Tenali', 'Morrispet, Tenali', 16.2440, 80.6450, TRUE, '2025-09-15'),
('DNR-007', 'Anuradha Devi', 'B-', '+91 98488 22114', 'anuradha.d@example.com', 'Guntur', 'Brodipet 4th Line, Guntur', 16.3050, 80.4400, TRUE, '2026-02-14'),
('DNR-008', 'Siddharth Rao', 'AB-', '+91 94900 88776', 'siddharth.r@example.com', 'Vijayawada', 'Moghalrajpuram, Vijayawada', 16.5010, 80.6550, TRUE, '2025-07-22');

-- Seed Blood Requests
INSERT INTO blood_requests (id, hospital_id, hospital_name, patient_name, patient_id, blood_group, component, units_required, urgency, clinical_reason, lat, lng, contact_person, contact_phone, status, matched_source, matched_source_id, match_score) VALUES
('REQ-101', 'HOSP-001', 'Metro Emergency & Trauma Care', 'Ramesh Kumar (Polytrauma)', 'MRN-2026-8812', 'O+', 'prbc', 2, 'CRITICAL', 'Compound pelvic trauma with active hemorrhagic shock', 16.3470, 81.0420, 'Dr. K. S. Sharma', '+91 86742 55900', 'Matched', 'Central Life Community Blood Bank', 'SRC-001', 98.5),
('REQ-102', 'HOSP-002', 'Machilipatnam Coastal Care Hospital', 'Venkata Lakshmi (Oncology)', 'MRN-2026-4401', 'AB-', 'platelets', 3, 'URGENT', 'Post-chemotherapy severe thrombocytopenia', 16.1820, 81.1350, 'Dr. P. V. Rao', '+91 86722 24500', 'Pending', 'District Red Cross Society Blood Center', 'SRC-002', 88.0),
('REQ-103', 'HOSP-003', 'Vijayawada Apex Institute of Medical Sciences', 'G. Satyanarayana (Cardiac Surgery)', 'MRN-2026-9055', 'A+', 'whole_blood', 4, 'STANDARD', 'Scheduled CABG open-heart operation reserve', 16.5062, 80.6480, 'Dr. Ananya Reddy', '+91 86625 90120', 'Fulfilled', 'Government General Hospital Apex Blood Bank', 'SRC-003', 96.0);

-- Seed Notifications
INSERT INTO notifications (title, message, type) VALUES
('CRITICAL ALERT: O+ PRBC Required', 'Metro Emergency & Trauma Care logged Critical Code Red for 2 units O+ PRBC. Central Life Community Blood Bank matched.', 'critical'),
('New Donor Registered', 'Rajesh Kumar Verma (O-) registered as active voluntary donor in Gudlavalleru.', 'success'),
('Inventory Refreshed', 'District Red Cross Blood Center updated available blood components.', 'info');

-- Seed Users (passwords are 'password123')
INSERT INTO users (username, email, password_hash, role, facility_id) VALUES
('hospital_admin', 'admin@hospital.org', 'scrypt:32768:8:1$i83d...$demohash', 'hospital', 'HOSP-001'),
('bloodbank_admin', 'admin@bloodbank.org', 'scrypt:32768:8:1$i83d...$demohash', 'blood_bank', 'SRC-001'),
('super_admin', 'admin@lifelink.org', 'scrypt:32768:8:1$i83d...$demohash', 'admin', NULL),
('donor_rajesh', 'rajesh.verma@example.com', 'scrypt:32768:8:1$i83d...$demohash', 'donor', 'DNR-001');
