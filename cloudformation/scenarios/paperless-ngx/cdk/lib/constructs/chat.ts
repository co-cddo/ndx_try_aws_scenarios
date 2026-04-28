import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import { Construct } from 'constructs';

export interface ChatConstructProps {
  readonly knowledgeBase: bedrock.CfnKnowledgeBase;
  readonly guardrail: bedrock.CfnGuardrail;
  readonly guardrailVersion: bedrock.CfnGuardrailVersion;
  readonly modelId: string;
  readonly paperlessUrl: string;
}

export class ChatConstruct extends Construct {
  public readonly fn: lambda.CfnFunction;
  public readonly url: lambda.CfnUrl;
  public readonly urlString: string;

  constructor(scope: Construct, id: string, props: ChatConstructProps) {
    super(scope, id);

    const region = cdk.Stack.of(this).region;

    const role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    role.addToPolicy(new iam.PolicyStatement({
      actions: ['bedrock:RetrieveAndGenerate', 'bedrock:Retrieve'],
      resources: ['*'],
    }));
    role.addToPolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        `arn:aws:bedrock:${region}::foundation-model/${props.modelId}`,
        `arn:aws:bedrock:${region}::foundation-model/amazon.titan-embed-text-v2:0`,
      ],
    }));
    role.addToPolicy(new iam.PolicyStatement({
      actions: ['bedrock:ApplyGuardrail'],
      resources: [props.guardrail.attrGuardrailArn],
    }));

    // Read the python handler + html template at synth time and combine into a single
    // self-contained index.py with the HTML as a Python triple-quoted string. This avoids
    // multi-file Lambda assets (which would need CDK bootstrap) — we hand the combined
    // script to CfnFunction's inline ZipFile property, which has no 4096-char limit.
    const handlerPath = path.join(__dirname, '..', '..', 'lambda', 'chat', 'index.py');
    const htmlPath = path.join(__dirname, '..', '..', 'lambda', 'chat', 'index.html');
    const handlerSrc = fs.readFileSync(handlerPath, 'utf8');
    const htmlSrc = fs.readFileSync(htmlPath, 'utf8');

    // Replace the on-disk file read with an inlined Python constant. The HTML
    // must be inserted AFTER any `from __future__` imports — Python requires
    // those at the very top of the file.
    const inlineHtmlBlock = `INDEX_HTML = ${pythonTripleQuote(htmlSrc)}\n\n`;
    const adjustedHandler = handlerSrc
      .replace(
        /def _load_html\(\) -> str:\n[\s\S]*?return f\.read\(\)\.replace\("__PAPERLESS_URL__", PAPERLESS_URL\)\n/,
        'def _load_html() -> str:\n    return INDEX_HTML.replace("__PAPERLESS_URL__", PAPERLESS_URL)\n',
      );

    const futureMatch = adjustedHandler.match(/^((?:"""[\s\S]*?"""\s*\n+)?(?:from __future__ import [^\n]+\n+)?)/);
    const futurePrefix = futureMatch ? futureMatch[0] : '';
    const rest = adjustedHandler.slice(futurePrefix.length);
    const inlinedSource = `${futurePrefix}${inlineHtmlBlock}${rest}`;

    this.fn = new lambda.CfnFunction(this, 'Function', {
      role: role.roleArn,
      runtime: 'python3.12',
      handler: 'index.handler',
      timeout: 60,
      memorySize: 512,
      code: { zipFile: inlinedSource },
      environment: {
        variables: {
          KNOWLEDGE_BASE_ID: props.knowledgeBase.attrKnowledgeBaseId,
          BEDROCK_MODEL_ID: props.modelId,
          GUARDRAIL_ID: props.guardrail.attrGuardrailId,
          GUARDRAIL_VERSION: props.guardrailVersion.attrVersion,
          PAPERLESS_URL: props.paperlessUrl,
        },
      },
    });
    this.fn.node.addDependency(role);

    // Public Function URL with two permissions (since Oct 2025 AWS requires both
    // lambda:InvokeFunctionUrl AND lambda:InvokeFunction with InvokedViaFunctionUrl).
    this.url = new lambda.CfnUrl(this, 'Url', {
      authType: 'NONE',
      targetFunctionArn: this.fn.attrArn,
      cors: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST'],
        allowHeaders: ['content-type'],
      },
    });

    new lambda.CfnPermission(this, 'UrlInvokePermission', {
      action: 'lambda:InvokeFunctionUrl',
      functionName: this.fn.attrArn,
      principal: '*',
      functionUrlAuthType: 'NONE',
    });

    new lambda.CfnPermission(this, 'UrlPublicInvokePermission', {
      action: 'lambda:InvokeFunction',
      functionName: this.fn.attrArn,
      principal: '*',
      invokedViaFunctionUrl: true,
    });

    this.urlString = this.url.attrFunctionUrl;
  }

  /** No-op kept for backwards compatibility — public Function URL doesn't need
   *  per-distribution grants. */
  grantCloudFrontInvoke(_distributionArn: string): void {
    // intentionally empty
  }
}

function pythonTripleQuote(s: string): string {
  // Use raw triple-double-quoted string and escape any embedded triple-double-quotes.
  const safe = s.replace(/"""/g, '\\"\\"\\"');
  return `r"""${safe}"""`;
}
