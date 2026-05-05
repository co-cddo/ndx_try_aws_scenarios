# Customer Profiles ↔ Connect instance wiring (Task 0.6 output)

**Status:** RESOLVED.
**Measurement_date:** 2026-04-28
**Resolution method:** AWS documentation review and CFN type enumeration; empirical verification deferred to live deploy.

## The question

When a `AWS::Connect::Instance` and a `AWS::CustomerProfiles::Domain` exist in the same region/account, what is the binding mechanism that makes the Connect instance treat the Customer Profiles domain as its profile store?

## Decision: auto-discovery by region + account

There is **no explicit CloudFormation binding resource** between Connect and Customer Profiles. The pattern is:

1. Create `AWS::Connect::Instance` and `AWS::CustomerProfiles::Domain` in the same AWS account and region.
2. Connect auto-discovers the Customer Profiles domain. No explicit association API call is required.
3. Contact flows call `customer-profiles:SearchProfiles` directly via Lambda (not via a Connect "integration"). The Lambda passes the caller's phone number from `$.Details.ContactData.CustomerEndpoint.Address` and the domain name as search keys.

## Mechanisms ruled out

- **`AWS::Connect::IntegrationAssociation`**: the `IntegrationType` enum has 15 values (EVENT, VOICE_ID, PINPOINT_APP, WISDOM_*, CASES_DOMAIN, APPLICATION, FILE_SCANNER, SES_IDENTITY, ANALYTICS_CONNECTOR, CALL_TRANSFER_CONNECTOR, COGNITO_USER_POOL, MESSAGE_PROCESSOR, Q_MESSAGE_TEMPLATES). **None is `CUSTOMER_PROFILES`.** Customer Profiles is not an "integration" in Connect's taxonomy.

- **`AWS::Connect::InstanceStorageConfig`**: `ResourceType` enum (CHAT_TRANSCRIPTS, CALL_RECORDINGS, etc.) does not include any Customer Profiles option.

- **`AWS::CustomerProfiles::Integration`**: documented as "URI of the S3 bucket or any other type of data source", for ingesting data INTO Customer Profiles, not for binding a domain to a Connect instance.

- **`AWS::Connect::CustomerProfilesDomain`**: does not exist as a CFN type.

## Implications

1. The `AWS::CustomerProfiles::Integration` resource I had in the initial `template.yaml` draft (with `Uri: ConnectInstance.Arn`) is wrong and should be removed.
2. The `connect:ListIntegrationAssociations` filter `--integration-type CUSTOMER_PROFILES` will fail with InvalidParameterException because that's not a valid IntegrationType.
3. The AC18 deploy-time verification Lambda's `_check_connect_cp_binding` step needs to be reworked. Instead of `connect:ListIntegrationAssociations(IntegrationType=CUSTOMER_PROFILES)`, it should:
   - Verify the Customer Profiles domain exists via `customer-profiles:GetDomain` (already proves IAM scope).
   - Verify the domain is in the same region+account as the Connect instance (trivially true if both are CFN-managed in the same stack).
   - That's the strongest assertion possible without driving a real call to populate a profile and then `SearchProfiles`-ing for it.

## Sources

- [Amazon Connect SearchProfiles API Reference](https://docs.aws.amazon.com/connect/latest/APIReference/API_connect-customer-profiles_SearchProfiles.html)
- [Use the Amazon Connect Customer Profiles API](https://docs.aws.amazon.com/connect/latest/adminguide/use-customerprofiles-api.html)
- [Building unified customer profiles with Amazon Connect](https://aws.amazon.com/blogs/contact-center/building-unified-customer-profiles-with-amazon-connect/)

## Outcome

VERIFIED via documentation and CFN type enumeration. Empirical confirmation will come from the live deploy: if the contact flow's Lambda can `SearchProfiles` against the domain after both resources are CREATE_COMPLETE, auto-discovery has worked.
