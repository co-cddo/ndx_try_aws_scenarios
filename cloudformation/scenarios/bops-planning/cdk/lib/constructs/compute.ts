import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface BopsResolvedSecrets {
  readonly secretKeyBase: string;
  readonly otpSecretEncryptionKey: string;
  readonly arePrimaryKey: string;
  readonly areDeterministicKey: string;
  readonly areKeySalt: string;
  readonly adminPassword: string;
  readonly apiBearer: string;
}

export interface ComputeConstructProps {
  readonly vpc: ec2.IVpc;
  readonly albSecurityGroup: ec2.ISecurityGroup;
  readonly fargateSecurityGroup: ec2.ISecurityGroup;
  readonly databaseCluster: rds.IDatabaseCluster;
  readonly databaseSecret: secretsmanager.ISecret;
  readonly redisUrl: string;
  readonly uploadsBucket: s3.IBucket;
  readonly secrets: BopsResolvedSecrets;
  readonly osMapApiKeyParam: cdk.CfnParameter;
}

export class ComputeConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly loadBalancerDnsName: string;
  public readonly logGroup: logs.ILogGroup;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: 'NdxBops-Cluster',
    });

    // RETAIN so we can debug failures after rollback
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/ndx-bops/production',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // IAM Roles — ISB SCP requires InnovationSandbox-ndx-* prefix
    const executionRole = new iam.Role(this, 'ExecutionRole', {
      roleName: 'InnovationSandbox-ndx-bops-exec',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });
    props.databaseSecret.grantRead(executionRole);

    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: 'InnovationSandbox-ndx-bops-task',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    props.uploadsBucket.grantReadWrite(taskRole);
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [this.logGroup.logGroupArn],
      }),
    );

    // Shared environment variables
    const dbHost = props.databaseCluster.clusterEndpoint.hostname;
    const dbPort = props.databaseCluster.clusterEndpoint.port.toString();
    const dbUser = props.databaseSecret.secretValueFromJson('username').unsafeUnwrap();
    const dbPassword = props.databaseSecret.secretValueFromJson('password').unsafeUnwrap();

    const databaseUrl = cdk.Fn.join('', [
      'postgres://', dbUser, ':', dbPassword, '@', dbHost, ':', dbPort, '/bops_production',
    ]);

    const applicantsDatabaseUrl = cdk.Fn.join('', [
      'postgres://', dbUser, ':', dbPassword, '@', dbHost, ':', dbPort, '/bops_applicants_production',
    ]);

    // ALB
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      loadBalancerName: 'NdxBops-ALB',
    });
    this.loadBalancerDnsName = this.loadBalancer.loadBalancerDnsName;

    const bopsCommonEnv: Record<string, string> = {
      RAILS_ENV: 'production',
      DATABASE_URL: databaseUrl,
      REDIS_URL: props.redisUrl,
      DB_HOST: dbHost,
      DB_PORT: dbPort,
      DB_USER: dbUser,
      DB_PASSWORD: dbPassword,
      DB_NAME: 'bops_production',
      SECRET_KEY_BASE: props.secrets.secretKeyBase,
      OTP_SECRET_ENCRYPTION_KEY: props.secrets.otpSecretEncryptionKey,
      ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY: props.secrets.arePrimaryKey,
      ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY: props.secrets.areDeterministicKey,
      ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT: props.secrets.areKeySalt,
      DEFAULT_LOCAL_AUTHORITY: 'ndx-demo',
      NOTIFY_API_KEY: 'test-00000000-0000-0000-0000-000000000000-00000000-0000-0000-0000-000000000000',
      NOTIFY_EMAIL_TEMPLATE_ID: '00000000-0000-0000-0000-000000000000',
      NOTIFY_EMAIL_REPLY_TO_ID: '00000000-0000-0000-0000-000000000000',
      NOTIFY_SMS_TEMPLATE_ID: '00000000-0000-0000-0000-000000000000',
      OS_VECTOR_TILES_API_KEY: props.osMapApiKeyParam.valueAsString,
      S3_BUCKET: props.uploadsBucket.bucketName,
      AWS_REGION: cdk.Aws.REGION,
      GROVER_NO_SANDBOX: 'true',
      PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium',
      RAILS_SERVE_STATIC_FILES: 'true',
      RAILS_LOG_TO_STDOUT: 'true',
      BOPS_ENVIRONMENT: 'production',
      ADMIN_PASSWORD: props.secrets.adminPassword,
      API_BEARER: props.secrets.apiBearer,
      DOMAIN: this.loadBalancerDnsName,
      APPLICANTS_DOMAIN: `${this.loadBalancerDnsName}:8080`,
    };

    // BOPS Web (1 vCPU, 2GB) — entrypoint handles DB wait + seed on first boot
    const bopsWebTaskDef = new ecs.FargateTaskDefinition(this, 'BopsWebTaskDef', {
      cpu: 1024,
      memoryLimitMiB: 2048,
      executionRole,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // Boot script runs as ROOT to patch source files, then drops to app user.
    // Patches: routing constraints (single-tenant), SSL disabled (CloudFront handles it),
    // seed with mailer disabled, user confirmation + 2FA bypass.
    const wrapperScript = [
      // Write boot script to /rails/tmp (writable)
      "cat > /rails/tmp/boot.sh << 'BOOTEOF'",
      '#!/bin/bash',
      'set -e',
      'echo "=== BOPS Boot (patched for single-tenant) ==="',
      '',
      '# 1. Patch routing constraints — replace entire file (needs root)',
      'cat > /rails/engines/bops_core/lib/bops_core/routing.rb << \'ROUTINGEOF\'',
      'module BopsCore',
      '  module Routing',
      '    extend ActiveSupport::Concern',
      '    class BopsDomain',
      '      class << self',
      '        def matches?(request) = true',
      '      end',
      '    end',
      '    class ApplicantsDomain',
      '      class << self',
      '        def matches?(request) = false  # Applicants on separate port',
      '      end',
      '    end',
      '    class LocalAuthoritySubdomain',
      '      class << self',
      '        def matches?(request) = request.env["bops.local_authority"].present?',
      '      end',
      '    end',
      '    class ConfigSubdomain',
      '      class << self',
      '        def matches?(request) = request.subdomain == "config"',
      '      end',
      '    end',
      '    class DeviseSubdomain',
      '      class << self',
      '        def matches?(request) = ConfigSubdomain.matches?(request) || request.env["bops.local_authority"].present?',
      '      end',
      '    end',
      '    class PublicSubdomain',
      '      class << self',
      '        def matches?(request) = true',
      '      end',
      '    end',
      '    def bops_domain(&) = constraints(BopsDomain, &)',
      '    def applicants_domain(&) = constraints(ApplicantsDomain, &)',
      '    def local_authority_subdomain(&) = constraints(LocalAuthoritySubdomain, &)',
      '    def config_subdomain(&) = constraints(ConfigSubdomain, &)',
      '    def devise_subdomain(&) = constraints(DeviseSubdomain, &)',
      '    def public_subdomain(&) = constraints(PublicSubdomain, &)',
      '  end',
      'end',
      'ROUTINGEOF',
      'echo "Routing patched."',
      '',
      '# 2. Disable SSL (CloudFront handles HTTPS termination)',
      'sed -i "s/config.assume_ssl = true/config.assume_ssl = false/" /rails/config/environments/production.rb',
      'sed -i "s/config.force_ssl = true/config.force_ssl = false/" /rails/config/environments/production.rb',
      'echo "SSL disabled."',
      '',
      '# 3. Drop to app user for everything below',
      'echo "[1/6] Waiting for database..."',
      'retries=120; count=0',
      'while ! su app -c "pg_isready -h \\"$DB_HOST\\" -p \\"${DB_PORT:-5432}\\" -U \\"$DB_USER\\"" 2>/dev/null; do',
      '  count=$((count + 1))',
      '  if [ "$count" -ge "$retries" ]; then echo "ERROR: Database not available"; exit 1; fi',
      '  echo "Waiting for database (attempt ${count}/${retries})..."; sleep 5',
      'done',
      'echo "Database is ready."',
      '',
      'echo "Testing authentication..."',
      'PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1 || {',
      '  echo "ERROR: Cannot authenticate"; exit 1',
      '}',
      '',
      'echo "Checking database..."',
      'PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres \\',
      '  -tc "SELECT 1 FROM pg_database WHERE datname = \'${DB_NAME:-bops_production}\'" | grep -q 1 || {',
      '  echo "Creating ${DB_NAME:-bops_production}..."',
      '  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres \\',
      '    -c "CREATE DATABASE ${DB_NAME:-bops_production};"',
      '}',
      '',
      'echo "[2/6] PostGIS extensions..."',
      'PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "${DB_NAME:-bops_production}" \\',
      '  -c "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS postgis_topology; CREATE EXTENSION IF NOT EXISTS btree_gin;" 2>&1 || true',
      '',
      'echo "[3/6] Migrations..."',
      'su app -c "bundle exec rails db:migrate" 2>&1',
      '',
      'SEED_MARKER="/tmp/.bops-seeded"',
      'if [ ! -f "$SEED_MARKER" ]; then',
      '  echo "[4/6] Seed data..."',
      "  su app -c \"bundle exec rails runner 'ActionMailer::Base.delivery_method = :test; load Rails.root.join(\\\"db/seeds.rb\\\")' \" 2>&1 || echo 'db:seed skipped'",
      '',
      '  echo "[5/6] Sample data..."',
      "  su app -c \"bundle exec rails runner 'ActionMailer::Base.delivery_method = :test; load Rails.root.join(\\\"scripts/seed_sample_data.rb\\\")' \" 2>&1 || echo 'Sample data skipped'",
      '',
      '  echo "Creating bops_applicants_production..."',
      '  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres \\',
      '    -c "CREATE DATABASE bops_applicants_production;" 2>/dev/null || true',
      '',
      '  touch "$SEED_MARKER"',
      '  echo "Seed complete."',
      'else',
      '  echo "Already seeded."',
      'fi',
      '',
      'echo "[6/6] Starting Puma..."',
      'exec su app -c "bundle exec rails server -b 0.0.0.0 -p ${PORT:-3000}"',
      'BOOTEOF',
      'chmod +x /rails/tmp/boot.sh && exec bash /rails/tmp/boot.sh',
    ].join('\n');

    bopsWebTaskDef.addContainer('bops-web', {
      image: ecs.ContainerImage.fromRegistry('ghcr.io/co-cddo/ndx_try_aws_scenarios-bops:feat-bops-planning'),
      // Run as root so we can patch routing.rb and production.rb, then drop to app user
      user: 'root',
      command: ['bash', '-c', wrapperScript],
      logging: ecs.LogDrivers.awsLogs({ logGroup: this.logGroup, streamPrefix: 'bops-web' }),
      environment: bopsCommonEnv,
      portMappings: [{ containerPort: 3000, protocol: ecs.Protocol.TCP }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/healthcheck || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(300),
      },
    });

    // BOPS-Applicants (0.5 vCPU, 1GB) — needs DB wait too (applicants DB created by web entrypoint)
    const bopsApplicantsTaskDef = new ecs.FargateTaskDefinition(this, 'BopsApplicantsTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    bopsApplicantsTaskDef.addContainer('bops-applicants', {
      image: ecs.ContainerImage.fromRegistry('ghcr.io/co-cddo/ndx_try_aws_scenarios-bops-applicants:feat-bops-planning'),
      // Wait for bops_applicants_production DB to exist (created by web entrypoint seed).
      // Use ruby pg gem directly — no pg_isready/psql in this image.
      // Retry every 15s for up to 12 min (web needs ~5 min to seed + create applicants DB).
      // Port 3000 — the container runs as non-root (app:app) and can't bind to 80
      command: ['bash', '-c', 'echo "Waiting for bops_applicants_production DB to be created by web service..."; for i in $(seq 1 48); do if bundle exec ruby -e "require \'pg\'; PG.connect(ENV[\'DATABASE_URL\'])" 2>/dev/null; then echo "DB ready, starting server"; exec bundle exec rails server -b 0.0.0.0 -p 3000; fi; echo "Attempt $i/48 - DB not ready yet..."; sleep 15; done; echo "Timed out waiting for DB"; exit 1'],
      logging: ecs.LogDrivers.awsLogs({ logGroup: this.logGroup, streamPrefix: 'bops-applicants' }),
      environment: {
        RAILS_ENV: 'production',
        DATABASE_URL: applicantsDatabaseUrl,
        SECRET_KEY_BASE: props.secrets.secretKeyBase,
        API_HOST: this.loadBalancerDnsName,
        PROTOCOL: 'http',
        API_BEARER: props.secrets.apiBearer,
        OS_VECTOR_TILES_API_KEY: props.osMapApiKeyParam.valueAsString,
        RAILS_SERVE_STATIC_FILES: 'true',
        RAILS_LOG_TO_STDOUT: 'true',
        DEFAULT_LOCAL_AUTHORITY: 'ndx-demo',
        DB_HOST: dbHost,
        DB_PORT: dbPort,
        DB_USER: dbUser,
        DB_PASSWORD: dbPassword,
      },
      portMappings: [{ containerPort: 3000, protocol: ecs.Protocol.TCP }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/healthcheck || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(300),
      },
    });

    // ALB Listeners
    const httpListener = this.loadBalancer.addListener('HTTP', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    const applicantsListener = this.loadBalancer.addListener('HTTP8080', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    // ECS Services — no worker for now (add back when core app works)
    const bopsWebService = new ecs.FargateService(this, 'BopsWebService', {
      cluster: this.cluster,
      taskDefinition: bopsWebTaskDef,
      desiredCount: 1,
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
      serviceName: 'NdxBops-Web',
      healthCheckGracePeriod: cdk.Duration.minutes(15),
    });

    const bopsApplicantsService = new ecs.FargateService(this, 'BopsApplicantsService', {
      cluster: this.cluster,
      taskDefinition: bopsApplicantsTaskDef,
      desiredCount: 1,
      securityGroups: [props.fargateSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
      serviceName: 'NdxBops-Applicants',
      healthCheckGracePeriod: cdk.Duration.minutes(15),
    });

    httpListener.addTargets('BopsWebTarget', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [bopsWebService],
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/healthcheck',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200',
      },
    });

    applicantsListener.addTargets('BopsApplicantsTarget', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [bopsApplicantsService],
      deregistrationDelay: cdk.Duration.seconds(30),
      healthCheck: {
        path: '/healthcheck',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200',
      },
    });
  }
}
