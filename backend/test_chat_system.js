const BASE_URL = 'http://localhost:5000/api';

async function req(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Chat System Verification Tests...\n');

  try {
    const timestamp = Date.now();
    const alumniEmail = `alumni_chat_${timestamp}@example.com`;
    const student1Email = `student1_chat_${timestamp}@example.com`;
    const student2Email = `student2_chat_${timestamp}@example.com`;
    const outsiderEmail = `outsider_chat_${timestamp}@example.com`;

    console.log('1. Registering test users...');
    // Register Alumni
    const alRes = await req('/auth/register', 'POST', {
      name: 'Dr. Vikram Malhotra',
      email: alumniEmail,
      password: 'Password123!',
      phone: '9876543210',
      role: 'alumni',
      department: 'AID',
      batch: '2015',
      company: 'Google',
      designation: 'Senior Staff Engineer'
    });
    if (!alRes.ok) throw new Error('Alumni registration failed: ' + JSON.stringify(alRes.data));
    const alumniToken = alRes.data.token;
    const alumniUser = alRes.data.user;

    // Register Student 1
    const st1Res = await req('/auth/register', 'POST', {
      name: 'Aarav Sharma',
      email: student1Email,
      password: 'Password123!',
      phone: '9876543211',
      role: 'student',
      department: 'AID',
      batch: '2025',
      rollNumber: 'CS2025001'
    });
    if (!st1Res.ok) throw new Error('Student 1 registration failed: ' + JSON.stringify(st1Res.data));
    const student1Token = st1Res.data.token;
    const student1User = st1Res.data.user;

    // Register Student 2
    const st2Res = await req('/auth/register', 'POST', {
      name: 'Diya Patel',
      email: student2Email,
      password: 'Password123!',
      phone: '9876543212',
      role: 'student',
      department: 'AID',
      batch: '2026',
      rollNumber: 'EC2026002'
    });
    if (!st2Res.ok) throw new Error('Student 2 registration failed: ' + JSON.stringify(st2Res.data));
    const student2Token = st2Res.data.token;
    const student2User = st2Res.data.user;

    // Register Outsider Student
    const outRes = await req('/auth/register', 'POST', {
      name: 'Rohan Gupta',
      email: outsiderEmail,
      password: 'Password123!',
      phone: '9876543213',
      role: 'student',
      department: 'AID',
      batch: '2024'
    });
    if (!outRes.ok) throw new Error('Outsider registration failed: ' + JSON.stringify(outRes.data));
    const outsiderToken = outRes.data.token;

    console.log('✅ Registered:');
    console.log(`   - Alumni: ${alumniUser.name} (${alumniUser._id || alumniUser.id})`);
    console.log(`   - Student 1: ${student1User.name} (${student1User._id || student1User.id})`);
    console.log(`   - Student 2: ${student2User.name} (${student2User._id || student2User.id})`);

    // 2. Student 1 requests mentorship with Alumni
    console.log('\n2. Student 1 requests mentorship with Alumni...');
    const req1Res = await req('/mentorships', 'POST', {
      alumniId: alumniUser._id || alumniUser.id,
      domain: 'Artificial Intelligence',
      goal: 'System Design Mentorship'
    }, student1Token);
    if (!req1Res.ok) throw new Error('Mentorship request failed: ' + JSON.stringify(req1Res.data));
    const mentorship1 = req1Res.data.data;
    console.log(`✅ Mentorship 1 created with status: "${mentorship1.status}" (ID: ${mentorship1._id})`);

    // 3. Verify that Chat is BLOCKED while status is 'requested'
    console.log('\n3. Verifying chat access is blocked for pending/requested mentorship...');
    const sendBlockedRes = await req('/messages', 'POST', {
      mentorshipId: mentorship1._id,
      text: 'Hello mentor!'
    }, student1Token);
    if (sendBlockedRes.status !== 403) {
      throw new Error(`FAIL: Expected 403 when sending on requested mentorship, got ${sendBlockedRes.status}`);
    }
    console.log('✅ Correctly received 403 Forbidden when trying to send message on pending mentorship.');

    const fetchBlockedRes = await req(`/messages/${mentorship1._id}`, 'GET', null, student1Token);
    if (fetchBlockedRes.status !== 403) {
      throw new Error(`FAIL: Expected 403 when fetching on requested mentorship, got ${fetchBlockedRes.status}`);
    }
    console.log('✅ Correctly received 403 Forbidden when trying to fetch messages on pending mentorship.');

    // Check conversation list - must NOT contain pending mentorship
    const convCheck1 = await req('/messages/conversations', 'GET', null, student1Token);
    if (convCheck1.data.data.length !== 0) {
      throw new Error(`FAIL: Pending mentorship appeared in conversations list! count: ${convCheck1.data.data.length}`);
    }
    console.log('✅ Pending mentorship does NOT appear in conversations list (count: 0).');

    // 4. Alumni accepts mentorship 1
    console.log('\n4. Alumni accepts Mentorship 1...');
    const acceptRes = await req(`/mentorships/${mentorship1._id}`, 'PUT', { status: 'active' }, alumniToken);
    if (!acceptRes.ok) throw new Error('Accept mentorship failed: ' + JSON.stringify(acceptRes.data));
    console.log(`✅ Mentorship 1 status updated to: "${acceptRes.data.data.status}"`);

    // 5. Verify conversation list for Student 1 and Alumni
    console.log('\n5. Checking active conversations lists...');
    const st1Convs = await req('/messages/conversations', 'GET', null, student1Token);
    if (st1Convs.data.data.length !== 1) {
      throw new Error(`Expected 1 conversation for Student 1, got ${st1Convs.data.data.length}`);
    }
    const st1Conv = st1Convs.data.data[0];
    console.log(`✅ Student 1 sees conversation with Partner: "${st1Conv.partner.name}" (${st1Conv.partner.role})`);
    if (st1Conv.partner.name !== 'Dr. Vikram Malhotra') {
      throw new Error(`Expected Alumni name "Dr. Vikram Malhotra", got "${st1Conv.partner.name}"`);
    }

    const alConvs = await req('/messages/conversations', 'GET', null, alumniToken);
    if (alConvs.data.data.length !== 1) {
      throw new Error(`Expected 1 conversation for Alumni, got ${alConvs.data.data.length}`);
    }
    const alConv = alConvs.data.data[0];
    console.log(`✅ Alumni sees conversation with Partner: "${alConv.partner.name}" (${alConv.partner.role})`);
    if (alConv.partner.name !== 'Aarav Sharma') {
      throw new Error(`Expected Student name "Aarav Sharma", got "${alConv.partner.name}"`);
    }

    // 6. Student 1 sends message to Alumni
    console.log('\n6. Student 1 sends message to Alumni...');
    const msg1Res = await req('/messages', 'POST', {
      mentorshipId: mentorship1._id,
      text: 'Hello Dr. Vikram, thrilled to connect with you!'
    }, student1Token);
    if (!msg1Res.ok) throw new Error('Send message 1 failed: ' + JSON.stringify(msg1Res.data));
    const msg1 = msg1Res.data.data;
    console.log(`✅ Message sent (ID: ${msg1._id}): "${msg1.text}"`);

    // 7. Alumni fetches messages
    console.log('\n7. Alumni fetches messages for Mentorship 1...');
    const fetch1Res = await req(`/messages/${mentorship1._id}`, 'GET', null, alumniToken);
    if (!fetch1Res.ok) throw new Error('Fetch messages 1 failed: ' + JSON.stringify(fetch1Res.data));
    const messages1 = fetch1Res.data.data;
    console.log(`✅ Fetched ${messages1.length} messages.`);
    if (messages1.length !== 1 || messages1[0].text !== 'Hello Dr. Vikram, thrilled to connect with you!') {
      throw new Error('Message content mismatch or missing message!');
    }

    // 8. Alumni replies to Student 1
    console.log('\n8. Alumni sends reply message to Student 1...');
    const msg2Res = await req('/messages', 'POST', {
      mentorshipId: mentorship1._id,
      text: 'Welcome Aarav! Looking forward to our mentoring sessions.'
    }, alumniToken);
    if (!msg2Res.ok) throw new Error('Send reply failed: ' + JSON.stringify(msg2Res.data));
    const msg2 = msg2Res.data.data;
    console.log(`✅ Reply sent (ID: ${msg2._id}): "${msg2.text}"`);

    // 9. Student 1 fetches updated messages (should have both in chronological order)
    console.log('\n9. Student 1 fetches updated conversation history...');
    const fetch2Res = await req(`/messages/${mentorship1._id}`, 'GET', null, student1Token);
    if (!fetch2Res.ok) throw new Error('Fetch messages 2 failed: ' + JSON.stringify(fetch2Res.data));
    const messages2 = fetch2Res.data.data;
    console.log(`✅ Fetched ${messages2.length} messages.`);
    if (messages2.length !== 2) throw new Error(`Expected 2 messages, got ${messages2.length}`);
    if (messages2[0].text !== msg1.text || messages2[1].text !== msg2.text) {
      throw new Error('Messages not returned in correct chronological order!');
    }
    console.log('✅ Messages verified in exact chronological order:');
    console.log(`   1. [${messages2[0].senderId === (student1User._id || student1User.id) ? 'Student' : 'Alumni'}]: ${messages2[0].text}`);
    console.log(`   2. [${messages2[1].senderId === (alumniUser._id || alumniUser.id) ? 'Alumni' : 'Student'}]: ${messages2[1].text}`);

    // 10. Multi-Mentee isolation test
    console.log('\n10. Testing Multi-Mentee isolation...');
    // Student 2 requests mentorship with same Alumni
    const req2Res = await req('/mentorships', 'POST', {
      alumniId: alumniUser._id || alumniUser.id,
      domain: 'VLSI Design',
      goal: 'Hardware architecture'
    }, student2Token);
    const mentorship2 = req2Res.data.data;
    // Alumni REJECTS/DECLINES Mentorship 2
    await req(`/mentorships/${mentorship2._id}`, 'PUT', { status: 'declined' }, alumniToken);

    // Alumni's conversation list should STILL only contain Student 1, NOT Student 2
    const alConvs2 = await req('/messages/conversations', 'GET', null, alumniToken);
    if (alConvs2.data.data.length !== 1) {
      throw new Error(`Expected Alumni to have only 1 active conversation, found ${alConvs2.data.data.length}`);
    }
    if (alConvs2.data.data[0].partner.name !== 'Aarav Sharma') {
      throw new Error(`Expected conversation partner to be Aarav Sharma, got ${alConvs2.data.data[0].partner.name}`);
    }
    console.log('✅ Alumni conversation list correctly isolates only accepted Student 1 (declined Student 2 excluded).');

    // Student 2 tries to send message on declined mentorship -> 403 Forbidden
    const st2SendRes = await req('/messages', 'POST', {
      mentorshipId: mentorship2._id,
      text: 'Please reconsider?'
    }, student2Token);
    if (st2SendRes.status !== 403) {
      throw new Error(`Expected 403 for student 2 on declined mentorship, got ${st2SendRes.status}`);
    }
    console.log('✅ Declined student correctly blocked from messaging with 403 Forbidden.');

    // 11. Cross-conversation privacy / outsider security test
    console.log('\n11. Testing Cross-conversation access protection...');
    const outFetchRes = await req(`/messages/${mentorship1._id}`, 'GET', null, outsiderToken);
    if (outFetchRes.status !== 403) {
      throw new Error(`Expected 403 for outsider fetch, got ${outFetchRes.status}`);
    }
    console.log('✅ Outsider student correctly blocked from reading conversation 1 with 403 Forbidden.');

    const outSendRes = await req('/messages', 'POST', {
      mentorshipId: mentorship1._id,
      text: 'Intruder message'
    }, outsiderToken);
    if (outSendRes.status !== 403) {
      throw new Error(`Expected 403 for outsider send, got ${outSendRes.status}`);
    }
    console.log('✅ Outsider student correctly blocked from posting to conversation 1 with 403 Forbidden.');

    // 12. Admin conversation list test
    console.log('\n12. Testing Admin conversation list endpoint...');
    const adminLogin = await req('/auth/login', 'POST', {
      email: 'kietgroup@gmail.com',
      password: 'kiet123',
      role: 'admin'
    });
    if (!adminLogin.ok) throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.data));
    const adminToken = adminLogin.data.token;
    const adminConvs = await req('/messages/conversations', 'GET', null, adminToken);
    if (!Array.isArray(adminConvs.data.data) || adminConvs.data.data.length !== 0) {
      throw new Error('Admin conversations should return empty array []');
    }
    console.log('✅ Admin receives empty conversations list [] without errors.');

    console.log('\n======================================================');
    console.log('🎉 ALL BACKEND CHAT & MESSAGING TESTS PASSED 100%! 🎉');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
