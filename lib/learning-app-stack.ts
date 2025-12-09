import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class LearningAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for static frontend
    const webBucket = new s3.Bucket(this, 'LearningWebBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'LearningDistribution', {
      defaultBehavior: {
        origin: cloudfront_origins.S3BucketOrigin.withOriginAccessControl(webBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    // DynamoDB table for users
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda for backend (Gemini + YouTube API)
    const backend = new lambda.Function(this, 'LearningBackend', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('learning-backend'),
      environment: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || (() => { throw new Error('GEMINI_API_KEY environment variable is required'); })(),
        YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || (() => { throw new Error('YOUTUBE_API_KEY environment variable is required'); })(),
        JWT_SECRET: process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required'); })(),
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Lambda for user registration
    const registerFunction = new lambda.Function(this, 'RegisterFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'register.handler',
      code: lambda.Code.fromAsset('learning-backend'),
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required'); })(),
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Lambda for user login
    const loginFunction = new lambda.Function(this, 'LoginFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'login.handler',
      code: lambda.Code.fromAsset('learning-backend'),
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required'); })(),
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Grant permissions
    usersTable.grantReadWriteData(registerFunction);
    usersTable.grantReadData(loginFunction);

    // API Gateway for chat and auth
    const api = new apigateway.RestApi(this, 'LearningApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Chat endpoint
    const chatResource = api.root.addResource('chat');
    chatResource.addMethod('POST', new apigateway.LambdaIntegration(backend));

    // Register endpoint
    const registerResource = api.root.addResource('register');
    registerResource.addMethod('POST', new apigateway.LambdaIntegration(registerFunction));

    // Login endpoint
    const loginResource = api.root.addResource('login');
    loginResource.addMethod('POST', new apigateway.LambdaIntegration(loginFunction));

    new cdk.CfnOutput(this, 'WebBucketURL', {
      value: webBucket.bucketWebsiteUrl,
    });
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
    });
  }
}