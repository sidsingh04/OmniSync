// Inserting agents data into MongoDB database

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Agent = require("../models/Agent"); // Adjust path if needed

// Load environment variables (Make sure .env contains MONGO_URI)
dotenv.config({ path: __dirname + "/../.env" });

// Initial Mock Data (You can add more or modify these based on your needs)
const seedAgents = [
    {
        agentId: "A101",
        name: "Ravi",
        status: "Offline",
        totalCallDuration: 0,
        failCalls: 0,
        successfullCalls: 0,
        totalPending: 0,
        totalResolved: 0
    },
    {
        agentId: "A102",
        name: "Priya",
        status: "Offline",
        totalCallDuration: 0,
        failCalls: 0,
        successfullCalls: 0,
        totalPending: 0,
        totalResolved: 0
    },
    {
        agentId: "A103",
        name: "Arjun",
        status: "Offline",
        totalCallDuration: 0,
        failCalls: 0,
        successfullCalls: 0,
        totalPending: 0,
        totalResolved: 0
    },
    {
        agentId: "A104",
        name: "Neha",
        status: "Offline",
        totalCallDuration: 0,
        failCalls: 0,
        successfullCalls: 0,
        totalPending: 0,
        totalResolved: 0
    }
];

async function seedDatabase() {
    try {
        // 1. Connect to MongoDB
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected Successfully.");

        // 2. Clear existing agents (Optional, but recommended for clean seeding)
        // console.log("Clearing existing agent collection...");
        // await Agent.deleteMany({});

        // 3. Insert the new seeded agents
        console.log("Inserting seed data...");
        for (const agentData of seedAgents) {
            // We use updateOne with upsert to avoid duplicate key errors if running multiple times
            await Agent.updateOne(
                { agentId: agentData.agentId },
                { $set: agentData },
                { upsert: true }
            );
        }

        console.log("Agents seeded successfully!");

    } catch (error) {
        console.error("Error seeding agents:", error);
    } finally {
        // 4. Disconnect when done
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

seedDatabase();
