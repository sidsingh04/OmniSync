const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");

router.post("/create", ticketController.createTicket);
router.get("/get", ticketController.getTicketById);
router.put("/update", ticketController.updateTicket);
router.get("/get-by-status", ticketController.getTicketsByStatus);
router.get("/get-by-agentId", ticketController.getTicketsByAgentId);
router.get("/get-all", ticketController.getAllTickets);

module.exports = router;