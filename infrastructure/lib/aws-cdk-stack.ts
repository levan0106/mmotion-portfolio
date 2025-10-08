import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface PortfolioStackProps extends cdk.StackProps {
  environment: string;
  domainName?: string;
}

// Default domain configuration
const DEFAULT_DOMAIN = 'mmotion.cloud';

export class PortfolioStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;
  public readonly database: rds.DatabaseInstance;
  public readonly cache: elasticache.CfnCacheCluster;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: PortfolioStackProps) {
    super(scope, id, props);

    // VPC Configuration
    this.vpc = new ec2.Vpc(this, 'PortfolioVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    const cacheSecurityGroup = new ec2.SecurityGroup(this, 'CacheSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ElastiCache',
      allowAllOutbound: false,
    });

    // Security Group Rules
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow traffic from ALB to backend'
    );

    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(3001),
      'Allow traffic from ALB to frontend'
    );

    dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow database access from ECS'
    );

    cacheSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow cache access from ECS'
    );

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'PortfolioCluster', {
      vpc: this.vpc,
      clusterName: `portfolio-cluster-${props.environment}`,
      containerInsights: true,
    });

    // ECR Repositories
    const backendRepo = new ecr.Repository(this, 'BackendRepository', {
      repositoryName: 'portfolio-backend',
      imageScanOnPush: true,
      lifecycleRules: [
        {
          maxImageCount: 10,
          rulePriority: 1,
        },
      ],
    });

    const frontendRepo = new ecr.Repository(this, 'FrontendRepository', {
      repositoryName: 'portfolio-frontend',
      imageScanOnPush: true,
      lifecycleRules: [
        {
          maxImageCount: 10,
          rulePriority: 1,
        },
      ],
    });

    // Secrets Manager
    const databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `portfolio/database-url-${props.environment}`,
      description: 'Database connection string for Portfolio Management System',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'postgres',
        }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    const redisSecret = new secretsmanager.Secret(this, 'RedisSecret', {
      secretName: `portfolio/redis-url-${props.environment}`,
      description: 'Redis connection string for Portfolio Management System',
      secretStringValue: cdk.SecretValue.unsafePlainText('redis://localhost:6379'),
    });

    // RDS Database
    this.database = new rds.DatabaseInstance(this, 'PortfolioDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_11,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      databaseName: 'portfolio_db',
      credentials: rds.Credentials.fromSecret(databaseSecret),
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: props.environment === 'production',
      multiAz: props.environment === 'production',
      storageEncrypted: true,
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      removalPolicy: props.environment === 'production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // ElastiCache Redis
    const cacheSubnetGroup = new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
      description: 'Subnet group for ElastiCache',
      subnetIds: this.vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    this.cache = new elasticache.CfnCacheCluster(this, 'PortfolioCache', {
      cacheNodeType: 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [cacheSecurityGroup.securityGroupId],
      cacheSubnetGroupName: cacheSubnetGroup.ref,
    });

    // CloudWatch Log Groups
    const backendLogGroup = new logs.LogGroup(this, 'BackendLogGroup', {
      logGroupName: `/ecs/portfolio-backend-${props.environment}`,
      retention: logs.RetentionDays.ONE_MONTH,
    });

    const frontendLogGroup = new logs.LogGroup(this, 'FrontendLogGroup', {
      logGroupName: `/ecs/portfolio-frontend-${props.environment}`,
      retention: logs.RetentionDays.ONE_MONTH,
    });

    // IAM Roles
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant permissions to secrets
    databaseSecret.grantRead(taskExecutionRole);
    redisSecret.grantRead(taskExecutionRole);

    // ECS Task Definitions
    const backendTaskDefinition = new ecs.FargateTaskDefinition(this, 'BackendTaskDefinition', {
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    const frontendTaskDefinition = new ecs.FargateTaskDefinition(this, 'FrontendTaskDefinition', {
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole: taskExecutionRole,
    });

    // Backend Container
    const backendContainer = backendTaskDefinition.addContainer('BackendContainer', {
      image: ecs.ContainerImage.fromEcrRepository(backendRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ecs',
        logGroup: backendLogGroup,
      }),
      environment: {
        NODE_ENV: props.environment,
        PORT: '3000',
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(databaseSecret, 'connectionString'),
        REDIS_URL: ecs.Secret.fromSecretsManager(redisSecret),
      },
    });

    backendContainer.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // Frontend Container
    const frontendContainer = frontendTaskDefinition.addContainer('FrontendContainer', {
      image: ecs.ContainerImage.fromEcrRepository(frontendRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ecs',
        logGroup: frontendLogGroup,
      }),
      environment: {
        VITE_API_URL: `https://api.${props.domainName || DEFAULT_DOMAIN}`,
        VITE_ENV: props.environment,
      },
    });

    frontendContainer.addPortMappings({
      containerPort: 3001,
      protocol: ecs.Protocol.TCP,
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'PortfolioALB', {
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    // Target Groups
    const backendTargetGroup = new elbv2.ApplicationTargetGroup(this, 'BackendTargetGroup', {
      vpc: this.vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        enabled: true,
        path: '/health',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    const frontendTargetGroup = new elbv2.ApplicationTargetGroup(this, 'FrontendTargetGroup', {
      vpc: this.vpc,
      port: 3001,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        enabled: true,
        path: '/',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // Load Balancer Listeners
    const httpListener = this.loadBalancer.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // HTTPS Listener (requires SSL certificate)
    const httpsListener = this.loadBalancer.addListener('HTTPSListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      defaultAction: elbv2.ListenerAction.forward([frontendTargetGroup]),
    });

    // Add routing rules
    httpsListener.addAction('BackendRouting', {
      priority: 1,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/api/*']),
      ],
      action: elbv2.ListenerAction.forward([backendTargetGroup]),
    });

    // ECS Services
    const backendService = new ecs.FargateService(this, 'BackendService', {
      cluster: this.cluster,
      taskDefinition: backendTaskDefinition,
      desiredCount: props.environment === 'production' ? 3 : 1,
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    const frontendService = new ecs.FargateService(this, 'FrontendService', {
      cluster: this.cluster,
      taskDefinition: frontendTaskDefinition,
      desiredCount: props.environment === 'production' ? 2 : 1,
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Attach services to target groups
    backendService.attachToApplicationTargetGroup(backendTargetGroup);
    frontendService.attachToApplicationTargetGroup(frontendTargetGroup);

    // Auto Scaling
    const backendScaling = backendService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: props.environment === 'production' ? 10 : 3,
    });

    backendScaling.scaleOnCpuUtilization('BackendCpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300),
    });

    // S3 Bucket for static assets
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `portfolio-assets-${props.environment}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.environment === 'production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // SSL Certificate for mmotion.cloud
    const certificate = new acm.Certificate(this, 'PortfolioCertificate', {
      domainName: props.domainName || DEFAULT_DOMAIN,
      subjectAlternativeNames: [
        `api.${props.domainName || DEFAULT_DOMAIN}`,
        `staging.${props.domainName || DEFAULT_DOMAIN}`,
      ],
      validation: acm.CertificateValidation.fromDns(),
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'PortfolioDistribution', {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(this.loadBalancer),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.LoadBalancerV2Origin(this.loadBalancer),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        },
      },
      domainNames: [props.domainName || DEFAULT_DOMAIN, `api.${props.domainName || DEFAULT_DOMAIN}`],
      certificate: certificate,
    });

    // CloudWatch Alarms
    const highCpuAlarm = new cdk.aws_cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: this.cluster.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'High CPU utilization in ECS cluster',
    });

    const highMemoryAlarm = new cdk.aws_cloudwatch.Alarm(this, 'HighMemoryAlarm', {
      metric: this.cluster.metricMemoryUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'High memory utilization in ECS cluster',
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'CacheEndpoint', {
      value: this.cache.attrRedisEndpointAddress,
      description: 'ElastiCache Redis endpoint',
    });

    new cdk.CfnOutput(this, 'BackendRepositoryURI', {
      value: backendRepo.repositoryUri,
      description: 'ECR repository URI for backend',
    });

    new cdk.CfnOutput(this, 'FrontendRepositoryURI', {
      value: frontendRepo.repositoryUri,
      description: 'ECR repository URI for frontend',
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
    });
  }
}
