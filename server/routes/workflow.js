const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { generateWorkflow, verifyStepCompletion } = require('../services/azureOpenAI');
const { findUsefullSources } = require('../services/azureSearch');

const Workflow = require('../models/Workflow');

router.post('/generate-workflow', async (req, res) => {
    const { goal, language, guestId } = req.body;

    if (!goal || !guestId) {
        return res.status(400).json({ error: 'Goal and Guest ID are required' });
    }

    try {
        console.log(`Received request for goal: ${goal}`);

        // Fetch relevant sources from Azure AI Search (Hybrid Architecture)
        const sources = await findUsefullSources(goal);
        console.log(`🔍 Found ${sources.length} sources from Azure Search`);

        const workflow = await generateWorkflow(goal, language, sources);

        // Save to Database (Only if connected)
        if (workflow && workflow.steps && workflow.steps.length > 0) {
            console.log(`[DEBUG] Mongoose ReadyState: ${mongoose.connection.readyState}`);

            if (mongoose.connection.readyState === 1) {
                try {
                    const newWorkflow = new Workflow({
                        goal: workflow.goal,
                        steps: workflow.steps,
                        locationContext: workflow.locationContext,
                        confidenceScore: workflow.confidenceScore,
                        language: language || 'English',
                        guestId: guestId
                    });
                    const saved = await newWorkflow.save();
                    console.log(`💾 Workflow saved to MongoDB with ID: ${saved._id}`);
                } catch (saveError) {
                    console.error("❌ Error saving to MongoDB:", saveError);
                }
            } else {
                console.warn(`⚠️ MongoDB not connected (State: ${mongoose.connection.readyState}). Skipping save.`);
            }
        }

        res.json(workflow);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate workflow' });
    }
});

// Get Workflow History
router.get('/history', async (req, res) => {
    try {
        const { guestId } = req.query;
        const query = guestId ? { guestId } : {};
        const history = await Workflow.find(query).sort({ createdAt: -1 }).limit(20); // Get last 20 for this user
        res.json(history);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// Delete Workflow
router.delete('/history/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Workflow.findByIdAndDelete(id);
        res.status(200).json({ message: "Workflow deleted successfully" });
    } catch (error) {
        console.error("Error deleting workflow:", error);
        res.status(500).json({ error: "Failed to delete workflow" });
    }
});

router.post('/verify-step', async (req, res) => {
    const { stepTitle, stepDescription, userProof } = req.body;

    if (!stepTitle || !userProof) {
        return res.status(400).json({ error: 'Missing step details or proof' });
    }

    try {
        const verification = await verifyStepCompletion(stepTitle, stepDescription, userProof);
        res.json(verification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to verify step' });
    }
});

module.exports = router;
