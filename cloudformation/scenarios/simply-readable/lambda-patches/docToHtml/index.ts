import * as mammoth from "mammoth";
import { S3 } from "@aws-sdk/client-s3";

interface Event {
	key: string;
}

const s3 = new S3({});

export const handler = async (event: Event): Promise<{ htmlKey: string }> => {
	console.log("Received event:", JSON.stringify(event, null, 4));

	const bucket = process.env.BUCKET_NAME;
	const key = event.key;

	let file;
	try {
		file = await s3.getObject({
			Bucket: bucket,
			Key: key,
		});
	} catch (error) {
		console.error("Error getting file from S3:", error);
		throw error;
	}

	const options: mammoth.Options = {
		styleMap: [
			"p[style-name='Title'] => h1:fresh",
			"p[style-name='Subtitle'] => h2:fresh",
		],
	};

	let result;
	try {
		result = await mammoth.convertToHtml(
			{ buffer: await file.Body?.transformToByteArray() },
			options,
		);
		console.log("Messages:", result.messages);
	} catch (error) {
		console.error("Error converting DOCX to HTML:", error);
		throw error;
	}

	// Save HTML to S3 to avoid Step Functions 256KB payload limit
	const htmlKey = key.replace(/\/upload\/.*$/, "/processing/doc.html");
	await s3.putObject({
		Bucket: bucket,
		Key: htmlKey,
		Body: result.value,
		ContentType: "text/html",
	});
	console.log("Saved HTML to S3:", htmlKey, `(${result.value.length} bytes)`);

	return { htmlKey };
};
