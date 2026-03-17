> **Status: IMPLEMENTED** — Merged in v3.0.0 of the council chatbot template. The implementation uses S3 Vectors storage (not AOSS), with 31 council documents indexed via Bedrock Knowledge Base. The ISB SCP blocking issue was resolved.

# Add Bedrock Knowledge Base with RAG to Council Chatbot

## Context

The council chatbot currently uses **in-context document retrieval** — the Lambda loads all 12 council documents from S3 at cold start and includes them in the Bedrock Converse API system prompt. This works but has limitations:

- All documents (~30K characters) are included in every request regardless of relevance, increasing token usage and cost
- No semantic search — the model must scan the entire document corpus to find relevant passages
- No citations — the model can't tell the user which specific document its answer came from
- Scales poorly — adding more documents increases prompt size linearly
- Client-side conversation history — the browser sends the last 10 messages with each request

A **Bedrock Knowledge Base** with vector storage would replace this with proper RAG (Retrieval-Augmented Generation): semantic search retrieves only the relevant document chunks, the model generates answers grounded in those chunks, and Bedrock manages conversation history server-side.

## Why this is blocked

The Innovation Sandbox (ISB) SCPs explicitly deny the S3 Vectors and OpenSearch Serverless data-plane operations needed by Bedrock Knowledge Base:

- **S3 Vectors**: `s3vectors:QueryVectors` (and other data-plane actions) are denied by SCP. Confirmed via CloudFormation deployment — the error from CloudTrail was `MalformedPolicyDocumentException: The following resources are invalid : null/index/null`, and direct `s3vectors:CreateIndex` calls returned explicit SCP deny.
- **OpenSearch Serverless (AOSS)**: Management plane works (collections and policies can be created), but ALL data-plane write operations (PUT/POST to collection endpoints) return 403. GET operations succeed. This was confirmed across multiple IAM roles including the SSO admin. Bedrock's internal service principal CAN access AOSS data plane (we got `404: no such index` not `403`), but no IAM role in the account can create the required vector index.

**Resolution needed**: The ISB SCP allowlist must be updated to permit `s3vectors:*` actions (or at minimum `s3vectors:CreateVectorBucket`, `s3vectors:CreateIndex`, `s3vectors:PutVectors`, `s3vectors:GetVectors`, `s3vectors:DeleteVectors`, `s3vectors:QueryVectors`, `s3vectors:GetIndex`, `s3vectors:DeleteIndex`, `s3vectors:DeleteVectorBucket`).

## What already exists

The current template (`cloudformation/scenarios/council-chatbot/template.yaml`) already has:

| Resource | Status |
|---|---|
| `KnowledgeBaseBucket` (S3) | Deployed, seeded with 12 council documents |
| `CouncilGuardrail` (Bedrock Guardrail) | Deployed and working |
| `CouncilGuardrailVersion` | Deployed |
| `SeedDataFunction` + `SeedData` | Deployed, seeds 12 documents to S3 |
| `ChatbotFunction` | Deployed, uses Converse API + in-context retrieval |
| `ChatbotRole` | Deployed, has S3 read + Bedrock InvokeModel + ApplyGuardrail |

## What needs to be added

### New CloudFormation resources

#### 1. S3 Vectors storage (2 resources)

```yaml
KnowledgeBaseVectorBucket:
  Type: AWS::S3Vectors::VectorBucket
  DeletionPolicy: Delete
  Properties:
    VectorBucketName: !Sub 'ndx-try-chatbot-vectors-${AWS::AccountId}-${AWS::Region}'

KnowledgeBaseVectorIndex:
  Type: AWS::S3Vectors::Index
  DeletionPolicy: Delete
  DependsOn: KnowledgeBaseVectorBucket
  Properties:
    VectorBucketName: !Sub 'ndx-try-chatbot-vectors-${AWS::AccountId}-${AWS::Region}'
    IndexName: council-kb-index
    DataType: float32
    Dimension: 1024
    DistanceMetric: cosine
```

Why S3 Vectors over AOSS: S3 Vectors is simpler, cheaper (no minimum ~$700/month AOSS cost), and sufficient for the chatbot's needs (semantic search only, no hybrid search required). The 12 council documents don't need the advanced filtering capabilities of AOSS.

Dimension 1024 matches `amazon.titan-embed-text-v2:0` default output. Cosine distance is standard for text embeddings.

#### 2. Knowledge Base IAM role

