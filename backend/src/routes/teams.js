const express = require('express');
const { PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { v4: uuidv4 } = require('uuid');
const docClient = require('../config/dynamodb');
const { requireManager } = require('../middleware/roles');

const router = express.Router();
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
const TABLE = process.env.DYNAMODB_TABLE_TEAMS;

// Create a team — managers only
router.post('/', requireManager(), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const teamId = uuidv4();
    await docClient.send(new PutCommand({ TableName: TABLE, Item: { teamId, name } }));
    res.status(201).json({ teamId, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all teams
router.get('/', async (req, res) => {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
    res.json(result.Items || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a user to a team — managers only
router.post('/:teamId/members', requireManager(), async (req, res) => {
  try {
    const { username } = req.body;
    const { teamId } = req.params;
    if (!username) return res.status(400).json({ error: 'username is required' });

    await cognitoClient.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
      UserAttributes: [{ Name: 'custom:teamId', Value: teamId }],
    }));

    res.json({ success: true, username, teamId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
