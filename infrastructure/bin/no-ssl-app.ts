#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FreeTierStack } from '../lib/aws-free-tier-stack-no-ssl';

const app = new cdk.App();

new FreeTierStack(app, 'PortfolioFreeTierNoSSL', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Portfolio Management System - Free Tier (No SSL)',
  tags: {
    Project: 'Portfolio Management System',
    Environment: 'Free Tier',
    SSL: 'Disabled',
  },
});
