const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const DATA_FILE = path.join(__dirname, '..', '..', 'data', 'store.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DEFAULT_STATE = {
  users: [],
  alumni: [],
  students: [],
  events: [],
  participations: [],
  mentorships: [],
  mentorClasses: [],
  referrals: [],
  notifications: []
};

class Store {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          users: Array.isArray(parsed.users) ? parsed.users : [],
          alumni: Array.isArray(parsed.alumni) ? parsed.alumni : [],
          students: Array.isArray(parsed.students) ? parsed.students : [],
          events: Array.isArray(parsed.events) ? parsed.events : [],
          participations: Array.isArray(parsed.participations) ? parsed.participations : [],
          mentorships: Array.isArray(parsed.mentorships) ? parsed.mentorships : [],
          mentorClasses: Array.isArray(parsed.mentorClasses) ? parsed.mentorClasses : [],
          referrals: Array.isArray(parsed.referrals) ? parsed.referrals : [],
          notifications: Array.isArray(parsed.notifications) ? parsed.notifications : []
        };
      }
    } catch (err) {
      console.error('Error loading store.json:', err.message);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving store.json:', err.message);
    }
  }

  clear() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.save();
  }

  // ─── User & Auth Helpers ──────────────────────────────────────────────────
  findUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  findUserById(id) {
    return this.data.users.find(u => u.id === id || u._id === id) || null;
  }

  async createAdmin({ name, email, phone, password }) {
    if (this.findUserByEmail(email)) {
      const err = new Error('An account with this email already exists.');
      err.status = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = `ADM-${Date.now()}`;
    const user = {
      id,
      _id: id,
      name,
      email,
      phone: phone || '',
      passwordHash,
      role: 'admin',
      department: 'Administration',
      designation: 'Platform Administrator',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff&size=150`,
      createdAt: new Date().toISOString()
    };

    this.data.users.push(user);
    this.save();

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  checkAndApplyInactivity() {
    const now = Date.now();
    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
    let changed = false;

    // Check Alumni
    for (const a of this.data.alumni) {
      if (a.status === 'BLOCKED' || a.status === 'Suspended' || a.status === 'Blocked') {
        continue;
      }
      const refTime = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : now);
      const isInactive = (now - refTime) >= FIFTEEN_DAYS_MS;
      const expectedStatus = isInactive ? 'INACTIVE' : 'ACTIVE';

      if (a.status !== expectedStatus) {
        a.status = expectedStatus;
        changed = true;
      }
      if (!a.lastLoginAt) {
        a.lastLoginAt = a.createdAt || new Date().toISOString();
        changed = true;
      }
      const u = this.data.users.find(user => user.id === a.id || user._id === a.id);
      if (u) {
        if (!u.lastLoginAt) u.lastLoginAt = a.lastLoginAt;
        if (u.status !== expectedStatus && u.status !== 'BLOCKED' && u.status !== 'Suspended' && u.status !== 'Blocked') {
          u.status = expectedStatus;
          changed = true;
        }
      }
    }

    // Check Students
    for (const s of this.data.students) {
      if (s.status === 'BLOCKED' || s.status === 'Suspended' || s.status === 'Blocked') {
        continue;
      }
      const refTime = s.lastLoginAt ? new Date(s.lastLoginAt).getTime() : (s.createdAt ? new Date(s.createdAt).getTime() : now);
      const isInactive = (now - refTime) >= FIFTEEN_DAYS_MS;
      const expectedStatus = isInactive ? 'INACTIVE' : 'ACTIVE';

      if (s.status !== expectedStatus) {
        s.status = expectedStatus;
        changed = true;
      }
      if (!s.lastLoginAt) {
        s.lastLoginAt = s.createdAt || new Date().toISOString();
        changed = true;
      }
      const u = this.data.users.find(user => user.id === s.id || user._id === s.id);
      if (u) {
        if (!u.lastLoginAt) u.lastLoginAt = s.lastLoginAt;
        if (u.status !== expectedStatus && u.status !== 'BLOCKED' && u.status !== 'Suspended' && u.status !== 'Blocked') {
          u.status = expectedStatus;
          changed = true;
        }
      }
    }

    if (changed) {
      this.save();
    }
  }

  async authenticate(email, credential) {
    const user = this.findUserByEmail(email);
    if (!user) {
      return null;
    }

    // Check if account has been administratively suspended/blocked
    if (user.status === 'BLOCKED' || user.status === 'Blocked' || user.status === 'Suspended') {
      const err = new Error('Your account has been suspended by an administrator.');
      err.status = 403;
      throw err;
    }

    const match = await bcrypt.compare(String(credential), user.passwordHash);
    if (!match) {
      return null;
    }

    // Successful login: update lastLoginAt and reactivate if INACTIVE
    const nowIso = new Date().toISOString();
    user.lastLoginAt = nowIso;
    if (user.status === 'INACTIVE' || !user.status) {
      user.status = 'ACTIVE';
    }

    // Sync status and lastLoginAt to linked alumni/student record
    const alumniRecord = this.data.alumni.find(a => a.id === user.id || a._id === user.id || (a.email && a.email.toLowerCase() === user.email.toLowerCase()));
    if (alumniRecord) {
      alumniRecord.lastLoginAt = nowIso;
      if (alumniRecord.status === 'INACTIVE' || alumniRecord.status === 'Verified' || !alumniRecord.status) {
        alumniRecord.status = 'ACTIVE';
      }
    }

    const studentRecord = this.data.students.find(s => s.id === user.id || s._id === user.id || (s.email && s.email.toLowerCase() === user.email.toLowerCase()));
    if (studentRecord) {
      studentRecord.lastLoginAt = nowIso;
      if (studentRecord.status === 'INACTIVE' || studentRecord.status === 'Active' || !studentRecord.status) {
        studentRecord.status = 'ACTIVE';
      }
    }

    this.save();

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  // ─── Alumni Helpers ───────────────────────────────────────────────────────
  async createAlumnus(data) {
    const { name, email, phone, pin, ...rest } = data;

    if (!email || !pin) {
      const err = new Error('Email and PIN are required for alumni creation.');
      err.status = 400;
      throw err;
    }

    if (this.findUserByEmail(email)) {
      const err = new Error('An account with this email already exists.');
      err.status = 409;
      throw err;
    }

    const id = `ALM-${Date.now()}`;
    const passwordHash = await bcrypt.hash(String(pin), 10);
    const nowIso = new Date().toISOString();

    const userAccount = {
      id,
      _id: id,
      name,
      email,
      phone: phone || '',
      passwordHash,
      role: 'alumni',
      department: rest.department || rest.branch || 'Computer Science',
      company: rest.company || '',
      designation: rest.role || rest.designation || 'Alumni Member',
      batch: rest.batch || '2024',
      status: 'ACTIVE',
      lastLoginAt: nowIso,
      avatar: rest.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff&size=150`,
      createdAt: nowIso
    };

    const alumnusRecord = {
      id,
      _id: id,
      name,
      email,
      phone: phone || '',
      rollNumber: rest.rollNumber || '',
      branch: rest.branch || 'AID',
      department: rest.department || rest.branch || 'Artificial Intelligence & Data Science',
      college: rest.college || 'KIET',
      company: rest.company || '',
      role: rest.role || rest.designation || 'Software Engineer',
      designation: rest.role || rest.designation || 'Software Engineer',
      ctc: rest.ctc || '4.0 LPA',
      batch: rest.batch || '2024',
      location: rest.location || 'India',
      status: 'ACTIVE',
      lastLoginAt: nowIso,
      skills: rest.skills || ['Mentorship', 'Career Guidance'],
      availableForMentorship: true,
      availableForReferrals: true,
      avatar: userAccount.avatar,
      createdAt: nowIso
    };

    this.data.users.push(userAccount);
    this.data.alumni.unshift(alumnusRecord);
    this.save();

    return alumnusRecord;
  }

  async updateAlumnus(id, updateData) {
    const idx = this.data.alumni.findIndex(a => a.id === id || a._id === id);
    if (idx === -1) {
      const err = new Error('Alumnus not found');
      err.status = 404;
      throw err;
    }

    const currentAlum = this.data.alumni[idx];

    // Check email change uniqueness
    if (updateData.email && updateData.email.toLowerCase() !== currentAlum.email.toLowerCase()) {
      const existing = this.findUserByEmail(updateData.email);
      if (existing && existing.id !== id && existing._id !== id) {
        const err = new Error('An account with this email already exists.');
        err.status = 409;
        throw err;
      }
    }

    // Update profile
    this.data.alumni[idx] = {
      ...currentAlum,
      ...updateData,
      id: currentAlum.id,
      _id: currentAlum._id
    };

    // Update linked user account
    const userIdx = this.data.users.findIndex(u => u.id === id || u._id === id);
    if (userIdx !== -1) {
      this.data.users[userIdx] = {
        ...this.data.users[userIdx],
        name: updateData.name || this.data.users[userIdx].name,
        email: updateData.email || this.data.users[userIdx].email,
        phone: updateData.phone !== undefined ? updateData.phone : this.data.users[userIdx].phone,
        department: updateData.department || updateData.branch || this.data.users[userIdx].department,
        company: updateData.company !== undefined ? updateData.company : this.data.users[userIdx].company,
        designation: updateData.role || updateData.designation || this.data.users[userIdx].designation
      };

      if (updateData.pin) {
        this.data.users[userIdx].passwordHash = await bcrypt.hash(String(updateData.pin), 10);
      }
    }

    this.save();
    return this.data.alumni[idx];
  }

  deleteAlumnus(id) {
    this.data.alumni = this.data.alumni.filter(a => a.id !== id && a._id !== id);
    this.data.users = this.data.users.filter(u => u.id !== id && u._id !== id);
    this.save();
    return true;
  }

  getAlumniList(query = {}) {
    this.checkAndApplyInactivity();
    let list = [...this.data.alumni];
    const { search, branch, college, department } = query;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.rollNumber && a.rollNumber.toLowerCase().includes(q)) ||
        (a.company && a.company.toLowerCase().includes(q)) ||
        (a.phone && a.phone.includes(q))
      );
    }

    if (branch && branch !== 'all') {
      list = list.filter(a => a.branch === branch);
    }

    if (college && college !== 'all') {
      list = list.filter(a => a.college === college);
    }

    if (department && department !== 'all') {
      list = list.filter(a => a.department === department || a.branch === department);
    }

    return list;
  }

  // ─── Student Helpers ──────────────────────────────────────────────────────
  async createStudent(data) {
    const { name, email, pin, ...rest } = data;

    if (!email || !pin) {
      const err = new Error('Email and PIN are required for student creation.');
      err.status = 400;
      throw err;
    }

    if (this.findUserByEmail(email)) {
      const err = new Error('An account with this email already exists.');
      err.status = 409;
      throw err;
    }

    const id = `STU-${Date.now()}`;
    const passwordHash = await bcrypt.hash(String(pin), 10);
    const nowIso = new Date().toISOString();

    const userAccount = {
      id,
      _id: id,
      name,
      email,
      passwordHash,
      role: 'student',
      department: rest.department || 'Computer Science',
      designation: 'Undergraduate Student',
      batch: rest.batch || '2026',
      status: 'ACTIVE',
      lastLoginAt: nowIso,
      avatar: rest.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=150`,
      createdAt: nowIso
    };

    const studentRecord = {
      id,
      _id: id,
      name,
      email,
      batch: rest.batch || '2026',
      department: rest.department || 'Computer Science',
      gpa: rest.gpa || '3.80',
      mentorshipRequests: 0,
      status: 'ACTIVE',
      lastLoginAt: nowIso,
      userId: { _id: id, id, name, email },
      createdAt: nowIso
    };

    this.data.users.push(userAccount);
    this.data.students.unshift(studentRecord);
    this.save();

    return studentRecord;
  }

  async updateStudent(id, updateData) {
    const idx = this.data.students.findIndex(s => s.id === id || s._id === id);
    if (idx === -1) {
      const err = new Error('Student not found');
      err.status = 404;
      throw err;
    }

    const currentStudent = this.data.students[idx];

    if (updateData.email && updateData.email.toLowerCase() !== currentStudent.email.toLowerCase()) {
      const existing = this.findUserByEmail(updateData.email);
      if (existing && existing.id !== id && existing._id !== id) {
        const err = new Error('An account with this email already exists.');
        err.status = 409;
        throw err;
      }
    }

    this.data.students[idx] = {
      ...currentStudent,
      ...updateData,
      id: currentStudent.id,
      _id: currentStudent._id,
      userId: { _id: currentStudent.id, id: currentStudent.id, name: updateData.name || currentStudent.name, email: updateData.email || currentStudent.email }
    };

    const userIdx = this.data.users.findIndex(u => u.id === id || u._id === id);
    if (userIdx !== -1) {
      this.data.users[userIdx] = {
        ...this.data.users[userIdx],
        name: updateData.name || this.data.users[userIdx].name,
        email: updateData.email || this.data.users[userIdx].email,
        department: updateData.department || this.data.users[userIdx].department,
        batch: updateData.batch || this.data.users[userIdx].batch
      };

      if (updateData.pin) {
        this.data.users[userIdx].passwordHash = await bcrypt.hash(String(updateData.pin), 10);
      }
    }

    this.save();
    return this.data.students[idx];
  }

  deleteStudent(id) {
    this.data.students = this.data.students.filter(s => s.id !== id && s._id !== id);
    this.data.users = this.data.users.filter(u => u.id !== id && u._id !== id);
    this.save();
    return true;
  }

  getStudentsList(query = {}) {
    this.checkAndApplyInactivity();
    let list = [...this.data.students];
    const { search, department } = query;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    }

    if (department && department !== 'all') {
      list = list.filter(s => s.department === department);
    }

    return list;
  }

  // ─── Events Helpers ───────────────────────────────────────────────────────
  createEvent(data, creatorUser) {
    if (!data.name && !data.title) {
      const err = new Error('Event name is required');
      err.status = 400;
      throw err;
    }

    const eventDate = new Date(data.date);
    if (isNaN(eventDate.getTime())) {
      const err = new Error('Invalid event date/time');
      err.status = 400;
      throw err;
    }

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    if (eventDate < todayMidnight) {
      const err = new Error('Event date cannot be in the past. Please select today or a future date.');
      err.status = 400;
      throw err;
    }

    const id = `evt-${Date.now()}`;
    const name = data.name || data.title;
    const newEvent = {
      _id: id,
      id,
      name,
      title: name,
      type: data.type || 'Technical Workshop',
      date: eventDate.toISOString(),
      location: data.location || 'Online',
      description: data.description || '',
      maxCapacity: Number(data.maxCapacity) || 100,
      createdBy: {
        _id: creatorUser.id || creatorUser._id,
        id: creatorUser.id || creatorUser._id,
        name: creatorUser.name,
        email: creatorUser.email,
        role: creatorUser.role
      },
      createdAt: new Date().toISOString()
    };

    this.data.events.unshift(newEvent);
    this.save();
    return newEvent;
  }

  getEvents(userArg = null, query = {}) {
    const now = new Date();
    const userId = userArg ? (typeof userArg === 'object' ? (userArg.id || userArg._id) : userArg) : null;
    const userEmail = userArg && typeof userArg === 'object' ? userArg.email : null;

    return this.data.events.map(ev => {
      const evDate = new Date(ev.date);
      const isCompleted = evDate < now;
      const participants = this.data.participations.filter(p => (p.eventId === ev._id || p.eventId === ev.id) && p.status === 'registered');
      const isRegistered = userId
        ? participants.some(p => p.userId === userId || p.user?._id === userId || p.user?.id === userId)
        : false;

      const isCreator = Boolean(
        userId && ev.createdBy && (
          ev.createdBy._id === userId ||
          ev.createdBy.id === userId ||
          (userEmail && ev.createdBy.email === userEmail)
        )
      );

      return {
        ...ev,
        participantCount: participants.length,
        attendeesCount: participants.length,
        status: isCompleted ? 'COMPLETED' : 'UPCOMING',
        isCompleted,
        isRegistered,
        isCreator
      };
    });
  }

  getEventById(id, userArg = null) {
    const ev = this.data.events.find(e => e._id === id || e.id === id);
    if (!ev) return null;

    const now = new Date();
    const evDate = new Date(ev.date);
    const isCompleted = evDate < now;
    const userId = userArg ? (typeof userArg === 'object' ? (userArg.id || userArg._id) : userArg) : null;
    const userEmail = userArg && typeof userArg === 'object' ? userArg.email : null;

    const eventParts = this.data.participations.filter(p => (p.eventId === id || p.eventId === ev._id) && p.status === 'registered');
    const isRegistered = userId
      ? eventParts.some(p => p.userId === userId || p.user?._id === userId || p.user?.id === userId)
      : false;

    const isCreator = Boolean(
      userId && ev.createdBy && (
        ev.createdBy._id === userId ||
        ev.createdBy.id === userId ||
        (userEmail && ev.createdBy.email === userEmail)
      )
    );

    return {
      ...ev,
      participantCount: eventParts.length,
      attendeesCount: eventParts.length,
      status: isCompleted ? 'COMPLETED' : 'UPCOMING',
      isCompleted,
      isRegistered,
      isCreator,
      participants: eventParts
    };
  }

  participateEvent(eventId, user) {
    const ev = this.getEventById(eventId, user);
    if (!ev) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    if (ev.isCompleted) {
      const err = new Error('This event has already been completed.');
      err.status = 400;
      throw err;
    }

    // RULE: Event Creator / Organizer does NOT register for their own event!
    const creatorId = ev.createdBy?._id || ev.createdBy?.id;
    if (creatorId && (creatorId === user.id || creatorId === user._id || (user.email && ev.createdBy?.email === user.email))) {
      const err = new Error('You are the organizer of this event and do not need to register.');
      err.status = 400;
      throw err;
    }

    const existing = this.data.participations.find(
      p => (p.eventId === eventId || p.eventId === ev._id) && p.userId === user.id && p.status === 'registered'
    );

    if (existing) {
      const err = new Error('You are already registered for this event.');
      err.status = 409;
      throw err;
    }

    const record = {
      _id: `part-${Date.now()}`,
      eventId: ev._id,
      userId: user.id,
      user: { _id: user.id, id: user.id, name: user.name, email: user.email, role: user.role },
      status: 'registered',
      createdAt: new Date().toISOString()
    };

    this.data.participations.push(record);
    this.save();

    // Create notification
    this.createNotification(
      user.id,
      'event',
      `You successfully registered for "${ev.name}".`,
      ev._id
    );

    return record;
  }

  cancelEventParticipation(eventId, userId) {
    const initialLen = this.data.participations.length;
    this.data.participations = this.data.participations.filter(
      p => !( (p.eventId === eventId) && p.userId === userId )
    );
    if (this.data.participations.length === initialLen) {
      const err = new Error('Registration not found');
      err.status = 404;
      throw err;
    }
    this.save();
    return { success: true, message: 'Registration cancelled' };
  }

  updateEvent(id, updateData, user) {
    const idx = this.data.events.findIndex(e => e._id === id || e.id === id);
    if (idx === -1) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    const ev = this.data.events[idx];
    if (user.role !== 'admin' && ev.createdBy?._id !== user.id && ev.createdBy?.id !== user.id) {
      const err = new Error('You do not have permission to update this event');
      err.status = 403;
      throw err;
    }

    this.data.events[idx] = {
      ...ev,
      ...updateData,
      _id: ev._id,
      id: ev.id
    };
    this.save();
    return this.data.events[idx];
  }

  deleteEvent(id, user) {
    const ev = this.data.events.find(e => e._id === id || e.id === id);
    if (!ev) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    if (user.role !== 'admin' && ev.createdBy?._id !== user.id && ev.createdBy?.id !== user.id) {
      const err = new Error('You do not have permission to delete this event');
      err.status = 403;
      throw err;
    }

    this.data.events = this.data.events.filter(e => e._id !== id && e.id !== id);
    this.data.participations = this.data.participations.filter(p => p.eventId !== id && p.eventId !== ev._id);
    this.save();
    return { success: true, message: 'Event deleted successfully' };
  }

  // ─── 1-to-1 Mentorship Helpers ────────────────────────────────────────────
  createMentorship(data, studentUser) {
    const alumni = this.findUserById(data.alumniId) || this.data.alumni.find(a => a.id === data.alumniId || a._id === data.alumniId);
    if (!alumni) {
      const err = new Error('Alumni not found');
      err.status = 404;
      throw err;
    }

    const studentId = String(studentUser.id || studentUser._id);
    const alumniId = String(alumni.id || alumni._id);

    // CRITICAL: ONE ALUMNI + ONE STUDENT = STRICTLY ONE MENTORSHIP RELATIONSHIP
    const existing = this.data.mentorships.find(m => {
      const sId = String(m.studentId?._id || m.studentId?.id || m.studentId || '');
      const aId = String(m.alumniId?._id || m.alumniId?.id || m.alumniId || '');
      return sId === studentId && aId === alumniId;
    });

    if (existing) {
      if (['requested', 'active'].includes(existing.status)) {
        const err = new Error('You already have an active or requested mentorship relationship with this mentor.');
        err.status = 409;
        throw err;
      }
      // If previous relationship was completed or declined, reactivate existing record rather than creating a duplicate
      existing.status = 'requested';
      existing.domain = data.domain || existing.domain || 'Career Guidance';
      existing.goal = data.goal || existing.goal || 'General Mentorship & Industry Insights';
      existing.createdAt = new Date().toISOString();
      this.save();
      this.createNotification(
        alumniId,
        'mentorship',
        `New mentorship request from ${studentUser.name} for ${existing.domain}.`,
        existing._id
      );
      return existing;
    }

    const id = `ment-${Date.now()}`;
    const newMentorship = {
      _id: id,
      id,
      alumniId: {
        _id: alumniId,
        id: alumniId,
        name: alumni.name,
        email: alumni.email,
        role: 'alumni'
      },
      studentId: {
        _id: studentId,
        id: studentId,
        name: studentUser.name,
        email: studentUser.email,
        role: 'student'
      },
      domain: data.domain || 'Career Guidance',
      goal: data.goal || 'General Mentorship & Industry Insights',
      status: 'requested',
      sessions: [],
      feedback: '',
      createdAt: new Date().toISOString()
    };

    this.data.mentorships.unshift(newMentorship);
    this.save();

    // Create notification for alumni
    this.createNotification(
      alumniId,
      'mentorship',
      `New mentorship request from ${studentUser.name} for ${newMentorship.domain}.`,
      id
    );

    return newMentorship;
  }

  getMentorships(user) {
    const now = new Date();

    // Deduplicate any duplicate student-alumni pairs: ONE RELATIONSHIP = ONE CARD
    const pairMap = new Map();
    for (const m of this.data.mentorships) {
      const sId = String(m.studentId?._id || m.studentId?.id || m.studentId || '');
      const aId = String(m.alumniId?._id || m.alumniId?.id || m.alumniId || '');
      const pairKey = `${sId}_${aId}`;

      if (!pairMap.has(pairKey)) {
        pairMap.set(pairKey, { ...m, sessions: Array.isArray(m.sessions) ? [...m.sessions] : [] });
      } else {
        const existing = pairMap.get(pairKey);
        if (Array.isArray(m.sessions)) {
          for (const s of m.sessions) {
            const sid = s.id || s._id;
            if (!existing.sessions.some(es => (es.id || es._id) === sid)) {
              existing.sessions.push(s);
            }
          }
        }
        if (m.status === 'active' && existing.status !== 'active') {
          existing.status = 'active';
        }
      }
    }

    let list = Array.from(pairMap.values());
    if (user && user.role !== 'admin') {
      const currentUserId = String(user.id || user._id);
      list = list.filter(m => {
        const sId = String(m.studentId?._id || m.studentId?.id || m.studentId || '');
        const aId = String(m.alumniId?._id || m.alumniId?.id || m.alumniId || '');
        return sId === currentUserId || aId === currentUserId;
      });
    }

    // Format sessions with dynamic upcoming vs completed calculation & chronological sort
    return list.map(m => {
      const sessions = Array.isArray(m.sessions) ? m.sessions.map(s => {
        let isCompleted = false;
        if (s.date) {
          const sessDate = new Date(s.date);
          isCompleted = sessDate < now;
        }
        return {
          ...s,
          status: isCompleted ? 'completed' : 'upcoming',
          isCompleted
        };
      }) : [];

      return {
        ...m,
        sessions
      };
    });
  }

  getMentorshipById(id, user) {
    const mentorships = this.getMentorships(user);
    return mentorships.find(m => m._id === id || m.id === id) || null;
  }

  updateMentorship(id, updateData, user) {
    const idx = this.data.mentorships.findIndex(m => m._id === id || m.id === id);
    if (idx === -1) {
      const err = new Error('Mentorship not found');
      err.status = 404;
      throw err;
    }

    const item = this.data.mentorships[idx];
    const prevStatus = item.status;

    if (updateData.status) {
      item.status = updateData.status;

      // Notifications on status change
      const studentId = item.studentId?._id || item.studentId;
      const alumniId = item.alumniId?._id || item.alumniId;
      const alumniName = item.alumniId?.name || 'Alumni Mentor';

      if (updateData.status === 'active' && prevStatus !== 'active') {
        this.createNotification(
          studentId,
          'mentorship',
          `Your mentorship request with ${alumniName} has been accepted!`,
          item._id
        );
      } else if (updateData.status === 'rejected' && prevStatus !== 'rejected') {
        this.createNotification(
          studentId,
          'mentorship',
          `Your mentorship request with ${alumniName} was declined.`,
          item._id
        );
      } else if (updateData.status === 'completed' && prevStatus !== 'completed') {
        this.createNotification(
          studentId,
          'mentorship',
          `Your mentorship with ${alumniName} is marked completed. Please leave feedback!`,
          item._id
        );
      }
    }

    if (updateData.feedback !== undefined) item.feedback = updateData.feedback;
    if (updateData.goal !== undefined) item.goal = updateData.goal;

    this.save();
    return item;
  }

  addMentorshipSession(id, sessionData, user) {
    const idx = this.data.mentorships.findIndex(m => m._id === id || m.id === id);
    if (idx === -1) {
      const err = new Error('Mentorship not found');
      err.status = 404;
      throw err;
    }

    const item = this.data.mentorships[idx];

    // Admin is READ-ONLY for sessions
    if (user.role === 'admin') {
      const err = new Error('Admin has read-only access and cannot log sessions.');
      err.status = 403;
      throw err;
    }

    const topic = (sessionData.topic || sessionData.sessionTopic || '').trim();
    if (!topic) {
      const err = new Error('Session topic is required');
      err.status = 400;
      throw err;
    }

    const rawDate = sessionData.date || sessionData.meetingDate;
    const rawTime = sessionData.time || sessionData.meetingTime || '10:00 AM';
    let sessionDate;
    if (rawDate) {
      sessionDate = new Date(rawDate);
    } else {
      sessionDate = new Date();
    }

    if (isNaN(sessionDate.getTime())) {
      const err = new Error('Invalid meeting date');
      err.status = 400;
      throw err;
    }

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    if (sessionDate < todayMidnight) {
      const err = new Error('Session date cannot be in the past. Please select today or a future date.');
      err.status = 400;
      throw err;
    }

    const meetingLink = (sessionData.meetingLink || '').trim();
    if (!meetingLink) {
      const err = new Error('Meeting link is required.');
      err.status = 400;
      throw err;
    }

    const newSession = {
      _id: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      topic,
      date: sessionDate.toISOString(),
      time: rawTime,
      meetingLink,
      notes: (sessionData.notes || sessionData.discussionNotes || '').trim(),
      status: 'upcoming'
    };

    if (!Array.isArray(item.sessions)) item.sessions = [];
    item.sessions.push(newSession);
    this.save();

    // PHASE 11 NOTIFICATION: Whenever an Alumni logs a session for a Student, student receives notification
    const studentId = item.studentId?._id || item.studentId;
    const mentorName = item.alumniId?.name || user.name;
    const displayDate = new Date(sessionDate).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });

    this.createNotification(
      studentId,
      'mentorship_session',
      `New Mentorship Session scheduled by ${mentorName} on "${topic}" for ${displayDate} at ${rawTime}. Link: ${meetingLink}`,
      item._id,
      {
        topic,
        mentor: mentorName,
        date: displayDate,
        time: rawTime,
        meetingLink
      }
    );

    return item;
  }

  // ─── Mentor Classes Helpers ───────────────────────────────────────────────
  createMentorClass(data, alumniUser) {
    if (alumniUser.role !== 'alumni' && alumniUser.role !== 'admin') {
      const err = new Error('Only alumni can create mentor classes');
      err.status = 403;
      throw err;
    }

    const topic = (data.topic || data.title || '').trim();
    if (!topic) {
      const err = new Error('Class topic is required');
      err.status = 400;
      throw err;
    }

    const rawDate = data.date || data.meetingDate;
    const time = data.time || data.meetingTime || '10:00 AM';
    if (!rawDate) {
      const err = new Error('Meeting date is required');
      err.status = 400;
      throw err;
    }

    const meetingLink = (data.meetingLink || '').trim();
    if (!meetingLink) {
      const err = new Error('Meeting link is required');
      err.status = 400;
      throw err;
    }

    // Find all active/accepted students for this alumni
    const alumniId = alumniUser.id || alumniUser._id;
    const activeMentorships = this.data.mentorships.filter(m =>
      (m.alumniId?._id === alumniId || m.alumniId === alumniId) &&
      m.status === 'active'
    );

    const eligibleStudents = activeMentorships.map(m => ({
      _id: m.studentId?._id || m.studentId?.id || m.studentId,
      name: m.studentId?.name || 'Student',
      email: m.studentId?.email || ''
    }));

    let targetStudents = [];
    if (data.target === 'all' || data.targetType === 'all' || !data.studentIds || data.studentIds.length === 0) {
      // Option 1: ALL accepted/active students
      targetStudents = eligibleStudents;
    } else {
      // Option 2: Selected accepted/active students
      const selectedIdSet = new Set(data.studentIds.map(String));
      targetStudents = eligibleStudents.filter(st => selectedIdSet.has(String(st._id)));
    }

    if (targetStudents.length === 0) {
      const err = new Error('No eligible active mentees found or selected for this mentor class.');
      err.status = 400;
      throw err;
    }

    const classId = `mc-${Date.now()}`;
    const classDate = new Date(rawDate);
    if (isNaN(classDate.getTime())) {
      const err = new Error('Invalid meeting date');
      err.status = 400;
      throw err;
    }

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    if (classDate < todayMidnight) {
      const err = new Error('Mentor Class date cannot be in the past. Please select today or a future date.');
      err.status = 400;
      throw err;
    }

    const newClass = {
      _id: classId,
      id: classId,
      alumniId: {
        _id: alumniId,
        id: alumniId,
        name: alumniUser.name,
        email: alumniUser.email
      },
      topic,
      date: classDate.toISOString(),
      time,
      meetingLink,
      students: targetStudents,
      createdAt: new Date().toISOString()
    };

    this.data.mentorClasses.unshift(newClass);
    this.save();

    // PHASE 12: Every selected student receives a notification
    const displayDate = isNaN(classDate.getTime()) ? rawDate : classDate.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
    for (const st of targetStudents) {
      this.createNotification(
        st._id,
        'mentor_class',
        `New Mentor Class Scheduled: "${topic}" by ${alumniUser.name} on ${displayDate} at ${time}. Link: ${meetingLink}`,
        classId,
        {
          topic,
          mentor: alumniUser.name,
          date: displayDate,
          time,
          meetingLink
        }
      );
    }

    return newClass;
  }

  getMentorClasses(user) {
    const now = new Date();
    let list = this.data.mentorClasses;

    if (user.role === 'student') {
      // Student sees ONLY classes where they are included
      list = list.filter(mc =>
        Array.isArray(mc.students) && mc.students.some(st => st._id === user.id || st.id === user.id || st._id === user._id)
      );
    } else if (user.role === 'alumni') {
      list = list.filter(mc =>
        mc.alumniId?._id === user.id || mc.alumniId?.id === user.id || mc.alumniId === user.id
      );
    }
    // Admin sees all mentor classes

    return list.map(mc => {
      const isCompleted = new Date(mc.date) < now;
      return {
        ...mc,
        status: isCompleted ? 'COMPLETED' : 'UPCOMING',
        isCompleted,
        studentCount: (mc.students || []).length
      };
    });
  }

  // ─── Referral Helpers ─────────────────────────────────────────────────────
  createReferral(data, alumniUser) {
    const student = this.findUserById(data.studentId) || this.data.students.find(s => s.id === data.studentId || s._id === data.studentId);
    if (!student) {
      const err = new Error('Student not found');
      err.status = 404;
      throw err;
    }

    const company = (data.company || '').trim();
    if (!company) {
      const err = new Error('Hiring company is required');
      err.status = 400;
      throw err;
    }

    const role = (data.role || data.jobTitle || '').trim();
    if (!role) {
      const err = new Error('Job title / position is required');
      err.status = 400;
      throw err;
    }

    const applicationLink = (data.applicationLink || '').trim();
    if (!applicationLink) {
      const err = new Error('Link to apply for job is required');
      err.status = 400;
      throw err;
    }

    const id = `ref-${Date.now()}`;
    const alumniId = alumniUser.id || alumniUser._id;
    const studentId = student.id || student._id;

    // Initial status must automatically be Pending
    const newReferral = {
      _id: id,
      id,
      alumniId: {
        _id: alumniId,
        id: alumniId,
        name: alumniUser.name,
        email: alumniUser.email
      },
      studentId: {
        _id: studentId,
        id: studentId,
        name: student.name,
        email: student.email
      },
      company,
      role,
      applicationLink,
      status: 'pending',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.data.referrals.unshift(newReferral);
    this.save();

    // Notify student about referral
    this.createNotification(
      studentId,
      'referral',
      `${alumniUser.name} submitted a job referral for you at ${company} for ${role}!`,
      id,
      {
        company,
        role,
        referrer: alumniUser.name,
        applicationLink
      }
    );

    return newReferral;
  }

  getReferrals(user) {
    let list = this.data.referrals;
    if (user.role === 'alumni') {
      list = list.filter(r => r.alumniId?._id === user.id || r.alumniId?.id === user.id || r.alumniId === user.id);
    } else if (user.role === 'student') {
      list = list.filter(r => r.studentId?._id === user.id || r.studentId?.id === user.id || r.studentId === user.id);
    }
    return list;
  }

  updateReferralStatus(id, newStatus, user) {
    const idx = this.data.referrals.findIndex(r => r._id === id || r.id === id);
    if (idx === -1) {
      const err = new Error('Referral not found');
      err.status = 404;
      throw err;
    }

    const item = this.data.referrals[idx];

    // PHASE 14 RULE: Student is the user who updates the referral status. Read-only for Alumni.
    if (user.role === 'alumni') {
      const err = new Error('Referral status is read-only for alumni; only the referred student updates pipeline status.');
      err.status = 403;
      throw err;
    }

    const validStatuses = ['pending', 'shortlisted', 'selected', 'rejected'];
    if (!validStatuses.includes(newStatus.toLowerCase())) {
      const err = new Error('Invalid status. Must be pending, shortlisted, selected, or rejected');
      err.status = 400;
      throw err;
    }

    const formattedStatus = newStatus.toLowerCase();
    const oldStatus = item.status;
    item.status = formattedStatus;
    this.save();

    // Notify Alumni when student updates status
    const alumniId = item.alumniId?._id || item.alumniId?.id || item.alumniId;
    const studentName = item.studentId?.name || user.name;
    if (alumniId && oldStatus !== formattedStatus) {
      this.createNotification(
        alumniId,
        'referral_status',
        `${studentName} updated referral status for ${item.company} (${item.role}) to ${formattedStatus.toUpperCase()}!`,
        item._id,
        {
          company: item.company,
          role: item.role,
          studentName,
          status: formattedStatus
        }
      );
    }

    return item;
  }

  // ─── Notification Helpers ─────────────────────────────────────────────────
  createNotification(recipientId, type, message, referenceId = null, extra = {}) {
    const notif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      recipientId: String(recipientId),
      type,
      message,
      referenceId,
      extra,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  getNotifications(userId) {
    return this.data.notifications.filter(n => n.recipientId === String(userId));
  }

  markNotificationRead(id, userId) {
    const notif = this.data.notifications.find(n => n.id === id && n.recipientId === String(userId));
    if (notif) {
      notif.read = true;
      this.save();
    }
    return notif;
  }

  markAllNotificationsRead(userId) {
    this.data.notifications.forEach(n => {
      if (n.recipientId === String(userId)) n.read = true;
    });
    this.save();
    return { success: true };
  }

  // ─── Analytics Helpers ────────────────────────────────────────────────────
  getAnalyticsOverview() {
    this.checkAndApplyInactivity();

    const totalAlumni = this.data.alumni.length;
    const activeAlumni = this.data.alumni.filter(a => (a.status || '').toUpperCase() === 'ACTIVE').length;
    const inactiveAlumni = totalAlumni - activeAlumni;

    const totalStudents = this.data.students.length;
    const activeStudents = this.data.students.filter(s => (s.status || '').toUpperCase() === 'ACTIVE').length;
    const inactiveStudents = totalStudents - activeStudents;

    const mentors = this.data.alumni.filter(a => a.availableForMentorship).length;
    const connections = this.data.mentorships.length * 2 + this.data.participations.length;
    const conversations = this.data.participations.length + this.data.mentorships.length;

    // Branch counts
    const branchCounts = {};
    this.data.alumni.forEach(a => {
      const b = a.branch || a.department || 'Other';
      branchCounts[b] = (branchCounts[b] || 0) + 1;
    });

    const departmentData = Object.keys(branchCounts).map(k => ({
      department: k,
      count: branchCounts[k],
      percentage: totalAlumni > 0 ? Number(((branchCounts[k] / totalAlumni) * 100).toFixed(1)) : 0
    }));

    return {
      totalAlumni,
      totalAlumniGrowth: 0,
      activeAlumni,
      activeAlumniGrowth: 0,
      inactiveAlumni,
      totalStudents,
      totalStudentsGrowth: 0,
      activeStudents,
      activeStudentsGrowth: 0,
      inactiveStudents,
      mentors,
      mentorsGrowth: 0,
      connections,
      connectionsGrowth: 0,
      conversations,
      departmentData,
      topEngagedAlumni: this.data.alumni.slice(0, 5)
    };
  }

  getDepartmentAnalytics() {
    const totalAlumni = this.data.alumni.length;
    const branchCounts = {};
    this.data.alumni.forEach(a => {
      const b = a.branch || a.department || 'Other';
      branchCounts[b] = (branchCounts[b] || 0) + 1;
    });
    return Object.keys(branchCounts).map(k => ({
      department: k,
      count: branchCounts[k],
      percentage: totalAlumni > 0 ? Number(((branchCounts[k] / totalAlumni) * 100).toFixed(1)) : 0
    }));
  }

  getIndustryAnalytics() {
    const totalAlumni = this.data.alumni.length;
    const companyCounts = {};
    this.data.alumni.forEach(a => {
      const ind = a.company || 'Technology';
      companyCounts[ind] = (companyCounts[ind] || 0) + 1;
    });
    const keys = Object.keys(companyCounts);
    if (keys.length === 0) {
      return [
        { industry: 'Technology', count: 0, percentage: 0 },
        { industry: 'Research', count: 0, percentage: 0 },
        { industry: 'Healthcare', count: 0, percentage: 0 },
        { industry: 'Education', count: 0, percentage: 0 }
      ];
    }
    return keys.map(k => ({
      industry: k,
      count: companyCounts[k],
      percentage: totalAlumni > 0 ? Number(((companyCounts[k] / totalAlumni) * 100).toFixed(1)) : 0
    }));
  }

  getEngagementTrend(query = {}) {
    return [
      { month: 'Jan', activeUsers: this.data.alumni.length, events: this.data.events.length },
      { month: 'Feb', activeUsers: this.data.alumni.length, events: this.data.events.length },
      { month: 'Mar', activeUsers: this.data.alumni.length, events: this.data.events.length },
      { month: 'Apr', activeUsers: this.data.alumni.length, events: this.data.events.length }
    ];
  }

  getMentorshipDomainAnalytics() {
    const domainCounts = {
      'Software Development': 0,
      'System Design': 0,
      'AI & Data Science': 0,
      'Product Management': 0,
      'Career Guidance': 0
    };
    this.data.alumni.forEach(a => {
      if (Array.isArray(a.skills)) {
        a.skills.forEach(s => {
          if (domainCounts[s] !== undefined) domainCounts[s]++;
          else domainCounts[s] = (domainCounts[s] || 0) + 1;
        });
      }
    });
    return Object.keys(domainCounts).map(d => ({
      domain: d,
      count: domainCounts[d]
    }));
  }

  getEventParticipationAnalytics() {
    const totalEvents = this.data.events.length;
    const totalParts = this.data.participations.length;
    return [
      { month: 'Q1 2025', webinars: Math.max(1, totalEvents), workshops: Math.max(1, totalParts), reunions: 0 },
      { month: 'Q2 2025', webinars: Math.max(2, totalEvents), workshops: Math.max(1, totalParts), reunions: 0 },
      { month: 'Q3 2025', webinars: Math.max(3, totalEvents), workshops: Math.max(2, totalParts), reunions: 1 },
      { month: 'Q4 2025', webinars: Math.max(4, totalEvents), workshops: Math.max(3, totalParts), reunions: 1 }
    ];
  }
}

const store = new Store();
module.exports = store;
