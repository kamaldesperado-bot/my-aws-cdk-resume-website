#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ResumeStaticWebsiteStack } from '../lib/resume-static-website-stack';

const app = new cdk.App();

new ResumeStaticWebsiteStack(app, 'ResumeStaticWebsiteStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'CDK Stack for hosting a resume as a static website using S3 and CloudFront',
});

app.synth();
