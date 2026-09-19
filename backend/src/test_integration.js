const http = require('http');

// Helper to make HTTP requests
function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

const BASE = {
  hostname: 'localhost',
  port: 5000,
  headers: { 'Content-Type': 'application/json' }
};

async function runTests() {
  console.log('--- Starting Backend Integration Tests ---');
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

  try {
    // 0. Reset data store
    const resetRes = await request({ ...BASE, path: '/api/admin/reset-data', method: 'POST' });
    assert(resetRes.status === 200, 'Data store reset clean');

    // 1. Admin Signup
    const adminData = {
      name: 'Aditya Admin',
      email: 'admin@test.com',
      phone: '9876543210',
      password: 'AdminPassword123'
    };
    const regRes = await request({ ...BASE, path: '/api/auth/register', method: 'POST' }, adminData);
    assert(regRes.status === 201 && regRes.data.token && regRes.data.user.role === 'admin', 'Admin signup succeeds');
    const adminToken = regRes.data.token;

    // 2. Reject Duplicate Email
    const dupRes = await request({ ...BASE, path: '/api/auth/register', method: 'POST' }, adminData);
    assert(dupRes.status === 409, 'Duplicate admin email rejected with 409');

    // 3. Admin Login
    const loginRes = await request({ ...BASE, path: '/api/auth/login', method: 'POST' }, {
      email: 'admin@test.com',
      password: 'AdminPassword123'
    });
    assert(loginRes.status === 200 && loginRes.data.user.email === 'admin@test.com', 'Admin login succeeds');

    // 4. Admin creates Alumni with PIN
    const alumniPayload = {
      name: 'Pavani Kadari',
      email: 'pavani@test.com',
      phone: '9998887776',
      pin: '123456',
      branch: 'AID',
      department: 'Artificial Intelligence & Data Science',
      college: 'KIEW',
      company: 'DATA I2I',
      role: 'AI Engineer'
    };
    const addAlumRes = await request({
      ...BASE,
      path: '/api/alumni',
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${adminToken}` }
    }, alumniPayload);
    assert(addAlumRes.status === 201 && addAlumRes.data.data.email === 'pavani@test.com', 'Admin creates Alumni with PIN');
    const alumniId = addAlumRes.data.data._id || addAlumRes.data.data.id;

    // 5. Duplicate Email check when creating student with alumni email
    const dupStudentRes = await request({
      ...BASE,
      path: '/api/students',
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${adminToken}` }
    }, {
      name: 'Dup Student',
      email: 'pavani@test.com',
      pin: '654321'
    });
    assert(dupStudentRes.status === 409, 'Creating student with existing alumni email rejected (409)');

    // 6. Immediate Alumni Login with PIN
    const alumniLoginRes = await request({ ...BASE, path: '/api/auth/login', method: 'POST' }, {
      email: 'pavani@test.com',
      pin: '123456'
    });
    assert(alumniLoginRes.status === 200 && alumniLoginRes.data.user.role === 'alumni', 'Alumni logs in immediately with PIN');
    const alumniToken = alumniLoginRes.data.token;

    // 7. Admin creates Student with PIN
    const studentPayload = {
      name: 'Rahul Kumar',
      email: 'rahul@test.com',
      pin: '456789',
      batch: '2026',
      department: 'Computer Science',
      gpa: '3.9'
    };
    const addStudentRes = await request({
      ...BASE,
      path: '/api/students',
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${adminToken}` }
    }, studentPayload);
    assert(addStudentRes.status === 201 && addStudentRes.data.data.email === 'rahul@test.com', 'Admin creates Student with PIN');
    const studentId = addStudentRes.data.data._id || addStudentRes.data.data.id;

    // 8. Immediate Student Login with PIN
    const studentLoginRes = await request({ ...BASE, path: '/api/auth/login', method: 'POST' }, {
      email: 'rahul@test.com',
      pin: '456789'
    });
    assert(studentLoginRes.status === 200 && studentLoginRes.data.user.role === 'student', 'Student logs in immediately with PIN');
    const studentToken = studentLoginRes.data.token;

    // 9. Mentorship Request: Student -> Alumni
    const reqMRes = await request({
      ...BASE,
      path: '/api/mentorships',
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${studentToken}` }
    }, {
      alumniId,
      domain: 'Artificial Intelligence',
      goal: 'Deep Learning Interview Prep'
    });
    assert(reqMRes.status === 201 && reqMRes.data.data.status === 'requested', 'Student requests mentorship');
    const mentorshipId = reqMRes.data.data._id || reqMRes.data.data.id;

    // 10. Prevent Duplicate Mentorship Relationship
    const dupMRes = await request({
      ...BASE,
      path: '/api/mentorships',
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${studentToken}` }
    }, {
      alumniId,
      domain: 'Artificial Intelligence',
      goal: 'Second Request Attempt'
    });
    assert(dupMRes.status === 409, 'Duplicate mentorship request between same pair prevented (409)');

    // 11. Alumni accepts mentorship
    const acceptRes = await request({
      ...BASE,
      path: `/api/mentorships/${mentorshipId}`,
      method: 'PUT',
      headers: { ...BASE.headers, Authorization: `Bearer ${alumniToken}` }
    }, { status: 'active' });
    assert(acceptRes.status === 200 && acceptRes.data.data.status === 'active', 'Alumni accepts mentorship');

    // 12. Alumni logs Session 1 and Session 2 (Nested in ONE relationship)
    const futureDate1 = new Date(Date.now() + 86400000).toISOString();
    const sessRes1 = await request({
      ...BASE,
      path: `/api/mentorships/${mentorshipId}/sessions`,
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${alumniToken}` }
    }, {
      topic: 'Neural Networks Basics',
      date: futureDate1,
      time: '10:00 AM',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      notes: 'Review chapter 1-3'
    });
    assert(sessRes1.status === 201 && sessRes1.data.data.sessions.length === 1, 'Alumni logs Session 1 inside existing relationship');

    const futureDate2 = new Date(Date.now() + 172800000).toISOString();
    const sessRes2 = await request({
      ...BASE,
      path: `/api/mentorships/${mentorshipId}/sessions`,
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${alumniToken}` }
    }, {
      topic: 'Transformers Architecture',
      date: futureDate2,
      time: '02:00 PM',
      meetingLink: 'https://meet.google.com/xyz-uvwx-rst',
      notes: 'Attention mechanism discussion'
    });
    assert(sessRes2.status === 201 && sessRes2.data.data.sessions.length === 2, 'Alumni logs Session 2 inside the same relationship');

    // 13. Admin tries to log session -> Must be 403 Forbidden (Read-only)
    const adminSessRes = await request({
      ...BASE,
      path: `/api/mentorships/${mentorshipId}/sessions`,
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${adminToken}` }
    }, {
      topic: 'Admin Illegal Session',
      date: futureDate1,
      time: '11:00 AM',
      meetingLink: 'https://meet.google.com/test'
    });
    assert(adminSessRes.status === 403, 'Admin restricted from logging sessions (403 Read-Only)');

    // 14. Check Student received session notification
    const studentNotifRes = await request({
      ...BASE,
      path: '/api/notifications',
      method: 'GET',
      headers: { ...BASE.headers, Authorization: `Bearer ${studentToken}` }
    });
    assert(studentNotifRes.status === 200 && studentNotifRes.data.data.length >= 2, 'Student received notifications for accepted mentorship & session');

    // 15. Alumni creates Mentor Class
    const mcRes = await request({
      ...BASE,
      path: '/api/mentor-classes',
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${alumniToken}` }
    }, {
      topic: 'React & System Architecture Masterclass',
      date: futureDate1,
      time: '11:00 AM',
      meetingLink: 'https://meet.google.com/masterclass',
      target: 'all'
    });
    assert(mcRes.status === 201 && mcRes.data.data.students.length === 1, 'Alumni creates Mentor Class for accepted mentees');

    // 16. Student sees Mentor Class
    const studentMcRes = await request({
      ...BASE,
      path: '/api/mentor-classes',
      method: 'GET',
      headers: { ...BASE.headers, Authorization: `Bearer ${studentToken}` }
    });
    assert(studentMcRes.status === 200 && studentMcRes.data.data.length === 1, 'Student sees assigned Mentor Class');

    // 17. Alumni creates Referral for Student
    const refRes = await request({
      ...BASE,
      path: '/api/referrals',
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${alumniToken}` }
    }, {
      studentId,
      company: 'Google',
      role: 'Associate Software Engineer',
      applicationLink: 'https://careers.google.com/jobs/1234'
    });
    assert(refRes.status === 201 && refRes.data.data.status === 'pending', 'Alumni creates Referral with default Pending status');
    const referralId = refRes.data.data._id || refRes.data.data.id;

    // 18. Student updates Referral status to Shortlisted
    const updateRefRes = await request({
      ...BASE,
      path: `/api/referrals/${referralId}`,
      method: 'PUT',
      headers: { ...BASE.headers, Authorization: `Bearer ${studentToken}` }
    }, { status: 'shortlisted' });
    assert(updateRefRes.status === 200 && updateRefRes.data.data.status === 'shortlisted', 'Student updates referral to Shortlisted');

    // 19. Alumni tries to update referral status -> 403 Forbidden (Read-only for alumni)
    const alumniUpdateRefRes = await request({
      ...BASE,
      path: `/api/referrals/${referralId}`,
      method: 'PUT',
      headers: { ...BASE.headers, Authorization: `Bearer ${alumniToken}` }
    }, { status: 'selected' });
    assert(alumniUpdateRefRes.status === 403, 'Alumni restricted from changing referral status (403 Read-Only)');

    // 20. Events: Admin creates event
    const eventRes = await request({
      ...BASE,
      path: '/api/events',
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${adminToken}` }
    }, {
      name: 'Global Alumni Tech Summit 2026',
      type: 'Conference',
      date: futureDate2,
      location: 'Campus Auditorium',
      description: 'Annual flagship technical summit.'
    });
    assert(eventRes.status === 201, 'Admin creates event');
    const eventId = eventRes.data.data._id || eventRes.data.data.id;

    // RULE: Event creator CANNOT register for their own event -> 400 Bad Request
    const adminRegEventRes = await request({
      ...BASE,
      path: `/api/events/${eventId}/participate`,
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${adminToken}` }
    });
    assert(adminRegEventRes.status === 400, 'Admin creator blocked from registering for own event (creator != participant)');

    // Alumni registers for Admin's event -> 201 Created
    const alumRegEventRes = await request({
      ...BASE,
      path: `/api/events/${eventId}/participate`,
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${alumniToken}` }
    });
    assert(alumRegEventRes.status === 201, 'Alumni registers for Admin-created event');

    // Student registers for Admin's event -> 201 Created
    const stuRegEventRes = await request({
      ...BASE,
      path: `/api/events/${eventId}/participate`,
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${studentToken}` }
    });
    assert(stuRegEventRes.status === 201, 'Student registers for event');

    // Alumni creates an event
    const alumCreateEventRes = await request({
      ...BASE,
      path: '/api/events',
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${alumniToken}` }
    }, {
      name: 'Alumni Fullstack Tech Meetup',
      type: 'Technical Workshop',
      date: futureDate2,
      location: 'Virtual',
      description: 'Hands-on coding workshop.'
    });
    assert(alumCreateEventRes.status === 201, 'Alumni creates event');
    const alumEventId = alumCreateEventRes.data.data._id || alumCreateEventRes.data.data.id;

    // Alumni creator CANNOT register for their own event -> 400 Bad Request
    const alumRegOwnEventRes = await request({
      ...BASE,
      path: `/api/events/${alumEventId}/participate`,
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${alumniToken}` }
    });
    assert(alumRegOwnEventRes.status === 400, 'Alumni creator blocked from registering for own event');

    // Student registers for Alumni-created event -> 201 Created
    const stuRegAlumEventRes = await request({
      ...BASE,
      path: `/api/events/${alumEventId}/participate`,
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${studentToken}` }
    });
    assert(stuRegAlumEventRes.status === 201, 'Student registers for Alumni-created event');

    // Student tries to CREATE event -> 403 Forbidden
    const stuCreateEventRes = await request({
      ...BASE,
      path: '/api/events',
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${studentToken}` }
    }, {
      name: 'Student Unauthorized Event',
      type: 'Workshop',
      date: futureDate1
    });
    assert(stuCreateEventRes.status === 403, 'Student prevented from creating event (403 Forbidden)');

    // 21. Calendar Date Validation Tests (Reject past dates with 400)
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Event with past date -> 400
    const pastEventRes = await request({
      ...BASE,
      path: '/api/events',
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${adminToken}` }
    }, {
      name: 'Past Event Test',
      date: yesterdayDate
    });
    assert(pastEventRes.status === 400, 'Past date event rejected with 400 Bad Request');

    // Mentorship session with past date -> 400
    const pastSessionRes = await request({
      ...BASE,
      path: `/api/mentorships/${mentorshipId}/sessions`,
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${alumniToken}` }
    }, {
      topic: 'Past Session Test',
      date: yesterdayDate,
      time: '10:00 AM',
      meetingLink: 'https://meet.google.com/test'
    });
    assert(pastSessionRes.status === 400, 'Past date mentorship session rejected with 400 Bad Request');

    // Mentor class with past date -> 400
    const pastClassRes = await request({
      ...BASE,
      path: '/api/mentor-classes',
      method: 'POST',
      headers: { ...BASE.headers, Authorization: `Bearer ${alumniToken}` }
    }, {
      topic: 'Past Class Test',
      date: yesterdayDate,
      time: '10:00 AM',
      meetingLink: 'https://meet.google.com/test',
      target: 'all'
    });
    assert(pastClassRes.status === 400, 'Past date mentor class rejected with 400 Bad Request');

    // 22. Alumni Querying Students (Fix for Select Student dropdown)
    const alumniQueryStudentsRes = await request({
      ...BASE,
      path: '/api/students',
      method: 'GET',
      headers: { ...BASE.headers, Authorization: `Bearer ${alumniToken}` }
    });
    assert(
      alumniQueryStudentsRes.status === 200 && Array.isArray(alumniQueryStudentsRes.data.data) && alumniQueryStudentsRes.data.data.length >= 1,
      'Alumni successfully queries student directory for job referrals (200 OK)'
    );

    // Final clean reset for user testing
    await request({ ...BASE, path: '/api/admin/reset-data', method: 'POST' });
    console.log('✅ Final clean reset executed so user can start testing clean.');

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Test run error:', err);
  }
}

runTests();