```yaml
KnowledgeBaseRole:
  Type: AWS::IAM::Role
  Properties:
    RoleName: !Sub 'ndx-try-chatbot-kb-role-${AWS::Region}'
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: bedrock.amazonaws.com
          Action: sts:AssumeRole
          Condition:
            StringEquals:
              aws:SourceAccount: !Ref AWS::AccountId
            ArnLike:
              AWS:SourceArn: !Sub 'arn:aws:bedrock:${AWS::Region}:${AWS::AccountId}:knowledge-base/*'
    Policies:
      - PolicyName: BedrockModelAccess
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - bedrock:ListFoundationModels
                - bedrock:ListCustomModels
              Resource: '*'
            - Effect: Allow
              Action: bedrock:InvokeModel
              Resource:
                - !Sub 'arn:aws:bedrock:${AWS::Region}::foundation-model/amazon.titan-embed-text-v2:0'
      - PolicyName: S3DataSourceAccess
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action: s3:ListBucket
              Resource: !GetAtt KnowledgeBaseBucket.Arn
              Condition:
                StringEquals:
                  aws:ResourceAccount: !Ref AWS::AccountId
            - Effect: Allow
              Action: s3:GetObject
              Resource: !Sub '${KnowledgeBaseBucket.Arn}/*'
              Condition:
                StringEquals:
                  aws:ResourceAccount: !Ref AWS::AccountId
      - PolicyName: S3VectorsAccess
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - s3vectors:PutVectors
                - s3vectors:GetVectors
                - s3vectors:DeleteVectors
                - s3vectors:QueryVectors
                - s3vectors:GetIndex
              Resource: !Sub
                - 'arn:aws:s3vectors:${AWS::Region}:${AWS::AccountId}:bucket/${VBucket}/index/${VIndex}'
                - VBucket: !Sub 'ndx-try-chatbot-vectors-${AWS::AccountId}-${AWS::Region}'
                  VIndex: council-kb-index
```

This role is assumed by `bedrock.amazonaws.com` (not by Lambda). It needs three categories of permissions:
- **Embedding model access**: `bedrock:InvokeModel` on `amazon.titan-embed-text-v2:0` for generating vector embeddings during ingestion and retrieval
- **S3 data source access**: Read the source documents from `KnowledgeBaseBucket` during ingestion
- **S3 Vectors access**: Read/write vectors to the vector index during ingestion and query

#### 3. Bedrock Knowledge Base

```yaml
CouncilKnowledgeBase:
  Type: AWS::Bedrock::KnowledgeBase
  DependsOn:
    - KnowledgeBaseRole
    - KnowledgeBaseVectorIndex
  Properties:
    Name: !Sub 'ndx-try-council-kb-${AWS::Region}'
    Description: Council service documents for RAG retrieval
    RoleArn: !GetAtt KnowledgeBaseRole.Arn
    KnowledgeBaseConfiguration:
      Type: VECTOR
      VectorKnowledgeBaseConfiguration:
        EmbeddingModelArn: !Sub 'arn:${AWS::Partition}:bedrock:${AWS::Region}::foundation-model/amazon.titan-embed-text-v2:0'
    StorageConfiguration:
      Type: S3_VECTORS
      S3VectorsConfiguration:
        VectorBucketArn: !Sub
          - 'arn:aws:s3vectors:${AWS::Region}:${AWS::AccountId}:bucket/${VBucket}'
          - VBucket: !Sub 'ndx-try-chatbot-vectors-${AWS::AccountId}-${AWS::Region}'
        IndexArn: !GetAtt KnowledgeBaseVectorIndex.IndexArn
        IndexName: council-kb-index
    Tags:
      Project: ndx-try
      Scenario: council-chatbot
```

**Gotcha**: `Tags` on `AWS::Bedrock::KnowledgeBase` uses a key-value map format (`Project: ndx-try`), NOT the `[{Key, Value}]` array format used by most AWS resources. Using the array format will cause a deployment error.

**Gotcha**: `StorageConfiguration` changes require **resource replacement**. If the vector storage needs to change later, the entire KB must be recreated.

#### 4. Data Source

```yaml
CouncilDataSource:
  Type: AWS::Bedrock::DataSource
  DependsOn: CouncilKnowledgeBase
  Properties:
    Name: council-documents
    KnowledgeBaseId: !Ref CouncilKnowledgeBase
    DataDeletionPolicy: DELETE
    DataSourceConfiguration:
      Type: S3
      S3Configuration:
        BucketArn: !GetAtt KnowledgeBaseBucket.Arn
        InclusionPrefixes:
          - 'documents/'
```

