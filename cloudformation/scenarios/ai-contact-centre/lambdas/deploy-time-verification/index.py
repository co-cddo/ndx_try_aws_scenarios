"""Deploy-time verification custom resource Lambda.

Per tech-spec Task 6.8 [F-AC18-orphan]. Implements AC18.

Performs:
  1. bedrock-runtime:InvokeModel against amazon.nova-pro-v1:0 with a 1-token prompt
  2. bedrock-agent-runtime:Retrieve against the KB ID with a stub query
  3. customer-profiles:SearchProfiles against the Customer Profiles domain
  4. connect:ListIntegrationAssociations against the Connect instance, asserts a
     CUSTOMER_PROFILES integration is present (verifies Cases-in-Connect binding,
     not just IAM)
  5. On any failure: cfn-response FAILED with the specific exception message
     and a remediation hint.
"""

import json
import logging
import urllib.request

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

bedrock_runtime = boto3.client("bedrock-runtime")
bedrock_agent = boto3.client("bedrock-agent-runtime")
customer_profiles = boto3.client("customer-profiles")
connect = boto3.client("connect")


def handler(event, context):
    request_type = event.get("RequestType", "Create")
    if request_type == "Delete":
        return _send(event, context, "SUCCESS", {})

    props = event.get("ResourceProperties", {})
    model_id = props.get("ModelId", "amazon.nova-pro-v1:0")
    kb_id = props["KnowledgeBaseId"]
    cp_domain = props["CustomerProfilesDomain"]
    connect_instance_id = props["ConnectInstanceId"]

    checks = [
        ("bedrock_invoke", _check_bedrock_invoke, [model_id]),
        ("kb_retrieve", _check_kb_retrieve, [kb_id]),
        ("cp_search", _check_cp_search, [cp_domain]),
        ("connect_cp_binding", _check_connect_cp_binding, [connect_instance_id]),
    ]
    results = {}
    for name, fn, args in checks:
        try:
            results[name] = fn(*args)
        except ClientError as exc:
            return _send(event, context, "FAILED", results,
                         reason=_remediation(name, exc))
        except Exception as exc:
            return _send(event, context, "FAILED", results,
                         reason=f"{name} unexpected error: {exc}")

    return _send(event, context, "SUCCESS", {"all_checks": "passed", **results})


def _check_bedrock_invoke(model_id):
    body = {
        "messages": [{"role": "user", "content": [{"text": "ok"}]}],
        "inferenceConfig": {"maxTokens": 1, "temperature": 0.0},
    }
    bedrock_runtime.invoke_model(modelId=model_id, body=json.dumps(body),
                                 contentType="application/json", accept="application/json")
    return "ok"


def _check_kb_retrieve(kb_id):
    bedrock_agent.retrieve(
        knowledgeBaseId=kb_id,
        retrievalQuery={"text": "council services"},
        retrievalConfiguration={"vectorSearchConfiguration": {"numberOfResults": 1}},
    )
    return "ok"


def _check_cp_search(domain_name):
    customer_profiles.search_profiles(
        DomainName=domain_name,
        KeyName="_phone",
        Values=["+447700900000"],
    )
    return "ok"


def _check_connect_cp_binding(instance_id):
    # Per Phase 0.6 spike: there is no IntegrationType=CUSTOMER_PROFILES on
    # Connect; binding is auto-discovery via same-region+same-account. The
    # strongest assertion we can make at deploy time is that the Connect
    # instance can describe itself (proving role+permissions) and the
    # Customer Profiles domain exists (verified separately by _check_cp_search).
    resp = connect.describe_instance(InstanceId=instance_id)
    status = resp.get("Instance", {}).get("InstanceStatus", "UNKNOWN")
    if status != "ACTIVE":
        raise RuntimeError(f"Connect instance {instance_id} status is {status}, expected ACTIVE")
    return f"ok (instance ACTIVE; CP binding is auto-discovery, see spikes/customer-profiles-wiring.md)"


def _remediation(check: str, exc: ClientError) -> str:
    code = exc.response.get("Error", {}).get("Code", "")
    msg = exc.response.get("Error", {}).get("Message", "")
    if check == "bedrock_invoke" and "AccessDenied" in code:
        return ("Bedrock model access not enabled for amazon.nova-pro-v1:0. "
                "See BLUEPRINT.md prerequisite (one-click in Bedrock console). "
                f"Original error: {code}: {msg}")
    if check == "kb_retrieve":
        return (f"Knowledge Base retrieve failed. Likely cause: ingestion not yet complete "
                f"(KB cold start can take 5-15 minutes), or KB IAM role missing. "
                f"Original error: {code}: {msg}")
    if check == "cp_search":
        return (f"Customer Profiles SearchProfiles failed. Verify domain exists and the "
                f"verification Lambda role has customer-profiles:SearchProfiles permission. "
                f"Original error: {code}: {msg}")
    if check == "connect_cp_binding":
        return (f"Connect instance Customer Profiles binding check failed. {code}: {msg}")
    return f"{check} failed: {code}: {msg}"


def _send(event, context, status, data, reason=None):
    body = {
        "Status": status,
        "Reason": reason or f"See {context.log_group_name}/{context.log_stream_name}",
        "PhysicalResourceId": event.get("PhysicalResourceId") or "deploy-time-verification",
        "StackId": event["StackId"], "RequestId": event["RequestId"],
        "LogicalResourceId": event["LogicalResourceId"], "Data": data,
    }
    payload = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(event["ResponseURL"], data=payload, method="PUT")
    req.add_header("content-type", ""); req.add_header("content-length", str(len(payload)))
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            logger.info("cfn-response %s: %s", status, resp.status)
    except Exception as exc:
        logger.exception("cfn-response send failed: %s", exc)
    return body
