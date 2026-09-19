const mockData = require("../data/mockData");

let alumniStore = [...mockData.alumniList];
let studentStore = [...mockData.studentList];
let eventStore = [...mockData.eventList];

class ManagementService {
  // Alumni
  async getAlumni(search = "", department = "") {
    let result = [...alumniStore];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.company.toLowerCase().includes(q));
    }
    if (department && department !== "all") {
      result = result.filter(a => a.department === department);
    }
    return result;
  }

  async addAlumnus(data) {
    const newAlumnus = {
      id: String(Date.now()),
      status: "Active",
      isMentor: false,
      ...data
    };
    alumniStore.unshift(newAlumnus);
    return newAlumnus;
  }

  async updateAlumnus(id, data) {
    const idx = alumniStore.findIndex(a => a.id === id);
    if (idx === -1) throw new Error("Alumnus not found");
    alumniStore[idx] = { ...alumniStore[idx], ...data };
    return alumniStore[idx];
  }

  async deleteAlumnus(id) {
    alumniStore = alumniStore.filter(a => a.id !== id);
    return true;
  }

  // Students
  async getStudents(search = "", department = "") {
    let result = [...studentStore];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }
    if (department && department !== "all") {
      result = result.filter(s => s.department === department);
    }
    return result;
  }

  async addStudent(data) {
    const newStudent = {
      id: String(Date.now()),
      status: "Active",
      mentorshipRequests: 0,
      ...data
    };
    studentStore.unshift(newStudent);
    return newStudent;
  }

  async updateStudent(id, data) {
    const idx = studentStore.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("Student not found");
    studentStore[idx] = { ...studentStore[idx], ...data };
    return studentStore[idx];
  }

  async deleteStudent(id) {
    studentStore = studentStore.filter(s => s.id !== id);
    return true;
  }

  // Events
  async getEvents(status = "all") {
    let result = [...eventStore];
    if (status && status !== "all") {
      result = result.filter(e => e.status.toLowerCase() === status.toLowerCase());
    }
    return result;
  }

  async addEvent(data) {
    const newEvent = {
      id: String(Date.now()),
      attendeesCount: 0,
      status: "Upcoming",
      ...data
    };
    eventStore.unshift(newEvent);
    return newEvent;
  }

  async updateEvent(id, data) {
    const idx = eventStore.findIndex(e => e.id === id);
    if (idx === -1) throw new Error("Event not found");
    eventStore[idx] = { ...eventStore[idx], ...data };
    return eventStore[idx];
  }

  async deleteEvent(id) {
    eventStore = eventStore.filter(e => e.id !== id);
    return true;
  }

  // Store accessors for analytics service
  getRawAlumni() {
    return alumniStore;
  }

  getRawStudents() {
    return studentStore;
  }

  getRawEvents() {
    return eventStore;
  }
}

module.exports = new ManagementService();

