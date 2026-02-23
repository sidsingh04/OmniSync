const express = require("express");
const router = express.Router();
const agentController = require("../controllers/agentController.js");

router.post("/update-status", agentController.updateAgentStatus);
router.get("/get-agent", agentController.getAgent);
router.put("/update", agentController.updateAgent);
router.get("/getAllAgents", agentController.getAllAgents);
router.get("/get-by-status", agentController.getAgentsOfStatus);

module.exports = router;

