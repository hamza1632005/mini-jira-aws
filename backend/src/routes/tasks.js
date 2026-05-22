const express = require('express');
const {
  PutCommand, GetCommand, ScanCommand, QueryCommand, UpdateCommand, DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const docClient = require('../config/dynamodb');
const { requireManager } = require('../middleware/roles');
const { resolveTeamId } = require('../utils/resolveTeamId');

const router = express.Router();
const TASKS_TABLE = process.env.DYNAMODB_TABLE_TASKS;
const AUDIT_TABLE = process.env.DYNAMODB_TABLE_AUDIT_LOG;

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const TRANSITIONS = {
  ToDo: ['InProgress'],
  InProgress: ['InReview'],
  InReview: ['Done'],
};

// POST /tasks — create a task (managers only)
router.post('/', requireManager(), async (req, res) => {
  try {
    const { title, description, priority, deadline, assigneeId, teamId, projectId } = req.body;
    if (!title || !teamId) return res.status(400).json({ error: 'title and teamId are required' });

    const task = {
      taskId: uuidv4(),
      title,
      description: description || '',
      priority: priority || 'Medium',
      teamId,
      status: 'ToDo',
      attachments: [],
      createdAt: new Date().toISOString(),
      ...(deadline && { deadline }),
      ...(assigneeId && { assigneeId }),
      ...(projectId && { projectId }),
    };

    await docClient.send(new PutCommand({ TableName: TASKS_TABLE, Item: task }));

    // TODO: Nour (M4) — publish to SNS TaskAssigned-Topic here (T-09) DONE!!!

    if (assigneeId) {
      await snsClient.send(new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Subject: 'New Task Assigned',
        Message: JSON.stringify({
          taskId: task.taskId,
          assigneeId,
          teamId,
        }),
      }));
    }

    return res.status(201).json(task);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /tasks — managers see all (with optional ?teamId= filter), employees see their team only
router.get('/', async (req, res) => {
  try {
    const role = req.user['custom:Role'];
    const userTeamId = await resolveTeamId(req.user['custom:TeamId']);
    const { teamId } = req.query;

    let result;
    if (role === 'manager') {
      if (teamId) {
        const filterTeamId = await resolveTeamId(teamId);
        result = await docClient.send(new QueryCommand({
          TableName: TASKS_TABLE,
          IndexName: 'teamId-index',
          KeyConditionExpression: 'teamId = :teamId',
          ExpressionAttributeValues: { ':teamId': filterTeamId },
        }));
      } else {
        result = await docClient.send(new ScanCommand({ TableName: TASKS_TABLE }));
      }
    } else if (userTeamId) {
      result = await docClient.send(new QueryCommand({
        TableName: TASKS_TABLE,
        IndexName: 'teamId-index',
        KeyConditionExpression: 'teamId = :teamId',
        ExpressionAttributeValues: { ':teamId': userTeamId },
      }));
    } else {
      result = { Items: [] };
    }

    return res.status(200).json(result.Items || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /tasks/:taskId — single task with team isolation
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await docClient.send(new GetCommand({ TableName: TASKS_TABLE, Key: { taskId } }));
    if (!result.Item) return res.status(404).json({ error: 'Task not found' });

    const role = req.user['custom:Role'];
    const userTeamId = await resolveTeamId(req.user['custom:TeamId']);
    if (role !== 'manager' && result.Item.teamId !== userTeamId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.status(200).json(result.Item);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /tasks/:taskId — update task fields (managers only)
router.patch('/:taskId', requireManager(), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, priority, deadline, assigneeId, teamId, projectId } = req.body;

    const taskResult = await docClient.send(new GetCommand({ TableName: TASKS_TABLE, Key: { taskId } }));
    if (!taskResult.Item) return res.status(404).json({ error: 'Task not found' });

    const parts = [];
    const names = {};
    const values = { ':updatedAt': new Date().toISOString() };

    if (title)                 { parts.push('#title = :title');       names['#title'] = 'title'; values[':title'] = title; }
    if (description !== undefined) { parts.push('description = :desc');                          values[':desc'] = description; }
    if (priority)              { parts.push('priority = :priority');                              values[':priority'] = priority; }
    if (deadline)              { parts.push('deadline = :deadline');                              values[':deadline'] = deadline; }
    if (assigneeId !== undefined)  { parts.push('assigneeId = :assigneeId');                     values[':assigneeId'] = assigneeId; }
    if (teamId)                { parts.push('teamId = :teamId');                                  values[':teamId'] = teamId; }
    if (projectId !== undefined)   { parts.push('projectId = :projectId');                       values[':projectId'] = projectId; }

    if (parts.length === 0) return res.status(400).json({ error: 'No fields provided to update' });
    parts.push('updatedAt = :updatedAt');

    const updateParams = {
      TableName: TASKS_TABLE,
      Key: { taskId },
      UpdateExpression: `SET ${parts.join(', ')}`,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    };
    if (Object.keys(names).length > 0) updateParams.ExpressionAttributeNames = names;

    const updated = await docClient.send(new UpdateCommand(updateParams));

    // TODO: Nour (M4) — if assigneeId changed, publish to SNS here (T-09) DONE!!!

    if (
      assigneeId !== undefined &&
      assigneeId !== taskResult.Item.assigneeId
    ) {
      await snsClient.send(new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Subject: 'Task Reassigned',
        Message: JSON.stringify({
          taskId,
          assigneeId,
          teamId: updated.Attributes.teamId,
        }),
      }));
    }



    return res.status(200).json(updated.Attributes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /tasks/:taskId/status — status transition with AuditLog
router.patch('/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    const taskResult = await docClient.send(new GetCommand({ TableName: TASKS_TABLE, Key: { taskId } }));
    if (!taskResult.Item) return res.status(404).json({ error: 'Task not found' });

    const task = taskResult.Item;
    const role = req.user['custom:Role'];

    if (role !== 'manager' && task.assigneeId !== req.user.sub) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const allowed = TRANSITIONS[task.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition', allowed, current: task.status });
    }

    const updatedAt = new Date().toISOString();

    const updateResult = await docClient.send(new UpdateCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
      UpdateExpression: 'SET #s = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':status': status, ':updatedAt': updatedAt },
      ReturnValues: 'ALL_NEW',
    }));

    // Write AuditLog entry for this transition
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

// DELETE /tasks/:taskId — delete task and its S3 attachments (managers only)
router.delete('/:taskId', requireManager(), async (req, res) => {
  try {
    const { taskId } = req.params;
    const taskResult = await docClient.send(new GetCommand({ TableName: TASKS_TABLE, Key: { taskId } }));
    if (!taskResult.Item) return res.status(404).json({ error: 'Task not found' });

    await docClient.send(new DeleteCommand({ TableName: TASKS_TABLE, Key: { taskId } }));

    // Delete all S3 attachments — silently skip if bucket not configured yet (T-04)
    const attachments = [...(taskResult.Item.attachments || [])];
    if (taskResult.Item.s3Key) attachments.push(taskResult.Item.s3Key);
    for (const key of attachments) {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_ORIGINALS, Key: key }));
      } catch (_) {}
    }

    return res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /tasks/:taskId/upload-url — presigned S3 upload URL (keeps all versions)
router.get('/:taskId/upload-url', async (req, res) => {
  try {
    const { taskId } = req.params;
    const role = req.user['custom:Role'];

    const taskResult = await docClient.send(new GetCommand({ TableName: TASKS_TABLE, Key: { taskId } }));
    if (!taskResult.Item) return res.status(404).json({ error: 'Task not found' });

    const userTeamId = await resolveTeamId(req.user['custom:TeamId']);
    if (role !== 'manager' && taskResult.Item.teamId !== userTeamId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const bucket = process.env.S3_BUCKET_ORIGINALS;
    if (!bucket || bucket.includes('PLACEHOLDER')) {
      return res.status(503).json({ error: 'S3 bucket not configured yet — pending Nour (T-04)' });
    }

    const s3Key = `tasks/${taskId}/${Date.now()}-attachment`;

    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({ Bucket: bucket, Key: s3Key }),
      { expiresIn: 300 }
    );

    // Append new key to attachments array to keep version history
    await docClient.send(new UpdateCommand({
      TableName: TASKS_TABLE,
      Key: { taskId },
      UpdateExpression: 'SET attachments = list_append(if_not_exists(attachments, :empty), :newKey), s3Key = :s3Key',
      ExpressionAttributeValues: { ':newKey': [s3Key], ':empty': [], ':s3Key': s3Key },
    }));

    return res.status(200).json({ uploadUrl, s3Key });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
