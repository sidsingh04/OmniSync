const Agent = require("../models/Agent");

async function updateAgentStatus(req, res) {
    try {
        const { agentId, status } = req.body;
        const agent = await Agent.findOne({ agentId });
        if (!agent) {
            return res.status(404).json({ success: false, message: "Agent not found" });
        }
        agent.status = status;
        await agent.save();
        return res.json({ success: true, message: "Status updated successfully" });
    } catch (error) {
        console.error("Error updating agent status:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function getAgent(req, res) {
    try {
        const { agentId } = req.query;
        const agent = await Agent.findOne({ agentId });
        if (!agent) {
            return res.status(404).json({ success: false, message: "Agent not found" });
        }
        return res.json({ success: true, agent });
    } catch (error) {
        console.error("Error getting agent:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}


async function getAgentsOfStatus(req, res) {
    try {
        const { status } = req.query;
        const agents = await Agent.find({ status });
        return res.json({ success: true, agents });
    } catch (error) {
        console.error("Error getting agents:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function updateAgent(req, res) {
    try {
        const { _id, __v, agentId, ...updateFields } = req.body;
        const updatedAgent = await Agent.findOneAndUpdate(
            { agentId },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedAgent) {
            return res.status(404).json({ success: false, message: "Agent not found" });
        }

        return res.json({ success: true, message: "Agent updated successfully", agent: updatedAgent });
    } catch (error) {
        console.error("Error updating agent:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function getAllAgents(req, res) {
    try {
        const agents = await Agent.find();
        return res.json({ success: true, agents });
    } catch (error) {
        console.error("Error getting agents:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

module.exports = {
    updateAgentStatus,
    getAgent,
    updateAgent,
    getAllAgents,
    getAgentsOfStatus
};