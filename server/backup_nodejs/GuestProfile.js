const mongoose = require('mongoose');

const GuestProfileSchema = new mongoose.Schema({
    guestId: { type: String, required: true, unique: true, index: true },
    points: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [
        {
            id: String,
            date: { type: Date, default: Date.now }
        }
    ],
    lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GuestProfile', GuestProfileSchema);
