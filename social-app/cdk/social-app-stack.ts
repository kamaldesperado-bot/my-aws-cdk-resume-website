import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class SocialAppStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);


        // S3 bucket for images (private)
        const imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });

        // S3 bucket for static website hosting (frontend)
        const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            publicReadAccess: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            blockPublicAccess: new s3.BlockPublicAccess({
                blockPublicAcls: false,
                blockPublicPolicy: false,
                ignorePublicAcls: false,
                restrictPublicBuckets: false,
            }),
        });

        // Add a bucket policy for public read access
        websiteBucket.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [websiteBucket.arnForObjects('*')],
            principals: [new cdk.aws_iam.AnyPrincipal()],
            effect: cdk.aws_iam.Effect.ALLOW,
        }));

        // DynamoDB tables
        const usersTable = new dynamodb.Table(this, 'UsersTable', {
            partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const postsTable = new dynamodb.Table(this, 'PostsTable', {
            partitionKey: { name: 'postId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const commentsTable = new dynamodb.Table(this, 'CommentsTable', {
            partitionKey: { name: 'commentId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const likesTable = new dynamodb.Table(this, 'LikesTable', {
            partitionKey: { name: 'likeId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // Lambda functions
        const backendLambda = new lambda.Function(this, 'BackendLambda', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../backend'),
            environment: {
                USERS_TABLE: usersTable.tableName,
                POSTS_TABLE: postsTable.tableName,
                COMMENTS_TABLE: commentsTable.tableName,
                LIKES_TABLE: likesTable.tableName,
                IMAGES_BUCKET: imagesBucket.bucketName,
                ADMIN_USERNAME: 'admin', // Change as needed
            },
            timeout: cdk.Duration.seconds(20),
        });

        // Grant Lambda access to DynamoDB and S3
        usersTable.grantReadWriteData(backendLambda);
        postsTable.grantReadWriteData(backendLambda);
        commentsTable.grantReadWriteData(backendLambda);
        likesTable.grantReadWriteData(backendLambda);
        imagesBucket.grantReadWrite(backendLambda);

        // API Gateway
        const api = new apigateway.RestApi(this, 'SocialAppApi', {
            restApiName: 'Social Media App Service',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
            },
        });

        // API endpoints
        api.root.addResource('register').addMethod('POST', new apigateway.LambdaIntegration(backendLambda));
        api.root.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(backendLambda));
        api.root.addResource('logout').addMethod('POST', new apigateway.LambdaIntegration(backendLambda));
        api.root.addResource('posts').addMethod('GET', new apigateway.LambdaIntegration(backendLambda));
        api.root.addResource('post').addMethod('POST', new apigateway.LambdaIntegration(backendLambda));
        api.root.addResource('like').addMethod('POST', new apigateway.LambdaIntegration(backendLambda));
        api.root.addResource('comment').addMethod('POST', new apigateway.LambdaIntegration(backendLambda));
    }
}
