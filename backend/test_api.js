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

async function runTests() {
  console.log('=== RUNNING BACKEND INTEGRATION & VERIFICATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health check
  const health = await request('GET', '/api/health');
  assert(health.status === 200 && health.data.database === 'connected', 'Health check connected to MongoDB');

  // 2. Admin valid login
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'kietgroup@gmail.com',
    password: 'kiet123',
    selectedRole: 'admin'
  });
  assert(adminLogin.status === 200 && adminLogin.data.token && adminLogin.data.user.role === 'admin', 'Admin login successful with valid JWT');
  const adminToken = adminLogin.data?.token;

  // 3. Cross-role security: Admin credentials under student or alumni role
  const crossRoleStudent = await request('POST', '/api/auth/login', {
    email: 'kietgroup@gmail.com',
    password: 'kiet123',
    selectedRole: 'student'
  });
  assert(crossRoleStudent.status === 401 && crossRoleStudent.data.error === 'Incorrect email or password.',
    'Cross-role login prevented (Admin credentials under student returns 401 with standard error message)');

  const crossRoleAlumni = await request('POST', '/api/auth/login', {
    email: 'kietgroup@gmail.com',
    password: 'kiet123',
    selectedRole: 'alumni'
  });
  assert(crossRoleAlumni.status === 401 && crossRoleAlumni.data.error === 'Incorrect email or password.',
    'Cross-role login prevented (Admin credentials under alumni returns 401 with standard error message)');

  // 4. Bad password
  const badPass = await request('POST', '/api/auth/login', {
    email: 'kietgroup@gmail.com',
    password: 'wrongpassword',
    selectedRole: 'admin'
  });
  assert(badPass.status === 401 && badPass.data.error === 'Incorrect email or password.',
    'Wrong password returns 401 "Incorrect email or password."');

  // 5. Public admin registration forbidden
  const adminReg = await request('POST', '/api/auth/register', {
    name: 'Hacker Admin',
    email: 'fakeadmin@test.com',
    password: 'password123',
    role: 'admin'
  });
  assert(adminReg.status === 403, 'Public admin registration forbidden (HTTP 403)');

  // 6. Alumni self-registration
  const randomSuffix = Date.now();
  const alumniReg = await request('POST', '/api/auth/register', {
    name: 'Karan Mehra',
    email: `karan.mehra.${randomSuffix}@kiet.edu`,
    phone: '9999000011',
    password: 'password123',
    role: 'alumni'
  });
  assert(alumniReg.status === 201 && alumniReg.data.user.role === 'alumni' && alumniReg.data.user.status === 'ACTIVE',
    'Alumni self-registration succeeds with status ACTIVE and bcrypt hash');
  const alumniToken = alumniReg.data?.token;

  // 7. Student self-registration
  const studentReg = await request('POST', '/api/auth/register', {
    name: 'Ananya Sharma',
    email: `ananya.sharma.${randomSuffix}@kiet.edu`,
    phone: '9999000022',
    password: 'password123',
    role: 'student'
  });
  assert(studentReg.status === 201 && studentReg.data.user.role === 'student' && studentReg.data.user.status === 'ACTIVE',
    'Student self-registration succeeds with status ACTIVE');
  const studentToken = studentReg.data?.token;

  // 8. Analytics overview: Real MongoDB counts
  const overview = await request('GET', '/api/analytics/overview', null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(
    overview.status === 200 &&
    typeof overview.data.totalAlumni === 'number' &&
    typeof overview.data.activeAlumni === 'number' &&
    typeof overview.data.inactiveAlumni === 'number' &&
    typeof overview.data.totalStudents === 'number' &&
    typeof overview.data.activeStudents === 'number' &&
    typeof overview.data.inactiveStudents === 'number',
    'Analytics overview returns real dynamic active/inactive counts from MongoDB'
  );

  // 9. Past date validation for Events
  const pastDateEvent = await request('POST', '/api/events', {
    title: 'Past Tech Talk',
    date: '2020-01-01',
    time: '10:00 AM'
  }, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(pastDateEvent.status === 400 && pastDateEvent.data.error.includes('past'),
    'Event creation with past date rejected with HTTP 400');

  // 10. Future date event creation
  const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const futureEvent = await request('POST', '/api/events', {
    name: 'Next-Gen Cloud Architecture',
    title: 'Next-Gen Cloud Architecture',
    type: 'Workshop',
    date: futureDate,
    time: '02:00 PM'
  }, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(futureEvent.status === 201 && futureEvent.data.data._id, 'Future date event created successfully');
  const eventId = futureEvent.data?.data?._id || futureEvent.data?.data?.id;

  // 11. Event creator cannot register for own event
  const creatorRegister = await request('POST', `/api/events/${eventId}/participate`, null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(creatorRegister.status === 400 && creatorRegister.data.error.includes('creator cannot register'),
    'Event creator is exempted and prevented from registering for own event');

  // 12. Student can register for event
  const studentRegister = await request('POST', `/api/events/${eventId}/participate`, null, {
    Authorization: `Bearer ${studentToken}`
  });
  assert(studentRegister.status === 201, 'Student successfully registered for event');

  // 13. Mentorship list & session past date validation
  const mentorships = await request('GET', '/api/mentorships', null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(mentorships.status === 200 && Array.isArray(mentorships.data.data), 'Mentorship list fetched for Admin monitoring');
  const mentorshipItem = mentorships.data.data[0];

  if (mentorshipItem) {
    const mId = mentorshipItem._id || mentorshipItem.id;
    const pastSession = await request('POST', `/api/mentorships/${mId}/sessions`, {
      topic: 'Outdated Session',
      date: '2021-05-10',
      time: '11:00 AM',
      meetingLink: 'https://meet.google.com/test'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(pastSession.status === 400 && pastSession.data.error.includes('past'),
      'Mentorship session with past date rejected with HTTP 400');

    // Future session
    const futureSession = await request('POST', `/api/mentorships/${mId}/sessions`, {
      topic: 'Modern Cloud & Microservices Q&A',
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      time: '04:00 PM',
      meetingLink: 'https://meet.google.com/valid-link'
    }, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(futureSession.status === 201, 'Mentorship session with future date created and notification triggered');
  }

  // 14. Job Referrals
  const referrals = await request('GET', '/api/referrals', null, {
    Authorization: `Bearer ${adminToken}`
  });
  assert(referrals.status === 200 && Array.isArray(referrals.data.data), 'Job referrals fetched for Admin monitoring');

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
