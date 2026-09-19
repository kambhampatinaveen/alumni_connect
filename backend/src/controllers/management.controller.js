const managementService = require("../services/management.service");

class ManagementController {
  // Alumni
  async getAlumni(req, res, next) {
    try {
      const { search, department } = req.query;
      const data = await managementService.getAlumni(search, department);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async addAlumnus(req, res, next) {
    try {
      const data = await managementService.addAlumnus(req.body);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateAlumnus(req, res, next) {
    try {
      const data = await managementService.updateAlumnus(req.params.id, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteAlumnus(req, res, next) {
    try {
      await managementService.deleteAlumnus(req.params.id);
      return res.status(200).json({ success: true, message: "Alumnus deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  // Students
  async getStudents(req, res, next) {
    try {
      const { search, department } = req.query;
      const data = await managementService.getStudents(search, department);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async addStudent(req, res, next) {
    try {
      const data = await managementService.addStudent(req.body);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateStudent(req, res, next) {
    try {
      const data = await managementService.updateStudent(req.params.id, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteStudent(req, res, next) {
    try {
      await managementService.deleteStudent(req.params.id);
      return res.status(200).json({ success: true, message: "Student deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  // Events
  async getEvents(req, res, next) {
    try {
      const { status } = req.query;
      const data = await managementService.getEvents(status);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async addEvent(req, res, next) {
    try {
      const data = await managementService.addEvent(req.body);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateEvent(req, res, next) {
    try {
      const data = await managementService.updateEvent(req.params.id, req.body);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req, res, next) {
    try {
      await managementService.deleteEvent(req.params.id);
      return res.status(200).json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ManagementController();
