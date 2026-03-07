import { S3 } from "@aws-sdk/client-s3";
import { DynamoDBClient, BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const s3 = new S3({});
const ddb = new DynamoDBClient({});

interface Event {
	string?: string;
	mdKey?: string;
	splitter: string;
	id: string;
	identity: string;
	modelId: string;
}

export const handler = async (event: Event): Promise<{ count: number }> => {
	let str: string;

	if (event.mdKey) {
		const bucket = process.env.BUCKET_NAME;
		const result = await s3.getObject({ Bucket: bucket, Key: event.mdKey });
		str = await result.Body!.transformToString("utf-8");
		console.log(`Read markdown from S3: ${event.mdKey} (${str.length} bytes)`);
	} else if (event.string) {
		str = event.string;
	} else {
		throw new Error("Either string or mdKey must be provided");
	}

	const paragraphs = str.split(event.splitter).filter((p) => p.trim().length > 0);
	console.log(`Split into ${paragraphs.length} non-empty paragraphs`);

	const tableName = process.env.TABLE_NAME!;
	const batchSize = 25; // DynamoDB batch limit

	for (let i = 0; i < paragraphs.length; i += batchSize) {
		const batch = paragraphs.slice(i, i + batchSize);
		const putRequests = batch.map((paragraph, batchIdx) => ({
			PutRequest: {
				Item: {
					id: { S: event.id },
					itemId: { S: randomUUID() },
					order: { N: String(i + batchIdx) },
					identity: { S: event.identity },
					type: { S: "text" },
					input: { S: paragraph },
					modelId: { S: event.modelId },
					status: { S: "updated" },
					output: { NULL: true },
					owner: { NULL: true },
					parent: { NULL: true },
				},
			},
		}));

		await ddb.send(
			new BatchWriteItemCommand({
				RequestItems: { [tableName]: putRequests },
			}),
		);
		console.log(`Wrote batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)`);
	}

	return { count: paragraphs.length };
};
