const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const workflowRoutes = require('./routes/workflow');

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

app.get('/', (req, res) => {
  res.send('LifeFlow API is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
