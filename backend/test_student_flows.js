const http = require('http');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const headers = { 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) headers.Authorization = `Bearer ${token}`;
    const req = http.request({ hostname: 'localhost', port: Number(process.env.TEST_PORT || 5000), path, method, headers }, res => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : {} }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function expect(condition, message) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  console.log(`PASS: ${message}`);
}

async function run() {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const selfEmail = `student.self.${suffix}@example.test`;
  const adminEmail = `student.admin.${suffix}@example.test`;
  const changedEmail = `student.changed.${suffix}@example.test`;

  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'kietgroup@gmail.com', password: 'kiet123', selectedRole: 'admin'
  });
  expect(adminLogin.status === 200 && adminLogin.body.token, 'admin login obtains JWT');

  const registration = await request('POST', '/api/auth/register', {
    name: 'Student Self Registration', email: selfEmail, phone: '9876543210',
    password: 'student-password', role: 'student'
  });
  expect(registration.status === 201 && registration.body.user.role === 'student', 'student self-registration creates a student user');

  for (const phone of ['98765abc10', '98765432101', '987654321']) {
    const invalid = await request('POST', '/api/auth/register', {
      name: 'Invalid Phone', email: `invalid.${phone.replace(/\W/g, '')}.${suffix}@example.test`,
      phone, password: 'student-password', role: 'student'
    });
    expect(invalid.status === 400, `self-registration rejects invalid phone ${phone}`);
  }

  const duplicate = await request('POST', '/api/auth/register', {
    name: 'Duplicate', email: selfEmail, phone: '9876543210', password: 'student-password', role: 'student'
  });
  expect(duplicate.status === 409, 'self-registration rejects duplicate email');

  const selfLogin = await request('POST', '/api/auth/login', {
    email: selfEmail, password: 'student-password', selectedRole: 'student'
  });
  expect(selfLogin.status === 200 && selfLogin.body.user.role === 'student', 'new self-registered student can log in to student portal');

  const wrongPassword = await request('POST', '/api/auth/login', {
    email: selfEmail, password: 'incorrect-password', selectedRole: 'student'
  });
  expect(wrongPassword.status === 401 && wrongPassword.body.error === 'Incorrect email or password.', 'wrong password returns generic error');

  const crossRole = await request('POST', '/api/auth/login', {
    email: selfEmail, password: 'student-password', selectedRole: 'alumni'
  });
  expect(crossRole.status === 401 && crossRole.body.error === 'Incorrect email or password.', 'student credentials cannot log in through alumni portal');

  const studentAsAdmin = await request('POST', '/api/auth/login', {
    email: selfEmail, password: 'student-password', selectedRole: 'admin'
  });
  expect(studentAsAdmin.status === 401, 'student credentials cannot log in through admin portal');

  const adminAsStudent = await request('POST', '/api/auth/login', {
    email: 'kietgroup@gmail.com', password: 'kiet123', selectedRole: 'student'
  });
  expect(adminAsStudent.status === 401, 'admin credentials cannot log in through student portal');

  const alumniAsStudent = await request('POST', '/api/auth/login', {
    email: 'rahul.sharma@kiet.edu', password: '1234', selectedRole: 'student'
  });
  expect(alumniAsStudent.status === 401, 'alumni credentials cannot log in through student portal');

  const create = await request('POST', '/api/students', {
    name: 'Student Created by Admin', email: adminEmail, phone: '9123456789', pin: '5678',
    batch: '2027', department: 'CSD', gpa: '8.6'
  }, adminLogin.body.token);
  expect(create.status === 201 && create.body.data && create.body.data.userId, 'admin registration creates linked student profile');
  const studentId = create.body.data._id || create.body.data.id;

  const invalidDepartment = await request('POST', '/api/students', {
    name: 'Wrong Department', email: `wrong.dept.${suffix}@example.test`, phone: '9123456789', pin: '5678',
    batch: '2027', department: 'CSE', gpa: '8.6'
  }, adminLogin.body.token);
  expect(invalidDepartment.status === 400, 'admin registration rejects non-whitelisted department');

  const missingAcademicFields = await request('POST', '/api/students', {
    name: 'Missing Academic Fields', email: `missing.academic.${suffix}@example.test`, phone: '9123456789', pin: '5678',
    batch: '', department: 'AID', gpa: ''
  }, adminLogin.body.token);
  expect(missingAcademicFields.status === 400, 'admin registration requires class year and GPA');

  const adminCreatedLogin = await request('POST', '/api/auth/login', {
    email: adminEmail, password: '5678', selectedRole: 'student'
  });
  expect(adminCreatedLogin.status === 200, 'admin-created student can log in with the PIN');

  const update = await request('PUT', `/api/students/${studentId}`, {
    name: 'Student Edited by Admin', email: changedEmail, phone: '9234567890', pin: '8765',
    batch: '2028', department: 'CAI', gpa: '9.1', status: 'ACTIVE'
  }, adminLogin.body.token);
  expect(update.status === 200 && update.body.data.email === changedEmail, 'admin edit persists profile changes');

  const oldLogin = await request('POST', '/api/auth/login', {
    email: adminEmail, password: '5678', selectedRole: 'student'
  });
  expect(oldLogin.status === 401, 'old email and PIN stop working after edit');

  const newLogin = await request('POST', '/api/auth/login', {
    email: changedEmail, password: '8765', selectedRole: 'student'
  });
  expect(newLogin.status === 200, 'new email and PIN work after edit');

  const invalidEdit = await request('PUT', `/api/students/${studentId}`, { phone: '92345abc90' }, adminLogin.body.token);
  expect(invalidEdit.status === 400, 'admin edit rejects invalid phone');

  const invalidGpaEdit = await request('PUT', `/api/students/${studentId}`, { gpa: '12.1' }, adminLogin.body.token);
  expect(invalidGpaEdit.status === 400, 'admin edit rejects GPA outside the supported range');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/alumniconnect');
  const student = await Student.findById(studentId).lean();
  const user = await User.findById(student.userId).select('+passwordHash').lean();
  expect(student.userId.toString() === user._id.toString() && user.role === 'student' && user.status === 'ACTIVE', 'User and Student remain linked with active student role');
  expect(user.email === changedEmail && student.email === changedEmail && user.passwordHash !== '8765' && student.last_login, 'email sync, password hashing, and last_login persistence verified in MongoDB');
  await mongoose.disconnect();
}

run().catch(async error => {
  console.error(error.message || error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
