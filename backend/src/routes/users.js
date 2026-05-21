const express = require('express');
const { resolveTeamId } = require('../utils/resolveTeamId');

const router = express.Router();

// GET /users/me — return current user profile from Cognito token claims
router.get('/me', async (req, res) => {
  try {
    const teamId = await resolveTeamId(req.user['custom:TeamId']);
    res.json({
      userId: req.user.sub,
      username: req.user.username,
      email: req.user.email,
      role: req.user['custom:Role'],
      teamId: teamId || undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
