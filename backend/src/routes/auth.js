const express = require('express');
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const router = express.Router();
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

// POST /auth/register — create a new user in Cognito (admin flow, no email verification)
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, role, teamId } = req.body;
    if (!username || !password || !email || !role) {
      return res.status(400).json({ error: 'username, password, email, and role are required' });
    }

    // Create the user
    await cognitoClient.send(new AdminCreateUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'custom:Role', Value: role },
        ...(teamId ? [{ Name: 'custom:TeamId', Value: teamId }] : []),
      ],
    }));

    // Set as permanent password immediately (skip forced-change flow)
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
      Password: password,
      Permanent: true,
    }));

    return res.status(201).json({ message: 'User created successfully', username, email, role });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /auth/login — exchange username+password for a Cognito access token
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const result = await cognitoClient.send(new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    }));

    const { IdToken } = result.AuthenticationResult;
    return res.status(200).json({ token: IdToken });
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
});

module.exports = router;
