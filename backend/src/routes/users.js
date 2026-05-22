const express = require('express');
const { CognitoIdentityProviderClient, AdminGetUserCommand, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { resolveTeamId } = require('../utils/resolveTeamId');

const router = express.Router();
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

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

// GET /users/by-id/:userId — resolve a userId (sub) to its username
router.get('/by-id/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await cognitoClient.send(new ListUsersCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Filter: `sub = "${userId}"`,
      Limit: 1,
    }));

    const cognitoUser = result.Users?.[0];
    if (!cognitoUser) return res.status(404).json({ error: 'User not found' });

    const attrs = Object.fromEntries(cognitoUser.Attributes.map((a) => [a.Name, a.Value]));
    return res.json({ userId: attrs.sub, username: cognitoUser.Username, email: attrs.email });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /users/lookup?username=xxx — resolve a username to its userId (sub)
router.get('/lookup', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'username query param is required' });

    const result = await cognitoClient.send(new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
    }));

    const attrs = Object.fromEntries(result.UserAttributes.map((a) => [a.Name, a.Value]));

    return res.json({
      userId: attrs.sub,
      username: result.Username,
      email: attrs.email,
    });
  } catch (err) {
    if (err.name === 'UserNotFoundException') {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
