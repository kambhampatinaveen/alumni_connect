// Resilient API client — real backend first
import axios from 'axios';

// ─── Real axios instance pointing at Express backend ─────────────────────────
const realAxios = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token if present (checks both authToken and alumniconnect_token)
realAxios.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('alumniconnect_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Clean empty initial fallback ───────────────────────────────────────────
const initialMockState = {
  overview: {
    totalAlumni: 0,
    totalAlumniGrowth: 0,
    activeAlumni: 0,
    activeAlumniGrowth: 0,
    mentors: 0,
    mentorsGrowth: 0,
    connections: 0,
    connectionsGrowth: 0,
    topEngagedAlumni: []
  },
  departmentData: [],
  industryData: [],
  engagementTrend: [],
  mentorshipDomains: [],
  eventParticipation: [],
  events: [],
  studentList: [],
  alumniList: [],
  mentorships: [],
  mentorClasses: [],
  referrals: [],
  notifications: []
};

function getStore() {
  const data = localStorage.getItem('alumniconnect_db');
  if (data) {
    try { return JSON.parse(data); } catch (e) {}
  }
  localStorage.setItem('alumniconnect_db', JSON.stringify(initialMockState));
  return initialMockState;
}

function saveStore(store) {
  localStorage.setItem('alumniconnect_db', JSON.stringify(store));
}

// Authentication and student administration must always use MongoDB.  Falling
// back to browser storage here would report a successful registration/update
// even though no account exists for the student to log in with.
function requiresPersistentBackend(url) {
  const path = String(url).split('?')[0];
  return path.startsWith('/auth') || path.startsWith('/students') || path.startsWith('/alumni') || path.startsWith('/notifications') || path.startsWith('/messages') || path.startsWith('/mentorships');
}

// ─── Smart API: Forward to backend, fallback safely if offline ──────────────
const api = {
  async get(url, config = {}) {
    try {
      const res = await realAxios.get(url, config);
      return res;
    } catch (err) {
      if (err.response) throw err;
      if (requiresPersistentBackend(url)) throw err;
      console.warn(`[api] Network error for GET ${url}`, err.message);
      return mockGet(url, config);
    }
  },

  async post(url, body) {
    try {
      const res = await realAxios.post(url, body);
      return res;
    } catch (err) {
      if (err.response) throw err;
      if (requiresPersistentBackend(url)) throw err;
      console.warn(`[api] Network error for POST ${url}`, err.message);
      return mockPost(url, body);
    }
  },

  async put(url, body) {
    try {
      const res = await realAxios.put(url, body);
      return res;
    } catch (err) {
      if (err.response) throw err;
      if (requiresPersistentBackend(url)) throw err;
      console.warn(`[api] Network error for PUT ${url}`, err.message);
      return mockPut(url, body);
    }
  },

  async delete(url) {
    try {
      const res = await realAxios.delete(url);
      return res;
    } catch (err) {
      if (err.response) throw err;
      if (requiresPersistentBackend(url)) throw err;
      console.warn(`[api] Network error for DELETE ${url}`, err.message);
      return mockDelete(url);
    }
  }
};

// ─── Clean Mock Fallbacks (Offline only) ──────────────────────────────────────
function mockGet(url, config = {}) {
  const store = getStore();
  const cleanUrl = url.split('?')[0];

  if (cleanUrl.includes('/analytics/overview')) return { data: store.overview };
  if (cleanUrl.includes('/analytics/by-department')) return { data: store.departmentData };
  if (cleanUrl.includes('/analytics/by-industry')) return { data: store.industryData };
  if (cleanUrl.includes('/analytics/engagement-trend')) return { data: store.engagementTrend };
  if (cleanUrl.includes('/analytics/mentorship-domains')) return { data: store.mentorshipDomains };
  if (cleanUrl.includes('/analytics/event-participation')) return { data: store.eventParticipation };

  if (cleanUrl === '/alumni' || cleanUrl === '/api/alumni') {
    return { data: { success: true, count: (store.alumniList || []).length, data: store.alumniList || [] } };
  }

  if (cleanUrl === '/students' || cleanUrl === '/api/students') {
    return { data: { success: true, count: (store.studentList || []).length, data: store.studentList || [] } };
  }

  if (cleanUrl === '/events' || cleanUrl === '/api/events') {
    return { data: { success: true, data: store.events || [] } };
  }

  if (cleanUrl === '/mentorships' || cleanUrl === '/api/mentorships') {
    return { data: { success: true, data: store.mentorships || [] } };
  }

  if (cleanUrl === '/mentor-classes' || cleanUrl === '/api/mentor-classes') {
    return { data: { success: true, data: store.mentorClasses || [] } };
  }

  if (cleanUrl === '/referrals' || cleanUrl === '/api/referrals') {
    return { data: { success: true, data: store.referrals || [] } };
  }

  if (cleanUrl === '/notifications' || cleanUrl === '/api/notifications') {
    return { data: { success: true, data: store.notifications || [] } };
  }

  return { data: [] };
}

async function mockPost(url, body) {
  const store = getStore();

  if (url.includes('/events')) {
    const newEvent = { _id: 'evt-' + Date.now(), id: String(Date.now()), attendeesCount: 0, status: 'UPCOMING', ...body };
    store.events.unshift(newEvent);
    saveStore(store);
    return { data: { success: true, data: newEvent } };
  }

  if (url.includes('/mentorships')) {
    const newM = { _id: 'ment-' + Date.now(), id: String(Date.now()), status: 'requested', sessions: [], createdAt: new Date().toISOString(), ...body };
    store.mentorships.unshift(newM);
    saveStore(store);
    return { data: { success: true, data: newM } };
  }

  if (url.includes('/mentor-classes')) {
    const newMC = { _id: 'mc-' + Date.now(), id: String(Date.now()), status: 'UPCOMING', createdAt: new Date().toISOString(), ...body };
    store.mentorClasses.unshift(newMC);
    saveStore(store);
    return { data: { success: true, data: newMC } };
  }

  if (url.includes('/referrals')) {
    const newRef = { _id: 'ref-' + Date.now(), id: String(Date.now()), status: 'pending', createdAt: new Date().toISOString(), ...body };
    store.referrals.unshift(newRef);
    saveStore(store);
    return { data: { success: true, data: newRef } };
  }

  return { data: { success: true } };
}

async function mockPut(url, body) {
  return { data: { success: true } };
}

async function mockDelete(url) {
  return { data: { success: true } };
}

export default api;
