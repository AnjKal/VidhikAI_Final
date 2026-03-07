import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION ?? 'us-east-1';

// Trim to guard against accidental leading/trailing spaces in .env files.
export const historyTableName = process.env.DDB_HISTORY_TABLE?.trim();

if (!historyTableName) {
  console.warn('DDB_HISTORY_TABLE is not set; history APIs will fail at runtime.');
}

const ddb = new DynamoDBClient({ region });

export const ddbDoc = DynamoDBDocumentClient.from(ddb, {
  marshallOptions: { removeUndefinedValues: true },
});
