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
exports.SocialAppStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
class SocialAppStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        console.log('SocialAppStack constructor called');
        // S3 bucket for images (private)
        const imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
        // S3 bucket for static website hosting (frontend)
        const websiteBucket = new s3.Bucket(this, 'WebsiteBucketV2', {
            blockPublicAccess: new s3.BlockPublicAccess({
                blockPublicAcls: false,
                blockPublicPolicy: false,
                ignorePublicAcls: false,
                restrictPublicBuckets: false,
            }),
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            publicReadAccess: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
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
            code: lambda.Code.fromAsset('social-app/backend'),
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
exports.SocialAppStack = SocialAppStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29jaWFsLWFwcC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNvY2lhbC1hcHAtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFFbkMsdURBQXlDO0FBQ3pDLG1FQUFxRDtBQUNyRCwrREFBaUQ7QUFDakQsdUVBQXlEO0FBRXpELE1BQWEsY0FBZSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3pDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO1FBRWpELGlDQUFpQztRQUNqQyxNQUFNLFlBQVksR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUNyRCxpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGlCQUFpQixFQUFFLElBQUk7U0FDMUIsQ0FBQyxDQUFDO1FBRUgsa0RBQWtEO1FBQ3RELE1BQU0sYUFBYSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDckQsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLENBQUMsaUJBQWlCLENBQUM7Z0JBQ3hDLGVBQWUsRUFBRSxLQUFLO2dCQUN0QixpQkFBaUIsRUFBRSxLQUFLO2dCQUN4QixnQkFBZ0IsRUFBRSxLQUFLO2dCQUN2QixxQkFBcUIsRUFBRSxLQUFLO2FBQy9CLENBQUM7WUFDRixvQkFBb0IsRUFBRSxZQUFZO1lBQ2xDLG9CQUFvQixFQUFFLFlBQVk7WUFDbEMsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixhQUFhLEVBQUUsR0FBRyxDQUFD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SyxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDaEcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQ2hHLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUNoRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFDdkcsQ0FBQztDQUNKO0FBbEdELHdDQWtHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5cbmV4cG9ydCBjbGFzcyBTb2NpYWxBcHBTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcbiAgICAgICAgY29uc29sZS5sb2coJ1NvY2lhbEFwcFN0YWNrIGNvbnN0cnVjdG9yIGNhbGxlZCcpO1xuXG4gICAgICAgIC8vIFMzIGJ1Y2tldCBmb3IgaW1hZ2VzIChwcml2YXRlKVxuICAgICAgICBjb25zdCBpbWFnZXNCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdJbWFnZXNCdWNrZXQnLCB7XG4gICAgICAgICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgICAgIGF1dG9EZWxldGVPYmplY3RzOiB0cnVlLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTMyBidWNrZXQgZm9yIHN0YXRpYyB3ZWJzaXRlIGhvc3RpbmcgKGZyb250ZW5kKVxuICAgIGNvbnN0IHdlYnNpdGVCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdXZWJzaXRlQnVja2V0VjInLCB7XG4gICAgICAgICAgICBibG9ja1B1YmxpY0FjY2VzczogbmV3IHMzLkJsb2NrUHVibGljQWNjZXNzKHtcbiAgICAgICAgICAgICAgICBibG9ja1B1YmxpY0FjbHM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGJsb2NrUHVibGljUG9saWN5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IGZhbHNlLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB3ZWJzaXRlSW5kZXhEb2N1bWVudDogJ2luZGV4Lmh0bWwnLFxuICAgICAgICAgICAgd2Vic2l0ZUVycm9yRG9jdW1lbnQ6ICdpbmRleC5odG1sJyxcbiAgICAgICAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IHRydWUsXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFkZCBhIGJ1Y2tldCBwb2xpY3kgZm9yIHB1YmxpYyByZWFkIGFjY2Vzc1xuICAgICAgICB3ZWJzaXRlQnVja2V0LmFkZFRvUmVzb3VyY2VQb2xpY3kobmV3IGNkay5hd3NfaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCddLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbd2Vic2l0ZUJ1Y2tldC5hcm5Gb3JPYmplY3RzKCcqJyldLFxuICAgICAgICAgICAgcHJpbmNpcGFsczogW25ldyBjZGsuYXdzX2lhbS5BbnlQcmluY2lwYWwoKV0sXG4gICAgICAgICAgICBlZmZlY3Q6IGNkay5hd3NfaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIC8vIER5bmFtb0RCIHRhYmxlc1xuICAgICAgICBjb25zdCB1c2Vyc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdVc2Vyc1RhYmxlJywge1xuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd1c2VybmFtZScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHBvc3RzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1Bvc3RzVGFibGUnLCB7XG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Bvc3RJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNvbW1lbnRzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0NvbW1lbnRzVGFibGUnLCB7XG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2NvbW1lbnRJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGxpa2VzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0xpa2VzVGFibGUnLCB7XG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2xpa2VJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gTGFtYmRhIGZ1bmN0aW9uc1xuICAgICAgICBjb25zdCBiYWNrZW5kTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQmFja2VuZExhbWJkYScsIHtcbiAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdzb2NpYWwtYXBwL2JhY2tlbmQnKSxcbiAgICAgICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgICAgICAgVVNFUlNfVEFCTEU6IHVzZXJzVGFibGUudGFibGVOYW1lLFxuICAgICAgICAgICAgICAgIFBPU1RTX1RBQkxFOiBwb3N0c1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgICAgICAgICBDT01NRU5UU19UQUJMRTogY29tbWVudHNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgICAgICAgICAgTElLRVNfVEFCTEU6IGxpa2VzVGFibGUudGFibGVOYW1lLFxuICAgICAgICAgICAgICAgIElNQUdFU19CVUNLRVQ6IGltYWdlc0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICAgICAgICAgIEFETUlOX1VTRVJOQU1FOiAnYWRtaW4nLCAvLyBDaGFuZ2UgYXMgbmVlZGVkXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMjApLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBHcmFudCBMYW1iZGEgYWNjZXNzIHRvIER5bmFtb0RCIGFuZCBTM1xuICAgICAgICB1c2Vyc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShiYWNrZW5kTGFtYmRhKTtcbiAgICAgICAgcG9zdHNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYmFja2VuZExhbWJkYSk7XG4gICAgICAgIGNvbW1lbnRzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGJhY2tlbmRMYW1iZGEpO1xuICAgICAgICBsaWtlc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShiYWNrZW5kTGFtYmRhKTtcbiAgICAgICAgaW1hZ2VzQnVja2V0LmdyYW50UmVhZFdyaXRlKGJhY2tlbmRMYW1iZGEpO1xuXG4gICAgICAgIC8vIEFQSSBHYXRld2F5XG4gICAgICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ1NvY2lhbEFwcEFwaScsIHtcbiAgICAgICAgICAgIHJlc3RBcGlOYW1lOiAnU29jaWFsIE1lZGlhIEFwcCBTZXJ2aWNlJyxcbiAgICAgICAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICAgICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICAgICAgICAgIGFsbG93TWV0aG9kczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQVBJIGVuZHBvaW50c1xuICAgICAgICBhcGkucm9vdC5hZGRSZXNvdXJjZSgncmVnaXN0ZXInKS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihiYWNrZW5kTGFtYmRhKSk7XG4gICAgICAgIGFwaS5yb290LmFkZFJlc291cmNlKCdsb2dpbicpLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGJhY2tlbmRMYW1iZGEpKTtcbiAgICAgICAgYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2xvZ291dCcpLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGJhY2tlbmRMYW1iZGEpKTtcbiAgICAgICAgYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3Bvc3RzJykuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihiYWNrZW5kTGFtYmRhKSk7XG4gICAgICAgIGFwaS5yb290LmFkZFJlc291cmNlKCdwb3N0JykuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYmFja2VuZExhbWJkYSkpO1xuICAgICAgICBhcGkucm9vdC5hZGRSZXNvdXJjZSgnbGlrZScpLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGJhY2tlbmRMYW1iZGEpKTtcbiAgICAgICAgYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2NvbW1lbnQnKS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihiYWNrZW5kTGFtYmRhKSk7XG4gICAgfVxufVxuIl19