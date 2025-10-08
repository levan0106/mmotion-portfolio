#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FreeTierStack } from '../lib/aws-free-tier-stack';

const app = new cdk.App();

// Staging Environment (Free Tier)
new FreeTierStack(app, 'PortfolioFreeTierStaging', {
  environment: 'staging',
  domainName: 'staging.mmotion.cloud',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

// Production Environment (Free Tier)
new FreeTierStack(app, 'PortfolioFreeTierProduction', {
  environment: 'production',
  domainName: 'mmotion.cloud',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

// Development Environment (Free Tier)
new FreeTierStack(app, 'PortfolioFreeTierDevelopment', {
  environment: 'development',
  domainName: 'dev.mmotion.cloud',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
