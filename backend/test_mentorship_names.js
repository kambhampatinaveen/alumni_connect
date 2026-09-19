require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'alumniconnect_super_secret_jwt_key_2026';

function request(method, path, body = null, headers = {}) {
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
      path,
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
  console.log('VERIFYING MENTORSHIP NAMES FIX IN STUDENT & ADMIN PORTALS');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extra = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extra}`);
      failed++;
    }
  }

  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/alumniconnect');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Alumni = mongoose.model('Alumni', new mongoose.Schema({}, { strict: false }));
    const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
    const Mentorship = mongoose.model('Mentorship', new mongoose.Schema({}, { strict: false }));

    // 1. Admin login
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'kietgroup@gmail.com',
      password: 'kiet123',
      role: 'admin'
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin authentication successful');
    const adminAuth = { Authorization: `Bearer ${adminLogin.data.token}` };

    // 2. Locate Ganesh and Naveen in DB
    const ganeshUser = await User.findOne({ name: /ganesh/i });
    assert(ganeshUser !== null, 'Ganesh student user found in MongoDB');

    const naveenAlumni = await Alumni.findOne({ name: /naveen/i });
    assert(naveenAlumni !== null, 'Naveen alumni document found in MongoDB');
    const naveenUser = await User.findById(naveenAlumni.userId);
    assert(naveenUser !== null, 'Naveen linked user found in MongoDB');

    const ganeshToken = jwt.sign(
      { id: ganeshUser._id, _id: ganeshUser._id, email: ganeshUser.email, role: 'student', name: ganeshUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const ganeshAuth = { Authorization: `Bearer ${ganeshToken}` };

    const naveenToken = jwt.sign(
      { id: naveenUser._id, _id: naveenUser._id, email: naveenUser.email, role: 'alumni', name: naveenUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    const naveenAuth = { Authorization: `Bearer ${naveenToken}` };

    // ========================================================
    // TEST 1: STUDENT PORTAL — SHOW ACTUAL ALUMNI NAME
    // ========================================================
    console.log('\n--- TEST 1: STUDENT PORTAL (Ganesh) ---');
    const ganeshMentorships = await request('GET', '/api/mentorships', null, ganeshAuth);
    assert(ganeshMentorships.status === 200, 'Student Ganesh fetched mentorships');
    const ganeshList = ganeshMentorships.data.data || [];
    assert(ganeshList.length > 0, 'Student Ganesh has mentorship relationships');

    const naveenCard = ganeshList.find(m => m.alumniId?.name && m.alumniId.name.includes('Naveen'));
    assert(naveenCard !== undefined, 'Ganesh sees mentorship card with Naveen');
    assert(
      naveenCard && naveenCard.alumniId?.name === 'Naveen Kambhampati',
      'Student card displays actual Alumni name "Naveen Kambhampati"',
      `Got: "${naveenCard?.alumniId?.name}"`
    );
    assert(
      naveenCard && naveenCard.alumniId?.name !== 'Alumni Mentor' && naveenCard.alumniId?.name !== 'Alumni',
      'Student card does NOT display generic "Alumni Mentor" or "Alumni"'
    );
    assert(
      naveenCard && (naveenCard.alumniId?.department === 'AID' || naveenCard.alumniId?.branch === 'AID'),
      'Student card displays actual Alumni department "AID"'
    );

    // ========================================================
    // TEST 2: ALUMNI PORTAL — SHOW ACTUAL STUDENT NAME
    // ========================================================
    console.log('\n--- TEST 2: ALUMNI PORTAL (Naveen) ---');
    const naveenMentorships = await request('GET', '/api/mentorships', null, naveenAuth);
    assert(naveenMentorships.status === 200, 'Alumni Naveen fetched mentorships');
    const naveenList = naveenMentorships.data.data || [];
    assert(naveenList.length > 0, 'Alumni Naveen has mentorship relationships');

    const ganeshReq = naveenList.find(m => m.studentId?.name && m.studentId.name.toLowerCase().includes('ganesh'));
    assert(ganeshReq !== undefined, 'Alumni Naveen sees mentorship card for Student Ganesh');
    assert(
      ganeshReq && ganeshReq.studentId?.name && ganeshReq.studentId.name.toLowerCase() === 'ganesh',
      'Alumni card displays actual Student name "ganesh"',
      `Got: "${ganeshReq?.studentId?.name}"`
    );
    assert(
      ganeshReq && ganeshReq.studentId?.name !== 'Student' && ganeshReq.studentId?.name !== 'Student Mentee',
      'Alumni card does NOT display generic "Student" or "Student Mentee"'
    );

    // ========================================================
    // TEST 3: ADMIN PORTAL — SHOW BOTH PEOPLE
    // ========================================================
    console.log('\n--- TEST 3: ADMIN PORTAL ---');
    const adminMentorships = await request('GET', '/api/mentorships', null, adminAuth);
    assert(adminMentorships.status === 200, 'Admin fetched all mentorship relationships');
    const adminList = adminMentorships.data.data || [];
    assert(adminList.length > 0, 'Admin receives list of mentorships');

    // Check Ganesh & Naveen card
    const adminGaneshNaveen = adminList.find(m =>
      (m.alumniId?.name && m.alumniId.name.includes('Naveen')) &&
      (m.studentId?.name && m.studentId.name.toLowerCase().includes('ganesh'))
    );
    assert(adminGaneshNaveen !== undefined, 'Admin sees Ganesh & Naveen mentorship record');
    assert(
      adminGaneshNaveen && adminGaneshNaveen.alumniId?.name === 'Naveen Kambhampati',
      'Admin card has actual Alumni name "Naveen Kambhampati"'
    );
    assert(
      adminGaneshNaveen && adminGaneshNaveen.studentId?.name && adminGaneshNaveen.studentId.name.toLowerCase() === 'ganesh',
      'Admin card has actual Student name "ganesh"'
    );

    // Verify across all mentorships in Admin view that NONE have generic 'Alumni Mentor' or 'Alumni' or 'Student'
    let allHaveNames = true;
    for (const m of adminList) {
      if (!m.alumniId?.name || m.alumniId.name === 'Alumni Mentor' || m.alumniId.name === 'Alumni') {
        allHaveNames = false;
        console.error('Invalid alumni name on mentorship:', m._id, m.alumniId);
      }
      if (!m.studentId?.name || m.studentId.name === 'Student' || m.studentId.name === 'Student Mentee') {
        allHaveNames = false;
        console.error('Invalid student name on mentorship:', m._id, m.studentId);
      }
    }
    assert(allHaveNames, 'ALL mentorship records in Admin view contain actual, non-generic names for both Alumni and Student');

    // ========================================================
    // TEST 4: NEW MENTORSHIP REQUEST FLOW
    // ========================================================
    console.log('\n--- TEST 4: NEW MENTORSHIP REQUEST FLOW ---');
    const suffix = Date.now();
    const newAlumEmail = `testmentor_${suffix}@test.com`;
    const newStudEmail = `teststudent_${suffix}@test.com`;

    // Create New Alumni
    const createAlum = await request('POST', '/api/alumni', {
      name: 'Dr. Vikram Malhotra',
      email: newAlumEmail,
      pin: '1234',
      phone: '9876543219',
      batch: '2018',
      department: 'CSD',
      company: 'Microsoft',
      role: 'Principal Architect'
    }, adminAuth);
    assert(createAlum.status === 201, 'Created new alumni Dr. Vikram Malhotra');
    const createdAlumDoc = createAlum.data.data;

    // Create New Student
    const createStud = await request('POST', '/api/students', {
      name: 'Rohan Verma',
      email: newStudEmail,
      pin: '1234',
      phone: '9876543218',
      batch: '2026',
      department: 'CSD',
      gpa: 9.1
    }, adminAuth);
    assert(createStud.status === 201, 'Created new student Rohan Verma');
    const createdStudDoc = createStud.data.data;

    // Login as New Student
    const studLogin = await request('POST', '/api/auth/login', {
      email: newStudEmail,
      password: '1234',
      role: 'student'
    });
    assert(studLogin.status === 200, 'New Student Rohan logged in');
    const newStudAuth = { Authorization: `Bearer ${studLogin.data.token}` };

    // Login as New Alumni
    const alumLogin = await request('POST', '/api/auth/login', {
      email: newAlumEmail,
      password: '1234',
      role: 'alumni'
    });
    assert(alumLogin.status === 200, 'New Alumni Dr. Vikram logged in');
    const newAlumAuth = { Authorization: `Bearer ${alumLogin.data.token}` };

    // Student Rohan sends mentorship request to Dr. Vikram using Alumni ID
    const sendReq = await request('POST', '/api/mentorships', {
      alumniId: createdAlumDoc._id || createdAlumDoc.id,
      domain: 'Cloud Infrastructure',
      goal: 'Guidance on Azure & Distributed Systems'
    }, newStudAuth);
    assert(sendReq.status === 201, 'Mentorship request submitted successfully');
    assert(sendReq.data.data.alumniId?.name === 'Dr. Vikram Malhotra', 'Create response returns actual Alumni name "Dr. Vikram Malhotra"');
    assert(sendReq.data.data.studentId?.name === 'Rohan Verma', 'Create response returns actual Student name "Rohan Verma"');

    // Verify Notification received by Dr. Vikram has Student name
    const alumNotifs = await request('GET', '/api/notifications', null, newAlumAuth);
    assert(alumNotifs.status === 200, 'Alumni Dr. Vikram fetched notifications');
    const notif = (alumNotifs.data.data || []).find(n => n.message && n.message.includes('Rohan Verma'));
    assert(notif !== undefined, 'Notification message explicitly contains Student name "Rohan Verma"');

    // Verify Student Portal sees Dr. Vikram
    const rohanMentorships = await request('GET', '/api/mentorships', null, newStudAuth);
    const rohanCard = (rohanMentorships.data.data || [])[0];
    assert(rohanCard && rohanCard.alumniId?.name === 'Dr. Vikram Malhotra', 'Student portal card displays "Dr. Vikram Malhotra"');

    // Verify Alumni Portal sees Rohan Verma
    const vikramMentorships = await request('GET', '/api/mentorships', null, newAlumAuth);
    const vikramCard = (vikramMentorships.data.data || [])[0];
    assert(vikramCard && vikramCard.studentId?.name === 'Rohan Verma', 'Alumni portal card displays "Rohan Verma"');

    // Verify Admin Portal sees both Dr. Vikram and Rohan Verma
    const adminCheck = await request('GET', '/api/mentorships', null, adminAuth);
    const newPair = (adminCheck.data.data || []).find(m =>
      m.alumniId?.name === 'Dr. Vikram Malhotra' && m.studentId?.name === 'Rohan Verma'
    );
    assert(newPair !== undefined, 'Admin portal monitors pair: Alumni: Dr. Vikram Malhotra & Student: Rohan Verma');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Unexpected error:', err);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`TOTAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
