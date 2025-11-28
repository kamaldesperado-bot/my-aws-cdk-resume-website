import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class PhotoAlbumStackMinimal extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Just create a simple S3 bucket to test
    const testBucket = new s3.Bucket(this, 'TestBucket', {
      bucketName: `test-photo-album-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    new cdk.CfnOutput(this, 'TestBucketName', {
      value: testBucket.bucketName,
      description: 'Test bucket name'
    });
  }
}