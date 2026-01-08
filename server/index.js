const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Fix for MongoDB SRV EREFUSED errors due to ISP DNS blocking
const dns = require('dns');
dns.setServers(['8.8.8.8']);

const workflowRoutes = require('./routes/workflow');
const gamificationRoutes = require('./routes/gamification');

const app = express();
const port = 5000;
const mongoose = require('mongoose');

// MongoDB Connection
// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api', workflowRoutes);
app.use('/api/gamification', gamificationRoutes);

app.get('/', (req, res) => {
  res.send('LifeFlow API is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
