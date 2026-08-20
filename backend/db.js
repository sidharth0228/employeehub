const Datastore = require('nedb-promises');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');

// Create datastores
const db = {
  users: Datastore.create({ filename: path.join(DATA_DIR, 'users.db'), autoload: true }),
  employees: Datastore.create({ filename: path.join(DATA_DIR, 'employees.db'), autoload: true }),
  documents: Datastore.create({ filename: path.join(DATA_DIR, 'documents.db'), autoload: true }),
  document_categories: Datastore.create({ filename: path.join(DATA_DIR, 'document_categories.db'), autoload: true }),
  leave_applications: Datastore.create({ filename: path.join(DATA_DIR, 'leave.db'), autoload: true }),
  activity_log: Datastore.create({ filename: path.join(DATA_DIR, 'activity.db'), autoload: true }),
  settings: Datastore.create({ filename: path.join(DATA_DIR, 'settings.db'), autoload: true }),
};

async function initDb() {
  const fs = require('fs');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const existingUser = await db.users.findOne({});
  if (existingUser) return;

  console.log('🌱 Seeding database...');

  // Seed admin
  const hash = bcrypt.hashSync('password123', 10);
  const admin = await db.users.insert({
    email: 'admin@employeehub.com',
    password_hash: hash,
    name: 'HR Admin',
    role: 'hr_admin',
    created_at: new Date().toISOString()
  });

  // Seed document categories
  const catData = [
    { name: 'Passport', is_required: true, description: 'Employee passport copy' },
    { name: 'Aadhaar Card', is_required: true, description: 'Government ID proof' },
    { name: 'PAN Card', is_required: true, description: 'Tax identification' },
    { name: 'Work Permit', is_required: false, description: 'Work authorization (for foreign nationals)' },
    { name: 'Educational Certificates', is_required: true, description: 'Degree / Diploma certificates' },
    { name: 'Experience Letters', is_required: false, description: 'Previous employment letters' },
    { name: 'Bank Statement', is_required: true, description: 'Recent bank statement for salary' },
    { name: 'Photo', is_required: true, description: 'Recent passport-size photograph' },
  ];
  const cats = [];
  for (const c of catData) {
    cats.push(await db.document_categories.insert({ ...c, created_at: new Date().toISOString() }));
  }

  // Seed employees
  const empData = [
    { employee_id: 'EH-001', first_name: 'Rahul', last_name: 'Sharma', email: 'rahul.sharma@company.com', phone: '+91-9876543210', department: 'Engineering', designation: 'Senior Software Engineer', employment_type: 'full_time', date_of_joining: '2022-03-15', date_of_birth: '1992-06-20', gender: 'male', nationality: 'Indian', status: 'active', onboarding_status: 'complete', onboarding_step: 4, address: '12, MG Road, Mumbai' },
    { employee_id: 'EH-002', first_name: 'Priya', last_name: 'Sharma', email: 'priya.sharma@company.com', phone: '+91-9876543211', department: 'HR', designation: 'HR Executive', employment_type: 'full_time', date_of_joining: '2023-01-10', date_of_birth: '1995-03-12', gender: 'female', nationality: 'Indian', status: 'active', onboarding_status: 'in_progress', onboarding_step: 3, address: '45, Park Street, Bangalore' },
    { employee_id: 'EH-003', first_name: 'Aman', last_name: 'Kumar', email: 'aman.kumar@company.com', phone: '+91-9876543212', department: 'Finance', designation: 'Finance Analyst', employment_type: 'full_time', date_of_joining: '2021-07-01', date_of_birth: '1990-11-05', gender: 'male', nationality: 'Indian', status: 'active', onboarding_status: 'complete', onboarding_step: 4, address: '78, Lake View, Hyderabad' },
    { employee_id: 'EH-004', first_name: 'Sarah', last_name: 'Jenkins', email: 'sarah.jenkins@company.com', phone: '+44-7700900123', department: 'Marketing', designation: 'Marketing Manager', employment_type: 'full_time', date_of_joining: '2023-06-01', date_of_birth: '1988-09-15', gender: 'female', nationality: 'British', status: 'active', onboarding_status: 'in_progress', onboarding_step: 2, address: '10 Downing Lane, London' },
    { employee_id: 'EH-005', first_name: 'Michael', last_name: 'Chen', email: 'michael.chen@company.com', phone: '+1-4155550123', department: 'Engineering', designation: 'DevOps Engineer', employment_type: 'full_time', date_of_joining: '2022-09-20', date_of_birth: '1993-04-25', gender: 'male', nationality: 'American', status: 'active', onboarding_status: 'complete', onboarding_step: 4, address: '250 Bay Area Blvd, San Francisco' },
    { employee_id: 'EH-006', first_name: 'Emily', last_name: 'Davis', email: 'emily.davis@company.com', phone: '+91-9876543215', department: 'Design', designation: 'UI/UX Designer', employment_type: 'full_time', date_of_joining: '2022-11-15', date_of_birth: '1994-07-30', gender: 'female', nationality: 'Indian', status: 'on_leave', onboarding_status: 'complete', onboarding_step: 4, address: '34, Indiranagar, Bangalore' },
    { employee_id: 'EH-007', first_name: 'Vikram', last_name: 'Patel', email: 'vikram.patel@company.com', phone: '+91-9876543216', department: 'Engineering', designation: 'Backend Developer', employment_type: 'contract', date_of_joining: '2023-03-01', date_of_birth: '1991-12-10', gender: 'male', nationality: 'Indian', status: 'active', onboarding_status: 'pending', onboarding_step: 1, address: '90, Salt Lake, Kolkata' },
    { employee_id: 'EH-008', first_name: 'Neha', last_name: 'Singh', email: 'neha.singh@company.com', phone: '+91-9876543217', department: 'Operations', designation: 'Operations Lead', employment_type: 'full_time', date_of_joining: '2020-05-10', date_of_birth: '1987-02-18', gender: 'female', nationality: 'Indian', status: 'active', onboarding_status: 'complete', onboarding_step: 4, address: '67, Connaught Place, Delhi' },
    { employee_id: 'EH-009', first_name: 'Raj', last_name: 'Mehta', email: 'raj.mehta@company.com', phone: '+91-9876543218', department: 'Sales', designation: 'Sales Executive', employment_type: 'full_time', date_of_joining: '2023-08-01', date_of_birth: '1996-05-22', gender: 'male', nationality: 'Indian', status: 'active', onboarding_status: 'in_progress', onboarding_step: 2, address: '23, Juhu Beach Road, Mumbai' },
    { employee_id: 'EH-010', first_name: 'Ananya', last_name: 'Roy', email: 'ananya.roy@company.com', phone: '+91-9876543219', department: 'Finance', designation: 'Accountant', employment_type: 'part_time', date_of_joining: '2022-02-14', date_of_birth: '1993-08-07', gender: 'female', nationality: 'Indian', status: 'active', onboarding_status: 'complete', onboarding_step: 4, address: '5, Park Circus, Kolkata' },
    { employee_id: 'EH-011', first_name: 'Karan', last_name: 'Verma', email: 'karan.verma@company.com', phone: '+91-9876543220', department: 'Engineering', designation: 'QA Engineer', employment_type: 'full_time', date_of_joining: '2021-10-01', date_of_birth: '1992-01-30', gender: 'male', nationality: 'Indian', status: 'inactive', onboarding_status: 'complete', onboarding_step: 4, address: '11, Sector 18, Noida' },
    { employee_id: 'EH-012', first_name: 'Divya', last_name: 'Nair', email: 'divya.nair@company.com', phone: '+91-9876543221', department: 'Design', designation: 'Graphic Designer', employment_type: 'full_time', date_of_joining: '2023-04-15', date_of_birth: '1997-11-14', gender: 'female', nationality: 'Indian', status: 'active', onboarding_status: 'in_progress', onboarding_step: 3, address: '55, Koramangala, Bangalore' },
    { employee_id: 'EH-013', first_name: 'Suresh', last_name: 'Babu', email: 'suresh.babu@company.com', phone: '+91-9876543222', department: 'Operations', designation: 'Operations Manager', employment_type: 'full_time', date_of_joining: '2019-12-01', date_of_birth: '1985-06-25', gender: 'male', nationality: 'Indian', status: 'active', onboarding_status: 'complete', onboarding_step: 4, address: '88, Anna Nagar, Chennai' },
    { employee_id: 'EH-014', first_name: 'Pooja', last_name: 'Gupta', email: 'pooja.gupta@company.com', phone: '+91-9876543223', department: 'Marketing', designation: 'Content Writer', employment_type: 'contract', date_of_joining: '2023-09-01', date_of_birth: '1998-03-09', gender: 'female', nationality: 'Indian', status: 'active', onboarding_status: 'pending', onboarding_step: 1, address: '101, Civil Lines, Jaipur' },
    { employee_id: 'EH-015', first_name: 'Arjun', last_name: 'Kapoor', email: 'arjun.kapoor@company.com', phone: '+91-9876543224', department: 'Sales', designation: 'Sales Manager', employment_type: 'full_time', date_of_joining: '2020-08-17', date_of_birth: '1988-10-03', gender: 'male', nationality: 'Indian', status: 'on_leave', onboarding_status: 'complete', onboarding_step: 4, address: '200, Bandra West, Mumbai' },
  ];
  const emps = [];
  for (const e of empData) {
    emps.push(await db.employees.insert({ ...e, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
  }

  // Seed documents
  const docData = [
    { employee_id: emps[0]._id, category_id: cats[0]._id, category_name: 'Passport', file_name: 'rahul_passport.pdf', expiry_date: '2024-07-15', status: 'verified', notes: '' },
    { employee_id: emps[0]._id, category_id: cats[1]._id, category_name: 'Aadhaar Card', file_name: 'rahul_aadhaar.pdf', expiry_date: null, status: 'verified', notes: '' },
    { employee_id: emps[0]._id, category_id: cats[2]._id, category_name: 'PAN Card', file_name: 'rahul_pan.pdf', expiry_date: null, status: 'pending', notes: 'Awaiting verification' },
    { employee_id: emps[2]._id, category_id: cats[3]._id, category_name: 'Work Permit', file_name: 'aman_work_permit.pdf', expiry_date: '2023-06-01', status: 'expired', notes: 'Work permit expired – renewal required' },
    { employee_id: emps[1]._id, category_id: cats[2]._id, category_name: 'PAN Card', file_name: 'priya_pan.pdf', expiry_date: null, status: 'rejected', notes: 'Image unclear, please resubmit' },
    { employee_id: emps[3]._id, category_id: cats[0]._id, category_name: 'Passport', file_name: 'sarah_passport.pdf', expiry_date: '2027-03-20', status: 'verified', notes: '' },
    { employee_id: emps[4]._id, category_id: cats[1]._id, category_name: 'Aadhaar Card', file_name: 'michael_id.pdf', expiry_date: null, status: 'verified', notes: '' },
  ];
  for (const d of docData) {
    await db.documents.insert({ ...d, file_url: null, mime_type: null, uploaded_at: new Date().toISOString() });
  }

  // Seed leave applications
  const leaveData = [
    { employee_id: emps[3]._id, employee_name: 'Sarah Jenkins', emp_code: 'EH-004', department: 'Marketing', leave_type: 'Sick Leave', start_date: '2023-06-14', end_date: '2023-06-15', days_count: 2, reason: 'Not feeling well', status: 'pending' },
    { employee_id: emps[4]._id, employee_name: 'Michael Chen', emp_code: 'EH-005', department: 'Engineering', leave_type: 'Annual Leave', start_date: '2023-06-20', end_date: '2023-06-25', days_count: 5, reason: 'Family vacation', status: 'approved' },
    { employee_id: emps[5]._id, employee_name: 'Emily Davis', emp_code: 'EH-006', department: 'Design', leave_type: 'Maternity Leave', start_date: '2023-07-01', end_date: '2023-09-30', days_count: 90, reason: 'Maternity leave', status: 'pending' },
    { employee_id: emps[0]._id, employee_name: 'Rahul Sharma', emp_code: 'EH-001', department: 'Engineering', leave_type: 'Annual Leave', start_date: '2023-07-10', end_date: '2023-07-14', days_count: 5, reason: 'Personal trip', status: 'approved' },
    { employee_id: emps[1]._id, employee_name: 'Priya Sharma', emp_code: 'EH-002', department: 'HR', leave_type: 'Sick Leave', start_date: '2023-06-05', end_date: '2023-06-06', days_count: 2, reason: 'Fever', status: 'approved' },
    { employee_id: emps[14]._id, employee_name: 'Arjun Kapoor', emp_code: 'EH-015', department: 'Sales', leave_type: 'Annual Leave', start_date: '2023-08-01', end_date: '2023-08-10', days_count: 10, reason: 'Vacation', status: 'pending' },
    { employee_id: emps[2]._id, employee_name: 'Aman Kumar', emp_code: 'EH-003', department: 'Finance', leave_type: 'Casual Leave', start_date: '2023-06-28', end_date: '2023-06-28', days_count: 1, reason: 'Personal work', status: 'rejected' },
  ];
  for (const l of leaveData) {
    await db.leave_applications.insert({ ...l, applied_at: new Date().toISOString(), reviewed_by: null, reviewed_at: null, notes: '' });
  }

  // Seed settings
  const settingsData = [
    { key: 'org_name', value: 'EmployeeHub Inc.' },
    { key: 'org_email', value: 'hr@employeehub.com' },
    { key: 'org_phone', value: '+91-1234567890' },
    { key: 'org_address', value: '123 Business Park, Mumbai, India' },
    { key: 'org_website', value: 'https://employeehub.com' },
    { key: 'leave_annual_quota', value: '21' },
    { key: 'leave_sick_quota', value: '10' },
    { key: 'leave_casual_quota', value: '7' },
  ];
  for (const s of settingsData) {
    await db.settings.insert(s);
  }

  // Seed activity log
  await db.activity_log.insert({ actor_id: admin._id, actor_name: 'HR Admin', action: 'verified', entity_type: 'employee', entity_id: emps[2]._id, details: 'Aman Kumar verified by HR Admin', created_at: new Date(Date.now() - 7200000).toISOString() });
  await db.activity_log.insert({ actor_id: admin._id, actor_name: 'HR Admin', action: 'added', entity_type: 'employee', entity_id: emps[3]._id, details: 'New employee Sarah Jenkins added', created_at: new Date(Date.now() - 18000000).toISOString() });
  await db.activity_log.insert({ actor_id: admin._id, actor_name: 'HR Admin', action: 'approved', entity_type: 'leave', entity_id: null, details: 'Leave approved for Michael Chen', created_at: new Date(Date.now() - 86400000).toISOString() });

  console.log('✅ Database seeded successfully');
}

module.exports = { db, initDb };
