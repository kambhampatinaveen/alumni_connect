const mockData = {
  overview: {
    totalAlumni: 2480,
    totalAlumniGrowth: 12.5,
    activeAlumni: 1620,
    activeAlumniGrowth: 8.3,
    mentors: 345,
    mentorsGrowth: 15.2,
    connections: 4890,
    connectionsGrowth: 18.7
  },

  departmentData: [
    { department: "Computer Science", count: 850, percentage: 34.3 },
    { department: "Electrical Eng", count: 420, percentage: 16.9 },
    { department: "Mechanical Eng", count: 380, percentage: 15.3 },
    { department: "Business Admin", count: 310, percentage: 12.5 },
    { department: "Civil Eng", count: 260, percentage: 10.5 },
    { department: "Biotechnology", count: 260, percentage: 10.5 }
  ],

  industryData: [
    { industry: "Technology", count: 920, percentage: 37.1 },
    { industry: "Finance & Banking", count: 410, percentage: 16.5 },
    { industry: "Healthcare & Biotech", count: 350, percentage: 14.1 },
    { industry: "Engineering & Mfg", count: 320, percentage: 12.9 },
    { industry: "Higher Education", count: 260, percentage: 10.5 },
    { industry: "Consulting", count: 220, percentage: 8.9 }
  ],

  engagementTrend: [
    { month: "Jan", activeUsers: 1100, mentorshipSessions: 140, eventAttendees: 220 },
    { month: "Feb", activeUsers: 1180, mentorshipSessions: 165, eventAttendees: 250 },
    { month: "Mar", activeUsers: 1250, mentorshipSessions: 190, eventAttendees: 310 },
    { month: "Apr", activeUsers: 1320, mentorshipSessions: 210, eventAttendees: 290 },
    { month: "May", activeUsers: 1410, mentorshipSessions: 245, eventAttendees: 380 },
    { month: "Jun", activeUsers: 1480, mentorshipSessions: 270, eventAttendees: 410 },
    { month: "Jul", activeUsers: 1520, mentorshipSessions: 290, eventAttendees: 430 },
    { month: "Aug", activeUsers: 1620, mentorshipSessions: 320, eventAttendees: 490 }
  ],

  mentorshipDomains: [
    { domain: "Software Development", count: 215 },
    { domain: "Data Science & AI", count: 180 },
    { domain: "Product Management", count: 145 },
    { domain: "System Architecture", count: 110 },
    { domain: "Cybersecurity", count: 95 },
    { domain: "Leadership & Management", count: 85 }
  ],

  eventParticipation: [
    { month: "Q1 2025", webinars: 340, workshops: 210, reunions: 150 },
    { month: "Q2 2025", webinars: 420, workshops: 290, reunions: 220 },
    { month: "Q3 2025", webinars: 480, workshops: 340, reunions: 310 },
    { month: "Q4 2025", webinars: 560, workshops: 410, reunions: 390 },
    { month: "Q1 2026", webinars: 610, workshops: 450, reunions: 420 },
    { month: "Q2 2026", webinars: 720, workshops: 520, reunions: 490 }
  ],

  topEngagedAlumni: [
    { id: "ALM-101", name: "Dr. Aris Vance", batch: "2016", department: "Computer Science", company: "Google", role: "Staff Engineer", engagementScore: 98, mentorshipsCompleted: 24, eventsAttended: 12, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
    { id: "ALM-102", name: "Sarah Jenkins", batch: "2018", department: "Business Admin", company: "McKinsey", role: "Engagement Manager", engagementScore: 94, mentorshipsCompleted: 19, eventsAttended: 15, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
    { id: "ALM-103", name: "Marcus Chen", batch: "2015", department: "Electrical Eng", company: "Apple", role: "Principal Hardware Architect", engagementScore: 91, mentorshipsCompleted: 18, eventsAttended: 9, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
    { id: "ALM-104", name: "Priya Sharma", batch: "2019", department: "Computer Science", company: "Microsoft", role: "Senior Data Scientist", engagementScore: 89, mentorshipsCompleted: 16, eventsAttended: 14, avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150" },
    { id: "ALM-105", name: "David Miller", batch: "2017", department: "Biotechnology", company: "Pfizer", role: "Lead Researcher", engagementScore: 86, mentorshipsCompleted: 14, eventsAttended: 11, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" }
  ],

  alumniList: [
    { id: "1", name: "Dr. Aris Vance", email: "aris.vance@techcorp.io", batch: "2016", department: "Computer Science", company: "Google", designation: "Staff Engineer", location: "San Francisco, CA", isMentor: true, status: "Active" },
    { id: "2", name: "Sarah Jenkins", email: "s.jenkins@mckinsey.com", batch: "2018", department: "Business Admin", company: "McKinsey", designation: "Engagement Manager", location: "New York, NY", isMentor: true, status: "Active" },
    { id: "3", name: "Marcus Chen", email: "mchen@apple.com", batch: "2015", department: "Electrical Eng", company: "Apple", designation: "Principal Hardware Architect", location: "Cupertino, CA", isMentor: true, status: "Active" },
    { id: "4", name: "Priya Sharma", email: "priya.sharma@microsoft.com", batch: "2019", department: "Computer Science", company: "Microsoft", designation: "Senior Data Scientist", location: "Seattle, WA", isMentor: true, status: "Active" },
    { id: "5", name: "David Miller", email: "dmiller@pfizer.com", batch: "2017", department: "Biotechnology", company: "Pfizer", designation: "Lead Researcher", location: "Boston, MA", isMentor: false, status: "Active" },
    { id: "6", name: "Elena Rostova", email: "elena@stripe.com", batch: "2020", department: "Computer Science", company: "Stripe", designation: "Backend Engineer", location: "Austin, TX", isMentor: true, status: "Inactive" }
  ],

  studentList: [
    { id: "1", name: "Alex Rivera", email: "arivera@student.edu", batch: "2025", department: "Computer Science", gpa: "3.85", mentorshipRequests: 3, status: "Active" },
    { id: "2", name: "Taylor Swift", email: "tswift@student.edu", batch: "2026", department: "Business Admin", gpa: "3.92", mentorshipRequests: 5, status: "Active" },
    { id: "3", name: "Jordan Lee", email: "jlee@student.edu", batch: "2025", department: "Electrical Eng", gpa: "3.70", mentorshipRequests: 2, status: "Active" },
    { id: "4", name: "Morgan Freeman", email: "mfreeman@student.edu", batch: "2027", department: "Civil Eng", gpa: "3.60", mentorshipRequests: 1, status: "Active" },
    { id: "5", name: "Casey Neistat", email: "cneistat@student.edu", batch: "2026", department: "Biotechnology", gpa: "3.78", mentorshipRequests: 4, status: "Active" }
  ],

  eventList: [
    { id: "1", title: "Global Alumni Tech Summit 2026", type: "Conference", date: "2026-10-15", location: "Main Auditorium & Online", attendeesCount: 420, maxCapacity: 500, status: "Upcoming" },
    { id: "2", title: "AI & Machine Learning Career Bootcamp", type: "Workshop", date: "2026-09-28", location: "Virtual (Zoom)", attendeesCount: 185, maxCapacity: 200, status: "Upcoming" },
    { id: "3", title: "Annual Leadership & Mentorship Networking Dinner", type: "Networking", date: "2026-11-05", location: "Grand Hotel Ballroom", attendeesCount: 120, maxCapacity: 150, status: "Upcoming" },
    { id: "4", title: "Spring 2026 Entrepreneurship Pitch Showcase", type: "Webinar", date: "2026-04-12", location: "Virtual", attendeesCount: 310, maxCapacity: 400, status: "Past" }
  ]
};

module.exports = mockData;
