const express = require('express');
const router = express.Router();
const { generateWorkflow, verifyStepCompletion } = require('../services/azureOpenAI');
const { findUsefullSources } = require('../services/azureSearch');

const Workflow = require('../models/Workflow'); // Import Model

router.post('/generate-workflow', async (req, res) => {
    const { goal, language } = req.body;

    if (!goal) {
        return res.status(400).json({ error: 'Goal is required' });
    }

    try {
        console.log(`Received request for goal: ${goal}`);

        // In a real scenario, we might use search results to feed context to OpenAI
        // For MVP, we might trust OpenAI or minimal search integration
        // const sources = await findUsefullSources(goal); 

        const workflow = await generateWorkflow(goal, language);

        // Save to Database
        if (workflow && workflow.steps && workflow.steps.length > 0) {
            const newWorkflow = new Workflow({
                goal: workflow.goal,
                steps: workflow.steps,
                locationContext: workflow.locationContext,
                confidenceScore: workflow.confidenceScore,
                language: language || 'English'
            });
            await newWorkflow.save();
            console.log("💾 Workflow saved to MongoDB");
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
        const history = await Workflow.find().sort({ createdAt: -1 }).limit(20); // Get last 20
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
