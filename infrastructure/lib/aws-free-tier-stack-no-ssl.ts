import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface FreeTierStackProps extends cdk.StackProps {
  domainName?: string;
}

export class FreeTierStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly ec2Instance: ec2.Instance;
  public readonly database: rds.DatabaseInstance;
  public readonly cache: elasticache.CfnCacheCluster;
  public readonly frontendBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: FreeTierStackProps) {
    super(scope, id, props);

    // VPC with 2 public subnets (Free Tier requirement)
    this.vpc = new ec2.Vpc(this, 'PortfolioVPC', {
      maxAzs: 2,
      natGateways: 0, // No NAT Gateway for Free Tier
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet1',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PublicSubnet2',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Security Groups
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for EC2 instance',
      allowAllOutbound: true,
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
    });

    const cacheSecurityGroup = new ec2.SecurityGroup(this, 'CacheSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ElastiCache',
    });

    // Allow EC2 to access RDS
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow EC2 to access RDS'
    );

    // Allow EC2 to access ElastiCache
    cacheSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(6379),
      'Allow EC2 to access ElastiCache'
    );

    // Allow HTTP/HTTPS from anywhere
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH from anywhere'
    );

    // IAM Role for EC2
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'),
      ],
    });

    // EC2 Instance
    this.ec2Instance = new ec2.Instance(this, 'PortfolioEC2', {
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      keyName: 'portfolio-key', // You'll need to create this key pair
    });

    // Database Secret
    const databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: 'Database credentials for Portfolio application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'portfolio' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // RDS Database
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
      credentials: rds.Credentials.fromSecret(databaseSecret),
      databaseName: 'portfolio',
      deletionProtection: false,
      backupRetention: cdk.Duration.days(1),
      deleteAutomatedBackups: true,
    });


    // ElastiCache Redis
    this.cache = new elasticache.CfnCacheCluster(this, 'PortfolioCache', {
      cacheNodeType: 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [cacheSecurityGroup.securityGroupId],
      cacheSubnetGroupName: new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
        description: 'Subnet group for ElastiCache',
        subnetIds: this.vpc.publicSubnets.map(subnet => subnet.subnetId),
      }).ref,
    });

    // S3 Bucket for Frontend
    this.frontendBucket = new s3.Bucket(this, 'PortfolioFrontendBucket', {
      bucketName: `portfolio-frontend-${this.account}-${this.region}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Distribution (without SSL)
    this.distribution = new cloudfront.Distribution(this, 'PortfolioDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
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
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

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
      description: 'S3 Bucket for Frontend',
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
      value: databaseSecret.secretArn,
      description: 'Database Secret ARN',
    });
  }
}
