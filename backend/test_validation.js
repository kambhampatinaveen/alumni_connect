const assert = require('assert');

// 1. Test Phone Validation Logic
function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, message: 'Phone number is required.' };
  }
  const trimmed = phone.trim();
  if (/[^0-9]/.test(trimmed)) {
    return { isValid: false, message: 'Phone number must contain only digits.' };
  }
  if (trimmed.length !== 10) {
    return { isValid: false, message: 'Phone number must contain exactly 10 digits.' };
  }
  return { isValid: true, sanitized: trimmed };
}

// 2. Test Student Department Logic
const ALLOWED_STUDENT_DEPTS = ['AID', 'CSD', 'CSC', 'CSM', 'CAI'];
function validateStudentDepartment(dept) {
  if (!dept || typeof dept !== 'string') {
    return { isValid: false, message: 'Department is required for student registration.' };
  }
  const clean = dept.trim().toUpperCase();
  if (!ALLOWED_STUDENT_DEPTS.includes(clean)) {
    return {
      isValid: false,
      message: `Invalid department. Allowed departments are: ${ALLOWED_STUDENT_DEPTS.join(', ')}.`
    };
  }
  return { isValid: true, department: clean };
}

// 3. Test Event Status Calculation
function calculateEventStatus(event) {
  if (!event || !event.date) return 'UPCOMING';
  const now = new Date();
  const eventDate = new Date(event.date);
  if (isNaN(eventDate.getTime())) return 'UPCOMING';

  const isToday =
    now.getFullYear() === eventDate.getFullYear() &&
    now.getMonth() === eventDate.getMonth() &&
    now.getDate() === eventDate.getDate();

  if (isToday) return 'ONGOING';
  if (eventDate < now) return 'COMPLETED';
  return 'UPCOMING';
}

console.log('--- Testing Phone Validation ---');
assert.strictEqual(validatePhoneNumber('9876543210').isValid, true);
assert.strictEqual(validatePhoneNumber('987654321a').message, 'Phone number must contain only digits.');
assert.strictEqual(validatePhoneNumber('+919876543210').message, 'Phone number must contain only digits.');
assert.strictEqual(validatePhoneNumber('98765 43210').message, 'Phone number must contain only digits.');
assert.strictEqual(validatePhoneNumber('987654321').message, 'Phone number must contain exactly 10 digits.');
assert.strictEqual(validatePhoneNumber('98765432109').message, 'Phone number must contain exactly 10 digits.');
console.log('✓ All Phone validation assertions passed!');

console.log('--- Testing Department Validation ---');
ALLOWED_STUDENT_DEPTS.forEach(d => {
  assert.strictEqual(validateStudentDepartment(d).isValid, true);
  assert.strictEqual(validateStudentDepartment(d.toLowerCase()).isValid, true);
});
assert.strictEqual(validateStudentDepartment('Computer Science').isValid, false);
assert.strictEqual(validateStudentDepartment('Mechanical').isValid, false);
assert.strictEqual(validateStudentDepartment('ECE').isValid, false);
console.log('✓ All Department validation assertions passed!');

console.log('--- Testing Dynamic Event Status ---');
const pastDate = new Date(Date.now() - 24 * 3600 * 1000 * 5).toISOString();
const futureDate = new Date(Date.now() + 24 * 3600 * 1000 * 30).toISOString();
const todayDate = new Date().toISOString();

assert.strictEqual(calculateEventStatus({ date: pastDate }), 'COMPLETED');
assert.strictEqual(calculateEventStatus({ date: futureDate }), 'UPCOMING');
assert.strictEqual(calculateEventStatus({ date: todayDate }), 'ONGOING');
console.log('✓ All Event Status calculation assertions passed!');

console.log('\nALL VALIDATION UNIT TESTS PASSED CLEANLY (100%)');
