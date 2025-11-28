import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class TravelBotRealStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for hosting
    const websiteBucket = new s3.Bucket(this, 'TravelBotRealWebsite', {
      bucketName: `travel-bot-real-${this.account}-${this.region}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'TravelBotRealDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // DynamoDB table for conversations
    const conversationTable = new dynamodb.Table(this, 'RealConversationHistory', {
      tableName: 'travel-bot-real-conversations',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function with real multi-cloud integrations
    const travelBotFunction = new lambda.Function(this, 'TravelBotRealFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('travel-bot-real-backend'),
      environment: {
        CONVERSATION_TABLE: conversationTable.tableName,
        OPENWEATHER_API_KEY: 'YOUR_OPENWEATHER_API_KEY',
        GOOGLE_CREDENTIALS: 'YOUR_GOOGLE_SERVICE_ACCOUNT_JSON',
        AZURE_TEXT_ANALYTICS_KEY: 'YOUR_AZURE_KEY',
        AZURE_TEXT_ANALYTICS_ENDPOINT: 'YOUR_AZURE_ENDPOINT',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // Add Lex permissions to Lambda
    travelBotFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'lex:PostText',
        'lex:PostContent',
        'lex:RecognizeText',
        'lex:RecognizeUtterance'
      ],
      resources: ['*']
    }));

    // Grant Lambda permissions to DynamoDB
    conversationTable.grantReadWriteData(travelBotFunction);

    // API Gateway
    const api = new apigateway.RestApi(this, 'TravelBotRealApi', {
      restApiName: 'Travel Bot Real API',
      description: 'Real multi-cloud travel planning bot API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    const chatResource = api.root.addResource('chat');
    chatResource.addMethod('POST', new apigateway.LambdaIntegration(travelBotFunction));

    // Deploy frontend
    new s3deploy.BucketDeployment(this, 'DeployTravelBotReal', {
      sources: [s3deploy.Source.asset('travel-bot-real-frontend')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'TravelBotRealURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Real Travel Bot Website URL',
    });

    new cdk.CfnOutput(this, 'TravelBotRealApiUrl', {
      value: api.url,
      description: 'Real Travel Bot API Gateway URL',
    });

    new cdk.CfnOutput(this, 'TravelBotRealDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });
  }
}