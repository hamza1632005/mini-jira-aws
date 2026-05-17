const express = require('express');
const {
  PutCommand,
  GetCommand,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const docClient = require('../config/dynamodb');
const { requireManager } = require('../middleware/roles');

const router = express.Router();
const TASKS_TABLE = process.env.DYNAMODB_TABLE_TASKS;
const AUDIT_TABLE = process.env.DYNAMODB_TABLE_AUDIT_LOG;

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

// Valid status transitions
const TRANSITIONS = {
  ToDo: ['InProgress'],
  InProgress: ['InReview'],
  InReview: ['Done'],
};

// Create a task — managers only
router.post('/', requireManager(), async (req, res) => {
  try {
    const { title, description, priority, deadline, assigneeId, teamId, projectId } = req.body;
    if (!title || !teamId) {
      return res.status(400).json({ error: 'title and teamId are required' });
    }

    const task = {
      taskId: uuidv4(),
      title,
      description: description || '',
      priority: priority || 'Medium',
      deadline: deadline || null,
      assigneeId: assigneeId || null,
      teamId,
      projectId: projectId || null,
      status: 'ToDo',
      createdAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: TASKS_TABLE, Item: task }));

    // TODO: Nour (M4) will add SNS publish here in T-09

    return res.status(201).json(task);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get tasks — managers see all, employees query by teamId GSI
router.get('/', async (req, res) => {
  try {
    const role = req.user['custom:role'];
    const teamId = req.user['custom:teamId'];

    let result;
    if (role === 'manager') {
      result = await docClient.send(new ScanCommand({ TableName: TASKS_TABLE }));
    } else {
      result = await docClient.send(new QueryCommand({
        TableName: TASKS_TABLE,
        IndexName: 'teamId-index',
        KeyConditionExpression: 'teamId = :teamId',
        ExpressionAttributeValues: { ':teamId': teamId },
      }));
    }

    return res.status(200).json(result.Items || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get a single task — with team isolation for employees
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await docClient.send(new GetCommand({ TableName: TASKS_TABLE, Key: { taskId } }));

    if (!result.Item) return res.status(404).json({ error: 'Task not found' });

    const role = req.user['custom:role'];
    if (role === 'employee' && result.Item.teamId !== req.user['custom:teamId']) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.status(200).json(result.Item);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update task status — any authenticated user, with transition validation and AuditLog
router.patch('/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    const taskResult = await docClient.send(new GetCommand({ TableName: TASKS_TABLE, Key: { taskId } }));
    if (!taskResult.Item) return res.status(404).json({ error: 'Task not found' });

    const task = taskResult.Item;
    const role = req.user['custom:role'];

    // Employees can only update tasks assigned to them
    if (role === 'employee' && task.assigneeId !== req.user.sub) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate the status transition
    const allowed = TRANSITIONS[task.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        allowed,
        current: task.status,
      });
    }

    const updatedAt = new Date().toISOString();

    // Update the task status
    const updateResult = await docClient.send(new UpdateCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
      UpdateExpression: 'SET #s = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':status': status, ':updatedAt': updatedAt },
      ReturnValues: 'ALL_NEW',
    }));

    // Write an AuditLog entry for this transition
    await docClient.send(new PutCommand({
      TableName: AUDIT_TABLE,
      Item: {
        logId: uuidv4(),
        taskId,
        userId: req.user.sub,
        fromStatus: task.status,
        toStatus: status,
        timestamp: updatedAt,
      },
    }));

    return res.status(200).json(updateResult.Attributes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete a task — managers only
router.delete('/:taskId', requireManager(), async (req, res) => {
  try {
    const { taskId } = req.params;

    const taskResult = await docClient.send(new GetCommand({ TableName: TASKS_TABLE, Key: { taskId } }));
    if (!taskResult.Item) return res.status(404).json({ error: 'Task not found' });

    await docClient.send(new DeleteCommand({ TableName: TASKS_TABLE, Key: { taskId } }));

    // TODO: add S3 DeleteObjectCommand when Nour confirms bucket names (T-04)
    // if (taskResult.Item.s3Key) { ... }

    return res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Generate a presigned S3 upload URL for a task attachment
router.get('/:taskId/upload-url', async (req, res) => {
  try {
    const { taskId } = req.params;
    const role = req.user['custom:role'];

    const taskResult = await docClient.send(new GetCommand({ TableName: TASKS_TABLE, Key: { taskId } }));
    if (!taskResult.Item) return res.status(404).json({ error: 'Task not found' });

    // Enforce team isolation for employees
    if (role === 'employee' && taskResult.Item.teamId !== req.user['custom:teamId']) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // TODO: add bucket name to .env when Nour confirms (T-04)
    const bucket = process.env.S3_BUCKET_ORIGINALS;
    const s3Key = `tasks/${taskId}/${Date.now()}-attachment`;

    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({ Bucket: bucket, Key: s3Key }),
      { expiresIn: 300 }
    );

    // Store the s3Key on the task record
    await docClient.send(new UpdateCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
      UpdateExpression: 'SET s3Key = :s3Key',
      ExpressionAttributeValues: { ':s3Key': s3Key },
    }));

    return res.status(200).json({ uploadUrl, s3Key });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
