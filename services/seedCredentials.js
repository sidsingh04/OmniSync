require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const { agentCredentials, superCredentials } = require("../models/Credentials");

const AgentCredentialsData = [
    { agentId: "A101", password: "helloji" },
    { agentId: "A102", password: "helloji" },
    { agentId: "A103", password: "helloji" },
    { agentId: "A104", password: "helloji" }
];

const SupervisorCredentialsData = [
    { superId: "S102", password: "helloji" } // Schema uses superId instead of supervisorId
];

async function seedData() {
    try {
        // Since you had an IPv4 issue, we'll force IPv4 connection here as well
        await mongoose.connect(process.env.MONGO_URI, { family: 4 });
        console.log("Connected to MongoDB for seeding...");

        // Use findOneAndUpdate with upsert to prevent duplicates or deleting unrelated data
        for (const cred of AgentCredentialsData) {
            await agentCredentials.findOneAndUpdate(
                { agentId: cred.agentId },
                { password: cred.password },
                { upsert: true, new: true }
            );
        }
        console.log(`Successfully seeded ${AgentCredentialsData.length} agent credentials.`);

        for (const cred of SupervisorCredentialsData) {
            await superCredentials.findOneAndUpdate(
                { superId: cred.superId },
                { password: cred.password },
                { upsert: true, new: true }
            );
        }
        console.log(`Successfully seeded ${SupervisorCredentialsData.length} supervisor credentials.`);

        console.log("Seeding completed.");
        process.exit(0);
    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    }
}

seedData();
