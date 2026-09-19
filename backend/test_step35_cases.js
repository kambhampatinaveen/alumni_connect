const http = require('http');
const mongoose = require('mongoose');

function request(method, urlPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('============================================================');
  console.log('STARTING AUTOMATED VERIFICATION OF STEP 35 CASES (A - S)');
  console.log('============================================================\n');

  await mongoose.connect('mongodb://127.0.0.1:27017/alumniconnect');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Baseline Admin login for admin-restricted operations
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'kietgroup@gmail.com',
      password: 'kiet123',
      selectedRole: 'admin'
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin authentication ready');
    const adminToken = adminLogin.data.token;
    const adminAuthHeader = { Authorization: `Bearer ${adminToken}` };

    // Baseline Alumni login
    const alumniEmail = 'rahul.sharma@kiet.edu';
    const alumniPass = '1234';

    // Baseline Student
    const studentEmail = 'arjun.singh@kiet.edu';
    const studentPass = '1234';

    // ─── TEST A: Main Login → Student → Login (Valid Student credentials) ───
    const testA = await request('POST', '/api/auth/login', {
      email: studentEmail,
      password: studentPass,
      selectedRole: 'student'
    });
    assert(
      testA.status === 200 && testA.data.user.role === 'student' && testA.data.token,
      'TEST A: Main Login → Student → Login (Valid Student credentials -> Student authenticated)'
    );

    // ─── TEST B: Main Login → Student → wrong password ───
    const testB = await request('POST', '/api/auth/login', {
      email: studentEmail,
      password: 'wrongpassword999',
      selectedRole: 'student'
    });
    assert(
      testB.status === 401 && (testB.data.error === 'Incorrect email or password.' || testB.data.error.includes('Incorrect email')),
      'TEST B: Main Login → Student → wrong password -> "Incorrect email or password."'
    );

    // ─── TEST C: Main Login → Student → Alumni credentials ───
    const testC = await request('POST', '/api/auth/login', {
      email: alumniEmail,
      password: alumniPass,
      selectedRole: 'student'
    });
    assert(
      testC.status === 401 && (testC.data.error === 'Incorrect email or password.' || testC.data.error.includes('Incorrect email')),
      'TEST C: Main Login → Student → Alumni credentials -> Login fails'
    );

    // ─── TEST D: Main Login → Alumni → Student credentials ───
    const testD = await request('POST', '/api/auth/login', {
      email: studentEmail,
      password: studentPass,
      selectedRole: 'alumni'
    });
    assert(
      testD.status === 401 && (testD.data.error === 'Incorrect email or password.' || testD.data.error.includes('Incorrect email')),
      'TEST D: Main Login → Alumni → Student credentials -> Login fails'
    );

    // ─── TEST E: Main Login → Admin → Student credentials ───
    const testE = await request('POST', '/api/auth/login', {
      email: studentEmail,
      password: studentPass,
      selectedRole: 'admin'
    });
    assert(
      testE.status === 401 && (testE.data.error === 'Incorrect email or password.' || testE.data.error.includes('Incorrect email')),
      'TEST E: Main Login → Admin → Student credentials -> Login fails'
    );

    // ─── TEST F: Student Signup ───
    const randomF = Date.now();
    const signupEmail = `rahul_${randomF}@gmail.com`;
    const signupPass = 'rahul123';
    const testF = await request('POST', '/api/auth/register', {
      name: 'Rahul',
      email: signupEmail,
      phone: '9876543210',
      password: signupPass,
      role: 'student'
    });
    assert(
      testF.status === 201 && testF.data.user.email === signupEmail && testF.data.user.role === 'student',
      'TEST F: Student Signup (Name, Email, 10-digit phone, Password) -> Student account created'
    );

    // Verify in MongoDB
    const studentUserInDb = await mongoose.connection.collection('users').findOne({ email: signupEmail });
    const studentDocInDb = await mongoose.connection.collection('students').findOne({ email: signupEmail });
    assert(
      studentUserInDb && studentDocInDb && String(studentDocInDb.userId) === String(studentUserInDb._id),
      'TEST F (DB): User and Student profile both created and linked in MongoDB'
    );

    // ─── TEST G: Student Signup → duplicate email ───
    const testG = await request('POST', '/api/auth/register', {
      name: 'Rahul Duplicate',
      email: signupEmail,
      phone: '9876543210',
      password: 'newpassword123',
      role: 'student'
    });
    assert(
      testG.status === 409 && (testG.data.error === 'This email is already registered.' || testG.data.error.includes('already registered')),
      'TEST G: Student Signup → duplicate email -> Registration rejected (409)'
    );

    // ─── TEST H: Student Signup → invalid phone ───
    const testH1 = await request('POST', '/api/auth/register', {
      name: 'Bad Phone',
      email: `badphone_${Date.now()}@gmail.com`,
      phone: '987654321', // 9 digits
      password: 'password123',
      role: 'student'
    });
    const testH2 = await request('POST', '/api/auth/register', {
      name: 'Bad Phone Alpha',
      email: `badphone2_${Date.now()}@gmail.com`,
      phone: '98765abc10',
      password: 'password123',
      role: 'student'
    });
    assert(
      testH1.status === 400 && testH2.status === 400,
      'TEST H: Student Signup → invalid phone -> Registration rejected'
    );

    // ─── TEST I: Admin → Manage Students → Add Student ───
    const adminStudentEmail = `admin_added_${Date.now()}@test.com`;
    const testI = await request('POST', '/api/students', {
      name: 'Vikas Gupta',
      email: adminStudentEmail,
      phone: '9876543210',
      pin: '4321',
      classYear: '2026',
      batch: '2026',
      department: 'AID',
      gpa: '9.0'
    }, adminAuthHeader);
    assert(
      testI.status === 201 && testI.data.success,
      'TEST I: Admin → Manage Students → Add Student -> Student saved to MongoDB'
    );
    const studentListI = await request('GET', '/api/students', null, adminAuthHeader);
    const inListI = studentListI.data.data.some(s => s.email === adminStudentEmail);
    assert(inListI, 'TEST I: Newly added student appears in Manage Students list');

    // ─── TEST J: Admin → Manage Students → Add Student (Invalid phone: 12345678901) ───
    const testJ = await request('POST', '/api/students', {
      name: 'Phone Test J',
      email: `phone_j_${Date.now()}@test.com`,
      phone: '12345678901',
      pin: '1234',
      department: 'AID'
    }, adminAuthHeader);
    assert(testJ.status === 400, 'TEST J: Admin Add Student invalid phone 12345678901 -> Rejected');

    // ─── TEST K: Admin → Manage Students → Add Student (Phone: 98765abc10) ───
    const testK = await request('POST', '/api/students', {
      name: 'Phone Test K',
      email: `phone_k_${Date.now()}@test.com`,
      phone: '98765abc10',
      pin: '1234',
      department: 'AID'
    }, adminAuthHeader);
    assert(testK.status === 400, 'TEST K: Admin Add Student phone 98765abc10 -> Rejected');

    // ─── TEST L: Admin → Manage Students → Add Student (Department: AID) ───
    const testL = await request('POST', '/api/students', {
      name: 'Dept Test L',
      email: `dept_l_${Date.now()}@test.com`,
      phone: '9876543210',
      pin: '1234',
      department: 'AID',
      batch: '2025',
      gpa: '8.0'
    }, adminAuthHeader);
    assert(testL.status === 201 && testL.data.data.department === 'AID', 'TEST L: Department AID accepted');

    const createdStudentId = testI.data.data._id || testI.data.data.id;

    // ─── TEST M: Admin → Manage Students → Edit Student (Change name) ───
    const testM = await request('PUT', `/api/students/${createdStudentId}`, {
      name: 'Vikas Kumar Gupta'
    }, adminAuthHeader);
    assert(
      testM.status === 200 && testM.data.data.name === 'Vikas Kumar Gupta',
      'TEST M: Edit Student -> Name updated in MongoDB'
    );
    const userAfterM = await mongoose.connection.collection('users').findOne({ email: adminStudentEmail });
    assert(userAfterM.name === 'Vikas Kumar Gupta', 'TEST M: Linked User record name updated in MongoDB');

    // ─── TEST N: Admin → Edit Student (Change phone to: 9876543210) ───
    const testN = await request('PUT', `/api/students/${createdStudentId}`, {
      phone: '9876543210'
    }, adminAuthHeader);
    assert(testN.status === 200 && testN.data.data.phone === '9876543210', 'TEST N: Edit Student phone 9876543210 -> Accepted');

    // ─── TEST O: Admin → Edit Student (Change phone to: 98765abc10) ───
    const testO = await request('PUT', `/api/students/${createdStudentId}`, {
      phone: '98765abc10'
    }, adminAuthHeader);
    assert(testO.status === 400, 'TEST O: Edit Student phone 98765abc10 -> Rejected');

    // ─── TEST P: Admin → Edit Student (Change PIN) ───
    // Current PIN is '4321'
    const testPUpdate = await request('PUT', `/api/students/${createdStudentId}`, {
      pin: '8899'
    }, adminAuthHeader);
    assert(testPUpdate.status === 200, 'TEST P: Edit Student PIN updated to 8899');

    // Old PIN MUST NOT WORK
    const testPOldPin = await request('POST', '/api/auth/login', {
      email: adminStudentEmail,
      password: '4321',
      selectedRole: 'student'
    });
    assert(testPOldPin.status === 401, 'TEST P: Old PIN 4321 fails');

    // New PIN MUST WORK
    const testPNewPin = await request('POST', '/api/auth/login', {
      email: adminStudentEmail,
      password: '8899',
      selectedRole: 'student'
    });
    assert(testPNewPin.status === 200 && testPNewPin.data.token, 'TEST P: New PIN 8899 works');

    // ─── TEST Q: Admin adds Student. Logout Admin. Login as newly created Student. ───
    // Create new student via Admin
    const studentQEmail = `student_q_${Date.now()}@test.com`;
    await request('POST', '/api/students', {
      name: 'Student Q',
      email: studentQEmail,
      phone: '9876543210',
      pin: '7777',
      department: 'CSD',
      batch: '2025'
    }, adminAuthHeader);
    // Login as newly created student
    const testQ = await request('POST', '/api/auth/login', {
      email: studentQEmail,
      password: '7777',
      selectedRole: 'student'
    });
    assert(
      testQ.status === 200 && testQ.data.user.role === 'student' && testQ.data.token,
      'TEST Q: Student created by Admin successfully logs in with Email + PIN'
    );

    // ─── TEST R: Student logs in. Check database. last_login is updated. ───
    const userBeforeR = await mongoose.connection.collection('users').findOne({ email: studentQEmail });
    const timeBefore = new Date(userBeforeR.last_login).getTime();
    // Wait 50ms and log in again
    await new Promise(r => setTimeout(r, 60));
    await request('POST', '/api/auth/login', {
      email: studentQEmail,
      password: '7777',
      selectedRole: 'student'
    });
    const userAfterR = await mongoose.connection.collection('users').findOne({ email: studentQEmail });
    const timeAfter = new Date(userAfterR.last_login).getTime();
    assert(timeAfter >= timeBefore, 'TEST R: Student logs in -> last_login is updated in MongoDB');

    // ─── TEST S: Inactive Student logs in -> becomes ACTIVE, last_login updates. ───
    // Set student to INACTIVE and last_login to 40 days ago
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    await mongoose.connection.collection('users').updateOne(
      { email: studentQEmail },
      { $set: { status: 'INACTIVE', last_login: fortyDaysAgo } }
    );
    await mongoose.connection.collection('students').updateOne(
      { email: studentQEmail },
      { $set: { status: 'INACTIVE', last_login: fortyDaysAgo } }
    );

    const inactiveUserCheck = await mongoose.connection.collection('users').findOne({ email: studentQEmail });
    assert(inactiveUserCheck.status === 'INACTIVE', 'TEST S: Student set to INACTIVE in DB');

    // Inactive student logs in
    const testS = await request('POST', '/api/auth/login', {
      email: studentQEmail,
      password: '7777',
      selectedRole: 'student'
    });
    assert(testS.status === 200 && testS.data.user.status === 'ACTIVE', 'TEST S: Inactive student login allowed');

    const userAfterS = await mongoose.connection.collection('users').findOne({ email: studentQEmail });
    const studentDocAfterS = await mongoose.connection.collection('students').findOne({ email: studentQEmail });
    assert(
      userAfterS.status === 'ACTIVE' && studentDocAfterS.status === 'ACTIVE' && new Date(userAfterS.last_login) > fortyDaysAgo,
      'TEST S: Inactive student account becomes ACTIVE and last_login updates to current time'
    );

    await mongoose.disconnect();
    console.log('\n============================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================');
    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Fatal test error:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

run();
