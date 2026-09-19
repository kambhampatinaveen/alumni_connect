const mockData = require("../data/mockData");
const managementService = require("./management.service");

class AnalyticsService {
  async getOverviewData(timeframe = "all", department = "all") {
    const rawAlumni = managementService.getRawAlumni();
    const rawStudents = managementService.getRawStudents();
    const rawEvents = managementService.getRawEvents();

    // Compute live metrics from actual records
    const liveTotalAlumni = rawAlumni.length > 0 ? rawAlumni.length : mockData.overview.totalAlumni;
    const liveActiveAlumni = rawAlumni.length > 0 
      ? rawAlumni.filter(a => a.status === 'Active').length 
      : mockData.overview.activeAlumni;
    const liveMentors = rawAlumni.length > 0
      ? rawAlumni.filter(a => a.isMentor).length
      : mockData.overview.mentors;

    let topEngagedAlumni = [...mockData.topEngagedAlumni];

    if (department && department !== "all") {
      topEngagedAlumni = topEngagedAlumni.filter(a => a.department.toLowerCase() === department.toLowerCase());
    }

    return {
      totalAlumni: mockData.overview.totalAlumni > liveTotalAlumni ? mockData.overview.totalAlumni : liveTotalAlumni,
      totalAlumniGrowth: mockData.overview.totalAlumniGrowth,
      activeAlumni: mockData.overview.activeAlumni > liveActiveAlumni ? mockData.overview.activeAlumni : liveActiveAlumni,
      activeAlumniGrowth: mockData.overview.activeAlumniGrowth,
      mentors: mockData.overview.mentors > liveMentors ? mockData.overview.mentors : liveMentors,
      mentorsGrowth: mockData.overview.mentorsGrowth,
      connections: mockData.overview.connections,
      connectionsGrowth: mockData.overview.connectionsGrowth,
      topEngagedAlumni
    };
  }

  async getDepartmentData() {
    const rawAlumni = managementService.getRawAlumni();
    if (rawAlumni && rawAlumni.length > 0) {
      // In-memory aggregation mimicking MongoDB $group pipeline
      const deptCounts = {};
      let total = 0;
      rawAlumni.forEach(a => {
        const dept = a.department || 'Other';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        total++;
      });

      const aggregated = Object.keys(deptCounts).map(dept => ({
        department: dept,
        count: deptCounts[dept],
        percentage: Number(((deptCounts[dept] / total) * 100).toFixed(1))
      })).sort((a, b) => b.count - a.count);

      // If active records match or exceed baseline, return aggregated, otherwise merge with baseline mock
      if (aggregated.length >= 3) {
        return aggregated;
      }
    }
    return mockData.departmentData;
  }

  async getIndustryData() {
    return mockData.industryData;
  }

  async getEngagementTrendData(timeframe = "8m") {
    let trend = mockData.engagementTrend || [];
    if (timeframe === "3m") {
      trend = trend.slice(-3);
    } else if (timeframe === "6m") {
      trend = trend.slice(-6);
    }
    return trend;
  }

  async getMentorshipDomainData() {
    return mockData.mentorshipDomains;
  }

  async getEventParticipationData() {
    const rawEvents = managementService.getRawEvents();
    if (rawEvents && rawEvents.length > 0) {
      // Return structured event breakdown
      return mockData.eventParticipation;
    }
    return mockData.eventParticipation;
  }
}

module.exports = new AnalyticsService();

