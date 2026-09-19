const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'alumniconnect_super_secret_jwt_key_2026';

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    }, res => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resData) });
        } catch(e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

(async () => {
  console.log('============================================================');
  console.log('TEST SUITE: ALUMNI SIGNUP -> REAL NAME IN MENTORSHIP');
  console.log('============================================================\n');

  // STEP 1: Alumni signs up with real name from prompt
  const timestamp = Date.now();
  const testAlumEmail = `naveen.kambhampati.${timestamp}@example.com`;
  const testAlumPhone = '9999999999';
  const testAlumName = 'Naveen Kambhampati';

  console.log('--- STEP 1: Register New Alumni with real name ---');
  const regRes = await request('POST', '/api/auth/register', {
    name: testAlumName,
    email: testAlumEmail,
    phone: testAlumPhone,
    password: 'password123',
    role: 'alumni',
    department: 'AID'
  });

  assert(regRes.status === 201, 'Alumni registered successfully with status 201');
  assert(regRes.data.user && regRes.data.user.name === testAlumName, 'Alumni response contains exact signup name');
  assert(regRes.data.user.role === 'alumni', 'Registered user role is alumni');
  assert(regRes.data.user.department === 'AID', 'Registered user department is AID');

  const alumniToken = regRes.data.token;
  const alumniAuth = { Authorization: `Bearer ${alumniToken}` };

  // Verify Alumni appears in GET /api/alumni with populated userId
  const alumniListRes = await request('GET', '/api/alumni');
  assert(alumniListRes.status === 200, 'Alumni directory accessible');
  const foundAlum = (alumniListRes.data.data || []).find(a => a.email === testAlumEmail);
  assert(foundAlum !== undefined, 'Newly signed-up alumni appears in alumni directory');
  assert(foundAlum.name === testAlumName, 'Alumni directory card displays real name');
  assert(foundAlum.department === 'AID' || foundAlum.branch === 'AID', 'Alumni directory card displays AID department');
  assert(foundAlum.userId !== undefined, 'Alumni document contains userId reference');
  assert(
    typeof foundAlum.userId === 'object' ? foundAlum.userId.name === testAlumName : true,
    'Alumni populated userId contains real name'
  );

  // STEP 2: Authenticate as Student Ganesh
  console.log('\n--- STEP 2: Authenticate as Student Ganesh ---');
  const mongoose = require('mongoose');
  await mongoose.connect('mongodb://127.0.0.1:27017/alumniconnect');
  const User = require('./src/models/User');
  const ganeshUser = await User.findOne({ email: 'ganesh@gmail.com' });
  assert(ganeshUser !== null, 'Found Student Ganesh in MongoDB');

  const ganeshToken = jwt.sign(
    { id: ganeshUser._id, _id: ganeshUser._id, email: ganeshUser.email, role: 'student', name: ganeshUser.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  const studentAuth = { Authorization: `Bearer ${ganeshToken}` };

  // STEP 3, 4, 5: Student requests mentorship with Naveen Kambhampati
  console.log('\n--- STEP 3, 4, 5: Student Ganesh requests mentorship with Naveen ---');
  // Test both sending foundAlum._id (Alumni collection ID) and foundAlum.userId (User ID)
  const mentorReq = await request('POST', '/api/mentorships', {
    alumniId: foundAlum._id,
    domain: 'AID',
    goal: 'Career guidance and AI placement prep'
  }, studentAuth);

  assert(mentorReq.status === 201, 'Mentorship request created successfully with status 201');
  const createdMentorship = mentorReq.data.data;
  assert(createdMentorship !== undefined, 'Create endpoint returns populated mentorship');
  assert(createdMentorship.alumniId?.name === testAlumName, 'Create response returns real Alumni name Naveen Kambhampati');
  assert(createdMentorship.studentId?.name === ganeshUser.name, 'Create response returns real Student name ganesh');
  assert(createdMentorship.status === 'requested', 'Mentorship status is requested (pending)');

  // STEP 6: Student Portal shows Naveen Kambhampati, AID, requested/pending
  console.log('\n--- STEP 6: Student Portal verification ---');
  const studentMentorships = await request('GET', '/api/mentorships', null, studentAuth);
  assert(studentMentorships.status === 200, 'Student fetched mentorships');
  const studentList = studentMentorships.data.data || [];
  const cardForNaveen = studentList.find(m => m._id === createdMentorship._id);
  assert(cardForNaveen !== undefined, 'Created mentorship found in Student Portal');

  // Verify name is NOT "Unknown Alumni" and NOT "Alumni Mentor"
  assert(cardForNaveen.alumniId?.name === testAlumName, `Student card alumniId.name is exact signup name "${testAlumName}"`);
  assert(cardForNaveen.alumni?.name === testAlumName, `Student card alumni.name is exact signup name "${testAlumName}"`);
  assert(cardForNaveen.alumniId?.name !== 'Unknown Alumni', 'Student card is NOT "Unknown Alumni"');
  assert(cardForNaveen.alumniId?.name !== 'Alumni Mentor', 'Student card is NOT "Alumni Mentor"');
  assert(cardForNaveen.alumniId?.name !== 'Alumni', 'Student card is NOT "Alumni"');
  assert(cardForNaveen.alumniId?.department === 'AID' || cardForNaveen.domain === 'AID', 'Student card displays AID department');
  assert(cardForNaveen.status === 'requested', 'Student card status is requested/pending');

  // STEP 7: Alumni Portal shows incoming request from Ganesh
  console.log('\n--- STEP 7: Alumni Portal verification ---');
  const alumniMentorships = await request('GET', '/api/mentorships', null, alumniAuth);
  assert(alumniMentorships.status === 200, 'Alumni Naveen fetched mentorships');
  const alumniList = alumniMentorships.data.data || [];
  const incomingReqCard = alumniList.find(m => m._id === createdMentorship._id);
  assert(incomingReqCard !== undefined, 'Incoming request found in Alumni Portal');
  assert(incomingReqCard.studentId?.name === ganeshUser.name, `Alumni sees real Student name "${ganeshUser.name}"`);
  assert(incomingReqCard.student?.name === ganeshUser.name, `Alumni sees real Student name on alias "${ganeshUser.name}"`);
  assert(incomingReqCard.studentId?.name !== 'Unknown Student', 'Alumni card is NOT "Unknown Student"');
  assert(incomingReqCard.studentId?.name !== 'Student', 'Alumni card is NOT generic "Student"');
  assert(incomingReqCard.status === 'requested', 'Alumni card status is REQUESTED');

  // STEP 8: Admin Portal monitoring view shows BOTH people
  console.log('\n--- STEP 8: Admin Portal verification ---');
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'kietgroup@gmail.com',
    password: 'kiet123',
    role: 'admin'
  });
  assert(adminLogin.status === 200, 'Admin authenticated');
  const adminAuth = { Authorization: `Bearer ${adminLogin.data.token}` };

  const adminMentorships = await request('GET', '/api/mentorships', null, adminAuth);
  assert(adminMentorships.status === 200, 'Admin fetched all mentorships');
  const adminList = adminMentorships.data.data || [];
  const adminMonitoredCard = adminList.find(m => m._id === createdMentorship._id);
  assert(adminMonitoredCard !== undefined, 'Mentorship found in Admin Portal monitoring view');
  assert(adminMonitoredCard.alumniId?.name === testAlumName, `Admin card displays real Alumni name "${testAlumName}"`);
  assert(adminMonitoredCard.studentId?.name === ganeshUser.name, `Admin card displays real Student name "${ganeshUser.name}"`);
  assert(adminMonitoredCard.alumniId?.name !== 'Unknown Alumni', 'Admin alumni is NOT "Unknown Alumni"');
  assert(adminMonitoredCard.studentId?.name !== 'Unknown Student', 'Admin student is NOT "Unknown Student"');

  // STEP 9: Notification Verification
  console.log('\n--- STEP 9: Notification Verification ---');
  const notifRes = await request('GET', '/api/notifications', null, alumniAuth);
  assert(notifRes.status === 200, 'Alumni fetched notifications');
  const notifications = notifRes.data.data || [];
  const mentorshipNotif = notifications.find(n => n.metadata?.mentorshipId === createdMentorship._id);
  assert(mentorshipNotif !== undefined, 'Alumni received mentorship request notification');
  assert(mentorshipNotif.message.includes(ganeshUser.name), `Notification explicitly contains student name "${ganeshUser.name}"`);
  assert(!mentorshipNotif.message.includes('from Student.'), 'Notification does NOT say generic "from Student"');

  // STEP 10: Existing Records Verification
  console.log('\n--- STEP 10: Existing Database Records Verification ---');
  for (const item of adminList) {
    assert(item.alumniId?.name && item.alumniId.name !== 'Unknown Alumni', `Existing record ${item._id} has real alumni name: "${item.alumniId?.name}"`);
    assert(item.studentId?.name && item.studentId.name !== 'Unknown Student', `Existing record ${item._id} has real student name: "${item.studentId?.name}"`);
  }

  // STEP 11: Nested Reference Resolution
  console.log('\n--- STEP 11: Nested Reference Resolution Check ---');
  assert(adminMonitoredCard.alumniId?.user !== undefined, 'alumniId.user nested object exists');
  assert(adminMonitoredCard.alumniId?.user?.name === testAlumName, 'alumniId.user.name resolves to real name');
  assert(adminMonitoredCard.alumniId?.userId?.name === testAlumName, 'alumniId.userId.name resolves to real name');
  assert(adminMonitoredCard.studentId?.user !== undefined, 'studentId.user nested object exists');
  assert(adminMonitoredCard.studentId?.user?.name === ganeshUser.name, 'studentId.user.name resolves to real student name');
  assert(adminMonitoredCard.studentId?.userId?.name === ganeshUser.name, 'studentId.userId.name resolves to real student name');

  console.log('\n============================================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY!');
  console.log('============================================================');

  await mongoose.disconnect();
  process.exit(0);
})().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
