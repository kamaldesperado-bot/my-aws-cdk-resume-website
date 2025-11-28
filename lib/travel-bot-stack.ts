import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class TravelBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for hosting the travel bot frontend
    const websiteBucket = new s3.Bucket(this, 'TravelBotWebsite', {
      bucketName: `travel-bot-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront distribution for global CDN
    const distribution = new cloudfront.Distribution(this, 'TravelBotDistribution', {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(websiteBucket),
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

    // DynamoDB table for storing conversation history
    const conversationTable = new dynamodb.Table(this, 'ConversationHistory', {
      tableName: 'travel-bot-conversations',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function for processing travel requests
    const travelBotFunction = new lambda.Function(this, 'TravelBotFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('travel-bot-backend'),
      environment: {
        CONVERSATION_TABLE: conversationTable.tableName,
        OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_API_KEY',
        GOOGLE_CREDENTIALS: process.env.GOOGLE_CREDENTIALS || 'YOUR_GOOGLE_SERVICE_ACCOUNT_JSON',
        AZURE_TEXT_ANALYTICS_KEY: process.env.AZURE_TEXT_ANALYTICS_KEY || 'YOUR_AZURE_KEY',
        AZURE_TEXT_ANALYTICS_ENDPOINT: process.env.AZURE_TEXT_ANALYTICS_ENDPOINT || 'YOUR_AZURE_ENDPOINT',
        LEX_BOT_ID: process.env.LEX_BOT_ID || 'YOUR_LEX_BOT_ID',
        LEX_BOT_ALIAS_ID: process.env.LEX_BOT_ALIAS_ID || 'TSTALIASID'
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Grant Lambda permissions to DynamoDB
    conversationTable.grantReadWriteData(travelBotFunction);

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

    // CloudWatch Log Group
    new logs.LogGroup(this, 'TravelBotLogs', {
      logGroupName: `/aws/lambda/${travelBotFunction.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'TravelBotErrors', {
      metric: travelBotFunction.metricErrors(),
      threshold: 10,
      evaluationPeriods: 2
    });

    new cloudwatch.Alarm(this, 'TravelBotDuration', {
      metric: travelBotFunction.metricDuration(),
      threshold: cdk.Duration.seconds(25).toMilliseconds(),
      evaluationPeriods: 2
    });

    // API Gateway for the Lambda function
    const api = new apigateway.RestApi(this, 'TravelBotApi', {
      restApiName: 'Travel Bot API',
      description: 'Multi-cloud travel planning bot API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    const chatResource = api.root.addResource('chat');
    chatResource.addMethod('POST', new apigateway.LambdaIntegration(travelBotFunction));

    // Deploy frontend files to S3
    new s3deploy.BucketDeployment(this, 'DeployTravelBot', {
      sources: [s3deploy.Source.asset('travel-bot-frontend')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'TravelBotURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Travel Bot Website URL',
    });

    new cdk.CfnOutput(this, 'TravelBotApiUrl', {
      value: api.url,
      description: 'Travel Bot API Gateway URL',
    });

    new cdk.CfnOutput(this, 'TravelBotDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID for cache invalidation',
    });
  }
}