"""Connect/Wisdom/CustomerProfiles bootstrap custom-resource Lambda.

Single Lambda handling three CFN custom resources (selected by Action
property) to wire up things CloudFormation doesn't support natively:

  Action="AgentSecurityProfilePermissions"
    Looks up the auto-created "Agent" SecurityProfile by name and updates its
    permissions to include CCP widgets (CustomerProfiles, Cases, Wisdom,
    QConnect).

  Action="CustomerProfilesPutIntegration"
    Calls customer-profiles:put_integration on the domain so inbound contacts
    auto-associate to existing profiles via the CTR object type. CFN's
    AWS::Connect::IntegrationAssociation enum doesn't include
    CUSTOMER_PROFILES so we use the CP-side API.

  Action="WisdomContentUpload"
    Uploads every markdown file from an S3 prefix into a Q in Connect KB.
    Lists S3 keys, calls start_content_upload + presigned PUT + create_content
    per doc. Idempotent: skips contents whose name already exists.

All three handlers are idempotent on Update and no-op on Delete (we leave the
state in place so the stack delete sequence doesn't fight Wisdom soft-delete
windows; the parent KB / SecurityProfile resources clean themselves up).
"""

import json
import logging
import os
import urllib.request

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

connect = boto3.client("connect")
profiles = boto3.client("customer-profiles")
qconnect = boto3.client("qconnect")
s3 = boto3.client("s3")


def handler(event, context):
    request_type = event.get("RequestType", "Create")
    props = event.get("ResourceProperties", {}) or {}
    action = props.get("Action", "")
    physical_id = event.get("PhysicalResourceId") or f"bootstrap-{action}"

    try:
        if request_type == "Delete":
            # Wisdom KB cannot be deleted while content exists — clear it first so the
            # parent AWS::Wisdom::KnowledgeBase resource can delete cleanly.
            if action == "WisdomContentUpload":
                _wisdom_clear_contents(props)
            elif action == "ConnectIntegrationAssociation":
                _, _ = _connect_ia(props, event, request_type, physical_id)
            return _send(event, context, "SUCCESS", {}, physical_id=physical_id)

        if action == "AgentSecurityProfilePermissions":
            data = _agent_perms(props)
        elif action == "CustomerProfilesPutIntegration":
            data = _cp_put_integration(props)
        elif action == "WisdomContentUpload":
            data = _wisdom_content_upload(props)
        elif action == "ConnectIntegrationAssociation":
            data, physical_id = _connect_ia(props, event, request_type, physical_id)
        elif action == "WisdomDefaultAIAgent":
            data = _wisdom_default_aiagent(props)
        elif action == "CustomerProfilesObjectType":
            data = _cp_object_type(props, request_type)
        elif action == "LookupPrompt":
            data = _lookup_prompt(props)
        elif action == "LookupQueue":
            data = _lookup_queue(props)
        else:
            return _send(event, context, "FAILED", {},
                         reason=f"Unknown Action: {action!r}", physical_id=physical_id)

        return _send(event, context, "SUCCESS", data, physical_id=physical_id)
    except Exception as exc:
        logger.exception("bootstrap action %s failed: %s", action, exc)
        return _send(event, context, "FAILED", {}, reason=str(exc)[:1024], physical_id=physical_id)


def _lookup_prompt(props):
    """Resolve a Connect prompt ARN by exact name. AWS auto-creates standard
    prompts (e.g. "Default queue prompt") on every fresh instance with new
    UUIDs, so flows that reference one need a runtime lookup instead of a
    hardcoded ARN."""
    instance_id = props["InstanceId"]
    name = props["PromptName"]
    paginator = connect.get_paginator("list_prompts")
    for page in paginator.paginate(InstanceId=instance_id):
        for p in page.get("PromptSummaryList") or []:
            if p.get("Name") == name:
                return {"Arn": p["Arn"], "Id": p["Id"], "Name": name}
    raise RuntimeError(f"Prompt {name!r} not found in instance {instance_id}")


def _lookup_queue(props):
    """Resolve a Connect queue ARN by exact name. The BasicQueue auto-created
    on every fresh instance gets a new UUID each time, so flows that reference
    it need a runtime lookup instead of a hardcoded GUID."""
    instance_id = props["InstanceId"]
    name = props.get("QueueName", "BasicQueue")
    paginator = connect.get_paginator("list_queues")
    for page in paginator.paginate(InstanceId=instance_id, QueueTypes=["STANDARD"]):
        for q in page.get("QueueSummaryList") or []:
            if q.get("Name") == name:
                return {"Arn": q["Arn"], "Id": q["Id"], "Name": name}
    raise RuntimeError(f"Queue {name!r} not found in instance {instance_id}")


