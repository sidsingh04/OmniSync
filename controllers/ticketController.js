// API's related to Tickets

const Ticket = require("../models/Tickets");

async function createTicket(req, res) {
    try {
        const { issueId, code, description, agentId, status, issueDate } = req.body;
        const ticket = new Ticket({
            issueId,
            code,
            description,
            agentId,
            status: status || 'pending',
            issueDate: issueDate || new Date(),
            remarks: req.body.remarks || "Initial ticket creation"
        });
        await ticket.save();
        return res.json({ success: true, message: "Ticket created successfully" });
    } catch (error) {
        console.error("Error creating ticket:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function getTicketById(req, res) {
    try {
        const { issueId } = req.query;
        const ticket = await Ticket.findOne({ issueId });
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }
        return res.json({ success: true, ticket });
    } catch (error) {
        console.error("Error getting ticket:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function updateTicket(req, res) {
    try {
        const { issueId, _id, __v, ...updateFields } = req.body;
        const ticket = await Ticket.findOneAndUpdate({ issueId }, { $set: updateFields }, { new: true, runValidators: true });
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }
        return res.json({ success: true, message: "Ticket updated successfully" });
    } catch (error) {
        console.error("Error updating ticket:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function getTicketsByStatus(req, res) {
    try {
        const { status } = req.query;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status query parameter is required"
            });
        }

        const tickets = await Ticket.find({ status });

        return res.json({
            success: true,
            tickets
        });

    } catch (error) {
        console.error("Error getting tickets:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

async function getTicketsByAgentId(req, res) {
    try {
        const { agentId } = req.query;

        if (!agentId) {
            return res.status(400).json({
                success: false,
                message: "agentId query parameter is required"
            });
        }

        const tickets = await Ticket.find({ agentId });

        return res.json({
            success: true,
            tickets
        });

    } catch (error) {
        console.error("Error getting tickets:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

async function getAllTickets(req, res) {
    try {
        const tickets = await Ticket.find();
        return res.json({
            success: true,
            tickets
        });
    } catch (error) {
        console.error("Error getting tickets:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

module.exports = {
    createTicket,
    getTicketById,
    updateTicket,
    getTicketsByStatus,
    getTicketsByAgentId,
    getAllTickets
};