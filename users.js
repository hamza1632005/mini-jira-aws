const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /users/me — return current user profile from token
router.get('/me', auth, (req, res) => {
  try {
    res.json({
      username: req.user.username,
      email: req.user.email,
      role: req.user['custom:Role'],
      teamId: req.user['custom:TeamId']
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;