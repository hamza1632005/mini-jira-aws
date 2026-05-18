const express = require('express');
const router = express.Router();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const { requireManager } = require('../middleware/roles');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

// POST /teams — create a team (manager only)
router.post('/', auth, requireManager, async (req, res) => {
  try {
    const { name } = req.body;
    const teamId = uuidv4();
    await docClient.send(new PutCommand({
      TableName: 'Teams',
      Item: { teamId, name }
    }));
    res.status(201).json({ teamId, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /teams — list all teams
router.get('/', auth, async (req, res) => {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: 'Teams' }));
    res.json(result.Items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /teams/:teamId/members — add user to a team (manager only)
router.post('/:teamId/members', auth, requireManager, async (req, res) => {
  try {
    const { username } = req.body;
    const { teamId } = req.params;
    await cognitoClient.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: process.env.COGNITO_POOL_ID,
      Username: username,
      UserAttributes: [{ Name: 'custom:TeamId', Value: teamId }]
    }));
    res.json({ success: true, username, teamId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;