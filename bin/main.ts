#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { ResumeStaticWebsiteStack } from '../lib/resume-static-website-stack';
import { PhotoAlbumStack } from '../lib/photo-album-stack';
import { LearningAppStack } from '../lib/learning-app-stack';
import { SocialAppStack } from '../lib/social-app-stack';

const app = new cdk.App();
new ResumeStaticWebsiteStack(app, 'ResumeStaticWebsiteStack');
new PhotoAlbumStack(app, 'PhotoAlbumStack');
new LearningAppStack(app, 'LearningAppStack');
new SocialAppStack(app, 'SocialAppStack');

