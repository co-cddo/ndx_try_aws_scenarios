import TurndownService from "turndown";
import { S3 } from "@aws-sdk/client-s3";

const s3 = new S3({});

export const handler = async (event: { html?: string; htmlKey?: string }): Promise<string | { mdKey: string }> => {
	let html: string;

	if (event.htmlKey) {
		// Read HTML from S3
		const bucket = process.env.BUCKET_NAME;
		const result = await s3.getObject({ Bucket: bucket, Key: event.htmlKey });
		html = await result.Body!.transformToString("utf-8");
		console.log(`Read HTML from S3: ${event.htmlKey} (${html.length} bytes)`);
	} else if (event.html) {
		html = event.html;
	} else {
		throw new Error("Either html or htmlKey must be provided");
	}

	const turndownService = new TurndownService({
		headingStyle: "atx",
		codeBlockStyle: "fenced",
		bulletListMarker: "-",
	});
	const markdown = turndownService.turndown(html);

	// If markdown is large, save to S3
	if (event.htmlKey) {
		const bucket = process.env.BUCKET_NAME;
		const mdKey = event.htmlKey.replace(/doc\.html$/, "doc.md");
		await s3.putObject({
			Bucket: bucket,
			Key: mdKey,
			Body: markdown,
			ContentType: "text/markdown",
		});
		console.log(`Saved markdown to S3: ${mdKey} (${markdown.length} bytes)`);
		return { mdKey };
	}

	return markdown;
};
