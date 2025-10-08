import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface FreeTierStackProps extends cdk.StackProps {
  environment: string;
  domainName?: string;
}

// Default domain configuration
const DEFAULT_DOMAIN = 'mmotion.cloud';

export class FreeTierStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly ec2Instance: ec2.Instance;
  public readonly database: rds.DatabaseInstance;
  public readonly cache: elasticache.CfnCacheCluster;
  public readonly frontendBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: FreeTierStackProps) {
    super(scope, id, props);

    // VPC Configuration (Free Tier compatible)
    this.vpc = new ec2.Vpc(this, 'PortfolioVPC', {
      maxAzs: 2, // Free Tier allows 2 AZs
      natGateways: 0, // No NAT Gateway to save costs
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Security Group for EC2 Instance
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for EC2 instance',
      allowAllOutbound: true,
    });

    // Allow HTTP/HTTPS from anywhere
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP'
    );
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS'
    );
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH'
    );

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS instance',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL from EC2
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from EC2'
    );

    // Security Group for ElastiCache
    const cacheSecurityGroup = new ec2.SecurityGroup(this, 'CacheSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ElastiCache',
      allowAllOutbound: false,
    });

    // Allow Redis from EC2
    cacheSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Redis from EC2'
    );

    // IAM Role for EC2 Instance
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // Add permissions for Secrets Manager
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: ['*'],
      })
    );

    // User Data Script for EC2 Instance
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y docker',
      'systemctl start docker',
      'systemctl enable docker',
      'usermod -a -G docker ec2-user',
      'yum install -y nginx',
      'systemctl start nginx',
      'systemctl enable nginx',
      'yum install -y git',
      'curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -',
      'yum install -y nodejs',
      'npm install -g pm2',
      'mkdir -p /opt/portfolio',
      'chown ec2-user:ec2-user /opt/portfolio'
    );

    // EC2 Instance (Free Tier: t2.micro)
    this.ec2Instance = new ec2.Instance(this, 'PortfolioEC2', {
      vpc: this.vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: userData,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      keyName: 'portfolio-key', // You need to create this key pair
    });

    // Database Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: this.vpc,
      description: 'Subnet group for RDS instance',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Database Secret
    const dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: 'Database credentials for Portfolio Management System',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // RDS Instance (Free Tier: t2.micro)
    this.database = new rds.DatabaseInstance(this, 'PortfolioDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroups: [rdsSecurityGroup],
      subnetGroup: dbSubnetGroup,
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: 'portfolio_db',
      allocatedStorage: 20, // Free Tier: 20GB
      maxAllocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      backupRetention: cdk.Duration.days(1), // Free Tier: 1 day
      deleteAutomatedBackups: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ElastiCache Subnet Group
    const cacheSubnetGroup = new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
      description: 'Subnet group for ElastiCache',
      subnetIds: this.vpc.publicSubnets.map(subnet => subnet.subnetId),
    });

    // ElastiCache Cluster (Free Tier: cache.t2.micro)
    this.cache = new elasticache.CfnCacheCluster(this, 'PortfolioCache', {
      cacheNodeType: 'cache.t2.micro',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [cacheSecurityGroup.securityGroupId],
      cacheSubnetGroupName: cacheSubnetGroup.ref,
    });

    // S3 Bucket for Frontend (Free Tier: 5GB)
    this.frontendBucket = new s3.Bucket(this, 'PortfolioFrontendBucket', {
      bucketName: `portfolio-frontend-${props.environment}-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Distribution (Free Tier: 1TB transfer/month)
    this.distribution = new cloudfront.Distribution(this, 'PortfolioDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Cheapest option
    });

    // Route 53 Hosted Zone (if domain is provided)
    if (props.domainName) {
      const hostedZone = new route53.HostedZone(this, 'PortfolioHostedZone', {
        zoneName: props.domainName,
      });

      // SSL Certificate
      const certificate = new acm.Certificate(this, 'PortfolioCertificate', {
        domainName: props.domainName,
        subjectAlternativeNames: [`api.${props.domainName}`],
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });

      // CloudFront Distribution with custom domain
      const customDistribution = new cloudfront.Distribution(this, 'PortfolioCustomDistribution', {
        defaultBehavior: {
          origin: new origins.S3Origin(this.frontendBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        defaultRootObject: 'index.html',
        domainNames: [props.domainName],
        certificate: certificate,
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
        ],
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      });

      // Route 53 Records
      new route53.ARecord(this, 'PortfolioARecord', {
        zone: hostedZone,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(customDistribution)
        ),
      });

      new route53.CnameRecord(this, 'PortfolioApiRecord', {
        zone: hostedZone,
        domainName: this.ec2Instance.instancePublicDnsName,
        recordName: `api.${props.domainName}`,
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: this.ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'EC2PublicIP', {
      value: this.ec2Instance.instancePublicIp,
      description: 'EC2 Instance Public IP',
    });

    new cdk.CfnOutput(this, 'EC2PublicDNS', {
      value: this.ec2Instance.instancePublicDnsName,
      description: 'EC2 Instance Public DNS',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'CacheEndpoint', {
      value: this.cache.attrRedisEndpointAddress,
      description: 'ElastiCache Redis Endpoint',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.frontendBucket.bucketName,
      description: 'S3 Frontend Bucket Name',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbSecret.secretArn,
      description: 'Database Secret ARN',
    });
  }
}
