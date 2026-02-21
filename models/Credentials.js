const mongoose = require("mongoose");

const agentCredentialsSchema = new mongoose.Schema({
    agentId: { type: String, required: true },
    password: { type: String, required: true }
});

const superCredentialsSchema = new mongoose.Schema({
    superId: { type: String, required: true },
    password: { type: String, required: true }
});

const agentCredentials = mongoose.model("AgentCredentials", agentCredentialsSchema);
const superCredentials = mongoose.model("SuperCredentials", superCredentialsSchema);

module.exports = {
    agentCredentials,
    superCredentials
};
