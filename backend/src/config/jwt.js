/**
 * JWT and security constants configuration
 */

const JWT_SECRET = process.env.JWT_SECRET || 'alumniconnect_super_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN
};
