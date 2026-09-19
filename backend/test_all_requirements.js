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
  console.log('STARTING AUTOMATED VERIFICATION OF ALUMNI CONNECT PROJECT TASKS');
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
    // 0. Admin Login
    console.log('\n--- 0. AUTHENTICATION & SETUP ---');
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'kietgroup@gmail.com',
      password: 'kiet123',
      role: 'admin'
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin authentication successful');
    const adminAuth = { Authorization: `Bearer ${adminLogin.data.token}` };

    // Register / Create 2 Alumni (Alumni A & Alumni B)
    const suffix = Date.now();
    const alumAEmail = `aluma_${suffix}@test.com`;
    const alumBEmail = `alumb_${suffix}@test.com`;
    const studentAEmail = `studa_${suffix}@test.com`;
    const studentBEmail = `studb_${suffix}@test.com`;

    const createAlumA = await request('POST', '/api/alumni', {
      name: 'Mentor Alpha',
      email: alumAEmail,
      phone: '9876543210',
      pin: '1234',
      batch: '2020',
      department: 'CSE',
      company: 'Google',
      role: 'Staff Engineer',
      domain: 'Cloud Architecture',
      skills: ['Go', 'Kubernetes', 'GCP'],
      bio: 'Staff engineer with 6 years experience mentoring students in cloud systems.',
      availability: 'Weekends'
    }, adminAuth);
    assert(createAlumA.status === 201, 'Created Alumni A');
    const alumADoc = createAlumA.data.data;

    const createAlumB = await request('POST', '/api/alumni', {
      name: 'Mentor Beta',
      email: alumBEmail,
      phone: '9876543211',
      pin: '1234',
      batch: '2019',
      department: 'ECE',
      company: 'Qualcomm',
      role: 'Hardware Lead',
      domain: 'Embedded Systems',
      skills: ['C++', 'Verilog', 'ARM'],
      bio: 'Hardware engineer passionate about IoT and silicon design.',
      availability: 'Weekday Evenings'
    }, adminAuth);
    assert(createAlumB.status === 201, 'Created Alumni B');

    // Create 2 Students (Student A & Student B)
    const createStudA = await request('POST', '/api/students', {
      name: 'Mentee Student A',
      email: studentAEmail,
      phone: '9876543212',
      pin: '1234',
      batch: '2025',
      department: 'CSD',
      gpa: 8.5
    }, adminAuth);
    assert(createStudA.status === 201, 'Created Student A');

    const createStudB = await request('POST', '/api/students', {
      name: 'Mentee Student B',
      email: studentBEmail,
      phone: '9876543213',
      pin: '1234',
      batch: '2026',
      department: 'CSD',
      gpa: 8.0
    }, adminAuth);
    assert(createStudB.status === 201, 'Created Student B');

    // Log in as Alumni A, Alumni B, Student A, Student B
    const loginAlumA = await request('POST', '/api/auth/login', { email: alumAEmail, password: '1234', role: 'alumni' });
    assert(loginAlumA.status === 200 && loginAlumA.data.token, 'Alumni A login successful');
    const alumAAuth = { Authorization: `Bearer ${loginAlumA.data.token}` };
    const alumAUserId = loginAlumA.data.user.id || loginAlumA.data.user._id;

    const loginAlumB = await request('POST', '/api/auth/login', { email: alumBEmail, password: '1234', role: 'alumni' });
    assert(loginAlumB.status === 200 && loginAlumB.data.token, 'Alumni B login successful');
    const alumBAuth = { Authorization: `Bearer ${loginAlumB.data.token}` };

    const loginStudA = await request('POST', '/api/auth/login', { email: studentAEmail, password: '1234', role: 'student' });
    assert(loginStudA.status === 200 && loginStudA.data.token, 'Student A login successful');
    const studAAuth = { Authorization: `Bearer ${loginStudA.data.token}` };

    const loginStudB = await request('POST', '/api/auth/login', { email: studentBEmail, password: '1234', role: 'student' });
    assert(loginStudB.status === 200 && loginStudB.data.token, 'Student B login successful');
    const studBAuth = { Authorization: `Bearer ${loginStudB.data.token}` };

    // ========================================================
    // PART 4: STUDENT "FIND ALUMNI MENTORS" ALUMNI DETAILS MODAL
    // ========================================================
    console.log('\n--- PART 4: STUDENT "FIND ALUMNI MENTORS" & ALUMNI DETAILS ---');
    const alumniListRes = await request('GET', '/api/alumni', null, studAAuth);
    assert(alumniListRes.status === 200 && Array.isArray(alumniListRes.data.data), 'Student can list alumni directory');
    const foundAlumA = (alumniListRes.data.data || []).find(a => a.email === alumAEmail);
    assert(foundAlumA !== undefined, 'Found Alumni A in directory');
    assert(foundAlumA.company === 'Google' && foundAlumA.role === 'Staff Engineer', 'Alumni details include company and role');
    assert(foundAlumA.department === 'CSE' && foundAlumA.batch === '2020', 'Alumni details include department and batch');
    assert(foundAlumA.bio && foundAlumA.availability === 'Weekends', 'Alumni details include bio and availability');
    assert(Array.isArray(foundAlumA.skills) && foundAlumA.skills.includes('Kubernetes'), 'Alumni details include skills tags');

    // ========================================================
    // PART 1: STUDENT MENTORSHIP REQUEST & ALUMNI PORTAL VISIBILITY
    // ========================================================
    console.log('\n--- PART 1: MENTORSHIP REQUEST & TARGET ALUMNI VISIBILITY ---');
    // Student A sends mentorship request using Alumni document _id (as from FindAlumni card)
    const reqRes = await request('POST', '/api/mentorships', {
      alumniId: foundAlumA._id || foundAlumA.id,
      goal: 'Guidance on Distributed Systems and GCP certifications',
      domain: 'Cloud Architecture',
      notes: 'Hello Mentor Alpha, looking forward to your mentorship!'
    }, studAAuth);
    assert(reqRes.status === 201, 'Student A successfully submitted mentorship request');
    assert(reqRes.data.data.status === 'requested', 'Mentorship record created with status: "requested"');
    const createdMentorship = reqRes.data.data;

    // Target Alumni A calls GET /api/mentorships
    const alumAMentorships = await request('GET', '/api/mentorships', null, alumAAuth);
    assert(alumAMentorships.status === 200, 'Alumni A fetched mentorships successfully');
    const matchingReq = (alumAMentorships.data.data || []).find(m => m._id === createdMentorship._id || m.id === createdMentorship.id);
    assert(matchingReq !== undefined, 'Target Alumni A sees the mentorship request in their portal');
    assert(matchingReq && (matchingReq.status === 'requested' || matchingReq.status === 'pending'), 'Mentorship status is requested/pending for Alumni A');

    // Target Alumni A calls GET /api/notifications
    const alumANotifs = await request('GET', '/api/notifications', null, alumAAuth);
    assert(alumANotifs.status === 200, 'Alumni A fetched notifications successfully');
    const mentNotif = (alumANotifs.data.data || []).find(n => n.title && n.title.includes('Mentorship'));
    assert(mentNotif !== undefined, 'Alumni A received notification for new mentorship request');
    assert(mentNotif && mentNotif.message && mentNotif.message.includes('Mentee Student A'), 'Notification message mentions requesting student name');

    // Alumni B checks mentorships and notifications: MUST NOT SEE THEM
    const alumBMentorships = await request('GET', '/api/mentorships', null, alumBAuth);
    const alumBHasReq = (alumBMentorships.data.data || []).some(m => m._id === createdMentorship._id || m.id === createdMentorship.id);
    assert(!alumBHasReq, 'Alumni B does NOT see Alumni A\'s mentorship request (isolated to target alumni)');

    const alumBNotifs = await request('GET', '/api/notifications', null, alumBAuth);
    const alumBHasNotif = (alumBNotifs.data.data || []).some(n => n.title && n.title.includes('Mentorship') && n.message && n.message.includes('Mentee Student A'));
    assert(!alumBHasNotif, 'Alumni B does NOT receive Alumni A\'s mentorship notification');

    // Alumni A accepts the mentorship
    const acceptRes = await request('PUT', `/api/mentorships/${createdMentorship._id || createdMentorship.id}/status`, {
      status: 'active'
    }, alumAAuth);
    assert(acceptRes.status === 200, 'Alumni A can accept the mentorship request');
    assert(acceptRes.data.data.status === 'active', 'Mentorship status transitioned to active');

    // ========================================================
    // PART 3: ONLINE / OFFLINE EVENT CREATION & VALIDATION
    // ========================================================
    console.log('\n--- PART 3: ONLINE / OFFLINE EVENT CREATION & VALIDATION ---');
    // Today's date YYYY-MM-DD
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Future date (7 days from now)
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const futureStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;

    // Past date (7 days ago)
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const pastStr = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`;

    // Test Online mode missing meetingLink -> should fail
    const onlineNoLink = await request('POST', '/api/events', {
      title: 'Online Webinar No Link',
      description: 'Testing validation',
      date: futureStr,
      time: '14:00',
      category: 'Webinar',
      mode: 'Online',
      meetingLink: ''
    }, adminAuth);
    assert(onlineNoLink.status === 400 && (onlineNoLink.data.error || '').toLowerCase().includes('meeting link'), 'Online event without meeting link is rejected');

    // Test Online mode invalid meetingLink -> should fail
    const onlineBadLink = await request('POST', '/api/events', {
      title: 'Online Webinar Bad Link',
      description: 'Testing validation',
      date: futureStr,
      time: '14:00',
      category: 'Webinar',
      mode: 'Online',
      meetingLink: 'not-a-valid-url'
    }, adminAuth);
    assert(onlineBadLink.status === 400 && (onlineBadLink.data.error || '').toLowerCase().includes('valid'), 'Online event with invalid meeting link URL is rejected');

    // Test Online mode valid meetingLink -> should succeed
    const onlineSuccess = await request('POST', '/api/events', {
      title: 'Valid Online Tech Talk',
      description: 'An online tech talk on modern web architectures',
      date: futureStr,
      time: '14:00',
      category: 'Workshop',
      mode: 'Online',
      meetingLink: 'https://meet.google.com/abc-defg-hij'
    }, adminAuth);
    assert(onlineSuccess.status === 201, 'Valid Online event created successfully');
    assert(onlineSuccess.data.data.mode === 'Online', 'Online event mode is "Online"');
    assert(onlineSuccess.data.data.meetingLink === 'https://meet.google.com/abc-defg-hij', 'Online event meeting link saved properly');
    assert(onlineSuccess.data.data.location === 'Online', 'Online event location is defaulted to "Online"');
    const onlineEventId = onlineSuccess.data.data._id;

    // Test Offline mode missing venue/location -> should fail
    const offlineNoLoc = await request('POST', '/api/events', {
      title: 'Offline Meetup No Location',
      description: 'Testing validation',
      date: futureStr,
      time: '10:00',
      category: 'Networking',
      mode: 'Offline',
      location: ''
    }, adminAuth);
    assert(offlineNoLoc.status === 400 && (offlineNoLoc.data.error || '').toLowerCase().includes('location'), 'Offline event without location/venue is rejected');

    // Test Offline mode valid venue -> should succeed
    const offlineSuccess = await request('POST', '/api/events', {
      title: 'Campus Alumni Meetup',
      description: 'In-person networking event at the main campus auditorium',
      date: futureStr,
      time: '10:00',
      category: 'Networking',
      mode: 'Offline',
      location: 'Auditorium Hall B, Tech Block'
    }, adminAuth);
    assert(offlineSuccess.status === 201, 'Valid Offline event created successfully');
    assert(offlineSuccess.data.data.mode === 'Offline', 'Offline event mode is "Offline"');
    assert(offlineSuccess.data.data.location === 'Auditorium Hall B, Tech Block', 'Offline event venue location saved properly');
    assert(!offlineSuccess.data.data.meetingLink, 'Offline event meetingLink is empty');
    const offlineEventId = offlineSuccess.data.data._id;

    // ========================================================
    // PART 2: EVENT STATUS (DATE-BASED) & USER-SPECIFIC FILTERS
    // ========================================================
    console.log('\n--- PART 2: EVENT STATUS & USER REGISTRATION FLOWS ---');
    // Create an Ongoing event (Today)
    const ongoingEventRes = await request('POST', '/api/events', {
      title: 'Today Ongoing Workshop',
      description: 'Happening today',
      date: todayStr,
      time: '11:00',
      category: 'Workshop',
      mode: 'Online',
      meetingLink: 'https://meet.google.com/today-session'
    }, adminAuth);
    assert(ongoingEventRes.status === 201, 'Created event scheduled for TODAY');
    const ongoingEvent = ongoingEventRes.data.data;
    assert(ongoingEvent.status === 'ONGOING', 'Event on TODAY calendar day has status "ONGOING"');

    // Verify Completed event status handling (query existing completed events in DB)
    const completedRes = await request('GET', '/api/events?status=completed', null, studAAuth);
    assert(completedRes.status === 200 && Array.isArray(completedRes.data.data), 'Queried completed events successfully');
    const pastCompleted = (completedRes.data.data || []).find(e => e.status === 'COMPLETED');
    assert(pastCompleted !== undefined, 'Event on past date has status "COMPLETED"');

    // Future event status
    assert(onlineSuccess.data.data.status === 'UPCOMING', 'Event on future date has status "UPCOMING"');

    // Registration flow: Student A registers for the Online event
    const regRes = await request('POST', `/api/events/${onlineEventId}/participate`, {}, studAAuth);
    assert(regRes.status === 200 || regRes.status === 201, 'Student A registered for the Online event successfully');
    assert(regRes.data.data && regRes.data.data.isRegistered === true, 'Response indicates isRegistered: true for Student A');

    // Duplicate registration should be prevented
    const dupRegRes = await request('POST', `/api/events/${onlineEventId}/participate`, {}, studAAuth);
    assert(dupRegRes.status === 400 && (dupRegRes.data.error || '').toLowerCase().includes('already registered'), 'Duplicate registration by Student A is cleanly prevented');

    // Student A checks GET /api/events with status=registered
    const studARegEvents = await request('GET', '/api/events?status=registered', null, studAAuth);
    assert(studARegEvents.status === 200, 'Student A queried registered events');
    const studAFound = (studARegEvents.data.data || []).find(e => e._id === onlineEventId);
    assert(studAFound !== undefined && studAFound.isRegistered === true, 'Student A registered filter includes the registered event');

    // Student A checks GET /api/events with status=notregistered
    const studANotRegEvents = await request('GET', '/api/events?status=notregistered', null, studAAuth);
    assert(studANotRegEvents.status === 200, 'Student A queried notregistered events');
    const studANotFound = (studANotRegEvents.data.data || []).find(e => e._id === onlineEventId);
    assert(studANotFound === undefined, 'Student A notregistered filter correctly excludes the registered event');

    // Student B checks GET /api/events with status=registered (has NOT registered)
    const studBRegEvents = await request('GET', '/api/events?status=registered', null, studBAuth);
    const studBFound = (studBRegEvents.data.data || []).find(e => e._id === onlineEventId);
    assert(studBFound === undefined, 'Student B registered filter does NOT include the event (user-specific)');

    // Student B checks GET /api/events with status=notregistered (has NOT registered)
    const studBNotRegEvents = await request('GET', '/api/events?status=notregistered', null, studBAuth);
    const studBFoundNot = (studBNotRegEvents.data.data || []).find(e => e._id === onlineEventId);
    assert(studBFoundNot !== undefined && studBFoundNot.isRegistered === false, 'Student B notregistered filter correctly includes the event (isRegistered: false)');

    // Detail view GET /api/events/:id checks
    const detailOnline = await request('GET', `/api/events/${onlineEventId}`, null, studAAuth);
    assert(detailOnline.status === 200, 'Fetched Online event details');
    assert(detailOnline.data.data.mode === 'Online', 'Detail view returns mode: Online');
    assert(detailOnline.data.data.meetingLink === 'https://meet.google.com/abc-defg-hij', 'Detail view returns meetingLink for Online event');
    assert(detailOnline.data.data.isRegistered === true, 'Detail view correctly reflects isRegistered: true for Student A');

    const detailOffline = await request('GET', `/api/events/${offlineEventId}`, null, studAAuth);
    assert(detailOffline.status === 200, 'Fetched Offline event details');
    assert(detailOffline.data.data.mode === 'Offline', 'Detail view returns mode: Offline');
    assert(detailOffline.data.data.location === 'Auditorium Hall B, Tech Block', 'Detail view returns physical venue location');
    assert(detailOffline.data.data.isRegistered === false, 'Detail view correctly reflects isRegistered: false for Student A on offline event');

  } catch (err) {
    console.error('Unexpected test error:', err);
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
