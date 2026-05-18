const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route (required for ALB health checks)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
const teamsRouter = require('./routes/teams');
const usersRouter = require('./routes/users');
const healthRouter = require('./routes/health');

app.use('/teams', teamsRouter);
app.use('/users', usersRouter);
app.use('/health', healthRouter);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Mini Jira API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;