"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoAlbumStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const s3deploy = __importStar(require("aws-cdk-lib/aws-s3-deployment"));
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const aws_cloudfront_origins_1 = require("aws-cdk-lib/aws-cloudfront-origins");
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const s3notifications = __importStar(require("aws-cdk-lib/aws-s3-notifications"));
class PhotoAlbumStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
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
            blockPublicAccess: new s3.BlockPublicAccess({
                blockPublicAcls: false,
                blockPublicPolicy: false,
                ignorePublicAcls: false,
                restrictPublicBuckets: false
            }),
            publicReadAccess: true,
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
        // Allow public listing of bucket contents
        photosBucket.addToResourcePolicy(new iam.PolicyStatement({
            actions: ['s3:ListBucket'],
            resources: [photosBucket.bucketArn],
            principals: [new iam.AnyPrincipal()]
        }));
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
        photosBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3notifications.LambdaDestination(imageProcessorFunction), { prefix: 'uploads/' });
        // Photo upload API (replaces Cloudinary upload API)
        const uploadFunction = new lambda.Function(this, 'PhotoUpload', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(`
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = new S3Client();

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  try {
    const body = JSON.parse(event.body || '{}');
    const filename = body.filename || 'photo.jpg';
    const contentType = body.contentType || 'image/jpeg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const key = \`uploads/\${timestamp}-\${random}-\${filename}\`;
    
    const command = new PutObjectCommand({
      Bucket: '${photosBucket.bucketName}',
      Key: key,
      ContentType: contentType
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    
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
                allowHeaders: apigateway.Cors.DEFAULT_HEADERS
            }
        });
        const upload = api.root.addResource('upload');
        upload.addMethod('POST', new apigateway.LambdaIntegration(uploadFunction));
        // Album management Lambda
        const albumFunction = new lambda.Function(this, 'AlbumManagementV2', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromInline(`
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client();
const BUCKET = '${photosBucket.bucketName}';
const KEY = 'albums/albums.json';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  try {
    if (event.httpMethod === 'GET') {
      try {
        const data = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }));
        const body = await data.Body.transformToString();
        return { statusCode: 200, headers, body };
      } catch (err) {
        if (err.name === 'NoSuchKey') {
          return { statusCode: 200, headers, body: JSON.stringify({ albums: [] }) };
        }
        throw err;
      }
    }
    
    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: KEY,
        Body: JSON.stringify(body),
        ContentType: 'application/json'
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }
    
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
      `),
            timeout: cdk.Duration.seconds(30)
        });
        photosBucket.grantReadWrite(albumFunction);
        const albums = api.root.addResource('albums');
        albums.addMethod('GET', new apigateway.LambdaIntegration(albumFunction));
        albums.addMethod('POST', new apigateway.LambdaIntegration(albumFunction));
        albums.addMethod('PUT', new apigateway.LambdaIntegration(albumFunction));
        // Create Origin Access Identity for CloudFront
        const websiteOAI = new cloudfront.OriginAccessIdentity(this, 'WebsiteOAI', {
            comment: 'OAI for Photo Album Website'
        });
        const photosOAI = new cloudfront.OriginAccessIdentity(this, 'PhotosOAI', {
            comment: 'OAI for Processed Photos'
        });
        // Grant CloudFront OAI access to buckets
        photoAlbumBucket.addToResourcePolicy(new iam.PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [photoAlbumBucket.arnForObjects('*')],
            principals: [new iam.CanonicalUserPrincipal(websiteOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
        }));
        processedPhotosBucket.addToResourcePolicy(new iam.PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [processedPhotosBucket.arnForObjects('*')],
            principals: [new iam.CanonicalUserPrincipal(photosOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
        }));
        photosBucket.addToResourcePolicy(new iam.PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [photosBucket.arnForObjects('*')],
            principals: [new iam.CanonicalUserPrincipal(photosOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
        }));
        // Create CloudFront distribution with multiple origins
        const distribution = new cloudfront.Distribution(this, 'PhotoAlbumDistribution', {
            defaultBehavior: {
                origin: aws_cloudfront_origins_1.S3BucketOrigin.withOriginAccessIdentity(photoAlbumBucket, { originAccessIdentity: websiteOAI }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                compress: true,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
            },
            additionalBehaviors: {
                '/images/*': {
                    origin: aws_cloudfront_origins_1.S3BucketOrigin.withOriginAccessIdentity(processedPhotosBucket, { originAccessIdentity: photosOAI }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                    compress: true,
                    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
                },
                '/photos/*': {
                    origin: aws_cloudfront_origins_1.S3BucketOrigin.withOriginAccessIdentity(photosBucket, {
                        originAccessIdentity: photosOAI,
                        originPath: ''
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                    compress: true,
                    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                    functionAssociations: [{
                            function: new cloudfront.Function(this, 'PhotosRewriteFunction', {
                                code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  request.uri = request.uri.replace(/^\/photos\//, '/');
  return request;
}
              `)
                            }),
                            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
                        }]
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
            comment: 'CloudFront distribution for photo album with image processing v2'
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
exports.PhotoAlbumStack = PhotoAlbumStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGhvdG8tYWxidW0tc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaG90by1hbGJ1bS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUVuQyx1REFBeUM7QUFDekMsd0VBQTBEO0FBQzFELHVFQUF5RDtBQUN6RCwrRUFBb0U7QUFDcEUseURBQTJDO0FBQzNDLG1FQUFxRDtBQUNyRCwrREFBaUQ7QUFDakQsdUVBQXlEO0FBQ3pELGtGQUFvRTtBQUVwRSxNQUFhLGVBQWdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDNUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixrRUFBa0U7UUFDbEUsTUFBTSxXQUFXLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUMvRCxTQUFTLEVBQUUsaUJBQWlCO1lBQzVCLFlBQVksRUFBRTtnQkFDWixJQUFJLEVBQUUsUUFBUTtnQkFDZCxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ3BDO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLElBQUksRUFBRSxTQUFTO2dCQUNmLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07WUFDdkMsZ0NBQWdDLEVBQUUsRUFBRSwwQkFBMEIsRUFBRSxJQUFJLEVBQUU7WUFDdEUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxlQUFlLENBQUMsV0FBVztTQUNqRCxDQUFDLENBQUM7UUFFSCwrQ0FBK0M7UUFDL0MsV0FBVyxDQUFDLHVCQUF1QixDQUFDO1lBQ2xDLFNB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QUUsR0FBRyxDQUFDLEdBQUc7WUFDZCxXQUFXLEVBQUUsbUNBQW1DO1NBQ2pELENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWhiRCwwQ0FnYkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgczNkZXBsb3kgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWRlcGxveW1lbnQnO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgeyBTM0J1Y2tldE9yaWdpbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnMnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgczNub3RpZmljYXRpb25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1ub3RpZmljYXRpb25zJztcblxuZXhwb3J0IGNsYXNzIFBob3RvQWxidW1TdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIENyZWF0ZSBEeW5hbW9EQiB0YWJsZSBmb3IgYWxidW0gbWV0YWRhdGEgKHN5bmNzIGFjcm9zcyBkZXZpY2VzKVxuICAgIGNvbnN0IGFsYnVtc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdQaG90b0FsYnVtc1RhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiAncGhvdG8tYWxidW1zLXYyJyxcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAndXNlcklkJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgc29ydEtleToge1xuICAgICAgICBuYW1lOiAnYWxidW1JZCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsIC8vIE5vIGNhcGFjaXR5IHBsYW5uaW5nIG5lZWRlZFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLCAvLyBLZWVwIGRhdGEgc2FmZSFcbiAgICAgIHBvaW50SW5UaW1lUmVjb3ZlcnlTcGVjaWZpY2F0aW9uOiB7IHBvaW50SW5UaW1lUmVjb3ZlcnlFbmFibGVkOiB0cnVlIH0sIC8vIEVuYWJsZSBiYWNrdXBzXG4gICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQVdTX01BTkFHRUQsXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgR1NJIGZvciBxdWVyeWluZyBhbGJ1bXMgYnkgY3JlYXRpb24gZGF0ZVxuICAgIGFsYnVtc1RhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ1VzZXJDcmVhdGVkSW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICd1c2VySWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICdjcmVhdGVkJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgcHJvamVjdGlvblR5cGU6IGR5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTCxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBTMyBidWNrZXQgZm9yIG9yaWdpbmFsIHBob3RvcyAocmVwbGFjZXMgQ2xvdWRpbmFyeSBzdG9yYWdlKVxuICAgIGNvbnN0IHBob3Rvc0J1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1Bob3Rvc0J1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBwaG90b3MtdjItJHt0aGlzLmFjY291bnR9LSR7dGhpcy5yZWdpb259YCxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBuZXcgczMuQmxvY2tQdWJsaWNBY2Nlc3MoeyBcbiAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiBmYWxzZSxcbiAgICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IGZhbHNlLFxuICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiBmYWxzZSxcbiAgICAgICAgcmVzdHJpY3RQdWJsaWNCdWNrZXRzOiBmYWxzZVxuICAgICAgfSksXG4gICAgICBwdWJsaWNSZWFkQWNjZXNzOiB0cnVlLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IGZhbHNlLFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFt7XG4gICAgICAgIGlkOiAnaW50ZWxsaWdlbnQtdGllcmluZycsXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIHRyYW5zaXRpb25zOiBbe1xuICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLklOVEVMTElHRU5UX1RJRVJJTkcsXG4gICAgICAgICAgdHJhbnNpdGlvbkFmdGVyOiBjZGsuRHVyYXRpb24uZGF5cygxKVxuICAgICAgICB9XVxuICAgICAgfV1cbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBTMyBidWNrZXQgZm9yIHByb2Nlc3NlZC9yZXNpemVkIGltYWdlcyAocmVwbGFjZXMgQ2xvdWRpbmFyeSB0cmFuc2Zvcm1hdGlvbnMpXG4gICAgY29uc3QgcHJvY2Vzc2VkUGhvdG9zQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnUHJvY2Vzc2VkUGhvdG9zQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYHByb2Nlc3NlZC1waG90b3MtdjItJHt0aGlzLmFjY291bnR9LSR7dGhpcy5yZWdpb259YCxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogZmFsc2UsXG4gICAgICB2ZXJzaW9uZWQ6IHRydWVcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBTMyBidWNrZXQgZm9yIHBob3RvIGFsYnVtIHdlYnNpdGVcbiAgICBjb25zdCBwaG90b0FsYnVtQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnUGhvdG9BbGJ1bUJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBwaG90by1hbGJ1bS12Mi0ke3RoaXMuYWNjb3VudH0tJHt0aGlzLnJlZ2lvbn1gLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiBmYWxzZSxcbiAgICAgIHZlcnNpb25lZDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgLy8gQWxsb3cgcHVibGljIGxpc3Rpbmcgb2YgYnVja2V0IGNvbnRlbnRzXG4gICAgcGhvdG9zQnVja2V0LmFkZFRvUmVzb3VyY2VQb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFsnczM6TGlzdEJ1Y2tldCddLFxuICAgICAgICByZXNvdXJjZXM6IFtwaG90b3NCdWNrZXQuYnVja2V0QXJuXSxcbiAgICAgICAgcHJpbmNpcGFsczogW25ldyBpYW0uQW55UHJpbmNpcGFsKCldXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBBbGxvdyBDT1JTIGZvciBwaG90byB1cGxvYWRzXG4gICAgcGhvdG9zQnVja2V0LmFkZENvcnNSdWxlKHtcbiAgICAgIGFsbG93ZWRNZXRob2RzOiBbczMuSHR0cE1ldGhvZHMuUFVULCBzMy5IdHRwTWV0aG9kcy5QT1NULCBzMy5IdHRwTWV0aG9kcy5HRVRdLFxuICAgICAgYWxsb3dlZE9yaWdpbnM6IFsnKiddLFxuICAgICAgYWxsb3dlZEhlYWRlcnM6IFsnKiddLFxuICAgICAgbWF4QWdlOiAzMDAwXG4gICAgfSk7XG5cbiAgICAvLyBBbGxvdyBDT1JTIGZvciB3ZWJzaXRlIGJ1Y2tldFxuICAgIHBob3RvQWxidW1CdWNrZXQuYWRkQ29yc1J1bGUoe1xuICAgICAgYWxsb3dlZE1ldGhvZHM6IFtzMy5IdHRwTWV0aG9kcy5HRVRdLFxuICAgICAgYWxsb3dlZE9yaWdpbnM6IFsnKiddLFxuICAgICAgYWxsb3dlZEhlYWRlcnM6IFsnKiddXG4gICAgfSk7XG5cbiAgICAvLyBJbWFnZSBwcm9jZXNzaW5nIExhbWJkYSBmdW5jdGlvbiAocmVwbGFjZXMgQ2xvdWRpbmFyeSB0cmFuc2Zvcm1hdGlvbnMpXG4gICAgY29uc3QgaW1hZ2VQcm9jZXNzb3JGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0ltYWdlUHJvY2Vzc29yJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbmNvbnN0IEFXUyA9IHJlcXVpcmUoJ2F3cy1zZGsnKTtcbmNvbnN0IHMzID0gbmV3IEFXUy5TMygpO1xuXG5leHBvcnRzLmhhbmRsZXIgPSBhc3luYyAoZXZlbnQpID0+IHtcbiAgY29uc3QgYnVja2V0ID0gZXZlbnQuUmVjb3Jkc1swXS5zMy5idWNrZXQubmFtZTtcbiAgY29uc3Qga2V5ID0gZGVjb2RlVVJJQ29tcG9uZW50KGV2ZW50LlJlY29yZHNbMF0uczMub2JqZWN0LmtleS5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XG4gIFxuICB0cnkge1xuICAgIC8vIEZvciBub3csIGp1c3QgY29weSB0aGUgb3JpZ2luYWwgaW1hZ2UgdG8gcHJvY2Vzc2VkIGJ1Y2tldFxuICAgIC8vIFlvdSBjYW4gbGF0ZXIgYWRkIFNoYXJwIGxheWVyIG9yIHVzZSBvdGhlciBpbWFnZSBwcm9jZXNzaW5nXG4gICAgY29uc3Qgb3JpZ2luYWxJbWFnZSA9IGF3YWl0IHMzLmdldE9iamVjdCh7IEJ1Y2tldDogYnVja2V0LCBLZXk6IGtleSB9KS5wcm9taXNlKCk7XG4gICAgXG4gICAgLy8gQ29weSBvcmlnaW5hbCB0byBwcm9jZXNzZWQgYnVja2V0IHdpdGggZGlmZmVyZW50IHNpemVzIGluIGZpbGVuYW1lXG4gICAgY29uc3Qgc2l6ZXMgPSBbJ3RodW1iJywgJ21lZGl1bScsICdsYXJnZScsICdvcmlnaW5hbCddO1xuICAgIFxuICAgIGZvciAoY29uc3Qgc2l6ZSBvZiBzaXplcykge1xuICAgICAgY29uc3QgcHJvY2Vzc2VkS2V5ID0ga2V5LnJlcGxhY2UoL1xcLlteLl0rJC8sIFxcYF9cXCR7c2l6ZX0uanBnXFxgKTtcbiAgICAgIGF3YWl0IHMzLnB1dE9iamVjdCh7XG4gICAgICAgIEJ1Y2tldDogJyR7cHJvY2Vzc2VkUGhvdG9zQnVja2V0LmJ1Y2tldE5hbWV9JyxcbiAgICAgICAgS2V5OiBwcm9jZXNzZWRLZXksXG4gICAgICAgIEJvZHk6IG9yaWdpbmFsSW1hZ2UuQm9keSxcbiAgICAgICAgQ29udGVudFR5cGU6IG9yaWdpbmFsSW1hZ2UuQ29udGVudFR5cGUgfHwgJ2ltYWdlL2pwZWcnXG4gICAgICB9KS5wcm9taXNlKCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgYm9keTogJ0ltYWdlcyBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5JyB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgaW1hZ2U6JywgZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9XG59O1xuICAgICAgYCksXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygyKSxcbiAgICAgIG1lbW9yeVNpemU6IDUxMlxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnMgdG8gTGFtYmRhXG4gICAgcGhvdG9zQnVja2V0LmdyYW50UmVhZChpbWFnZVByb2Nlc3NvckZ1bmN0aW9uKTtcbiAgICBwcm9jZXNzZWRQaG90b3NCdWNrZXQuZ3JhbnRXcml0ZShpbWFnZVByb2Nlc3NvckZ1bmN0aW9uKTtcblxuICAgIC8vIFRyaWdnZXIgTGFtYmRhIG9uIHBob3RvIHVwbG9hZFxuICAgIHBob3Rvc0J1Y2tldC5hZGRFdmVudE5vdGlmaWNhdGlvbihcbiAgICAgIHMzLkV2ZW50VHlwZS5PQkpFQ1RfQ1JFQVRFRCxcbiAgICAgIG5ldyBzM25vdGlmaWNhdGlvbnMuTGFtYmRhRGVzdGluYXRpb24oaW1hZ2VQcm9jZXNzb3JGdW5jdGlvbiksXG4gICAgICB7IHByZWZpeDogJ3VwbG9hZHMvJyB9XG4gICAgKTtcblxuICAgIC8vIFBob3RvIHVwbG9hZCBBUEkgKHJlcGxhY2VzIENsb3VkaW5hcnkgdXBsb2FkIEFQSSlcbiAgICBjb25zdCB1cGxvYWRGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ1Bob3RvVXBsb2FkJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbmNvbnN0IHsgUzNDbGllbnQsIFB1dE9iamVjdENvbW1hbmQgfSA9IHJlcXVpcmUoJ0Bhd3Mtc2RrL2NsaWVudC1zMycpO1xuY29uc3QgeyBnZXRTaWduZWRVcmwgfSA9IHJlcXVpcmUoJ0Bhd3Mtc2RrL3MzLXJlcXVlc3QtcHJlc2lnbmVyJyk7XG5jb25zdCBzM0NsaWVudCA9IG5ldyBTM0NsaWVudCgpO1xuXG5leHBvcnRzLmhhbmRsZXIgPSBhc3luYyAoZXZlbnQpID0+IHtcbiAgY29uc3QgaGVhZGVycyA9IHtcbiAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJyonLFxuICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogJyonXG4gIH07XG4gIFxuICBpZiAoZXZlbnQuaHR0cE1ldGhvZCA9PT0gJ09QVElPTlMnKSB7XG4gICAgcmV0dXJuIHsgc3RhdHVzQ29kZTogMjAwLCBoZWFkZXJzLCBib2R5OiAnJyB9O1xuICB9XG4gIFxuICB0cnkge1xuICAgIGNvbnN0IGJvZHkgPSBKU09OLnBhcnNlKGV2ZW50LmJvZHkgfHwgJ3t9Jyk7XG4gICAgY29uc3QgZmlsZW5hbWUgPSBib2R5LmZpbGVuYW1lIHx8ICdwaG90by5qcGcnO1xuICAgIGNvbnN0IGNvbnRlbnRUeXBlID0gYm9keS5jb250ZW50VHlwZSB8fCAnaW1hZ2UvanBlZyc7XG4gICAgY29uc3QgdGltZXN0YW1wID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCByYW5kb20gPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoNyk7XG4gICAgY29uc3Qga2V5ID0gXFxgdXBsb2Fkcy9cXCR7dGltZXN0YW1wfS1cXCR7cmFuZG9tfS1cXCR7ZmlsZW5hbWV9XFxgO1xuICAgIFxuICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgUHV0T2JqZWN0Q29tbWFuZCh7XG4gICAgICBCdWNrZXQ6ICcke3Bob3Rvc0J1Y2tldC5idWNrZXROYW1lfScsXG4gICAgICBLZXk6IGtleSxcbiAgICAgIENvbnRlbnRUeXBlOiBjb250ZW50VHlwZVxuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IHNpZ25lZFVybCA9IGF3YWl0IGdldFNpZ25lZFVybChzM0NsaWVudCwgY29tbWFuZCwgeyBleHBpcmVzSW46IDMwMCB9KTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgaGVhZGVycyxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgdXBsb2FkVXJsOiBzaWduZWRVcmwsIGtleSB9KVxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDUwMCxcbiAgICAgIGhlYWRlcnMsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnJvci5tZXNzYWdlIH0pXG4gICAgfTtcbiAgfVxufTtcbiAgICAgIGApLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApXG4gICAgfSk7XG5cbiAgICBwaG90b3NCdWNrZXQuZ3JhbnRXcml0ZSh1cGxvYWRGdW5jdGlvbik7XG5cbiAgICAvLyBBUEkgR2F0ZXdheSBmb3IgcGhvdG8gdXBsb2Fkc1xuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ1Bob3RvQWxidW1BcGknLCB7XG4gICAgICByZXN0QXBpTmFtZTogJ1Bob3RvIEFsYnVtIEFQSScsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBmb3IgcGhvdG8gYWxidW0gb3BlcmF0aW9ucycsXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IGFwaWdhdGV3YXkuQ29ycy5ERUZBVUxUX0hFQURFUlNcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHVwbG9hZCA9IGFwaS5yb290LmFkZFJlc291cmNlKCd1cGxvYWQnKTtcbiAgICB1cGxvYWQuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odXBsb2FkRnVuY3Rpb24pKTtcblxuICAgIC8vIEFsYnVtIG1hbmFnZW1lbnQgTGFtYmRhXG4gICAgY29uc3QgYWxidW1GdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0FsYnVtTWFuYWdlbWVudFYyJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbmNvbnN0IHsgUzNDbGllbnQsIEdldE9iamVjdENvbW1hbmQsIFB1dE9iamVjdENvbW1hbmQgfSA9IHJlcXVpcmUoJ0Bhd3Mtc2RrL2NsaWVudC1zMycpO1xuY29uc3QgczNDbGllbnQgPSBuZXcgUzNDbGllbnQoKTtcbmNvbnN0IEJVQ0tFVCA9ICcke3Bob3Rvc0J1Y2tldC5idWNrZXROYW1lfSc7XG5jb25zdCBLRVkgPSAnYWxidW1zL2FsYnVtcy5qc29uJztcblxuZXhwb3J0cy5oYW5kbGVyID0gYXN5bmMgKGV2ZW50KSA9PiB7XG4gIGNvbnN0IGhlYWRlcnMgPSB7XG4gICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcbiAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6ICcqJyxcbiAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6ICcqJ1xuICB9O1xuICBcbiAgaWYgKGV2ZW50Lmh0dHBNZXRob2QgPT09ICdPUFRJT05TJykge1xuICAgIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgaGVhZGVycywgYm9keTogJycgfTtcbiAgfVxuICBcbiAgdHJ5IHtcbiAgICBpZiAoZXZlbnQuaHR0cE1ldGhvZCA9PT0gJ0dFVCcpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBzM0NsaWVudC5zZW5kKG5ldyBHZXRPYmplY3RDb21tYW5kKHsgQnVja2V0OiBCVUNLRVQsIEtleTogS0VZIH0pKTtcbiAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IGRhdGEuQm9keS50cmFuc2Zvcm1Ub1N0cmluZygpO1xuICAgICAgICByZXR1cm4geyBzdGF0dXNDb2RlOiAyMDAsIGhlYWRlcnMsIGJvZHkgfTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAoZXJyLm5hbWUgPT09ICdOb1N1Y2hLZXknKSB7XG4gICAgICAgICAgcmV0dXJuIHsgc3RhdHVzQ29kZTogMjAwLCBoZWFkZXJzLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGFsYnVtczogW10gfSkgfTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmIChldmVudC5odHRwTWV0aG9kID09PSAnUE9TVCcgfHwgZXZlbnQuaHR0cE1ldGhvZCA9PT0gJ1BVVCcpIHtcbiAgICAgIGNvbnN0IGJvZHkgPSBKU09OLnBhcnNlKGV2ZW50LmJvZHkgfHwgJ3t9Jyk7XG4gICAgICBhd2FpdCBzM0NsaWVudC5zZW5kKG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgQnVja2V0OiBCVUNLRVQsXG4gICAgICAgIEtleTogS0VZLFxuICAgICAgICBCb2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgICAgICAgQ29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfSkpO1xuICAgICAgcmV0dXJuIHsgc3RhdHVzQ29kZTogMjAwLCBoZWFkZXJzLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUgfSkgfTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHsgc3RhdHVzQ29kZTogNDA1LCBoZWFkZXJzLCBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KSB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiB7IHN0YXR1c0NvZGU6IDUwMCwgaGVhZGVycywgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9KSB9O1xuICB9XG59O1xuICAgICAgYCksXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMClcbiAgICB9KTtcblxuICAgIHBob3Rvc0J1Y2tldC5ncmFudFJlYWRXcml0ZShhbGJ1bUZ1bmN0aW9uKTtcblxuICAgIGNvbnN0IGFsYnVtcyA9IGFwaS5yb290LmFkZFJlc291cmNlKCdhbGJ1bXMnKTtcbiAgICBhbGJ1bXMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihhbGJ1bUZ1bmN0aW9uKSk7XG4gICAgYWxidW1zLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGFsYnVtRnVuY3Rpb24pKTtcbiAgICBhbGJ1bXMuYWRkTWV0aG9kKCdQVVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihhbGJ1bUZ1bmN0aW9uKSk7XG5cbiAgICAvLyBDcmVhdGUgT3JpZ2luIEFjY2VzcyBJZGVudGl0eSBmb3IgQ2xvdWRGcm9udFxuICAgIGNvbnN0IHdlYnNpdGVPQUkgPSBuZXcgY2xvdWRmcm9udC5PcmlnaW5BY2Nlc3NJZGVudGl0eSh0aGlzLCAnV2Vic2l0ZU9BSScsIHtcbiAgICAgIGNvbW1lbnQ6ICdPQUkgZm9yIFBob3RvIEFsYnVtIFdlYnNpdGUnXG4gICAgfSk7XG5cbiAgICBjb25zdCBwaG90b3NPQUkgPSBuZXcgY2xvdWRmcm9udC5PcmlnaW5BY2Nlc3NJZGVudGl0eSh0aGlzLCAnUGhvdG9zT0FJJywge1xuICAgICAgY29tbWVudDogJ09BSSBmb3IgUHJvY2Vzc2VkIFBob3RvcydcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IENsb3VkRnJvbnQgT0FJIGFjY2VzcyB0byBidWNrZXRzXG4gICAgcGhvdG9BbGJ1bUJ1Y2tldC5hZGRUb1Jlc291cmNlUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCddLFxuICAgICAgICByZXNvdXJjZXM6IFtwaG90b0FsYnVtQnVja2V0LmFybkZvck9iamVjdHMoJyonKV0sXG4gICAgICAgIHByaW5jaXBhbHM6IFtuZXcgaWFtLkNhbm9uaWNhbFVzZXJQcmluY2lwYWwod2Vic2l0ZU9BSS5jbG91ZEZyb250T3JpZ2luQWNjZXNzSWRlbnRpdHlTM0Nhbm9uaWNhbFVzZXJJZCldXG4gICAgICB9KVxuICAgICk7XG5cbiAgICBwcm9jZXNzZWRQaG90b3NCdWNrZXQuYWRkVG9SZXNvdXJjZVBvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgYWN0aW9uczogWydzMzpHZXRPYmplY3QnXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbcHJvY2Vzc2VkUGhvdG9zQnVja2V0LmFybkZvck9iamVjdHMoJyonKV0sXG4gICAgICAgIHByaW5jaXBhbHM6IFtuZXcgaWFtLkNhbm9uaWNhbFVzZXJQcmluY2lwYWwocGhvdG9zT0FJLmNsb3VkRnJvbnRPcmlnaW5BY2Nlc3NJZGVudGl0eVMzQ2Fub25pY2FsVXNlcklkKV1cbiAgICAgIH0pXG4gICAgKTtcblxuICAgIHBob3Rvc0J1Y2tldC5hZGRUb1Jlc291cmNlUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCddLFxuICAgICAgICByZXNvdXJjZXM6IFtwaG90b3NCdWNrZXQuYXJuRm9yT2JqZWN0cygnKicpXSxcbiAgICAgICAgcHJpbmNpcGFsczogW25ldyBpYW0uQ2Fub25pY2FsVXNlclByaW5jaXBhbChwaG90b3NPQUkuY2xvdWRGcm9udE9yaWdpbkFjY2Vzc0lkZW50aXR5UzNDYW5vbmljYWxVc2VySWQpXVxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIENsb3VkRnJvbnQgZGlzdHJpYnV0aW9uIHdpdGggbXVsdGlwbGUgb3JpZ2luc1xuICAgIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbih0aGlzLCAnUGhvdG9BbGJ1bURpc3RyaWJ1dGlvbicsIHtcbiAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xuICAgICAgICBvcmlnaW46IFMzQnVja2V0T3JpZ2luLndpdGhPcmlnaW5BY2Nlc3NJZGVudGl0eShwaG90b0FsYnVtQnVja2V0LCB7IG9yaWdpbkFjY2Vzc0lkZW50aXR5OiB3ZWJzaXRlT0FJIH0pLFxuICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfR0VUX0hFQUQsXG4gICAgICAgIGNhY2hlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQ2FjaGVkTWV0aG9kcy5DQUNIRV9HRVRfSEVBRCxcbiAgICAgICAgY29tcHJlc3M6IHRydWUsXG4gICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfT1BUSU1JWkVEXG4gICAgICB9LFxuICAgICAgYWRkaXRpb25hbEJlaGF2aW9yczoge1xuICAgICAgICAnL2ltYWdlcy8qJzoge1xuICAgICAgICAgIG9yaWdpbjogUzNCdWNrZXRPcmlnaW4ud2l0aE9yaWdpbkFjY2Vzc0lkZW50aXR5KHByb2Nlc3NlZFBob3Rvc0J1Y2tldCwgeyBvcmlnaW5BY2Nlc3NJZGVudGl0eTogcGhvdG9zT0FJIH0pLFxuICAgICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OiBjbG91ZGZyb250LlZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBjbG91ZGZyb250LkFsbG93ZWRNZXRob2RzLkFMTE9XX0dFVF9IRUFELFxuICAgICAgICAgIGNhY2hlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQ2FjaGVkTWV0aG9kcy5DQUNIRV9HRVRfSEVBRCxcbiAgICAgICAgICBjb21wcmVzczogdHJ1ZSxcbiAgICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRFxuICAgICAgICB9LFxuICAgICAgICAnL3Bob3Rvcy8qJzoge1xuICAgICAgICAgIG9yaWdpbjogUzNCdWNrZXRPcmlnaW4ud2l0aE9yaWdpbkFjY2Vzc0lkZW50aXR5KHBob3Rvc0J1Y2tldCwgeyBcbiAgICAgICAgICAgIG9yaWdpbkFjY2Vzc0lkZW50aXR5OiBwaG90b3NPQUksXG4gICAgICAgICAgICBvcmlnaW5QYXRoOiAnJ1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OiBjbG91ZGZyb250LlZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBjbG91ZGZyb250LkFsbG93ZWRNZXRob2RzLkFMTE9XX0dFVF9IRUFELFxuICAgICAgICAgIGNhY2hlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQ2FjaGVkTWV0aG9kcy5DQUNIRV9HRVRfSEVBRCxcbiAgICAgICAgICBjb21wcmVzczogdHJ1ZSxcbiAgICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRCxcbiAgICAgICAgICBmdW5jdGlvbkFzc29jaWF0aW9uczogW3tcbiAgICAgICAgICAgIGZ1bmN0aW9uOiBuZXcgY2xvdWRmcm9udC5GdW5jdGlvbih0aGlzLCAnUGhvdG9zUmV3cml0ZUZ1bmN0aW9uJywge1xuICAgICAgICAgICAgICBjb2RlOiBjbG91ZGZyb250LkZ1bmN0aW9uQ29kZS5mcm9tSW5saW5lKGBcbmZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQpIHtcbiAgdmFyIHJlcXVlc3QgPSBldmVudC5yZXF1ZXN0O1xuICByZXF1ZXN0LnVyaSA9IHJlcXVlc3QudXJpLnJlcGxhY2UoL15cXC9waG90b3NcXC8vLCAnLycpO1xuICByZXR1cm4gcmVxdWVzdDtcbn1cbiAgICAgICAgICAgICAgYClcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgZXZlbnRUeXBlOiBjbG91ZGZyb250LkZ1bmN0aW9uRXZlbnRUeXBlLlZJRVdFUl9SRVFVRVNUXG4gICAgICAgICAgfV1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRSb290T2JqZWN0OiAnaW5kZXguaHRtbCcsXG4gICAgICBlcnJvclJlc3BvbnNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgaHR0cFN0YXR1czogNDA0LFxuICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogNDA0LFxuICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvZXJyb3IuaHRtbCcsXG4gICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaHR0cFN0YXR1czogNDAzLFxuICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogNDAzLFxuICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvZXJyb3IuaHRtbCcsXG4gICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgcHJpY2VDbGFzczogY2xvdWRmcm9udC5QcmljZUNsYXNzLlBSSUNFX0NMQVNTXzEwMCxcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICBjb21tZW50OiAnQ2xvdWRGcm9udCBkaXN0cmlidXRpb24gZm9yIHBob3RvIGFsYnVtIHdpdGggaW1hZ2UgcHJvY2Vzc2luZyB2MidcbiAgICB9KTtcblxuICAgIC8vIERlcGxveSBwaG90byBhbGJ1bSB3ZWJzaXRlIGNvbnRlbnQgdG8gUzNcbiAgICBuZXcgczNkZXBsb3kuQnVja2V0RGVwbG95bWVudCh0aGlzLCAnRGVwbG95UGhvdG9BbGJ1bScsIHtcbiAgICAgIHNvdXJjZXM6IFtzM2RlcGxveS5Tb3VyY2UuYXNzZXQoJy4vcGhvdG8tYWxidW0tY29udGVudCcpXSxcbiAgICAgIGRlc3RpbmF0aW9uQnVja2V0OiBwaG90b0FsYnVtQnVja2V0LFxuICAgICAgZGlzdHJpYnV0aW9uOiBkaXN0cmlidXRpb24sXG4gICAgICBkaXN0cmlidXRpb25QYXRoczogWycvKiddLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0IHRoZSBDbG91ZEZyb250IFVSTFxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQaG90b0FsYnVtVVJMJywge1xuICAgICAgdmFsdWU6IGBodHRwczovLyR7ZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWV9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xvdWRGcm9udCBVUkwgZm9yIFBob3RvIEFsYnVtJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQaG90b0FsYnVtQnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiBwaG90b0FsYnVtQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIGJ1Y2tldCBuYW1lIGZvciBwaG90byBhbGJ1bSB3ZWJzaXRlJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQaG90b0FsYnVtRGlzdHJpYnV0aW9uSWQnLCB7XG4gICAgICB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZEZyb250IGRpc3RyaWJ1dGlvbiBJRCBmb3IgY2FjaGUgaW52YWxpZGF0aW9uJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQaG90b0FsYnVtc1RhYmxlTmFtZScsIHtcbiAgICAgIHZhbHVlOiBhbGJ1bXNUYWJsZS50YWJsZU5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0R5bmFtb0RCIHRhYmxlIG5hbWUgZm9yIGFsYnVtIG1ldGFkYXRhJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQaG90b0FsYnVtc1RhYmxlQXJuJywge1xuICAgICAgdmFsdWU6IGFsYnVtc1RhYmxlLnRhYmxlQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdEeW5hbW9EQiB0YWJsZSBBUk4nXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUGhvdG9zQnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiBwaG90b3NCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUzMgYnVja2V0IGZvciBvcmlnaW5hbCBwaG90b3MnXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUHJvY2Vzc2VkUGhvdG9zQnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiBwcm9jZXNzZWRQaG90b3NCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUzMgYnVja2V0IGZvciBwcm9jZXNzZWQgcGhvdG9zJ1xuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VwbG9hZEFwaVVybCcsIHtcbiAgICAgIHZhbHVlOiBhcGkudXJsLFxuICAgICAgZGVzY3JpcHRpb246ICdBUEkgR2F0ZXdheSBVUkwgZm9yIHBob3RvIHVwbG9hZHMnXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==