**Gotcha**: `!Ref CouncilDataSource` returns `KnowledgeBaseId|DataSourceId` (pipe-separated). Use `!GetAtt CouncilDataSource.DataSourceId` to get just the data source ID.

### Modifications to existing resources

#### 5. SeedDataFunction — add ingestion trigger

Add environment variables:
```yaml
Environment:
  Variables:
    BUCKET_NAME: !Ref KnowledgeBaseBucket
    KB_ID: !Ref CouncilKnowledgeBase
    DS_ID: !GetAtt CouncilDataSource.DataSourceId
```

Add to SeedDataRole:
```yaml
- PolicyName: BedrockIngestion
  PolicyDocument:
    Version: '2012-10-17'
    Statement:
      - Effect: Allow
        Action:
          - bedrock:StartIngestionJob
          - bedrock:GetIngestionJob
        Resource:
          - !Sub 'arn:aws:bedrock:${AWS::Region}:${AWS::AccountId}:knowledge-base/*'
```

Update SeedData dependency:
```yaml
SeedData:
  Type: Custom::SeedData
  DependsOn: CouncilDataSource  # was: KnowledgeBaseBucket
```

The Lambda handler should call `bedrock-agent.start_ingestion_job()` after writing documents, then poll `get_ingestion_job()` until status is `COMPLETE` or `FAILED`. The Lambda has a 300s timeout — ingestion of 12 small text documents typically completes in 1-3 minutes, so this is sufficient.

**Important**: The handler must wait for ingestion to complete before returning SUCCESS to CloudFormation. Otherwise the custom resource succeeds before documents are indexed, and the chatbot would answer from an empty KB during initial deployment.

#### 6. ChatbotRole — add KB permissions

```yaml
- PolicyName: KnowledgeBaseAccess
  PolicyDocument:
    Version: '2012-10-17'
    Statement:
      - Effect: Allow
        Action:
          - bedrock:RetrieveAndGenerate
          - bedrock:Retrieve
        Resource: '*'
```

`bedrock:RetrieveAndGenerate` is a runtime action on the `bedrock-agent-runtime` endpoint. It cannot be scoped to a specific KB ARN — the resource must be `*`.

#### 7. ChatbotFunction — replace Converse with RetrieveAndGenerate

Add environment variable:
```yaml
KNOWLEDGE_BASE_ID: !Ref CouncilKnowledgeBase
```

**Lambda code changes**:

Replace the current approach (load all docs from S3, include in system prompt, call `bedrock.converse()`) with:

```python
bedrock_agent = boto3.client('bedrock-agent-runtime')

KB_ID = os.environ.get('KNOWLEDGE_BASE_ID', '')
GUARDRAIL_ID = os.environ.get('GUARDRAIL_ID', '')
GUARDRAIL_VERSION = os.environ.get('GUARDRAIL_VERSION', '')
MODEL_ARN = f"arn:aws:bedrock:{os.environ['AWS_REGION']}::foundation-model/{os.environ['BEDROCK_MODEL_ID']}"

def get_rag_response(user_message, session_id=None):
    config = {
        'type': 'KNOWLEDGE_BASE',
        'knowledgeBaseConfiguration': {
            'knowledgeBaseId': KB_ID,
            'modelArn': MODEL_ARN,
            'generationConfiguration': {
                'inferenceConfig': {
                    'textInferenceConfig': {
                        'maxTokens': 1024,
                        'temperature': 0.7
                    }
                }
            },
            'retrievalConfiguration': {
                'vectorSearchConfiguration': {
                    'numberOfResults': 5,
                    'overrideSearchType': 'SEMANTIC'
                }
            }
        }
    }

    if GUARDRAIL_ID and GUARDRAIL_VERSION:
        config['knowledgeBaseConfiguration']['generationConfiguration']['guardrailConfiguration'] = {
            'guardrailId': GUARDRAIL_ID,
            'guardrailVersion': GUARDRAIL_VERSION
        }

    kwargs = {
        'input': {'text': user_message},
        'retrieveAndGenerateConfiguration': config
    }
    if session_id:
        kwargs['sessionId'] = session_id

    response = bedrock_agent.retrieve_and_generate(**kwargs)

    return {
        'success': True,
        'response': response['output']['text'],
        'sessionId': response['sessionId'],
        'citations': len(response.get('citations', [])),
        'guardrail': response.get('guardrailAction') == 'INTERVENED'
    }
```

