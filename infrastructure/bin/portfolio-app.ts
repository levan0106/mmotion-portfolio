#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PortfolioStack } from '../lib/aws-cdk-stack';

const app = new cdk.App();

// Staging Environment
new PortfolioStack(app, 'PortfolioStackStaging', {
  environment: 'staging',
  domainName: 'staging.mmotion.cloud',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

// Production Environment
new PortfolioStack(app, 'PortfolioStackProduction', {
  environment: 'production',
  domainName: 'mmotion.cloud',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

// Development Environment (optional)
new PortfolioStack(app, 'PortfolioStackDevelopment', {
  environment: 'development',
  domainName: 'dev.mmotion.cloud',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
