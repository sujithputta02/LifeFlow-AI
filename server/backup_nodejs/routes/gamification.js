const express = require('express');
const router = express.Router();
const GuestProfile = require('../models/GuestProfile');

// Get Profile (or create if new)
router.get('/:guestId', async (req, res) => {
    try {
        const { guestId } = req.params;
        let profile = await GuestProfile.findOne({ guestId });

        if (!profile) {
            profile = new GuestProfile({ guestId });
            await profile.save();
            console.log(`✨ New Guest Profile created for: ${guestId}`);
        }

        res.json(profile);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// Update Profile
router.post('/update', async (req, res) => {
    try {
        const { guestId, points, level, badges } = req.body;

        if (!guestId) return res.status(400).json({ error: "guestId is required" });

        const profile = await GuestProfile.findOneAndUpdate(
            { guestId },
            {
                $set: { points, level, badges, lastActive: Date.now() }
            },
            { new: true, upsert: true } // Upsert = create if not exists
        );

        res.json(profile);
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

module.exports = router;
