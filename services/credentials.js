// Login for agent and supervisor using backend API endpoints

const { agentCredentials, superCredentials } = require("../models/Credentials");

async function loginAgent(agentId, password) {
    return await agentCredentials.findOne({ agentId, password });
}

async function loginSupervisor(superId, password) {
    return await superCredentials.findOne({ superId, password });
}

module.exports = {
    loginAgent,
    loginSupervisor
};