const mongoose = require('mongoose');

const SubStepSchema = new mongoose.Schema({
    type: String,
    value: String // The text content of the sub-step
});

const StepSchema = new mongoose.Schema({
    stepId: Number,
    title: String,
    description: String,
    subSteps: [String], // Array of strings based on current structure
    documents: [String],
    source: String
});

const WorkflowSchema = new mongoose.Schema({
    goal: { type: String, required: true },
    steps: [StepSchema],
    locationContext: {
        origin: String,
        destination: String,
        query: String
    },
    confidenceScore: Number,
    guestId: { type: String, index: true }, // Added for guest isolation
    language: String, // Added to track language
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Workflow', WorkflowSchema);
