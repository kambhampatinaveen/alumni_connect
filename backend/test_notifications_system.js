const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('============================================================');
  console.log('TEST SUITE: COMPLETE ROLE-BASED NOTIFICATION SYSTEM');
  console.log('============================================================\n');

  // STEP 1: Setup test accounts
  console.log('--- STEP 1: Authenticate / Register Test Users ---');

  // Admin login
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'kietgroup@gmail.com',
    password: 'kiet123',
    role: 'admin'
  });
  assert(adminLogin.status === 200, 'Admin login successful');
  const adminToken = adminLogin.data.token;
  const adminUser = adminLogin.data.user;
  console.log('✅ PASS: Admin authenticated');

  // Student Ganesh registration / login
  const ganeshEmail = `ganesh.notif.${Date.now()}@example.com`;
  const ganeshReg = await request('POST', '/api/auth/register', {
    name: 'Ganesh',
    email: ganeshEmail,
    phone: '9876543210',
    password: 'password123',
    role: 'student',
    department: 'AID'
  });
  assert(ganeshReg.status === 201, 'Student Ganesh registered');
  const ganeshToken = ganeshReg.data.token;
  const ganeshUser = ganeshReg.data.user;
  console.log(`✅ PASS: Student Ganesh registered (${ganeshUser.name}, ID: ${ganeshUser.id || ganeshUser._id})`);

  // Alumni Naveen registration / login
  const naveenEmail = `naveen.notif.${Date.now()}@example.com`;
  const naveenReg = await request('POST', '/api/auth/register', {
    name: 'Naveen Kambhampati',
    email: naveenEmail,
    phone: '9876543211',
    password: 'password123',
    role: 'alumni',
    department: 'AID'
  });
  assert(naveenReg.status === 201, 'Alumni Naveen registered');
  const naveenToken = naveenReg.data.token;
  const naveenUser = naveenReg.data.user;
  console.log(`✅ PASS: Alumni Naveen registered (${naveenUser.name}, ID: ${naveenUser.id || naveenUser._id})`);

  // Alumni Other (for isolation check)
  const otherAlumEmail = `other.alum.${Date.now()}@example.com`;
  const otherAlumReg = await request('POST', '/api/auth/register', {
    name: 'Dr. Vikram Sarabhai',
    email: otherAlumEmail,
    phone: '9876543212',
    password: 'password123',
    role: 'alumni',
    department: 'CSD'
  });
  assert(otherAlumReg.status === 201, 'Alumni Other registered');
  const otherAlumToken = otherAlumReg.data.token;
  const otherAlumUser = otherAlumReg.data.user;
  console.log(`✅ PASS: Alumni Other registered (${otherAlumUser.name}, ID: ${otherAlumUser.id || otherAlumUser._id})`);

  // STEP 2: Verify Admin received New Student & Alumni Registration Notifications
  console.log('\n--- STEP 2: Admin Registration Notifications ---');
  const adminNotifsRes = await request('GET', '/api/notifications', null, adminToken);
  assert(adminNotifsRes.status === 200, 'Admin fetched notifications');
  const adminNotifs = adminNotifsRes.data.data || [];
  const studRegNotif = adminNotifs.find(n => n.type === 'user_registration' && n.message.includes('Ganesh'));
  assert(studRegNotif !== undefined, 'Admin received notification for Student Ganesh registration');
  console.log('✅ PASS: Admin received New Student Registration notification for Ganesh');

  const alumRegNotif = adminNotifs.find(n => n.type === 'user_registration' && n.message.includes('Naveen'));
  assert(alumRegNotif !== undefined, 'Admin received notification for Alumni Naveen registration');
  console.log('✅ PASS: Admin received New Alumni Registration notification for Naveen');

  // STEP 3: Student Ganesh requests mentorship with Alumni Naveen
  console.log('\n--- STEP 3: Mentorship Request Notification Flow ---');
  const mentReq = await request('POST', '/api/mentorships', {
    alumniId: naveenUser.id || naveenUser._id,
    domain: 'AID',
    goal: 'Career Guidance in Cloud AI'
  }, ganeshToken);
  assert(mentReq.status === 201, 'Mentorship request created successfully');
  const mentorship = mentReq.data.data;
  console.log(`✅ PASS: Mentorship created (ID: ${mentorship._id})`);

  // Verify Alumni Naveen receives notification
  const naveenNotifsRes = await request('GET', '/api/notifications', null, naveenToken);
  assert(naveenNotifsRes.status === 200, 'Alumni Naveen fetched notifications');
  const naveenNotifs = naveenNotifsRes.data.data || [];
  const naveenMentNotif = naveenNotifs.find(n => n.type === 'mentorship_request' && n.relatedId === mentorship._id);
  assert(naveenMentNotif !== undefined, 'Alumni Naveen received Mentorship Request notification');
  assert(naveenMentNotif.title === 'New Mentorship Request', 'Title is "New Mentorship Request"');
  assert(naveenMentNotif.message.includes('Ganesh sent you a mentorship request.'), `Message uses real name: "${naveenMentNotif.message}"`);
  assert(!naveenMentNotif.message.includes('Unknown'), 'Message does NOT say Unknown');
  console.log(`✅ PASS: Alumni Naveen received: "${naveenMentNotif.title}" - "${naveenMentNotif.message}"`);

  // Verify Alumni Other does NOT receive Naveen's mentorship notification (ISOLATION TEST)
  const otherNotifsRes = await request('GET', '/api/notifications', null, otherAlumToken);
  const otherNotifs = otherNotifsRes.data.data || [];
  const otherHasNaveenNotif = otherNotifs.some(n => n.relatedId === mentorship._id);
  assert(!otherHasNaveenNotif, 'Alumni Other does NOT see Naveen\'s private mentorship request notification');
  console.log('✅ PASS: Notification Isolation Verified — Other alumni cannot see Naveen\'s notifications');

  // Verify Admin received Administrative Mentorship Request Notification
  const adminNotifsRes2 = await request('GET', '/api/notifications', null, adminToken);
  const adminMentNotif = adminNotifsRes2.data.data.find(n => n.type === 'mentorship_request' && n.relatedId === mentorship._id);
  assert(adminMentNotif !== undefined, 'Admin received administrative mentorship request notification');
  assert(adminMentNotif.message.includes('Ganesh requested mentorship with Naveen Kambhampati.'), `Admin message contains both names: "${adminMentNotif.message}"`);
  console.log(`✅ PASS: Admin received: "${adminMentNotif.title}" - "${adminMentNotif.message}"`);

  // STEP 4: Alumni Naveen accepts mentorship request
  console.log('\n--- STEP 4: Mentorship Accept Flow ---');
  const acceptRes = await request('PUT', `/api/mentorships/${mentorship._id}`, { status: 'accepted' }, naveenToken);
  assert(acceptRes.status === 200, 'Alumni Naveen accepted mentorship');

  // Verify Student Ganesh receives notification
  const ganeshNotifsRes = await request('GET', '/api/notifications', null, ganeshToken);
  assert(ganeshNotifsRes.status === 200, 'Student Ganesh fetched notifications');
  const ganeshNotifs = ganeshNotifsRes.data.data || [];
  const ganeshAcceptNotif = ganeshNotifs.find(n => n.type === 'mentorship_accept' && n.relatedId === mentorship._id);
  assert(ganeshAcceptNotif !== undefined, 'Student Ganesh received Mentorship Request Accepted notification');
  assert(ganeshAcceptNotif.title === 'Mentorship Request Accepted', 'Title is "Mentorship Request Accepted"');
  assert(ganeshAcceptNotif.message.includes('Naveen Kambhampati accepted your mentorship request.'), `Message uses real name: "${ganeshAcceptNotif.message}"`);
  console.log(`✅ PASS: Student Ganesh received: "${ganeshAcceptNotif.title}" - "${ganeshAcceptNotif.message}"`);

  // STEP 5: Alumni Naveen schedules a new session
  console.log('\n--- STEP 5: New Mentorship Session Flow ---');
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const sessionRes = await request('POST', `/api/mentorships/${mentorship._id}/sessions`, {
    topic: 'Cloud Infrastructure & Kubernetes',
    date: nextWeek.toISOString(),
    time: '02:00 PM',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    notes: 'Please review cloud basics before the session'
  }, naveenToken);
  assert(sessionRes.status === 201, 'Alumni Naveen created mentorship session');

  // Verify Student Ganesh receives session notification
  const ganeshNotifsRes2 = await request('GET', '/api/notifications', null, ganeshToken);
  const sessionNotif = ganeshNotifsRes2.data.data.find(n => n.type === 'session' && n.relatedId === mentorship._id);
  assert(sessionNotif !== undefined, 'Student Ganesh received New Mentorship Session notification');
  assert(sessionNotif.title === 'New Mentorship Session', 'Title is "New Mentorship Session"');
  assert(sessionNotif.message.includes('Naveen Kambhampati scheduled a mentorship session for'), `Message has real name & date: "${sessionNotif.message}"`);
  console.log(`✅ PASS: Student Ganesh received: "${sessionNotif.title}" - "${sessionNotif.message}"`);

  // STEP 6: Alumni Naveen creates Job Referral for Student Ganesh
  console.log('\n--- STEP 6: Job Referral Flow ---');
  const refRes = await request('POST', '/api/referrals', {
    company: 'Google',
    jobTitle: 'Software Engineer',
    studentId: ganeshUser.id || ganeshUser._id,
    applicationLink: 'https://careers.google.com/jobs/12345',
    notes: 'Strong candidate in cloud systems'
  }, naveenToken);
  assert(refRes.status === 201, 'Alumni Naveen submitted job referral');
  const referral = refRes.data.data;

  // Verify Student Ganesh receives referral notification
  const ganeshNotifsRes3 = await request('GET', '/api/notifications', null, ganeshToken);
  const refNotif = ganeshNotifsRes3.data.data.find(n => n.type === 'referral' && n.relatedId === referral._id);
  assert(refNotif !== undefined, 'Student Ganesh received New Job Referral notification');
  assert(refNotif.title === 'New Job Referral', 'Title is "New Job Referral"');
  assert(refNotif.message.includes('Naveen Kambhampati referred you for Software Engineer at Google.'), `Message matches: "${refNotif.message}"`);
  console.log(`✅ PASS: Student Ganesh received: "${refNotif.title}" - "${refNotif.message}"`);

  // STEP 7: Student Ganesh updates referral status to Shortlisted
  console.log('\n--- STEP 7: Referral Status Updated Flow ---');
  const refUpdateRes = await request('PUT', `/api/referrals/${referral._id}`, { status: 'shortlisted' }, ganeshToken);
  assert(refUpdateRes.status === 200, 'Student Ganesh updated referral status');

  // Verify Alumni Naveen receives referral status notification
  const naveenNotifsRes2 = await request('GET', '/api/notifications', null, naveenToken);
  const refStatusNotif = naveenNotifsRes2.data.data.find(n => n.type === 'referral_status' && n.relatedId === referral._id);
  assert(refStatusNotif !== undefined, 'Alumni Naveen received Referral Status Updated notification');
  assert(refStatusNotif.title === 'Referral Status Updated', 'Title is "Referral Status Updated"');
  assert(refStatusNotif.message.includes('Ganesh updated the referral status for Software Engineer at Google to Shortlisted.'), `Message matches: "${refStatusNotif.message}"`);
  console.log(`✅ PASS: Alumni Naveen received: "${refStatusNotif.title}" - "${refStatusNotif.message}"`);

  // STEP 8: Event Creation & Participation Flow
  console.log('\n--- STEP 8: Event Creation & Registration Flow ---');
  const eventDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const eventRes = await request('POST', '/api/events', {
    name: 'Next-Gen Cloud Architecture',
    title: 'Next-Gen Cloud Architecture',
    type: 'Technical Workshop',
    description: 'Deep dive into microservices and distributed databases',
    date: eventDate.toISOString(),
    time: '11:00 AM',
    mode: 'Online',
    meetingLink: 'https://meet.google.com/xyz-uvw-rst'
  }, naveenToken);
  assert(eventRes.status === 201, 'Alumni Naveen created event');
  const createdEvent = eventRes.data.data;

  // Verify Student Ganesh receives new event notification
  const ganeshNotifsRes4 = await request('GET', '/api/notifications', null, ganeshToken);
  const eventNotif = ganeshNotifsRes4.data.data.find(n => n.type === 'event_created' && n.relatedId === createdEvent._id);
  assert(eventNotif !== undefined, 'Student Ganesh received New Event notification');
  assert(eventNotif.title === 'New Event Available', 'Title is "New Event Available"');
  console.log(`✅ PASS: Student Ganesh received: "${eventNotif.title}" - "${eventNotif.message}"`);

  // Student Ganesh registers for event
  const partRes = await request('POST', `/api/events/${createdEvent._id}/participate`, null, ganeshToken);
  assert(partRes.status === 201, 'Student Ganesh registered for event');

  // Verify Alumni Naveen (event creator) received registration notification
  const naveenNotifsRes3 = await request('GET', '/api/notifications', null, naveenToken);
  const partNotif = naveenNotifsRes3.data.data.find(n => n.type === 'event_registration' && n.relatedId === createdEvent._id);
  assert(partNotif !== undefined, 'Event creator Naveen received New Event Registration notification');
  assert(partNotif.title === 'New Event Registration', 'Title is "New Event Registration"');
  assert(partNotif.message.includes('Ganesh registered for Next-Gen Cloud Architecture.'), `Message matches: "${partNotif.message}"`);
  console.log(`✅ PASS: Event Creator Naveen received: "${partNotif.title}" - "${partNotif.message}"`);

  // STEP 9: Unread Count & Mark As Read Dynamic Behavior
  console.log('\n--- STEP 9: Dynamic Unread Count & Mark As Read ---');
  const unreadBefore = await request('GET', '/api/notifications/unread-count', null, naveenToken);
  assert(unreadBefore.status === 200, 'Fetched unread count');
  const initialUnread = unreadBefore.data.unreadCount;
  assert(initialUnread > 0, `Initial unread count is positive (${initialUnread})`);
  console.log(`✅ PASS: Initial unread count for Naveen: ${initialUnread}`);

  // Mark single notification as read
  const naveenList = await request('GET', '/api/notifications', null, naveenToken);
  const firstUnread = naveenList.data.data.find(n => n.unread === true || n.isRead === false);
  assert(firstUnread !== undefined, 'Found unread notification');

  const markReadRes = await request('PUT', `/api/notifications/${firstUnread._id}/read`, null, naveenToken);
  assert(markReadRes.status === 200, 'Marked notification as read');
  assert(markReadRes.data.data.unread === false, 'Notification is now marked read');

  const unreadAfterOne = await request('GET', '/api/notifications/unread-count', null, naveenToken);
  assert(unreadAfterOne.data.unreadCount === initialUnread - 1, 'Unread count decreased exactly by 1');
  console.log(`✅ PASS: Unread count decreased by 1 to: ${unreadAfterOne.data.unreadCount}`);

  // Mark all as read
  const markAllRes = await request('PUT', '/api/notifications/read-all', null, naveenToken);
  assert(markAllRes.status === 200, 'Marked all notifications as read');

  const unreadAfterAll = await request('GET', '/api/notifications/unread-count', null, naveenToken);
  assert(unreadAfterAll.data.unreadCount === 0, 'Unread count is now exactly 0');
  console.log('✅ PASS: Mark all as read sets unread count to 0');

  // STEP 10: Security & Recipient Isolation
  console.log('\n--- STEP 10: Security & Authorization Verification ---');
  // Student Ganesh attempts to mark Naveen's notification as read -> MUST FAIL (404/denied)
  const unauthorizedMark = await request('PUT', `/api/notifications/${firstUnread._id}/read`, null, ganeshToken);
  assert(unauthorizedMark.status === 404, 'Unauthorized mark-as-read returns 404/Access Denied');
  console.log('✅ PASS: Cross-user mutation blocked — Ganesh cannot mark Naveen\'s notification as read');

  console.log('\n============================================================');
  console.log('ALL NOTIFICATION SYSTEM TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('============================================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
