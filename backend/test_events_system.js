require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./src/models/Event');
const User = require('./src/models/User');
const Participation = require('./src/models/Participation');

const BASE_URL = 'http://localhost:5000/api';

async function request(method, path, body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('🚀 Starting Event System End-to-End Verification Suite...\n');
  await mongoose.connect('mongodb://127.0.0.1:27017/alumniconnect');

  // Find or create test users: Student Ganesh, Alumni Naveen, Alumni Priya, Admin
  let studentGanesh = await User.findOne({ email: 'ganesh_events_test@example.com' });
  if (!studentGanesh) {
    const bcrypt = require('bcrypt');
    studentGanesh = await User.create({
      name: 'Ganesh Test',
      email: 'ganesh_events_test@example.com',
      phone: '9876543210',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'student',
      department: 'AID',
      status: 'ACTIVE'
    });
  }

  let alumniNaveen = await User.findOne({ email: 'naveen_events_test@example.com' });
  if (!alumniNaveen) {
    const bcrypt = require('bcrypt');
    alumniNaveen = await User.create({
      name: 'Naveen Test',
      email: 'naveen_events_test@example.com',
      phone: '9876543211',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'alumni',
      status: 'ACTIVE'
    });
  }

  let alumniPriya = await User.findOne({ email: 'priya_events_test@example.com' });
  if (!alumniPriya) {
    const bcrypt = require('bcrypt');
    alumniPriya = await User.create({
      name: 'Priya Test',
      email: 'priya_events_test@example.com',
      phone: '9876543212',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'alumni',
      status: 'ACTIVE'
    });
  }

  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    const bcrypt = require('bcrypt');
    adminUser = await User.create({
      name: 'Platform Admin',
      email: 'admin_events_test@example.com',
      phone: '9876543213',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
      status: 'ACTIVE'
    });
  }

  // Obtain JWT tokens
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'alumniconnect_super_secret_key_2024';

  const studentToken = jwt.sign({ id: studentGanesh._id, role: 'student', name: studentGanesh.name }, JWT_SECRET);
  const alumniToken = jwt.sign({ id: alumniNaveen._id, role: 'alumni', name: alumniNaveen.name }, JWT_SECRET);
  const alumni2Token = jwt.sign({ id: alumniPriya._id, role: 'alumni', name: alumniPriya.name }, JWT_SECRET);
  const adminToken = jwt.sign({ id: adminUser._id, role: 'admin', name: adminUser.name }, JWT_SECRET);

  const studentHeaders = { Authorization: `Bearer ${studentToken}` };
  const alumniHeaders = { Authorization: `Bearer ${alumniToken}` };
  const alumni2Headers = { Authorization: `Bearer ${alumni2Token}` };
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  const now = new Date();

  // Helper to format 12-hour time
  function format12(date) {
    let h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    const meridiem = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${meridiem}`;
  }

  // Define times for tests
  // Ongoing: started 30 mins ago, ends 1 hour from now
  const ongoingStart = new Date(now.getTime() - 30 * 60 * 1000);
  const ongoingEnd = new Date(now.getTime() + 60 * 60 * 1000);
  const ongoingTimeStr = `${format12(ongoingStart)} – ${format12(ongoingEnd)}`;

  // Completed: yesterday
  const completedDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Upcoming: next week
  const upcomingDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Clean up any previous test events
  await Event.deleteMany({ name: /\[TEST EVENT\]/ });
  await Participation.deleteMany({ userId: { $in: [studentGanesh._id, alumniNaveen._id, alumniPriya._id, adminUser._id] } });

  // ─────────────────────────────────────────────────────────────────────────────
  // Create Test Events
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. Upcoming Online Event
  const upcomingEvent = await Event.create({
    name: '[TEST EVENT] Future Cloud Architectures 2026',
    title: '[TEST EVENT] Future Cloud Architectures 2026',
    type: 'Technical Workshop',
    date: upcomingDate,
    time: '10:00 AM – 12:00 PM',
    mode: 'Online',
    location: 'Online',
    meetingLink: 'https://meet.google.com/test-upcoming-link',
    createdBy: alumniNaveen._id,
    createdByRole: 'alumni',
    creatorName: alumniNaveen.name,
    participants: []
  });

  // 2. Ongoing Online Event
  const ongoingEvent = await Event.create({
    name: '[TEST EVENT] Active Real-Time AI Masterclass',
    title: '[TEST EVENT] Active Real-Time AI Masterclass',
    type: 'Webinar',
    date: now,
    time: ongoingTimeStr,
    mode: 'Online',
    location: 'Online',
    meetingLink: 'https://meet.google.com/test-ongoing-link',
    createdBy: alumniNaveen._id,
    createdByRole: 'alumni',
    creatorName: alumniNaveen.name,
    participants: []
  });

  // 3. Completed Event
  const completedEvent = await Event.create({
    name: '[TEST EVENT] Past DevOps Bootcamp',
    title: '[TEST EVENT] Past DevOps Bootcamp',
    type: 'Technical Workshop',
    date: completedDate,
    time: '10:00 AM – 12:00 PM',
    mode: 'Online',
    location: 'Online',
    meetingLink: 'https://meet.google.com/test-completed-link',
    createdBy: alumniNaveen._id,
    createdByRole: 'alumni',
    creatorName: alumniNaveen.name,
    participants: []
  });

  // 4. Offline Event
  const offlineEvent = await Event.create({
    name: '[TEST EVENT] Campus Career Conclave',
    title: '[TEST EVENT] Campus Career Conclave',
    type: 'Networking',
    date: upcomingDate,
    time: '02:00 PM – 04:00 PM',
    mode: 'Offline',
    location: 'Main Campus Auditorium, Block A',
    meetingLink: '',
    createdBy: alumniNaveen._id,
    createdByRole: 'alumni',
    creatorName: alumniNaveen.name,
    participants: []
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 1: Upcoming Online Event (Unregistered User)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 1: Upcoming Online Event (Unregistered Student) ---');
  let res = await request('GET', `/events/${upcomingEvent._id}`, null, studentHeaders);
  let evData = res.data.data;
  console.log('Status:', evData.status);
  console.log('isRegistered:', evData.isRegistered);
  console.log('meetingLink exposed in API?:', Boolean(evData.meetingLink));
  if (evData.status !== 'UPCOMING') throw new Error(`Expected UPCOMING, got ${evData.status}`);
  if (evData.isRegistered !== false) throw new Error('Expected isRegistered to be false');
  if (evData.meetingLink) throw new Error('Security violation: meetingLink leaked to unregistered user before event!');
  console.log('✅ TEST 1 Passed: Status is UPCOMING and meetingLink is securely stripped from response.\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 2: Upcoming Online Event (Registered User)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 2: Upcoming Online Event (Registered Student) ---');
  // Student registers for upcomingEvent
  res = await request('POST', `/events/${upcomingEvent._id}/participate`, {}, studentHeaders);
  console.log('Registration message:', res.data.message);

  res = await request('GET', `/events/${upcomingEvent._id}`, null, studentHeaders);
  evData = res.data.data;
  console.log('Status:', evData.status);
  console.log('isRegistered:', evData.isRegistered);
  console.log('meetingLink exposed in API?:', Boolean(evData.meetingLink));
  if (evData.status !== 'UPCOMING') throw new Error(`Expected UPCOMING, got ${evData.status}`);
  if (evData.isRegistered !== true) throw new Error('Expected isRegistered to be true');
  if (evData.meetingLink) throw new Error('Security violation: meetingLink leaked to registered user BEFORE event starts!');
  console.log('✅ TEST 2 Passed: Student is registered, status is UPCOMING, and meetingLink remains hidden before event starts.\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 3: Ongoing Online Event (Registered User)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 3: Ongoing Online Event (Registered Student) ---');
  // Student registers for ongoingEvent
  await request('POST', `/events/${ongoingEvent._id}/participate`, {}, studentHeaders);

  res = await request('GET', `/events/${ongoingEvent._id}`, null, studentHeaders);
  evData = res.data.data;
  console.log('Status:', evData.status);
  console.log('isRegistered:', evData.isRegistered);
  console.log('meetingLink exposed?:', Boolean(evData.meetingLink));
  console.log('canJoinMeeting:', evData.canJoinMeeting);
  if (evData.status !== 'ONGOING') throw new Error(`Expected ONGOING, got ${evData.status}`);
  if (evData.isRegistered !== true) throw new Error('Expected isRegistered to be true');
  if (!evData.meetingLink || !evData.meetingLink.includes('meet.google.com')) {
    throw new Error('Expected valid meetingLink for registered user during ONGOING event');
  }
  if (evData.canJoinMeeting !== true) throw new Error('Expected canJoinMeeting to be true');
  console.log('✅ TEST 3 Passed: Status is ONGOING, registered user gets meetingLink and canJoinMeeting is true.\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 4: Completed Event (Registered User)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 4: Completed Event (Registered User) ---');
  // Add student directly to participants for testing completed event
  completedEvent.participants.push(studentGanesh._id);
  await completedEvent.save();

  res = await request('GET', `/events/${completedEvent._id}`, null, studentHeaders);
  evData = res.data.data;
  console.log('Status:', evData.status);
  console.log('meetingLink exposed?:', Boolean(evData.meetingLink));
  console.log('canJoinMeeting:', evData.canJoinMeeting);
  if (evData.status !== 'COMPLETED') throw new Error(`Expected COMPLETED, got ${evData.status}`);
  if (evData.meetingLink) throw new Error('Security violation: meetingLink exposed after event completed!');
  if (evData.canJoinMeeting) throw new Error('Expected canJoinMeeting to be false for completed event');
  console.log('✅ TEST 4 Passed: Status is COMPLETED, meeting link is hidden, and joining is disabled.\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 5: Ongoing Online Event (Unregistered User)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 5: Ongoing Online Event (Unregistered Alumni Priya) ---');
  res = await request('GET', `/events/${ongoingEvent._id}`, null, alumni2Headers);
  evData = res.data.data;
  console.log('Status:', evData.status);
  console.log('isRegistered for Priya:', evData.isRegistered);
  console.log('meetingLink exposed to Priya?:', Boolean(evData.meetingLink));
  if (evData.status !== 'ONGOING') throw new Error(`Expected ONGOING, got ${evData.status}`);
  if (evData.isRegistered !== false) throw new Error('Expected Priya to be unregistered');
  if (evData.meetingLink) throw new Error('Security violation: meetingLink leaked to unregistered user during event!');
  console.log('✅ TEST 5 Passed: Unregistered user during ONGOING event cannot access meetingLink.\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 6: Offline Event
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 6: Offline Event ---');
  res = await request('GET', `/events/${offlineEvent._id}`, null, studentHeaders);
  evData = res.data.data;
  console.log('Mode:', evData.mode);
  console.log('Location/Venue:', evData.location);
  console.log('meetingLink:', evData.meetingLink);
  if (evData.mode !== 'Offline') throw new Error('Expected mode Offline');
  if (!evData.location.includes('Main Campus Auditorium')) throw new Error('Expected venue to be displayed');
  if (evData.meetingLink) throw new Error('Offline event should not have meeting link');
  console.log('✅ TEST 6 Passed: Offline event returns venue and empty meetingLink.\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 7: Student Registered & Not Registered Filters
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 7: Student Registered & Not Registered Filters ---');
  // Fetch registered events for student
  res = await request('GET', '/events?status=registered', null, studentHeaders);
  const studentRegistered = res.data.data;
  const isUpcomingInReg = studentRegistered.some(e => e._id.toString() === upcomingEvent._id.toString());
  console.log('Student Registered count for test:', studentRegistered.length, '| Contains upcomingEvent?:', isUpcomingInReg);
  if (!isUpcomingInReg) throw new Error('upcomingEvent must appear in Student registered events');

  // Fetch not registered events for student
  res = await request('GET', '/events?status=notregistered', null, studentHeaders);
  const studentNotRegistered = res.data.data;
  const isUpcomingInNotReg = studentNotRegistered.some(e => e._id.toString() === upcomingEvent._id.toString());
  console.log('Contains upcomingEvent in Not Registered?:', isUpcomingInNotReg);
  if (isUpcomingInNotReg) throw new Error('upcomingEvent must NOT appear in Student Not Registered events');
  console.log('✅ TEST 7 Passed: Student Registered / Not Registered filters work accurately.\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 8: Alumni Registration Filter Isolation
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 8: Alumni Registration Filter Isolation ---');
  // Alumni Priya registers for offlineEvent
  await request('POST', `/events/${offlineEvent._id}/participate`, {}, alumni2Headers);

  // Priya checks registered
  res = await request('GET', '/events?status=registered', null, alumni2Headers);
  const priyaRegistered = res.data.data.some(e => e._id.toString() === offlineEvent._id.toString());
  console.log('Priya has offlineEvent in Registered?:', priyaRegistered);
  if (!priyaRegistered) throw new Error('offlineEvent must appear in Priya registered filter');

  // Student Ganesh (did NOT register for offlineEvent) checks Not Registered
  res = await request('GET', '/events?status=notregistered', null, studentHeaders);
  const studentHasOfflineInNotReg = res.data.data.some(e => e._id.toString() === offlineEvent._id.toString());
  console.log('Student has offlineEvent in Not Registered?:', studentHasOfflineInNotReg);
  if (!studentHasOfflineInNotReg) throw new Error('offlineEvent must appear in Student Not Registered filter');
  console.log('✅ TEST 8 Passed: Registration filters are strictly user-isolated between Alumni and Student.\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 9: Admin Participation and Filters
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 9: Admin Participation and Filters ---');
  // Admin registers for offlineEvent
  await request('POST', `/events/${offlineEvent._id}/participate`, {}, adminHeaders);

  res = await request('GET', '/events?status=registered', null, adminHeaders);
  const adminRegistered = res.data.data.some(e => e._id.toString() === offlineEvent._id.toString());
  console.log('Admin has offlineEvent in Registered?:', adminRegistered);
  if (!adminRegistered) throw new Error('offlineEvent must appear in Admin registered filter');

  res = await request('GET', '/events?status=notregistered', null, adminHeaders);
  const adminNotRegistered = res.data.data.some(e => e._id.toString() === offlineEvent._id.toString());
  console.log('Admin has offlineEvent in Not Registered?:', adminNotRegistered);
  if (adminNotRegistered) throw new Error('offlineEvent must NOT appear in Admin not registered filter');
  console.log('✅ TEST 9 Passed: Admin registration works using Admin user ID and filters correctly.\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 10: Cancel Registration Forbidden Check
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 10: Cancel Registration Forbidden (HTTP 403) ---');
  res = await request('POST', `/events/${upcomingEvent._id}/cancel`, {}, studentHeaders);
  console.log('Cancellation attempt HTTP status:', res.status);
  console.log('Cancellation error response:', res.data);
  if (res.status !== 403) {
    throw new Error(`Expected 403 Forbidden for cancellation, got ${res.status}`);
  }
  console.log('✅ TEST 10 Passed: Cancel registration is forbidden and returns HTTP 403.\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 11: Duplicate Registration Prevention Check
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 11: Duplicate Registration Prevention ---');
  // Student Ganesh tries to register for upcomingEvent again
  res = await request('POST', `/events/${upcomingEvent._id}/participate`, {}, studentHeaders);
  console.log('Duplicate attempt HTTP status:', res.status);
  console.log('Duplicate error message:', res.data?.error);
  if (res.status !== 400 && res.status !== 409) {
    throw new Error(`Expected 400 or 409 for duplicate registration, got ${res.status}`);
  }
  console.log('✅ TEST 11 Passed: Duplicate registration is blocked.\n');

  console.log('================================================================');
  console.log('🎉 ALL 11 TESTS PASSED! Event system functions with 100% compliance.');
  console.log('================================================================');

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
