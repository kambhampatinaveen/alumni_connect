const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const { verifyAdmin } = require("../middlewares/auth.middleware");

// Apply admin protection to analytics endpoints
router.use(verifyAdmin);

router.get("/overview", analyticsController.getOverview);
router.get("/by-department", analyticsController.getByDepartment);
router.get("/by-industry", analyticsController.getByIndustry);
router.get("/engagement-trend", analyticsController.getEngagementTrend);
router.get("/mentorship-domains", analyticsController.getMentorshipDomains);
router.get("/event-participation", analyticsController.getEventParticipation);

module.exports = router;

