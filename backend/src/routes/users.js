const express = require('express');

const router = express.Router();

// GET /users/me — return current user profile from Cognito token claims
router.get('/me', (req, res) => {
  try {
    res.json({
      userId: req.user.sub,
      username: req.user.username,
      email: req.user.email,
      role: req.user['custom:role'],
      teamId: req.user['custom:teamId'],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
