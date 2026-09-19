const http = require('http');

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
  console.log('STARTING AUTOMATED VERIFICATION OF FINAL PROMPT REQUIREMENTS');
  console.log('============================================================\n');

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
    // 1. Admin Login
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'kietgroup@gmail.com',
      password: 'kiet123',
      role: 'admin'
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin authentication successful');
    const adminToken = adminLogin.data.token;
    const adminAuthHeader = { Authorization: `Bearer ${adminToken}` };

    // 2. TEST 2 - INVALID PHONE TESTS
    const phoneLong = await request('POST', '/api/students', {
      name: 'Phone Test 1',
      email: `ptest1_${Date.now()}@test.com`,
      phone: '98765432101',
      pin: '1234',
      department: 'AID',
      batch: '2025'
    }, adminAuthHeader);
    assert(phoneLong.status === 400 && phoneLong.data.error.includes('10 digits'), 'TEST 2A: Phone 98765432101 rejected (11 digits)');

    const phoneAlpha = await request('POST', '/api/students', {
      name: 'Phone Test 2',
      email: `ptest2_${Date.now()}@test.com`,
      phone: '98765abc10',
      pin: '1234',
      department: 'AID',
      batch: '2025'
    }, adminAuthHeader);
    assert(phoneAlpha.status === 400, 'TEST 2B: Phone 98765abc10 rejected (contains letters)');

    const phoneShort = await request('POST', '/api/students', {
      name: 'Phone Test 3',
      email: `ptest3_${Date.now()}@test.com`,
      phone: '987654321',
      pin: '1234',
      department: 'AID',
      batch: '2025'
    }, adminAuthHeader);
    assert(phoneShort.status === 400 && phoneShort.data.error.includes('10 digits'), 'TEST 2C: Phone 987654321 rejected (9 digits)');

    const phonePrefix = await request('POST', '/api/students', {
      name: 'Phone Test 4',
      email: `ptest4_${Date.now()}@test.com`,
      phone: '+919876543210',
      pin: '1234',
      department: 'AID',
      batch: '2025'
    }, adminAuthHeader);
    assert(phonePrefix.status === 400, 'TEST 2D: Phone +919876543210 rejected (prefix not allowed)');

    // 3. TEST 3 - DEPARTMENT RESTRICTION
    const deptInvalid = await request('POST', '/api/students', {
      name: 'Dept Test',
      email: `dept_${Date.now()}@test.com`,
      phone: '9876543210',
      pin: '1234',
      department: 'MECHANICAL',
      batch: '2025'
    }, adminAuthHeader);
    assert(deptInvalid.status === 400 && deptInvalid.data.error.includes('AID, CSD, CSC, CSM, CAI'), 'TEST 3A: Non-allowed department MECHANICAL rejected');

    // 4. TEST 1 - VALID STUDENT REGISTRATION (Saved to MongoDB and returned in list)
    const validStudentEmail = `student_valid_${Date.now()}@test.com`;
    const addStudentRes = await request('POST', '/api/students', {
      name: 'Aditya Sharma',
      email: validStudentEmail,
      phone: '9876543210',
      pin: '5678',
      department: 'CSD',
      batch: '2026',
      gpa: '9.2'
    }, adminAuthHeader);
    assert(addStudentRes.status === 201 && addStudentRes.data.success, 'TEST 1A: Student with valid phone 9876543210 and department CSD created');

    const studentList = await request('GET', '/api/students', null, adminAuthHeader);
    const foundInList = studentList.data.data.some(s => s.email === validStudentEmail);
    assert(foundInList, 'TEST 1B: Newly registered student appears immediately in student directory list');

    // 5. Setup for REFERRAL CONNECTED STUDENTS TEST (TEST 10)
    // Register Alumni A
    const alumniEmail = `alumni_${Date.now()}@kiet.edu`;
    const alumReg = await request('POST', '/api/auth/register', {
      name: 'Rahul Sharma',
      email: alumniEmail,
      password: 'password123',
      phone: '9876543222',
      role: 'alumni',
      department: 'CSD'
    });
    const alumLogin = await request('POST', '/api/auth/login', {
      email: alumniEmail,
      password: 'password123',
      role: 'alumni'
    });
    const alumToken = alumLogin.data.token;
    const alumUser = alumLogin.data.user;
    const alumAuthHeader = { Authorization: `Bearer ${alumToken}` };

    // Register Student A (will be connected)
    const studentAEmail = `studentA_${Date.now()}@kiet.edu`;
    await request('POST', '/api/auth/register', {
      name: 'Student A',
      email: studentAEmail,
      password: 'password123',
      phone: '9876543233',
      role: 'student',
      department: 'CSD'
    });
    const studentALogin = await request('POST', '/api/auth/login', {
      email: studentAEmail,
      password: 'password123',
      role: 'student'
    });
    const studentAToken = studentALogin.data.token;
    const studentAUser = studentALogin.data.user;
    const studentAAuthHeader = { Authorization: `Bearer ${studentAToken}` };

    // Register Student B (NOT connected)
    const studentBEmail = `studentB_${Date.now()}@kiet.edu`;
    await request('POST', '/api/auth/register', {
      name: 'Student B',
      email: studentBEmail,
      password: 'password123',
      phone: '9876543244',
      role: 'student',
      department: 'AID'
    });
    const studentBLogin = await request('POST', '/api/auth/login', {
      email: studentBEmail,
      password: 'password123',
      role: 'student'
    });
    const studentBToken = studentBLogin.data.token;
    const studentBUser = studentBLogin.data.user;
    const studentBAuthHeader = { Authorization: `Bearer ${studentBToken}` };

    // Connect Alumni A with Student A via active Mentorship
    const mentorshipReq = await request('POST', '/api/mentorships', {
      alumniId: alumUser.id,
      domain: 'Software Engineering',
      goal: 'Mock Interviews & Referrals'
    }, studentAAuthHeader);
    const mId = mentorshipReq.data.data.id || mentorshipReq.data.data._id;
    await request('PUT', `/api/mentorships/${mId}`, { status: 'active' }, alumAuthHeader);

    // TEST 10: Alumni A posts referral WITHOUT selecting a student
    const referralPost = await request('POST', '/api/referrals', {
      company: 'Google',
      role: 'Software Engineer',
      jobTitle: 'Software Engineer',
      applicationLink: 'https://careers.google.com/jobs/results/12345'
    }, alumAuthHeader);
    assert(referralPost.status === 201 && referralPost.data.data.company === 'Google', 'TEST 10A: Alumni A posts referral without selecting individual student');
    const refId = referralPost.data.data._id || referralPost.data.data.id;

    // Student A (Connected) views referrals
    const studentAReferrals = await request('GET', '/api/referrals', null, studentAAuthHeader);
    const studentASees = studentAReferrals.data.data.some(r => (r._id === refId || r.id === refId) && r.company === 'Google');
    assert(studentASees, 'TEST 10B: Connected Student A sees referral posted by Alumni A');

    // Student B (NOT connected) views referrals
    const studentBReferrals = await request('GET', '/api/referrals', null, studentBAuthHeader);
    const studentBSees = studentBReferrals.data.data.some(r => (r._id === refId || r.id === refId) && r.company === 'Google');
    assert(!studentBSees, 'TEST 10C: Unconnected Student B does NOT see referral from Alumni A (Backend security enforced)');

    // Student A updates status to Shortlisted
    const updateRef = await request('PUT', `/api/referrals/${refId}`, { status: 'shortlisted' }, studentAAuthHeader);
    assert(updateRef.status === 200 && updateRef.data.data.status.toLowerCase() === 'shortlisted', 'TEST 10D: Connected Student A updates referral pipeline status to Shortlisted');

    // Student B attempts to update referral -> 403 Forbidden
    const unauthUpdate = await request('PUT', `/api/referrals/${refId}`, { status: 'selected' }, studentBAuthHeader);
    assert(unauthUpdate.status === 403, 'TEST 10E: Unconnected Student B restricted from modifying referral (403 Forbidden)');

    // Alumni attempts to change status -> 403 Read-Only for Alumni
    const alumniStatusChange = await request('PUT', `/api/referrals/${refId}`, { status: 'selected' }, alumAuthHeader);
    assert(alumniStatusChange.status === 403, 'TEST 10F: Alumni restricted from modifying student pipeline status (403 Read-Only)');

    // 6. EVENT TESTS (TEST 4, 5, 6, 7, 8, 9)
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb://127.0.0.1:27017/alumniconnect');

    const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const todayStr = new Date().toISOString();

    // Create Future Event by Admin
    const futureEv = await request('POST', '/api/events', {
      name: 'Future AI Cloud Summit',
      type: 'Technical Workshop',
      date: futureDate,
      time: '10:00 AM',
      location: 'Auditorium'
    }, adminAuthHeader);
    assert(futureEv.status === 201, 'Future event created by Admin');
    const futureEvId = futureEv.data.data._id || futureEv.data.data.id;

    // Create Past Event by Admin and update date in DB to 7 days ago
    const pastEv = await request('POST', '/api/events', {
      name: 'Completed Campus Bootcamp',
      type: 'Webinar',
      date: todayStr,
      time: '10:00 AM',
      location: 'Virtual Meet'
    }, adminAuthHeader);
    const pastEvId = pastEv.data.data._id || pastEv.data.data.id;
    await mongoose.connection.collection('events').updateOne(
      { _id: new mongoose.Types.ObjectId(pastEvId) },
      { $set: { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    );

    // Create Ongoing Event (today, current time)
    const nowObj = new Date();
    const currentHours = nowObj.getHours();
    const ampm = currentHours >= 12 ? 'PM' : 'AM';
    const hour12 = currentHours % 12 || 12;
    const timeFormatted = `${hour12}:00 ${ampm}`;

    const ongoingEv = await request('POST', '/api/events', {
      name: 'Ongoing Tech Symposium',
      type: 'Networking',
      date: todayStr,
      time: timeFormatted,
      location: 'Conference Hall A'
    }, adminAuthHeader);
    const ongoingEvId = ongoingEv.data.data._id || ongoingEv.data.data.id;

    // TEST 4, 5 & 6: Event Status check
    const allEvents = await request('GET', '/api/events', null, studentAAuthHeader);
    const futureItem = allEvents.data.data.find(e => (e._id === futureEvId || e.id === futureEvId));
    const pastItem = allEvents.data.data.find(e => (e._id === pastEvId || e.id === pastEvId));
    const ongoingItem = allEvents.data.data.find(e => (e._id === ongoingEvId || e.id === ongoingEvId));

    assert(futureItem && futureItem.status === 'UPCOMING', 'TEST 4: Future event accurately classified as UPCOMING');
    assert(ongoingItem && ongoingItem.status === 'ONGOING', 'TEST 5: Current event accurately classified as ONGOING');
    assert(pastItem && pastItem.status === 'COMPLETED', 'TEST 6: Past event accurately classified as COMPLETED');

    // TEST 9: Event Creator Exception
    // Admin checks future event -> isCreator: true
    const adminEvents = await request('GET', '/api/events', null, adminAuthHeader);
    const adminEvItem = adminEvents.data.data.find(e => (e._id === futureEvId || e.id === futureEvId));
    assert(adminEvItem && adminEvItem.isCreator, 'TEST 9A: Admin creator marked with isCreator: true');

    // Admin attempts to register for their own event -> Rejected
    const adminSelfReg = await request('POST', `/api/events/${futureEvId}/participate`, null, adminAuthHeader);
    assert(adminSelfReg.status === 400, 'TEST 9B: Creator blocked from registering for their own event');

    // TEST 7: Student A registers for Future Event
    const studentReg = await request('POST', `/api/events/${futureEvId}/participate`, null, studentAAuthHeader);
    assert(studentReg.status === 201, 'TEST 7A: Student A successfully registers for Future Event');

    // Registered filter
    const registeredQuery = await request('GET', '/api/events?status=registered', null, studentAAuthHeader);
    const inRegistered = registeredQuery.data.data.some(e => e._id === futureEvId || e.id === futureEvId);
    assert(inRegistered, 'TEST 7B: Event appears under Registered filter for Student A');

    // TEST 8: Not Registered filter for Student B
    const notRegQuery = await request('GET', '/api/events?status=notregistered', null, studentBAuthHeader);
    const inNotRegistered = notRegQuery.data.data.some(e => e._id === futureEvId || e.id === futureEvId);
    assert(inNotRegistered, 'TEST 8: Unregistered event appears in Not Registered filter for Student B');

    // Creator is NOT included in Not Registered filter
    const adminNotRegQuery = await request('GET', '/api/events?status=notregistered', null, adminAuthHeader);
    const creatorInNotRegistered = adminNotRegQuery.data.data.some(e => e._id === futureEvId || e.id === futureEvId);
    assert(!creatorInNotRegistered, 'TEST 9C: Creator explicitly excluded from Not Registered filter');

    await mongoose.disconnect();
    console.log('\n============================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('============================================================');
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    try { const mongoose = require('mongoose'); await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

run();
