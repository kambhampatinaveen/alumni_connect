/**
 * Input validation helpers for AlumniConnect platform
 */

const VALID_STUDENT_DEPARTMENTS = ['AID', 'CSD', 'CSC', 'CSM', 'CAI'];

function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return 'Phone number must contain exactly 10 digits.';
  }
  const trimmed = phone.trim();
  if (/[^\d]/.test(trimmed)) {
    return 'Phone number must contain only digits.';
  }
  if (trimmed.length !== 10 || !/^[0-9]{10}$/.test(trimmed)) {
    return 'Phone number must contain exactly 10 digits.';
  }
  return null;
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return 'Email address is required.';
  }
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Invalid email address format.';
  }
  return null;
}

function validateStudentDepartment(dept) {
  if (!dept || typeof dept !== 'string' || !VALID_STUDENT_DEPARTMENTS.includes(dept.trim())) {
    return 'Invalid department. Allowed departments are: AID, CSD, CSC, CSM, CAI.';
  }
  return null;
}

function validateGpa(gpa) {
  if (gpa === undefined || gpa === null || String(gpa).trim() === '') {
    return 'GPA is required.';
  }
  const numericGpa = Number(gpa);
  if (!Number.isFinite(numericGpa) || numericGpa < 0 || numericGpa > 10) {
    return 'GPA must be a number between 0 and 10.';
  }
  return null;
}

function validateClassYear(batch) {
  if (batch === undefined || batch === null || !String(batch).trim()) {
    return 'Class Year is required.';
  }
  return null;
}

module.exports = {
  VALID_STUDENT_DEPARTMENTS,
  validatePhoneNumber,
  validateEmail,
  validateStudentDepartment,
  validateGpa,
  validateClassYear
};
