#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ResumeStaticWebsiteStack } from '../lib/resume-static-website-stack';
import { PhotoAlbumStack } from '../lib/photo-album-stack';
import { LearningAppStack } from '../lib/learning-app-stack';

const app = new cdk.App();

// Resume website stack
new ResumeStaticWebsiteStack(app, 'ResumeStaticWebsiteStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'CDK Stack for hosting a resume as a static website using S3 and CloudFront',
});

// Photo album website stack (separate)
new PhotoAlbumStack(app, 'PhotoAlbumStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'CDK Stack for photo album website with AWS-native image processing',
});

// Learning app stack
new LearningAppStack(app, 'LearningAppStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'CDK Stack for learning app with AI chat and YouTube suggestions',
});

app.synth();
