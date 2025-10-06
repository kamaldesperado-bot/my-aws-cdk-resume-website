import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ResumeStaticWebsiteStack } from '../lib/resume-static-website-stack';

describe('ResumeStaticWebsiteStack', () => {
  test('S3 Bucket Created', () => {
    const app = new cdk.App();
    const stack = new ResumeStaticWebsiteStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'error.html'
      }
    });
  });

  test('CloudFront Distribution Created', () => {
    const app = new cdk.App();
    const stack = new ResumeStaticWebsiteStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  test('Origin Access Identity Created', () => {
    const app = new cdk.App();
    const stack = new ResumeStaticWebsiteStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::CloudFront::CloudFrontOriginAccessIdentity', 1);
  });
});
