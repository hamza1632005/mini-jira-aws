const express = require('express');
const { PutCommand, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const docClient = require('../config/dynamodb');
const { resolveTeamId } = require('../utils/resolveTeamId');

const router = express.Router({ mergeParams: true });
const COMMENTS_TABLE = process.env.DYNAMODB_TABLE_COMMENTS;
const TASKS_TABLE = process.env.DYNAMODB_TABLE_TASKS;

// Post a comment on a task — any authenticated user
router.post('/:taskId/comments', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const comment = {
      commentId: uuidv4(),
      taskId,
      userId: req.user.sub,
      text,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: COMMENTS_TABLE, Item: comment }));
    return res.status(201).json(comment);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get all comments for a task — employees restricted to their team
router.get('/:taskId/comments', async (req, res) => {
  try {
    const { taskId } = req.params;
    const role = req.user['custom:Role'];
    const teamId = await resolveTeamId(req.user['custom:TeamId']);

    // Fetch the parent task to enforce team isolation for employees
    const taskResult = await docClient.send(new GetCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
    }));

    if (!taskResult.Item) return res.status(404).json({ error: 'Task not found' });

    if (role !== 'manager' && taskResult.Item.teamId !== teamId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Comments PK=commentId, SK=taskId — no GSI on taskId, so scan with filter
    const result = await docClient.send(new ScanCommand({
      TableName: COMMENTS_TABLE,
      FilterExpression: 'taskId = :taskId',
      ExpressionAttributeValues: { ':taskId': taskId },
    }));

    return res.status(200).json(result.Items || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
