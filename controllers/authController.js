const authService = require("../services/credentials.js");

async function agentLogin(req, res) {
    try {
        const { agentId, userId, password } = req.body;
        const agent = await authService.loginAgent(agentId || userId, password);

        if (!agent) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        res.json({ success: true });

    } catch (error) {
        console.error("Agent login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

async function supervisorLogin(req, res) {
    try {
        const { superId, userId, password } = req.body;
        const supervisor = await authService.loginSupervisor(superId || userId, password);

        if (!supervisor) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        res.json({ success: true });

    } catch (error) {
        console.error("Supervisor login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

module.exports = {
    agentLogin,
    supervisorLogin
};