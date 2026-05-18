const express = require('express');
const cors = require('cors');
require('dotenv').config();

const auth = require('./middleware/auth');
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const tasksRouter = require('./routes/tasks');
const commentsRouter = require('./routes/comments');
const teamsRouter = require('./routes/teams');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check — required for ALB health checks (T-08)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/projects', auth, projectsRouter);
app.use('/tasks', auth, tasksRouter);
app.use('/tasks', auth, commentsRouter);
app.use('/teams', auth, teamsRouter);
app.use('/users', auth, usersRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
