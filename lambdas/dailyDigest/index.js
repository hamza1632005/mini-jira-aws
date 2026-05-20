const {
    DynamoDBClient,
    ScanCommand
  } = require('@aws-sdk/client-dynamodb');
  
  const {
    SNSClient,
    PublishCommand
  } = require('@aws-sdk/client-sns');
  
  const dynamodb = new DynamoDBClient({
    region: 'us-east-1'
  });
  
  const sns = new SNSClient({
    region: 'us-east-1'
  });
  
  exports.handler = async () => {
  
    try {
  
      const today = new Date().toISOString().split('T')[0];
  
      console.log('Checking tasks for date:', today);
  
      const result = await dynamodb.send(new ScanCommand({
        TableName: 'Tasks'
      }));
  
      const tasks = result.Items || [];
  
      const dueTasks = tasks.filter(task => {
  
        const deadline = task.deadline?.S || '';
        const status = task.status?.S || '';
  
        return (
          deadline.startsWith(today) &&
          status !== 'Done'
        );
      });
  
      console.log('Due tasks found:', dueTasks.length);
  
      const grouped = {};
  
      for (const task of dueTasks) {
  
        const assignee = task.assigneeId?.S || 'Unknown';
  
        if (!grouped[assignee]) {
          grouped[assignee] = [];
        }
  
        grouped[assignee].push({
          title: task.title?.S || 'Untitled',
          deadline: task.deadline?.S || ''
        });
      }
  
      for (const assignee in grouped) {
  
        const taskList = grouped[assignee]
          .map(t => `• ${t.title} (Deadline: ${t.deadline})`)
          .join('\n');
  
        const message =
  `Daily Digest for ${assignee}
  
  Tasks due today:
  
  ${taskList}`;
  
        await sns.send(new PublishCommand({
          TopicArn: 'arn:aws:sns:us-east-1:605357530074:TaskAssigned-Topic',
          Subject: `Daily Digest - ${assignee}`,
          Message: message
        }));
  
        console.log(`Digest sent for ${assignee}`);
      }
  
      return {
        statusCode: 200,
        body: 'Daily digest completed'
      };
  
    } catch (error) {
  
      console.error('DailyDigest Error:', error);
  
      return {
        statusCode: 500,
        body: JSON.stringify(error)
      };
    }
  };