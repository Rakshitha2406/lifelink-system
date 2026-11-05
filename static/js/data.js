// ============================================================================
// LifeLink — Smart Emergency Blood Availability & Matching System
// Clinical Knowledge Base & Transfusion Compatibility Engine
// ============================================================================

// Blood Groups List
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Blood Components
const BLOOD_COMPONENTS = [
  { id: 'whole_blood', name: 'Whole Blood', unit: 'Units' },
  { id: 'prbc', name: 'Packed Red Blood Cells (PRBC)', unit: 'Units' },
  { id: 'platelets', name: 'Random Donor Platelets (RDP) / SDP', unit: 'Units' },
  { id: 'ffp', name: 'Fresh Frozen Plasma (FFP)', unit: 'Units' },
  { id: 'cryo', name: 'Cryoprecipitate', unit: 'Units' }
];

// Compatibility Matrices by Component
// Based on standard clinical transfusion guidelines
const COMPATIBILITY_RULES = {
  // Red Blood Cells / Whole Blood: Recipient group -> Compatible Donor groups
  red_cells: {
    'O-':  ['O-'],
    'O+':  ['O+', 'O-'],
    'A-':  ['A-', 'O-'],
    'A+':  ['A+', 'A-', 'O+', 'O-'],
    'B-':  ['B-', 'O-'],
    'B+':  ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'] // Universal Recipient
  },

  // Plasma (FFP): Notice plasma compatibility is REVERSED compared to red cells!
  // AB is universal plasma donor; O is universal plasma recipient
  plasma: {
    'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+':  ['O+', 'A+', 'B+', 'AB+'],
    'A-':  ['A-', 'A+', 'AB-', 'AB+'],
    'A+':  ['A+', 'AB+'],
    'B-':  ['B-', 'B+', 'AB-', 'AB+'],
    'B+':  ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+']
  },

  // Platelets (preferred ABO identical, but compatible alternatives accepted in emergency)
  platelets: {
    'O-':  ['O-', 'O+'],
    'O+':  ['O+', 'O-'],
    'A-':  ['A-', 'A+', 'O-'],
    'A+':  ['A+', 'A-', 'O+', 'O-'],
    'B-':  ['B-', 'B+', 'O-'],
    'B+':  ['B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
  }
};

// Default Fallback Participating Blood Sources
const DEFAULT_BLOOD_SOURCES = [
  {
    id: 'SRC-001',
    name: 'Central Life Community Blood Bank',
    type: 'Community Blood Center',
    category: 'blood_bank',
    contactPerson: 'Dr. K. Srinivas (In-Charge)',
    phone: '+91 86742 55101',
    email: 'central.bb@lifelink-network.in',
    address: 'Main Road, Near Bus Stand, Gudlavalleru',
    city: 'Gudlavalleru',
    lat: 16.3458,
    lng: 81.0452,
    verified: true,
    operatingHours: '24/7 Emergency Service',
    lastUpdated: new Date().toISOString(),
    inventory: {
      'A+':  { whole_blood: 6,  prbc: 12, platelets: 5,  ffp: 8,  cryo: 2 },
      'A-':  { whole_blood: 1,  prbc: 3,  platelets: 1,  ffp: 2,  cryo: 0 },
      'B+':  { whole_blood: 8,  prbc: 14, platelets: 6,  ffp: 10, cryo: 4 },
      'B-':  { whole_blood: 2,  prbc: 2,  platelets: 0,  ffp: 1,  cryo: 0 },
      'AB+': { whole_blood: 4,  prbc: 6,  platelets: 3,  ffp: 4,  cryo: 1 },
      'AB-': { whole_blood: 0,  prbc: 1,  platelets: 0,  ffp: 1,  cryo: 0 },
      'O+':  { whole_blood: 10, prbc: 20, platelets: 8,  ffp: 12, cryo: 5 },
      'O-':  { whole_blood: 2,  prbc: 4,  platelets: 2,  ffp: 3,  cryo: 1 }
    }
  },
  {
    id: 'SRC-002',
    name: 'District Red Cross Society Blood Center',
    type: 'Red Cross Society Center',
    category: 'blood_bank',
    contactPerson: 'M. Lakshmi Narayana (Transfusion Officer)',
    phone: '+91 86722 22890',
    email: 'redcross.mtm@lifelink-network.in',
    address: 'Near District Hospital, Machilipatnam',
    city: 'Machilipatnam',
    lat: 16.1875,
    lng: 81.1389,
    verified: true,
    operatingHours: '24/7 Emergency Service',
    lastUpdated: new Date().toISOString(),
    inventory: {
      'A+':  { whole_blood: 4,  prbc: 8,  platelets: 3,  ffp: 5,  cryo: 1 },
      'A-':  { whole_blood: 2,  prbc: 2,  platelets: 1,  ffp: 2,  cryo: 0 },
      'B+':  { whole_blood: 7,  prbc: 11, platelets: 4,  ffp: 6,  cryo: 2 },
      'B-':  { whole_blood: 1,  prbc: 1,  platelets: 0,  ffp: 1,  cryo: 0 },
      'AB+': { whole_blood: 3,  prbc: 5,  platelets: 2,  ffp: 3,  cryo: 1 },
      'AB-': { whole_blood: 1,  prbc: 2,  platelets: 0,  ffp: 1,  cryo: 0 },
      'O+':  { whole_blood: 9,  prbc: 15, platelets: 6,  ffp: 9,  cryo: 3 },
      'O-':  { whole_blood: 3,  prbc: 5,  platelets: 1,  ffp: 2,  cryo: 1 }
    }
  },
  {
    id: 'SRC-003',
    name: 'Government General Hospital Apex Blood Bank',
    type: 'Apex Tertiary Blood Centre',
    category: 'hospital_center',
    contactPerson: 'Dr. V. Ramana Rao (HOD Blood Bank)',
    phone: '+91 86625 78441',
    email: 'ggh.vijayawada@lifelink-network.in',
    address: 'Hanumanpet, Opposite Railway Station, Vijayawada',
    city: 'Vijayawada',
    lat: 16.5131,
    lng: 80.6325,
    verified: true,
    operatingHours: '24/7 Apex Facility',
    lastUpdated: new Date().toISOString(),
    inventory: {
      'A+':  { whole_blood: 15, prbc: 30, platelets: 12, ffp: 25, cryo: 10 },
      'A-':  { whole_blood: 4,  prbc: 8,  platelets: 3,  ffp: 6,  cryo: 2 },
      'B+':  { whole_blood: 18, prbc: 35, platelets: 14, ffp: 28, cryo: 8 },
      'B-':  { whole_blood: 3,  prbc: 6,  platelets: 2,  ffp: 4,  cryo: 1 },
      'AB+': { whole_blood: 8,  prbc: 16, platelets: 6,  ffp: 10, cryo: 4 },
      'AB-': { whole_blood: 2,  prbc: 4,  platelets: 1,  ffp: 3,  cryo: 1 },
      'O+':  { whole_blood: 22, prbc: 45, platelets: 18, ffp: 35, cryo: 12 },
      'O-':  { whole_blood: 5,  prbc: 10, platelets: 4,  ffp: 7,  cryo: 3 }
    }
  },
  {
    id: 'SRC-004',
    name: 'City Emergency Regional Blood Center',
    type: 'Accredited Hospital Blood Store',
    category: 'hospital_center',
    contactPerson: 'Sister Grace K. (Shift Supervisor)',
    phone: '+91 86624 33000',
    email: 'cityemergency.bb@lifelink-network.in',
    address: 'Suryaraopet, Governorpet, Vijayawada',
    city: 'Vijayawada',
    lat: 16.5090,
    lng: 80.6400,
    verified: true,
    operatingHours: '24/7 Transfusion Wing',
    lastUpdated: new Date().toISOString(),
    inventory: {
      'A+':  { whole_blood: 5,  prbc: 10, platelets: 4,  ffp: 7,  cryo: 2 },
      'A-':  { whole_blood: 1,  prbc: 2,  platelets: 0,  ffp: 1,  cryo: 0 },
      'B+':  { whole_blood: 6,  prbc: 12, platelets: 5,  ffp: 8,  cryo: 3 },
      'B-':  { whole_blood: 0,  prbc: 1,  platelets: 0,  ffp: 1,  cryo: 0 },
      'AB+': { whole_blood: 2,  prbc: 4,  platelets: 2,  ffp: 3,  cryo: 1 },
      'AB-': { whole_blood: 0,  prbc: 0,  platelets: 0,  ffp: 0,  cryo: 0 },
      'O+':  { whole_blood: 8,  prbc: 16, platelets: 6,  ffp: 11, cryo: 4 },
      'O-':  { whole_blood: 1,  prbc: 2,  platelets: 1,  ffp: 1,  cryo: 0 }
    }
  },
  {
    id: 'SRC-005',
    name: 'Tenali Sub-District Blood Bank',
    type: 'Government Sub-District Blood Center',
    category: 'blood_bank',
    contactPerson: 'P. Bapuji (Senior Lab Tech)',
    phone: '+91 86442 27715',
    email: 'tenali.sdh@lifelink-network.in',
    address: 'Near Taluka Karyalayam, Tenali',
    city: 'Tenali',
    lat: 16.2410,
    lng: 80.6475,
    verified: true,
    operatingHours: '8:00 AM - 8:00 PM (On-Call Night Service)',
    lastUpdated: new Date().toISOString(),
    inventory: {
      'A+':  { whole_blood: 3,  prbc: 5,  platelets: 1,  ffp: 4,  cryo: 0 },
      'A-':  { whole_blood: 0,  prbc: 1,  platelets: 0,  ffp: 1,  cryo: 0 },
      'B+':  { whole_blood: 4,  prbc: 7,  platelets: 2,  ffp: 5,  cryo: 1 },
      'B-':  { whole_blood: 1,  prbc: 1,  platelets: 0,  ffp: 0,  cryo: 0 },
      'AB+': { whole_blood: 2,  prbc: 3,  platelets: 1,  ffp: 2,  cryo: 0 },
      'AB-': { whole_blood: 0,  prbc: 0,  platelets: 0,  ffp: 0,  cryo: 0 },
      'O+':  { whole_blood: 5,  prbc: 9,  platelets: 3,  ffp: 6,  cryo: 2 },
      'O-':  { whole_blood: 1,  prbc: 1,  platelets: 0,  ffp: 1,  cryo: 0 }
    }
  },
  {
    id: 'SRC-006',
    name: 'Guntur Apex Blood Storage & Component Unit',
    type: 'Rotary Club Blood Bank',
    category: 'blood_bank',
    contactPerson: 'Dr. C. Venkatesh (Medical Director)',
    phone: '+91 86322 34488',
    email: 'rotary.guntur@lifelink-network.in',
    address: 'Old Club Road, Kothapet, Guntur',
    city: 'Guntur',
    lat: 16.3067,
    lng: 80.4365,
    verified: true,
    operatingHours: '24/7 Emergency Service',
    lastUpdated: new Date().toISOString(),
    inventory: {
      'A+':  { whole_blood: 8,  prbc: 16, platelets: 7,  ffp: 14, cryo: 5 },
      'A-':  { whole_blood: 2,  prbc: 4,  platelets: 1,  ffp: 3,  cryo: 1 },
      'B+':  { whole_blood: 10, prbc: 20, platelets: 8,  ffp: 16, cryo: 6 },
      'B-':  { whole_blood: 2,  prbc: 3,  platelets: 1,  ffp: 2,  cryo: 0 },
      'AB+': { whole_blood: 4,  prbc: 8,  platelets: 3,  ffp: 5,  cryo: 2 },
      'AB-': { whole_blood: 1,  prbc: 2,  platelets: 0,  ffp: 1,  cryo: 0 },
      'O+':  { whole_blood: 12, prbc: 25, platelets: 10, ffp: 20, cryo: 7 },
      'O-':  { whole_blood: 3,  prbc: 6,  platelets: 2,  ffp: 4,  cryo: 2 }
    }
  }
];

// Default Participating Hospitals
const DEFAULT_HOSPITALS = [
  {
    id: 'HOSP-001',
    name: 'Metro Emergency & Trauma Care',
    email: 'emergency@metrocare.org',
    phone: '+91 86742 55900',
    address: 'Main Hospital Road, Gudlavalleru Sector 2',
    city: 'Gudlavalleru',
    lat: 16.3470,
    lng: 81.0420,
    repName: 'Dr. K. S. Sharma (Trauma Lead)',
    licenseNo: 'HOSP-AP-2023-8821'
  },
  {
    id: 'HOSP-002',
    name: 'Machilipatnam Coastal Care Hospital',
    email: 'requisitions@coastalcare.in',
    phone: '+91 86722 24500',
    address: 'Collectorate Junction, Machilipatnam',
    city: 'Machilipatnam',
    lat: 16.1820,
    lng: 81.1350,
    repName: 'Dr. P. V. Rao (Chief Medical Officer)',
    licenseNo: 'HOSP-AP-2021-4190'
  },
  {
    id: 'HOSP-003',
    name: 'Vijayawada Apex Institute of Medical Sciences',
    email: 'blood.order@vijayawadaapex.org',
    phone: '+91 86625 90120',
    address: 'Ring Road, Near Benz Circle, Vijayawada',
    city: 'Vijayawada',
    lat: 16.5062,
    lng: 80.6480,
    repName: 'Dr. Ananya Reddy (Blood Bank Liaison)',
    licenseNo: 'HOSP-AP-2020-1104'
  },
  {
    id: 'HOSP-004',
    name: 'Tenali Multi-Speciality Care Hospital',
    email: 'emergency@tenalicare.in',
    phone: '+91 86442 33110',
    address: 'Station Road, Tenali',
    city: 'Tenali',
    lat: 16.2430,
    lng: 80.6400,
    repName: 'Dr. M. Sridhar (ICU Superintendent)',
    licenseNo: 'HOSP-AP-2022-7741'
  }
];

// Default Donors
const DEFAULT_DONORS = [
  {
    id: 'DNR-001',
    name: 'Rajesh Kumar Verma',
    bloodGroup: 'O-',
    phone: '+91 98480 12345',
    email: 'rajesh.verma@example.com',
    city: 'Gudlavalleru',
    address: 'Near Bus Depot, Ward 4',
    lat: 16.3465,
    lng: 81.0435,
    isAvailable: true,
    lastDonated: '2025-11-12'
  },
  {
    id: 'DNR-002',
    name: 'Sowmya Priya K.',
    bloodGroup: 'A+',
    phone: '+91 98492 54321',
    email: 'sowmya.k@example.com',
    city: 'Gudlavalleru',
    address: 'Main Market Road',
    lat: 16.3480,
    lng: 81.0460,
    isAvailable: true,
    lastDonated: '2025-08-20'
  },
  {
    id: 'DNR-003',
    name: 'Venkatesh Prasad',
    bloodGroup: 'B+',
    phone: '+91 94401 77889',
    email: 'v.prasad@example.com',
    city: 'Machilipatnam',
    address: 'Robertsonpet, Machilipatnam',
    lat: 16.1850,
    lng: 81.1370,
    isAvailable: true,
    lastDonated: '2026-01-10'
  },
  {
    id: 'DNR-004',
    name: 'Naveen Chandra',
    bloodGroup: 'AB+',
    phone: '+91 97005 33221',
    email: 'naveen.c@example.com',
    city: 'Vijayawada',
    lat: 16.5080,
    lng: 80.6410,
    isAvailable: true,
    lastDonated: '2025-10-05'
  },
  {
    id: 'DNR-005',
    name: 'Fatima Begum',
    bloodGroup: 'O+',
    phone: '+91 99887 66554',
    email: 'fatima.b@example.com',
    city: 'Vijayawada',
    address: 'One Town, Vijayawada',
    lat: 16.5150,
    lng: 80.6280,
    isAvailable: true,
    lastDonated: '2025-12-01'
  },
  {
    id: 'DNR-006',
    name: 'Kalyan Chakravarthy',
    bloodGroup: 'A-',
    phone: '+91 98661 44332',
    email: 'kalyan.c@example.com',
    city: 'Tenali',
    address: 'Morrispet, Tenali',
    lat: 16.2440,
    lng: 80.6450,
    isAvailable: true,
    lastDonated: '2025-09-15'
  },
  {
    id: 'DNR-007',
    name: 'Anuradha Devi',
    bloodGroup: 'B-',
    phone: '+91 98488 22114',
    email: 'anuradha.d@example.com',
    city: 'Guntur',
    address: 'Brodipet 4th Line, Guntur',
    lat: 16.3050,
    lng: 80.4400,
    isAvailable: true,
    lastDonated: '2026-02-14'
  },
  {
    id: 'DNR-008',
    name: 'Siddharth Rao',
    bloodGroup: 'AB-',
    phone: '+91 94900 88776',
    email: 'siddharth.r@example.com',
    city: 'Vijayawada',
    address: 'Moghalrajpuram, Vijayawada',
    lat: 16.5010,
    lng: 80.6550,
    isAvailable: true,
    lastDonated: '2025-07-22'
  }
];

// Default Requests
const DEFAULT_REQUESTS = [
  {
    id: 'REQ-101',
    hospitalId: 'HOSP-001',
    hospitalName: 'Metro Emergency & Trauma Care',
    patientName: 'Ramesh Kumar (Polytrauma)',
    patientId: 'MRN-2026-8812',
    bloodGroup: 'O+',
    component: 'prbc',
    unitsRequired: 2,
    urgency: 'CRITICAL',
    clinicalReason: 'Compound pelvic trauma with active hemorrhagic shock',
    lat: 16.3470,
    lng: 81.0420,
    contactPerson: 'Dr. K. S. Sharma',
    contactPhone: '+91 86742 55900',
    status: 'Matched',
    matchedSource: 'Central Life Community Blood Bank',
    matchedSourceId: 'SRC-001',
    matchScore: 98.5,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
  },
  {
    id: 'REQ-102',
    hospitalId: 'HOSP-002',
    hospitalName: 'Machilipatnam Coastal Care Hospital',
    patientName: 'Venkata Lakshmi (Oncology)',
    patientId: 'MRN-2026-4401',
    bloodGroup: 'AB-',
    component: 'platelets',
    unitsRequired: 3,
    urgency: 'URGENT',
    clinicalReason: 'Post-chemotherapy severe thrombocytopenia',
    lat: 16.1820,
    lng: 81.1350,
    contactPerson: 'Dr. P. V. Rao',
    contactPhone: '+91 86722 24500',
    status: 'Pending',
    matchedSource: 'District Red Cross Society Blood Center',
    matchedSourceId: 'SRC-002',
    matchScore: 88.0,
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
  },
  {
    id: 'REQ-103',
    hospitalId: 'HOSP-003',
    hospitalName: 'Vijayawada Apex Institute of Medical Sciences',
    patientName: 'G. Satyanarayana (Cardiac Surgery)',
    patientId: 'MRN-2026-9055',
    bloodGroup: 'A+',
    component: 'whole_blood',
    unitsRequired: 4,
    urgency: 'STANDARD',
    clinicalReason: 'Scheduled CABG open-heart operation reserve',
    lat: 16.5062,
    lng: 80.6480,
    contactPerson: 'Dr. Ananya Reddy',
    contactPhone: '+91 86625 90120',
    status: 'Fulfilled',
    matchedSource: 'Government General Hospital Apex Blood Bank',
    matchedSourceId: 'SRC-003',
    matchScore: 96.0,
    createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString()
  }
];

// Default System Notifications
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'NOTIF-1',
    title: 'CRITICAL ALERT: O+ PRBC Required',
    message: 'Metro Emergency & Trauma Care logged Critical Code Red for 2 units O+ PRBC. Central Life Community Blood Bank matched.',
    type: 'critical',
    read: false,
    timestamp: new Date().toISOString()
  },
  {
    id: 'NOTIF-2',
    title: 'New Donor Registered',
    message: 'Rajesh Kumar Verma (O-) registered as active voluntary donor in Gudlavalleru.',
    type: 'success',
    read: false,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 'NOTIF-3',
    title: 'Inventory Refreshed',
    message: 'District Red Cross Blood Center updated available blood components.',
    type: 'info',
    read: true,
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  }
];
