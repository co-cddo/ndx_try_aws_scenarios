# isb-hub-orgmgmt

CloudFormation stacks that **must** deploy to the AWS Organizations management account, not the ISB hub (568672915267).

SERVICE_MANAGED StackSets with `AutoDeployment` need an org-management-account context to provision instances on OU events. The hub account's CDK app (`cloudformation/isb-hub/`) covers everything else.

## ci-deploy-role-stackset

Creates a StackSet (`Isb-ndx-CIDeployRole`) that auto-deploys `InnovationSandbox-ndx-CIDeployRole` into every account under the Innovation Sandbox parent OU. Per-scenario CI workflows assume this role after acquiring an ISB lease, deploy + tear down their `ndx-try-<scenario>` stack inside the leased pool account, then release the lease.

The role name starts with `InnovationSandbox-ndx-` so it's exempt from SCP `p-tyb1wjxv` (`isb-deny-all-non-control-plane-actions`). Its trust policy only allows `sts:AssumeRole` from the hub-side OIDC role `isb-hub-github-actions-ci-lease` (defined in the hub CDK).

### Deploy

```bash
aws cloudformation deploy \
  --profile NDX/orgManagement \
  --region us-west-2 \
  --stack-name isb-ndx-ci-deploy-role \
  --template-file cloudformation/isb-hub-orgmgmt/ci-deploy-role-stackset/template.yaml \
  --capabilities CAPABILITY_NAMED_IAM
```

After the parent stack reaches `CREATE_COMPLETE`/`UPDATE_COMPLETE`, AWS CloudFormation begins provisioning stack instances to every account in the target OU. With ~1,300 pool accounts this takes 10–20 min wallclock at MaxConcurrentPercentage=100; the underlying role itself is ready per-account as each instance reaches `CURRENT`.

### Verify

```bash
# StackSet exists
aws cloudformation describe-stack-set --stack-set-name Isb-ndx-CIDeployRole \
  --call-as DELEGATED_ADMIN --region us-west-2 --profile NDX/orgManagement

# How many instances are CURRENT?
aws cloudformation list-stack-instances --stack-set-name Isb-ndx-CIDeployRole \
  --call-as DELEGATED_ADMIN --region us-west-2 --profile NDX/orgManagement \
  --query 'length(Summaries[?Status==`CURRENT`])'

# Spot-check the role exists in a specific pool account
isb assign           # claim a sandbox-empty lease
aws iam get-role --role-name InnovationSandbox-ndx-CIDeployRole --profile NDX/SandboxAdmin
isb terminate
```

### Roll-back

```bash
# Drains stack instances first, then deletes the StackSet, then the parent stack.
aws cloudformation delete-stack --profile NDX/orgManagement --region us-west-2 \
  --stack-name isb-ndx-ci-deploy-role
```
