const express = require("express");
const router = express.Router();
const managementController = require("../controllers/management.controller");
const { verifyAdmin } = require("../middlewares/auth.middleware");

// Protect management routes with admin authorization
router.use(verifyAdmin);

// Alumni routes
router.get("/alumni", managementController.getAlumni);
router.post("/alumni", managementController.addAlumnus);
router.put("/alumni/:id", managementController.updateAlumnus);
router.delete("/alumni/:id", managementController.deleteAlumnus);

// Students routes
router.get("/students", managementController.getStudents);
router.post("/students", managementController.addStudent);
router.put("/students/:id", managementController.updateStudent);
router.delete("/students/:id", managementController.deleteStudent);

// Events routes
router.get("/events", managementController.getEvents);
router.post("/events", managementController.addEvent);
router.put("/events/:id", managementController.updateEvent);
router.delete("/events/:id", managementController.deleteEvent);

module.exports = router;