def _connect_ia(props, event, request_type, current_physical_id):
    """Create/Delete a Connect IntegrationAssociation. Used for types CFN doesn't
    support natively (e.g. WISDOM_ASSISTANT, WISDOM_KNOWLEDGE_BASE)."""
    instance_id = props["InstanceId"]
    integration_type = props["IntegrationType"]
    integration_arn = props["IntegrationArn"]
    if request_type == "Delete":
        if current_physical_id and current_physical_id != "uninitialised":
            try:
                connect.delete_integration_association(
                    InstanceId=instance_id, IntegrationAssociationId=current_physical_id,
                )
            except ClientError as exc:
                if exc.response.get("Error", {}).get("Code") not in ("ResourceNotFoundException",):
                    raise
        return {}, current_physical_id

    # Create or Update — for Update we leave the existing association in place if the ARN
    # hasn't changed; otherwise we delete + recreate.
    if request_type == "Update" and current_physical_id and current_physical_id != "uninitialised":
        try:
            existing = connect.list_integration_associations(InstanceId=instance_id)
            for ia in existing.get("IntegrationAssociationSummaryList", []):
                if ia["IntegrationAssociationId"] == current_physical_id:
                    if ia["IntegrationArn"] == integration_arn:
                        return {"IntegrationAssociationId": current_physical_id}, current_physical_id
                    # Different ARN — delete the old one and continue to recreate.
                    connect.delete_integration_association(
                        InstanceId=instance_id, IntegrationAssociationId=current_physical_id,
                    )
                    break
        except ClientError:
            pass

    resp = connect.create_integration_association(
        InstanceId=instance_id,
        IntegrationType=integration_type,
        IntegrationArn=integration_arn,
    )
    new_id = resp["IntegrationAssociationId"]
    return {"IntegrationAssociationId": new_id}, new_id


def _agent_perms(props):
    instance_id = props["InstanceId"]
    profile_name = props.get("SecurityProfileName", "Agent")
    desired = props["Permissions"]
    applications_raw = props.get("Applications") or []
    # CFN can pass nested objects but always serialises ints/bools to strings;
    # filter out empties and normalise.
    applications = []
    for app in applications_raw:
        ns = (app or {}).get("Namespace")
        perms = (app or {}).get("ApplicationPermissions") or []
        if ns:
            applications.append({"Namespace": ns, "ApplicationPermissions": list(perms)})

    sp_id = ""
    paginator = connect.get_paginator("list_security_profiles")
    for page in paginator.paginate(InstanceId=instance_id):
        for sp in page.get("SecurityProfileSummaryList", []):
            if sp.get("Name") == profile_name:
                sp_id = sp["Id"]
                break
        if sp_id:
            break
    if not sp_id:
        raise RuntimeError(f"SecurityProfile {profile_name!r} not found in instance {instance_id}")

    update_kwargs = dict(InstanceId=instance_id, SecurityProfileId=sp_id, Permissions=desired)
    if applications:
        update_kwargs["Applications"] = applications
    connect.update_security_profile(**update_kwargs)
    return {
        "SecurityProfileId": sp_id,
        "PermissionsCount": str(len(desired)),
        "ApplicationsCount": str(len(applications)),
    }


def _cp_put_integration(props):
    domain_name = props["DomainName"]
    instance_arn = props["InstanceArn"]
    object_type = props.get("ObjectTypeName", "CTR")

    profiles.put_integration(
        DomainName=domain_name, Uri=instance_arn, ObjectTypeName=object_type,
    )
    return {"DomainName": domain_name, "ObjectTypeName": object_type}


def _wisdom_default_aiagent(props):
    """Set a Q in Connect AI Agent as the assistant's default for the given type
    (typically ANSWER_RECOMMENDATION). CFN's AWS::Wisdom::AIAgent doesn't bind
    the agent as a default — that's a separate qconnect:UpdateAssistantAIAgent."""
    assistant_id = props["AssistantId"]
    agent_id = props["AIAgentId"]
    agent_type = props.get("AIAgentType", "ANSWER_RECOMMENDATION")
    qconnect.update_assistant_ai_agent(
        assistantId=assistant_id,
        aiAgentType=agent_type,
        configuration={"aiAgentId": agent_id},
    )
    return {"AssistantId": assistant_id, "AIAgentId": agent_id, "Type": agent_type}


