const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect('mongodb://127.0.0.1:27017/alumniconnect');
  console.log('Connected to DB');

  const users = await mongoose.connection.collection('users').find({}).toArray();
  for (const u of users) {
    if (u.phone && !/^[0-9]{10}$/.test(u.phone)) {
      let cleaned = u.phone.replace(/\D/g, '');
      if (cleaned.length === 12 && cleaned.startsWith('91')) {
        cleaned = cleaned.substring(2);
      }
      if (cleaned.length !== 10) {
        cleaned = '9876543210';
      }
      console.log(`Fixing user ${u.email}: phone "${u.phone}" -> "${cleaned}"`);
      await mongoose.connection.collection('users').updateOne(
        { _id: u._id },
        { $set: { phone: cleaned } }
      );
    }
  }

  // Also check students and alumni
  const students = await mongoose.connection.collection('students').find({}).toArray();
  for (const s of students) {
    if (s.phone && !/^[0-9]{10}$/.test(s.phone)) {
      let cleaned = s.phone.replace(/\D/g, '');
      if (cleaned.length === 12 && cleaned.startsWith('91')) {
        cleaned = cleaned.substring(2);
      }
      if (cleaned.length !== 10) {
        cleaned = '9876543210';
      }
      await mongoose.connection.collection('students').updateOne(
        { _id: s._id },
        { $set: { phone: cleaned } }
      );
    }
  }

  const alumni = await mongoose.connection.collection('alumnis').find({}).toArray();
  for (const a of alumni) {
    if (a.phone && !/^[0-9]{10}$/.test(a.phone)) {
      let cleaned = a.phone.replace(/\D/g, '');
      if (cleaned.length === 12 && cleaned.startsWith('91')) {
        cleaned = cleaned.substring(2);
      }
      if (cleaned.length !== 10) {
        cleaned = '9876543210';
      }
      await mongoose.connection.collection('alumnis').updateOne(
        { _id: a._id },
        { $set: { phone: cleaned } }
      );
    }
  }

  console.log('Done fixing phones');
  await mongoose.disconnect();
}

fix().catch(console.error);
