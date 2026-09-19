const mongoose = require('mongoose');

async function normalize() {
  await mongoose.connect('mongodb://127.0.0.1:27017/alumniconnect');
  console.log('Connected to DB');

  const validDepts = ['AID', 'CSD', 'CSC', 'CSM', 'CAI'];
  const students = await mongoose.connection.collection('students').find({}).toArray();
  for (const s of students) {
    if (!validDepts.includes(s.department)) {
      console.log(`Normalizing student ${s.email} department from "${s.department}" to "AID"`);
      await mongoose.connection.collection('students').updateOne(
        { _id: s._id },
        { $set: { department: 'AID' } }
      );
    }
  }

  const users = await mongoose.connection.collection('users').find({ role: 'student' }).toArray();
  for (const u of users) {
    if (u.department && !validDepts.includes(u.department)) {
      console.log(`Normalizing user ${u.email} department from "${u.department}" to "AID"`);
      await mongoose.connection.collection('users').updateOne(
        { _id: u._id },
        { $set: { department: 'AID' } }
      );
    }
  }

  console.log('Done normalizing student departments');
  await mongoose.disconnect();
}

normalize().catch(console.error);