def _cp_object_type(props, request_type):
    """Create a Customer Profiles ObjectType from an AWS-provided template (e.g.
    `CTR-NoInferred` so Connect contacts auto-associate to existing profiles
    without inferring stub profiles). Idempotent on Update; Delete is no-op
    because the parent Domain delete cascades it."""
    domain_name = props["DomainName"]
    template_id = props["TemplateId"]
    object_type_name = props["ObjectTypeName"]

    if request_type == "Delete":
        return {}

    # Idempotent: put_profile_object_type_template makes a domain-local copy
    # under our chosen ObjectTypeName. PutProfileObjectType lets us name it.
    profiles.put_profile_object_type(
        DomainName=domain_name,
        ObjectTypeName=object_type_name,
        Description=f"Profile object type from template {template_id}",
        TemplateId=template_id,
    )
    return {"ObjectTypeName": object_type_name, "TemplateId": template_id}


def _wisdom_clear_contents(props):
    """Delete every content item from the Wisdom KB so the parent resource
    can be deleted cleanly. Safe to call on a missing KB (catches errors)."""
    kb_id = props.get("KnowledgeBaseId", "")
    if not kb_id:
        return
    try:
        pag = qconnect.get_paginator("list_contents")
        deleted = 0
        for page in pag.paginate(knowledgeBaseId=kb_id):
            for c in page.get("contentSummaries", []):
                try:
                    qconnect.delete_content(knowledgeBaseId=kb_id, contentId=c["contentId"])
                    deleted += 1
                except ClientError as exc:
                    if exc.response.get("Error", {}).get("Code") not in ("ResourceNotFoundException",):
                        raise
        logger.info("Cleared %d Wisdom contents from %s", deleted, kb_id)
    except ClientError as exc:
        logger.warning("Wisdom clear-contents failed (may already be gone): %s", exc)


def _wisdom_content_upload(props):
    kb_id = props["KnowledgeBaseId"]
    bucket = props["SourceBucket"]
    prefix = props.get("SourcePrefix", "")

    existing = set()
    pag = qconnect.get_paginator("list_contents")
    for page in pag.paginate(knowledgeBaseId=kb_id):
        for c in page.get("contentSummaries", []):
            existing.add(c["name"])

    s3_pag = s3.get_paginator("list_objects_v2")
    uploaded, skipped = 0, 0
    for page in s3_pag.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []) or []:
            key = obj["Key"]
            if not key.lower().endswith((".md", ".txt", ".html")):
                continue
            name = os.path.basename(key).rsplit(".", 1)[0]
            if name in existing:
                skipped += 1
                continue
            body = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
            content_type = "text/plain" if key.endswith((".md", ".txt")) else "text/html"
            up = qconnect.start_content_upload(
                knowledgeBaseId=kb_id,
                contentType=content_type,
                presignedUrlTimeToLive=60,
            )
            req = urllib.request.Request(up["url"], data=body, method="PUT")
            for h, v in (up.get("headersToInclude") or {}).items():
                req.add_header(h, v)
            with urllib.request.urlopen(req, timeout=30) as r:
                if r.status >= 300:
                    raise RuntimeError(f"Presigned PUT for {key} returned {r.status}")
            try:
                qconnect.create_content(
                    knowledgeBaseId=kb_id,
                    name=name,
                    title=name.replace("-", " ").replace("_", " ").title()[:100],
                    uploadId=up["uploadId"],
                )
                uploaded += 1
            except qconnect.exceptions.ConflictException:
                skipped += 1
    return {"Uploaded": str(uploaded), "Skipped": str(skipped)}


def _send(event, context, status, data, reason=None, physical_id=None):
    body = {
        "Status": status,
        "Reason": reason or f"See {context.log_group_name}/{context.log_stream_name}",
        "PhysicalResourceId": physical_id or event.get("PhysicalResourceId") or "uninitialised",
        "StackId": event["StackId"],
        "RequestId": event["RequestId"],
        "LogicalResourceId": event["LogicalResourceId"],
        "Data": data,
    }
    payload = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(event["ResponseURL"], data=payload, method="PUT")
    req.add_header("content-type", "")
    req.add_header("content-length", str(len(payload)))
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            logger.info("cfn-response %s: %s", status, resp.status)
    except Exception as exc:
        logger.exception("cfn-response send failed: %s", exc)
    return body
