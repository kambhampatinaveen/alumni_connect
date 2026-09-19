const analyticsService = require("../services/analytics.service");

class AnalyticsController {
  async getOverview(req, res, next) {
    try {
      const { timeframe, department } = req.query;
      const data = await analyticsService.getOverviewData(timeframe, department);
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getByDepartment(req, res, next) {
    try {
      const data = await analyticsService.getDepartmentData();
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getByIndustry(req, res, next) {
    try {
      const data = await analyticsService.getIndustryData();
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getEngagementTrend(req, res, next) {
    try {
      const { timeframe } = req.query;
      const data = await analyticsService.getEngagementTrendData(timeframe);
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getMentorshipDomains(req, res, next) {
    try {
      const data = await analyticsService.getMentorshipDomainData();
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getEventParticipation(req, res, next) {
    try {
      const data = await analyticsService.getEventParticipationData();
      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
