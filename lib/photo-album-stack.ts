import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class PhotoAlbumStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table for album metadata (syncs across devices)
    const albumsTable = new dynamodb.Table(this, 'PhotoAlbumsTable', {
      tableName: 'photo-albums',
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

    // Create S3 bucket for photo album website (just HTML/CSS/JS - photos on Cloudinary)
    const photoAlbumBucket = new s3.Bucket(this, 'PhotoAlbumBucket', {
      bucketName: `photo-album-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep photos safe!
      autoDeleteObjects: false, // Don't auto-delete
      versioned: true, // Enable versioning for safety
    });

    // Allow CORS for S3 uploads (for development; restrict in production)
    photoAlbumBucket.addCorsRule({
      allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
      allowedOrigins: ['*'], // Change to your domain in production
      allowedHeaders: ['*'],
    });

    // Create Origin Access Identity for CloudFront
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'PhotoAlbumOAI',
      {
        comment: 'OAI for Photo Album Website',
      }
    );

    // Grant CloudFront OAI access to read from S3
    photoAlbumBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [photoAlbumBucket.arnForObjects('*')],
        principals: [
          new iam.CanonicalUserPrincipal(
            originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    // Create CloudFront distribution (no authentication for now - will add JavaScript login)
    const distribution = new cloudfront.Distribution(this, 'PhotoAlbumDistribution', {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(photoAlbumBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/error.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/error.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      comment: 'CloudFront distribution for photo album website',
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
      description: 'DynamoDB table ARN',
    });
  }
}
