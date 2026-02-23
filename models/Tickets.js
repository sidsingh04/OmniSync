const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({

    issueId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    code: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    callDuration: {
        type: Number,
        default: 0,
        min: 0
    },

    agentId: {
        type: String,
        required: true,
        index: true
    },

    issueDate: {
        type: Date,
        default: Date.now
    },

    approvalDate: {
        type: Date
    },

    resolvedDate: {
        type: Date
    },

    remarks: {
        type: String,
        required: true,
        trim: true
    },

    status: {
        type: String,
        enum: ["pending", "approval", "resolved"],
        default: "pending"
    }

}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);