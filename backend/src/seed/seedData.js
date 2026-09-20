const bcrypt = require('bcrypt');
const User = require('../models/User');
const Alumni = require('../models/Alumni');
const Student = require('../models/Student');
const Event = require('../models/Event');
const Mentorship = require('../models/Mentorship');
const MentorClass = require('../models/MentorClass');
const Referral = require('../models/Referral');
const Notification = require('../models/Notification');

async function seedDatabase(forceReset = false) {
  try {
    if (forceReset) {
      console.log('🔄  Clearing existing collections for database reset...');
      await Notification.deleteMany({});
      await Referral.deleteMany({});
      await MentorClass.deleteMany({});
      await Mentorship.deleteMany({});
      await Event.deleteMany({});
      await Student.deleteMany({});
      await Alumni.deleteMany({});
      await User.deleteMany({});
      console.log('✅  Collections cleared.');
    }

    // 1. Ensure Predefined Admin Accounts
    const adminAccounts = [
      {
        name: 'KIET Administrator',
        email: 'kietgroup@gmail.com',
        phone: '9876543210',
        password: 'kiet123',
        department: 'Administration',
        designation: 'Platform Administrator'
      },
      {
        name: 'System Administrator',
        email: 'admin@alumniconnect.com',
        phone: '9876543211',
        password: 'Admin@123',
        department: 'Administration',
        designation: 'System Administrator'
      }
    ];

    for (const acc of adminAccounts) {
      let adm = await User.findOne({ email: acc.email });
      if (!adm) {
        const passwordHash = await bcrypt.hash(acc.password, 10);
        await User.create({
          name: acc.name,
          email: acc.email,
          phone: acc.phone,
          passwordHash,
          role: 'admin',
          status: 'ACTIVE',
          department: acc.department,
          designation: acc.designation,
          last_login: new Date()
        });
        console.log(`✅  Predefined Admin seeded: ${acc.email}`);
      } else {
        let needsSave = false;
        if (adm.role !== 'admin') { adm.role = 'admin'; needsSave = true; }
        if (adm.status !== 'ACTIVE') { adm.status = 'ACTIVE'; needsSave = true; }
        if (!adm.phone || !/^[0-9]{10}$/.test(adm.phone)) { adm.phone = acc.phone; needsSave = true; }
        if (needsSave) {
          await adm.save();
        }
      }
    }

    // Check if alumni or students already exist
    const alumniCount = await Alumni.countDocuments();
    const studentCount = await Student.countDocuments();

    if (alumniCount === 0 && studentCount === 0) {
      console.log('🌱  Seeding baseline alumni, students, events, and mentorships...');
      const defaultPinHash = await bcrypt.hash('1234', 10);

      // Seed 2 Alumni: 1 active, 1 inactive (>30 days)
      const now = new Date();
      const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);

      const alumni1User = await User.create({
        name: 'Rahul Sharma',
        email: 'rahul.sharma@kiet.edu',
        phone: '9811223344',
        passwordHash: defaultPinHash,
        role: 'alumni',
        status: 'ACTIVE',
        last_login: now,
        department: 'Computer Science',
        designation: 'Senior Software Engineer',
        company: 'Google',
        batch: '2022',
        location: 'Bengaluru'
      });

      const alumni1Doc = await Alumni.create({
        userId: alumni1User._id,
        name: alumni1User.name,
        email: alumni1User.email,
        phone: alumni1User.phone,
        rollNumber: '18CS045',
        branch: 'CSE',
        college: 'KIET',
        company: 'Google',
        role: 'Senior Software Engineer',
        designation: 'Senior Software Engineer',
        ctc: '28 LPA',
        batch: '2022',
        department: 'Computer Science',
        location: 'Bengaluru',
        status: 'ACTIVE',
        last_login: now,
        mentorshipDomain: 'Software Development & System Design',
        engagementScore: 92
      });

      const alumni2User = await User.create({
        name: 'Priya Patel',
        email: 'priya.patel@kiet.edu',
        phone: '9822334455',
        passwordHash: defaultPinHash,
        role: 'alumni',
        status: 'INACTIVE',
        last_login: fortyDaysAgo,
        department: 'Information Technology',
        designation: 'Product Analyst',
        company: 'Microsoft',
        batch: '2021',
        location: 'Hyderabad'
      });

      await Alumni.create({
        userId: alumni2User._id,
        name: alumni2User.name,
        email: alumni2User.email,
        phone: alumni2User.phone,
        rollNumber: '17IT089',
        branch: 'IT',
        college: 'KIET',
        company: 'Microsoft',
        role: 'Product Analyst',
        designation: 'Product Analyst',
        ctc: '22 LPA',
        batch: '2021',
        department: 'Information Technology',
        location: 'Hyderabad',
        status: 'INACTIVE',
        last_login: fortyDaysAgo,
        mentorshipDomain: 'Product Management & Placement',
        engagementScore: 78
      });

      // Seed 2 Students: 1 active, 1 inactive (>30 days)
      const student1User = await User.create({
        name: 'Arjun Singh',
        email: 'arjun.singh@kiet.edu',
        phone: '9833445566',
        passwordHash: defaultPinHash,
        role: 'student',
        status: 'ACTIVE',
        last_login: now,
        department: 'AID',
        batch: '2025'
      });

      await Student.create({
        userId: student1User._id,
        name: student1User.name,
        email: student1User.email,
        phone: student1User.phone,
        rollNumber: '2100290100015',
        department: 'AID',
        batch: '2025',
        gpa: '8.8',
        status: 'ACTIVE',
        last_login: now
      });

      const student2User = await User.create({
        name: 'Sneha Verma',
        email: 'sneha.verma@kiet.edu',
        phone: '9844556677',
        passwordHash: defaultPinHash,
        role: 'student',
        status: 'INACTIVE',
        last_login: fortyDaysAgo,
        department: 'CSD',
        batch: '2026'
      });

      await Student.create({
        userId: student2User._id,
        name: student2User.name,
        email: student2User.email,
        phone: student2User.phone,
        rollNumber: '2200290200042',
        department: 'CSD',
        batch: '2026',
        gpa: '8.4',
        status: 'INACTIVE',
        last_login: fortyDaysAgo
      });

      // Seed Events: 1 Upcoming, 1 Past
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const pastEventDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const admin = await User.findOne({ role: 'admin' });

      await Event.create({
        name: 'Annual Tech & Innovation Summit 2026',
        title: 'Annual Tech & Innovation Summit 2026',
        type: 'Summit & Keynote',
        description: 'Keynote sessions by distinguished alumni in Cloud Computing and AI.',
        date: futureDate,
        time: '11:00 AM',
        location: 'KIET Auditorium & Virtual Meet',
        meetingLink: 'https://meet.google.com/summit-tech-2026',
        createdBy: admin._id,
        createdByRole: 'admin',
        creatorName: 'KIET Administrator',
        participants: [alumni1User._id, student1User._id],
        status: 'UPCOMING'
      });

      await Event.create({
        name: 'Alumni Placement Orientation 2025',
        title: 'Alumni Placement Orientation 2025',
        type: 'Orientation',
        description: 'Comprehensive campus placement prep workshop.',
        date: pastEventDate,
        time: '02:00 PM',
        location: 'Virtual Meet',
        meetingLink: 'https://meet.google.com/prep-orient-2025',
        createdBy: admin._id,
        createdByRole: 'admin',
        creatorName: 'KIET Administrator',
        participants: [alumni1User._id],
        status: 'COMPLETED'
      });

      // Seed 1 Mentorship Relationship: 1 card with 1 upcoming session & 1 past session
      const upcomingSessionDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const pastSessionDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

      await Mentorship.create({
        studentId: student1User._id,
        alumniId: alumni1User._id,
        domain: 'Software Engineering & System Architecture',
        goal: 'Prepare for tier-1 software engineering product company interviews.',
        status: 'active',
        sessions: [
          {
            topic: 'System Design: Distributed Cache & Microservices',
            date: upcomingSessionDate,
            time: '06:00 PM',
            meetingLink: 'https://meet.google.com/sys-design-session',
            notes: 'Bring questions regarding Redis and LRU cache implementations.',
            status: 'scheduled'
          },
          {
            topic: 'Resume Review & DSA Strategy',
            date: pastSessionDate,
            time: '05:00 PM',
            meetingLink: 'https://meet.google.com/dsa-review-session',
            notes: 'Completed review. Focus on Graphs and Dynamic Programming.',
            status: 'completed'
          }
        ]
      });

      // Seed 1 Job Referral
      await Referral.create({
        alumniId: alumni1User._id,
        studentId: student1User._id,
        company: 'Google',
        jobTitle: 'Software Engineer - University Graduate',
        applicationLink: 'https://careers.google.com/jobs/results/12345',
        status: 'Pending',
        notes: 'Referred based on exceptional open-source contributions.'
      });

      // Seed 1 Notification for student
      await Notification.create({
        userId: student1User._id,
        title: 'Mentorship Session Confirmed',
        message: 'Rahul Sharma scheduled a session: System Design on ' + upcomingSessionDate.toLocaleDateString(),
        type: 'session',
        unread: true
      });

      console.log('✅  Baseline data seeded successfully.');
    }
  } catch (error) {
    console.error('❌  Seed error:', error.message);
  }
}

module.exports = seedDatabase;
