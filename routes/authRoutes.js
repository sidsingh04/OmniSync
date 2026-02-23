const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController.js");

router.post("/agent", authController.agentLogin);
router.post("/supervisor", authController.supervisorLogin);

module.exports = router;