**Key behavioural changes**:

1. **Server-side conversation memory**: Bedrock manages conversation history via `sessionId`. On the first request, omit `sessionId` — Bedrock generates one. Return it to the browser; the browser sends it back on subsequent requests. No client-side history array needed.

2. **Semantic retrieval**: Only relevant document chunks are retrieved (top 5 by default), not the entire corpus. This reduces token usage significantly.

3. **Citations**: The response includes `citations` with references back to the source S3 objects. The UI can display "X sources" to show grounding.

4. **Guardrails in RAG context**: The guardrail configuration moves from the top-level Converse API `guardrailConfig` parameter to nested inside `generationConfiguration.guardrailConfiguration`. The guardrail evaluates both the input query and the generated output.

5. **Fallback**: Keep the current `bedrock.converse()` code as a fallback if RAG fails (e.g., KB not ready, transient errors).

#### 8. HTML/JS changes

The JavaScript in the embedded HTML needs to:
- Store `sessionId` from responses in `sessionStorage`
- Send `sessionId` (not `history` array) with each POST request
- Remove the `getHistory()` function and client-side history management
- Display citation count in the response metadata
- Clear `sessionId` when "Clear conversation" is clicked
- Update banner from "Bedrock Guardrails" to "Knowledge Base and Guardrails"

### Resource dependency chain

```
KnowledgeBaseBucket ─────────────────────────────┐
                                                  │
KnowledgeBaseVectorBucket                         │
    │                                             │
KnowledgeBaseVectorIndex                          │
    │                                             │
KnowledgeBaseRole ←───── (references both) ───────┘
    │
CouncilKnowledgeBase
    │
CouncilDataSource
    │
SeedData (writes docs + triggers ingestion)
```

`CouncilGuardrail` and `CouncilGuardrailVersion` are independent — they have no dependency on the KB chain and will be created in parallel.

## Prerequisites

1. **ISB SCP update**: Allow `s3vectors:*` actions in sandbox accounts
2. **Bedrock model access**: Enable `amazon.titan-embed-text-v2:0` in sandbox accounts (in addition to the already-enabled `amazon.nova-pro-v1:0`)

## What to update in BLUEPRINT.md

- Add `amazon.titan-embed-text-v2:0` to the model prerequisites
- Update verification steps to check KB status is `ACTIVE` and data source sync completed
- Add note about ingestion time (1-3 minutes after stack creation)

## What to update in walkthrough content

The walkthrough content files were already updated to reference Knowledge Base and RAG in the previous pass. When the KB is implemented, the following should be verified:

- `step-4.njk`: The "Council knowledge base" card currently says "documents stored in S3" — update to describe RAG retrieval from Bedrock KB with vector embeddings
- `step-4.njk`: The "Conversation memory" section currently says "client-side history" — update to describe Bedrock server-side sessionId
- `council-chatbot.yaml`: The console tour "S3 Knowledge Bucket" step should be updated to "Bedrock Knowledge Base" with the console URL `https://console.aws.amazon.com/bedrock/home#/knowledge-bases`
- `council-chatbot.yaml`: The visual architecture tour "Council Documents Loaded" step should describe vector search retrieval
- `index.njk`: The technical staff bullet "Council document retrieval from S3" should become "Bedrock Knowledge Base with RAG retrieval"

## Estimated deployment time

The Knowledge Base and related resources add approximately 3-5 minutes to stack creation:
- S3 Vectors bucket + index: ~30 seconds
- IAM role propagation: ~15 seconds
- Knowledge Base creation: ~30 seconds
- Data Source creation: ~15 seconds
- Document ingestion (12 files): ~1-3 minutes

Total additional time over current template: ~5 minutes. Recommend updating BLUEPRINT.md timeout to 15 minutes.

## Testing checklist

- [ ] Stack creates successfully with all KB resources
- [ ] KB status is `ACTIVE`
- [ ] Data source sync completes (all 12 documents indexed)
- [ ] Council question returns accurate RAG response with citations
- [ ] Follow-up question works via sessionId (server-side memory)
- [ ] Political/medical/off-topic questions blocked by guardrail
- [ ] PII input blocked by guardrail
- [ ] Prompt injection blocked by guardrail
- [ ] "Clear conversation" resets sessionId and starts fresh context
- [ ] Fallback to direct Bedrock call works if RAG fails
- [ ] Stack deletion cleans up all resources including vector bucket/index
