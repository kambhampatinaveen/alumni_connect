const BASE_URL = 'http://localhost:5000/api';

async function req(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('=== RUNNING ADMIN CRUD & AUTHENTICATION FLOW TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message, debugInfo = null) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      if (debugInfo) console.error('     Debug:', JSON.stringify(debugInfo));
      failed++;
    }
  }

  try {
    // 1. Admin Login Tests
    console.log('[1] Testing Admin Login...');
    const admin1Res = await req('POST', '/auth/login', {
      email: 'kietgroup@gmail.com',
      password: 'kiet123',
      selectedRole: 'admin'
    });
    assert(admin1Res.ok && admin1Res.data.user.role.toLowerCase() === 'admin', 'Login with kietgroup@gmail.com succeeds as Admin', admin1Res);
    const adminToken = admin1Res.data?.token;

    const admin2Res = await req('POST', '/auth/login', {
      email: 'admin@alumniconnect.com',
      password: 'Admin@123',
      selectedRole: 'admin'
    });
    assert(admin2Res.ok && admin2Res.data.user.role.toLowerCase() === 'admin', 'Login with admin@alumniconnect.com succeeds as Admin', admin2Res);

    // 2. Student CRUD & Login Flow
    console.log('\n[2] Testing Admin Student Create -> Login -> Update (no PIN change) -> Reset PIN -> Login...');
    const testStudentEmail = `vinay.crud.${Date.now()}@kiet.edu`;
    const initialStudentPin = '789456';
    const newStudentPin = '456789';

    // Create Student
    const createStudentRes = await req('POST', '/students', {
      name: 'Vinay Test Student',
      email: testStudentEmail,
      phone: '9876543210',
      pin: initialStudentPin,
      department: 'AID',
      batch: '2025',
      gpa: '8.5'
    }, adminToken);
    assert(createStudentRes.status === 201 && createStudentRes.data?.data?.email === testStudentEmail, 'Admin successfully created student', createStudentRes);
    const createdStudentId = createStudentRes.data?.data?._id;

    // Student Login with Initial PIN
    const studentLogin1 = await req('POST', '/auth/login', {
      email: testStudentEmail,
      password: initialStudentPin,
      selectedRole: 'student'
    });
    assert(studentLogin1.ok && studentLogin1.data?.user?.role === 'student', 'Student successfully logs in with initial PIN', studentLogin1);
    const studentToken = studentLogin1.data?.token;

    // Cross-role test: Student trying to log into Admin portal should be rejected
    const studentAdminLoginAttempt = await req('POST', '/auth/login', {
      email: testStudentEmail,
      password: initialStudentPin,
      selectedRole: 'admin'
    });
    assert(studentAdminLoginAttempt.status === 401, 'Student attempting Admin login is rejected (role enforcement)', studentAdminLoginAttempt);

    // Admin updates Student details without changing PIN (pin: '')
    const updateStudentNoPin = await req('PUT', `/students/${createdStudentId}`, {
      name: 'Vinay Test Updated',
      gpa: '8.9',
      pin: '' // Empty string must not overwrite existing password!
    }, adminToken);
    assert(updateStudentNoPin.ok && updateStudentNoPin.data?.data?.name === 'Vinay Test Updated', 'Admin updated student profile leaving PIN empty', updateStudentNoPin);

    // Student should STILL be able to log in with initial PIN
    const studentLogin2 = await req('POST', '/auth/login', {
      email: testStudentEmail,
      password: initialStudentPin,
      selectedRole: 'student'
    });
    assert(studentLogin2.ok, 'Student can still log in with original PIN after profile update', studentLogin2);

    // Admin updates Student PIN
    const updateStudentPin = await req('PUT', `/students/${createdStudentId}`, {
      pin: newStudentPin
    }, adminToken);
    assert(updateStudentPin.ok, 'Admin updated student PIN', updateStudentPin);

    // Old PIN should fail
    const oldPinAttempt = await req('POST', '/auth/login', {
      email: testStudentEmail,
      password: initialStudentPin,
      selectedRole: 'student'
    });
    assert(oldPinAttempt.status === 401, 'Old PIN rejected with 401 Unauthorized', oldPinAttempt);

    // New PIN should succeed
    const studentLogin3 = await req('POST', '/auth/login', {
      email: testStudentEmail,
      password: newStudentPin,
      selectedRole: 'student'
    });
    assert(studentLogin3.ok, 'Student successfully logs in with new reset PIN', studentLogin3);

    // 3. Alumni CRUD & Login Flow
    console.log('\n[3] Testing Admin Alumni Create -> Login -> Update (no PIN change) -> Reset PIN -> Login...');
    const testAlumniEmail = `eswar.crud.${Date.now()}@kiet.edu`;
    const initialAlumniPin = '123456';
    const newAlumniPin = '654321';

    // Create Alumni
    const createAlumniRes = await req('POST', '/alumni', {
      name: 'Eswar Test Alumni',
      email: testAlumniEmail,
      phone: '9123456780',
      pin: initialAlumniPin,
      company: 'Google',
      role: 'Staff Software Engineer',
      branch: 'AID',
      college: 'KIET',
      batch: '2023'
    }, adminToken);
    assert(createAlumniRes.status === 201 && createAlumniRes.data?.data?.email === testAlumniEmail, 'Admin successfully created alumnus', createAlumniRes);
    const createdAlumniId = createAlumniRes.data?.data?._id;

    // Alumni Login with Initial PIN
    const alumniLogin1 = await req('POST', '/auth/login', {
      email: testAlumniEmail,
      password: initialAlumniPin,
      selectedRole: 'alumni'
    });
    assert(alumniLogin1.ok && alumniLogin1.data?.user?.role === 'alumni', 'Alumnus successfully logs in with initial PIN', alumniLogin1);
    const alumniToken = alumniLogin1.data?.token;

    // Admin updates Alumni details without changing PIN (pin: '')
    const updateAlumniNoPin = await req('PUT', `/alumni/${createdAlumniId}`, {
      company: 'Alphabet Inc.',
      pin: '' // Empty string must not overwrite existing password!
    }, adminToken);
    assert(updateAlumniNoPin.ok && updateAlumniNoPin.data?.data?.company === 'Alphabet Inc.', 'Admin updated alumni company leaving PIN empty', updateAlumniNoPin);

    // Alumni should STILL be able to log in with initial PIN
    const alumniLogin2 = await req('POST', '/auth/login', {
      email: testAlumniEmail,
      password: initialAlumniPin,
      selectedRole: 'alumni'
    });
    assert(alumniLogin2.ok, 'Alumnus can still log in with original PIN after profile update', alumniLogin2);

    // Admin updates Alumni PIN
    const updateAlumniPin = await req('PUT', `/alumni/${createdAlumniId}`, {
      pin: newAlumniPin
    }, adminToken);
    assert(updateAlumniPin.ok, 'Admin updated alumni PIN', updateAlumniPin);

    // Old PIN should fail
    const oldAlumniPinAttempt = await req('POST', '/auth/login', {
      email: testAlumniEmail,
      password: initialAlumniPin,
      selectedRole: 'alumni'
    });
    assert(oldAlumniPinAttempt.status === 401, 'Old PIN rejected with 401 Unauthorized', oldAlumniPinAttempt);

    // New PIN should succeed
    const alumniLogin3 = await req('POST', '/auth/login', {
      email: testAlumniEmail,
      password: newAlumniPin,
      selectedRole: 'alumni'
    });
    assert(alumniLogin3.ok, 'Alumnus successfully logs in with new reset PIN', alumniLogin3);

    // 4. Role Authorization & Security Tests
    console.log('\n[4] Testing Role-based Security & Permissions...');
    // Student attempting Admin POST /students
    const studentCreateStudentAttempt = await req('POST', '/students', {
      name: 'Hacker Student',
      email: 'hacker@test.edu',
      pin: '123456'
    }, studentToken);
    assert(studentCreateStudentAttempt.status === 403, 'Student blocked from creating students with 403 Forbidden', studentCreateStudentAttempt);

    // Student attempting Admin POST /alumni
    const studentCreateAlumniAttempt = await req('POST', '/alumni', {
      name: 'Hacker Alumni',
      email: 'hacker.alumni@test.edu',
      pin: '123456'
    }, studentToken);
    assert(studentCreateAlumniAttempt.status === 403, 'Student blocked from creating alumni with 403 Forbidden', studentCreateAlumniAttempt);

    // Alumni attempting Admin POST /alumni
    const alumniCreateAlumniAttempt = await req('POST', '/alumni', {
      name: 'Another Alumni',
      email: 'another.alumni@test.edu',
      pin: '123456'
    }, alumniToken);
    assert(alumniCreateAlumniAttempt.status === 403, 'Alumni blocked from creating alumni with 403 Forbidden', alumniCreateAlumniAttempt);

    // Unauthenticated request
    const anonAttempt = await req('POST', '/students', {
      name: 'Anonymous',
      email: 'anon@test.edu',
      pin: '123456'
    });
    assert(anonAttempt.status === 401, 'Unauthenticated request blocked with 401 Unauthorized', anonAttempt);

    // 5. Validation & Conflict Tests
    console.log('\n[5] Testing Validation & Duplicate Email Handling...');
    const dupRes = await req('POST', '/students', {
      name: 'Duplicate Student',
      email: testStudentEmail,
      phone: '9988776655',
      pin: '123456',
      department: 'AID',
      batch: '2025',
      gpa: '9.0'
    }, adminToken);
    assert(dupRes.status === 409, 'Duplicate email rejected with 409 Conflict', dupRes);

    // 6. Cleanup & Deletion Flow
    console.log('\n[6] Testing Record Deletion & Auth Invalidation...');
    const delStudentRes = await req('DELETE', `/students/${createdStudentId}`, null, adminToken);
    assert(delStudentRes.ok, 'Admin successfully deleted test student', delStudentRes);

    // Deleted student can no longer login
    const deletedStudentLogin = await req('POST', '/auth/login', {
      email: testStudentEmail,
      password: newStudentPin,
      selectedRole: 'student'
    });
    assert(deletedStudentLogin.status === 401 || deletedStudentLogin.status === 404, 'Deleted student login rejected', deletedStudentLogin);

    const delAlumniRes = await req('DELETE', `/alumni/${createdAlumniId}`, null, adminToken);
    assert(delAlumniRes.ok, 'Admin successfully deleted test alumnus', delAlumniRes);

    // Deleted alumnus can no longer login
    const deletedAlumniLogin = await req('POST', '/auth/login', {
      email: testAlumniEmail,
      password: newAlumniPin,
      selectedRole: 'alumni'
    });
    assert(deletedAlumniLogin.status === 401 || deletedAlumniLogin.status === 404, 'Deleted alumnus login rejected', deletedAlumniLogin);

  } catch (err) {
    console.error('Unexpected test error:', err.message, err.stack);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
