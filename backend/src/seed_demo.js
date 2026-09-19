const store = require('./data/store');

async function seed() {
  console.log('Seeding initial accounts and records...');

  // 1. Admin
  let admin = store.data.users.find(u => u.email === 'admin@alumniconnect.com');
  if (!admin) {
    admin = await store.createAdmin({
      name: 'System Administrator',
      email: 'admin@alumniconnect.com',
      phone: '+91 9876543210',
      password: 'Admin@123'
    });
    console.log('Created Admin:', admin.email);
  }

  // 2. Alumni
  let alumniUser = store.data.users.find(u => u.email === 'sarah.jenkins@alumniconnect.com');
  let alumniRecord;
  if (!alumniUser) {
    alumniRecord = await store.createAlumnus({
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@alumniconnect.com',
      phone: '+91 9123456780',
      pin: '123456',
      rollNumber: '18CS042',
      branch: 'CSD',
      college: 'KIET',
      company: 'Stripe',
      role: 'Senior Product Designer',
      ctc: '32 LPA'
    });
    alumniUser = store.data.users.find(u => u.email === 'sarah.jenkins@alumniconnect.com');
    console.log('Created Alumni:', alumniUser.email);
  } else {
    alumniRecord = store.data.alumni.find(a => a.email === alumniUser.email);
  }

  // 3. Student
  let studentUser = store.data.users.find(u => u.email === 'alex.rivera@alumniconnect.com');
  let studentRecord;
  if (!studentUser) {
    studentRecord = await store.createStudent({
      name: 'Alex Rivera',
      email: 'alex.rivera@alumniconnect.com',
      department: 'Computer Science',
      batch: '2025',
      gpa: '3.92',
      pin: '123456'
    });
    studentUser = store.data.users.find(u => u.email === 'alex.rivera@alumniconnect.com');
    console.log('Created Student:', studentUser.email);
  } else {
    studentRecord = store.data.students.find(s => s.email === studentUser.email);
  }

  // 4. Mentorship Relationship (1-to-1)
  const existingM = store.data.mentorships.find(
    m => (m.studentId?.id === studentRecord.id || m.studentId === studentRecord.id) &&
         (m.alumniId?.id === alumniRecord.id || m.alumniId === alumniRecord.id)
  );

  if (!existingM) {
    const newM = store.createMentorship({
      alumniId: alumniRecord.id,
      domain: 'Frontend Architecture & System Design',
      goal: 'Guidance on fullstack software architecture, scalable React patterns, and career placement.'
    }, studentUser);

    // Accept it
    newM.status = 'active';

    // Add Past Session
    newM.sessions.push({
      id: 'sess-1',
      topic: 'Introduction & Resume Deep-Dive',
      date: '2026-08-15',
      time: '10:00 AM',
      notes: 'Reviewed resume format, key project descriptions, and portfolio highlights.',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      status: 'completed'
    });

    // Add Upcoming Session
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateStr = futureDate.toISOString().split('T')[0];

    newM.sessions.push({
      id: 'sess-2',
      topic: 'System Design Mock Interview (Distributed Caching & Redis)',
      date: dateStr,
      time: '04:30 PM',
      notes: 'Focus on high-availability design, cache invalidation strategies, and latency trade-offs.',
      meetingLink: 'https://meet.google.com/xyz-uvwx-rst',
      status: 'scheduled'
    });

    store.save();
    console.log('Created 1-to-1 Mentorship with 2 sessions');
  }

  // 5. Mentor Class
  if (store.data.mentorClasses.length === 0) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const classDateStr = futureDate.toISOString().split('T')[0];

    store.createMentorClass({
      title: 'Full-Stack Microservices Masterclass',
      description: 'Hands-on architectural deep dive covering event-driven services, Kafka message brokers, and Docker containerization.',
      date: classDateStr,
      time: '11:00 AM',
      meetingLink: 'https://meet.google.com/masterclass-session',
      targetType: 'all',
      studentIds: [studentRecord.id],
      studentNames: [studentRecord.name]
    }, alumniUser);
    console.log('Created Group Mentor Class');
  }

  // 6. Referral
  if (store.data.referrals.length === 0) {
    store.createReferral({
      studentId: studentRecord.id,
      company: 'Stripe',
      role: 'Associate Software Engineer (L3)',
      applicationLink: 'https://stripe.com/jobs/ase-2026',
      notes: 'Top tier candidate recommendation for backend engineering team.'
    }, alumniUser);
    console.log('Created Referral Listing');
  }

  // 7. Event
  if (store.data.events.length === 0) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    store.createEvent({
      name: 'AI & LLM Systems Architecture in 2026',
      type: 'Technical Workshop',
      date: futureDate.toISOString(),
      location: 'Auditorium A / Virtual Stream',
      description: 'Keynote technical workshop on deploying production LLM inference pipelines and multi-agent systems.'
    }, admin);
    console.log('Created Event');
  }

  console.log('Seeding complete! All accounts ready.');
}

seed().catch(console.error);
