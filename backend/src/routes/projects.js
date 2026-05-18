const express = require('express');
const { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const docClient = require('../config/dynamodb');
const { requireManager } = require('../middleware/roles');

const router = express.Router();
const TABLE = process.env.DYNAMODB_TABLE_PROJECTS;

// Create a new project — managers only
router.post('/', requireManager(), async (req, res) => {
  try {
    const { name, description, teamId } = req.body;
    if (!name || !teamId) {
      return res.status(400).json({ error: 'name and teamId are required' });
    }

    const project = {
      projectId: uuidv4(),
      name,
      description: description || '',
      teamId,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: TABLE, Item: project }));
    return res.status(201).json(project);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get all projects — managers see all, employees see their team's only
router.get('/', async (req, res) => {
  try {
    const role = req.user['custom:Role'];
    const teamId = req.user['custom:TeamId'];

    let result;
    if (role === 'manager') {
      result = await docClient.send(new ScanCommand({ TableName: TABLE }));
    } else {
      result = await docClient.send(new ScanCommand({
        TableName: TABLE,
        FilterExpression: 'teamId = :teamId',
        ExpressionAttributeValues: { ':teamId': teamId },
      }));
    }

    return res.status(200).json(result.Items || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get a single project
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await docClient.send(new GetCommand({ TableName: TABLE, Key: { projectId } }));
    if (!result.Item) return res.status(404).json({ error: 'Project not found' });

    const role = req.user['custom:Role'];
    if (role === 'employee' && result.Item.teamId !== req.user['custom:TeamId']) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.status(200).json(result.Item);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update a project — managers only
router.patch('/:projectId', requireManager(), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;

    if (!name && !description) {
      return res.status(400).json({ error: 'Provide at least name or description to update' });
    }

    const updateParts = [];
    const exprNames = {};
    const exprValues = {};
    if (name) { updateParts.push('#n = :name'); exprNames['#n'] = 'name'; exprValues[':name'] = name; }
    if (description) { updateParts.push('description = :description'); exprValues[':description'] = description; }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE,
      Key: { projectId },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ReturnValues: 'ALL_NEW',
    }));

    return res.status(200).json(result.Attributes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete a project — managers only
router.delete('/:projectId', requireManager(), async (req, res) => {
  try {
    const { projectId } = req.params;
    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { projectId } }));
    return res.status(200).json({ message: 'Project deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
