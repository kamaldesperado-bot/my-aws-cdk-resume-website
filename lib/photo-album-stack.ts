import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3notifications from 'aws-cdk-lib/aws-s3-notifications';

export class PhotoAlbumStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table for album metadata (syncs across devices)
    const albumsTable = new dynamodb.Table(this, 'PhotoAlbumsTable', {
      tableName: 'photo-albums-v2',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'albumId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // No capacity planning needed
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep data safe!
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true }, // Enable backups
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for querying albums by creation date
    albumsTable.addGlobalSecondaryIndex({
      indexName: 'UserCreatedIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'created',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create S3 bucket for original photos (replaces Cloudinary storage)
    const photosBucket = new s3.Bucket(this, 'PhotosBucket', {
      bucketName: `photos-v2-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      versioned: true,
      lifecycleRules: [{
        id: 'intelligent-tiering',
        enabled: true,
        transitions: [{
          storageClass: s3.StorageClass.INTELLIGENT_TIERING,
          transitionAfter: cdk.Duration.days(1)
        }]
      }]
    });

    // Create S3 bucket for processed/resized images (replaces Cloudinary transformations)
    const processedPhotosBucket = new s3.Bucket(this, 'ProcessedPhotosBucket', {
      bucketName: `processed-photos-v2-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      versioned: true
    });

    // Create S3 bucket for photo album website
    const photoAlbumBucket = new s3.Bucket(this, 'PhotoAlbumBucket', {
      bucketName: `photo-album-v2-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      versioned: true
    });

    // Allow CORS for photo uploads
    photosBucket.addCorsRule({
      allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.GET],
      allowedOrigins: ['*'],
      allowedHeaders: ['*'],
      maxAge: 3000
    });

    // Allow CORS for website bucket
    photoAlbumBucket.addCorsRule({
      allowedMethods: [s3.HttpMethods.GET],
      allowedOrigins: ['*'],
      allowedHeaders: ['*']
    });

    // Image processing Lambda function (replaces Cloudinary transformations)
    const imageProcessorFunction = new lambda.Function(this, 'ImageProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  
  try {
    // For now, just copy the original image to processed bucket
    // You can later add Sharp layer or use other image processing
    const originalImage = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    
    // Copy original to processed bucket with different sizes in filename
    const sizes = ['thumb', 'medium', 'large', 'original'];
    
    for (const size of sizes) {
      const processedKey = key.replace(/\.[^.]+$/, \`_\${size}.jpg\`);
      await s3.putObject({
        Bucket: '${processedPhotosBucket.bucketName}',
        Key: processedKey,
        Body: originalImage.Body,
        ContentType: originalImage.ContentType || 'image/jpeg'
      }).promise();
    }
    
    return { statusCode: 200, body: 'Images processed successfully' };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};
      `),
      timeout: cdk.Duration.minutes(2),
      memorySize: 512
    });

    // Grant permissions to Lambda
    photosBucket.grantRead(imageProcessorFunction);
    processedPhotosBucket.grantWrite(imageProcessorFunction);

    // Trigger Lambda on photo upload
    photosBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3notifications.LambdaDestination(imageProcessorFunction),
      { prefix: 'uploads/' }
    );

    // Photo upload API (replaces Cloudinary upload API)
    const uploadFunction = new lambda.Function(this, 'PhotoUpload', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }
  
  try {
    const { filename, contentType } = JSON.parse(event.body);
    const key = \`uploads/\${uuidv4()}-\${filename}\`;
    
    const signedUrl = s3.getSignedUrl('putObject', {
      Bucket: '${photosBucket.bucketName}',
      Key: key,
      ContentType: contentType,
      Expires: 300
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ uploadUrl: signedUrl, key })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
      `),
      timeout: cdk.Duration.seconds(30)
    });

    photosBucket.grantWrite(uploadFunction);

    // API Gateway for photo uploads
    const api = new apigateway.RestApi(this, 'PhotoAlbumApi', {
      restApiName: 'Photo Album API',
      description: 'API for photo album operations',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    const upload = api.root.addResource('upload');
    upload.addMethod('POST', new apigateway.LambdaIntegration(uploadFunction));

    // Create Origin Access Identity for CloudFront
    const websiteOAI = new cloudfront.OriginAccessIdentity(this, 'WebsiteOAI', {
      comment: 'OAI for Photo Album Website'
    });

    const photosOAI = new cloudfront.OriginAccessIdentity(this, 'PhotosOAI', {
      comment: 'OAI for Processed Photos'
    });

    // Grant CloudFront OAI access to buckets
    photoAlbumBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [photoAlbumBucket.arnForObjects('*')],
        principals: [new iam.CanonicalUserPrincipal(websiteOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
      })
    );

    processedPhotosBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [processedPhotosBucket.arnForObjects('*')],
        principals: [new iam.CanonicalUserPrincipal(photosOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
      })
    );

    // Create CloudFront distribution with multiple origins
    const distribution = new cloudfront.Distribution(this, 'PhotoAlbumDistribution', {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessIdentity(photoAlbumBucket, { originAccessIdentity: websiteOAI }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
      },
      additionalBehaviors: {
        '/images/*': {
          origin: S3BucketOrigin.withOriginAccessIdentity(processedPhotosBucket, { originAccessIdentity: photosOAI }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          compress: true,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
        }
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/error.html',
          ttl: cdk.Duration.minutes(5)
        },
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/error.html',
          ttl: cdk.Duration.minutes(5)
        }
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      comment: 'CloudFront distribution for photo album with image processing'
    });

    // Deploy photo album website content to S3
    new s3deploy.BucketDeployment(this, 'DeployPhotoAlbum', {
      sources: [s3deploy.Source.asset('./photo-album-content')],
      destinationBucket: photoAlbumBucket,
      distribution: distribution,
      distributionPaths: ['/*'],
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, 'PhotoAlbumURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront URL for Photo Album',
    });

    new cdk.CfnOutput(this, 'PhotoAlbumBucketName', {
      value: photoAlbumBucket.bucketName,
      description: 'S3 bucket name for photo album website',
    });

    new cdk.CfnOutput(this, 'PhotoAlbumDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID for cache invalidation',
    });

    new cdk.CfnOutput(this, 'PhotoAlbumsTableName', {
      value: albumsTable.tableName,
      description: 'DynamoDB table name for album metadata',
    });

    new cdk.CfnOutput(this, 'PhotoAlbumsTableArn', {
      value: albumsTable.tableArn,
      description: 'DynamoDB table ARN'
    });

    new cdk.CfnOutput(this, 'PhotosBucketName', {
      value: photosBucket.bucketName,
      description: 'S3 bucket for original photos'
    });

    new cdk.CfnOutput(this, 'ProcessedPhotosBucketName', {
      value: processedPhotosBucket.bucketName,
      description: 'S3 bucket for processed photos'
    });

    new cdk.CfnOutput(this, 'UploadApiUrl', {
      value: api.url,
      description: 'API Gateway URL for photo uploads'
    });
  }
}
