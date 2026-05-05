"""Custom resource Lambda for AWS Connect Cases (CFN doesn't ship native types).

Handles four resource kinds via the connectcases API:
  - Domain   (kind=Domain)   props: Name
  - Field    (kind=Field)    props: DomainId, Name, Type, Description?
  - Layout   (kind=Layout)   props: DomainId, Name, Content (JSON-string Basic block)
  - Template (kind=Template) props: DomainId, Name, LayoutId, RequiredFieldIds[]

Idempotency: ResourceProperties.Kind drives the dispatch. PhysicalResourceId is
the API-returned ID (domainId, fieldId, layoutId, templateId).

Update with a different Name is treated as replacement. The new resource is
created; CFN deletes the old via a separate Delete event.
"""

import json
import logging
import urllib.request

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cases = boto3.client("connectcases")


def handler(event, context):
    request_type = event.get("RequestType", "Create")
    props = event.get("ResourceProperties", {})
    kind = props.get("Kind")
    physical_id = event.get("PhysicalResourceId") or "uninitialised"

    try:
        if request_type == "Delete":
            _delete(kind, physical_id, props)
            return _send(event, context, "SUCCESS", {})

        if request_type == "Create":
            phys_id, data = _create(kind, props)
            return _send(event, context, "SUCCESS", data, physical_id=phys_id)

        if request_type == "Update":
            old_props = event.get("OldResourceProperties", {})
            if _replacement_required(kind, props, old_props):
                phys_id, data = _create(kind, props)
                return _send(event, context, "SUCCESS", data, physical_id=phys_id)
            data = _update(kind, physical_id, props)
            return _send(event, context, "SUCCESS", data, physical_id=physical_id)
    except ClientError as exc:
        return _send(event, context, "FAILED", {},
                     reason=f"{exc.response.get('Error',{}).get('Code','?')}: "
                            f"{exc.response.get('Error',{}).get('Message','')}",
                     physical_id=physical_id)
    except Exception as exc:
        return _send(event, context, "FAILED", {}, reason=str(exc), physical_id=physical_id)


def _create(kind, props):
    if kind == "Domain":
        resp = cases.create_domain(name=props["Name"])
        return resp["domainId"], {"DomainId": resp["domainId"], "DomainArn": resp["domainArn"]}
    if kind == "Field":
        resp = cases.create_field(
            domainId=props["DomainId"],
            name=props["Name"],
            type=props["Type"],
            description=props.get("Description") or "",
        )
        return resp["fieldId"], {"FieldId": resp["fieldId"], "FieldArn": resp["fieldArn"]}
    if kind == "Layout":
        resp = cases.create_layout(
            domainId=props["DomainId"],
            name=props["Name"],
            content=json.loads(props["ContentJson"]) if isinstance(props.get("ContentJson"), str) else props["Content"],
        )
        return resp["layoutId"], {"LayoutId": resp["layoutId"], "LayoutArn": resp["layoutArn"]}
    if kind == "Template":
        required_fields = props.get("RequiredFieldIds") or []
        resp = cases.create_template(
            domainId=props["DomainId"],
            name=props["Name"],
            layoutConfiguration={"defaultLayout": props["LayoutId"]},
            requiredFields=[{"fieldId": fid} for fid in required_fields],
            status="Active",
        )
        return resp["templateId"], {"TemplateId": resp["templateId"], "TemplateArn": resp["templateArn"]}
    raise ValueError(f"unknown Kind: {kind}")


def _update(kind, physical_id, props):
    if kind == "Field":
        cases.update_field(
            domainId=props["DomainId"],
            fieldId=physical_id,
            name=props.get("Name"),
            description=props.get("Description") or "",
        )
        return {"FieldId": physical_id}
    if kind == "Layout":
        cases.update_layout(
            domainId=props["DomainId"],
            layoutId=physical_id,
            name=props.get("Name"),
            content=json.loads(props["ContentJson"]) if isinstance(props.get("ContentJson"), str) else props["Content"],
        )
        return {"LayoutId": physical_id}
    if kind == "Template":
        required_fields = props.get("RequiredFieldIds") or []
        cases.update_template(
            domainId=props["DomainId"],
            templateId=physical_id,
            name=props.get("Name"),
            layoutConfiguration={"defaultLayout": props["LayoutId"]},
            requiredFields=[{"fieldId": fid} for fid in required_fields],
        )
        return {"TemplateId": physical_id}
    if kind == "Domain":
        return {"DomainId": physical_id}
    raise ValueError(f"unknown Kind: {kind}")


def _delete(kind, physical_id, props):
    if physical_id == "uninitialised":
        return
    try:
        if kind == "Domain":
            cases.delete_domain(domainId=physical_id)
        elif kind == "Field":
            cases.delete_field(domainId=props["DomainId"], fieldId=physical_id)
        elif kind == "Layout":
            cases.delete_layout(domainId=props["DomainId"], layoutId=physical_id)
        elif kind == "Template":
            cases.delete_template(domainId=props["DomainId"], templateId=physical_id)
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code in ("ResourceNotFoundException",):
            logger.info("delete skipped (%s) — already gone", code)
            return
        raise


def _replacement_required(kind, new, old) -> bool:
    if kind == "Domain":
        return new.get("Name") != old.get("Name")
    if kind == "Field":
        return new.get("Type") != old.get("Type") or new.get("DomainId") != old.get("DomainId")
    if kind in ("Layout", "Template"):
        return new.get("DomainId") != old.get("DomainId")
    return True


def _send(event, context, status, data, reason=None, physical_id=None):
    body = {
        "Status": status,
        "Reason": reason or f"See {context.log_group_name}/{context.log_stream_name}",
        "PhysicalResourceId": physical_id or event.get("PhysicalResourceId") or "uninitialised",
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
