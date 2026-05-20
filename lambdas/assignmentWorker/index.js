const {
  CloudWatchClient,
  PutMetricDataCommand
} = require('@aws-sdk/client-cloudwatch');

const {
  DynamoDBClient,
  PutItemCommand
} = require('@aws-sdk/client-dynamodb');

const crypto = require('crypto');

// const { v4: uuidv4 } = require('uuid'); // Incompatible with Node.js version 24

const cloudwatch = new CloudWatchClient({
  region: 'us-east-1'
});

const dynamodb = new DynamoDBClient({
  region: 'us-east-1'
});

exports.handler = async (event) => {

  try {

    for (const record of event.Records) {

      // SNS message wrapped inside SQS
      const body = JSON.parse(record.body);

      const message = JSON.parse(body.Message);

      const {
        taskId,
        assigneeId,
        teamId
      } = message;

      console.log('Received assignment:', message);

      // Save audit log
      await dynamodb.send(new PutItemCommand({
        TableName: 'AuditLog',
        Item: {
          logId: { S: crypto.randomUUID() },
          taskId: { S: taskId },
          userId: { S: assigneeId },
          action: { S: 'TASK_ASSIGNED' },
          timestamp: { S: new Date().toISOString() }
        }
      }));

      // Publish CloudWatch metric
      await cloudwatch.send(new PutMetricDataCommand({
        Namespace: 'MiniJira',
        MetricData: [
          {
            MetricName: 'TasksAssigned',
            Dimensions: [
              {
                Name: 'TeamId',
                Value: teamId
              }
            ],
            Unit: 'Count',
            Value: 1
          }
        ]
      }));

      console.log('Metric published');
    }

    return {
      statusCode: 200,
      body: 'Success'
    };

  } catch (error) {

    console.error('Lambda Error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};