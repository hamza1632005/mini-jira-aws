const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const docClient = require('../config/dynamodb');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Map Cognito custom:TeamId (UUID or team name) to DynamoDB teamId UUID */
async function resolveTeamId(teamIdOrName) {
  if (!teamIdOrName || typeof teamIdOrName !== 'string') return null;
  const trimmed = teamIdOrName.trim();
  if (UUID_RE.test(trimmed)) return trimmed;

  const table = process.env.DYNAMODB_TABLE_TEAMS;
  if (!table) return trimmed;

  const result = await docClient.send(new ScanCommand({ TableName: table }));
  const match = (result.Items || []).find(
    (t) => t.name && t.name.toLowerCase() === trimmed.toLowerCase()
  );
  return match ? match.teamId : trimmed;
}

module.exports = { resolveTeamId };
