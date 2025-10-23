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
exports.SocialAppStack = SocialAppStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29jaWFsLWFwcC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNvY2lhbC1hcHAtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFFbkMsdURBQXlDO0FBQ3pDLG1FQUFxRDtBQUNyRCwrREFBaUQ7QUFDakQsdUVBQXlEO0FBRXpELE1BQWEsY0FBZSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ3pDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFHeEIsaUNBQWlDO1FBQ2pDLE1BQU0sWUFBWSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3JELGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDeEMsaUJBQWlCLEVBQUUsSUFBSTtTQUMxQixDQUFDLENBQUM7UUFFSCxrREFBa0Q7UUFDbEQsTUFBTSxhQUFhLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkQsb0JBQW9CLEVBQUUsWUFBWTtZQUNsQyxvQkFBb0IsRUFBRSxZQUFZO1lBQ2xDLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztZQUN4QyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGlCQUFpQixFQUFFLElBQUksRUFBRSxDQUFDLGlCQUFpQixDQUFDO2dCQUN4QyxlQUFlLEVBQUUsS0FBSztnQkFDdEIsaUJBQWlCLEVBQUUsS0FBSztnQkFDeEIsZ0JBQWdCLEVBQUUsS0FBSztnQkFDdkIscUJBQXFCLEVBQUUsS0FBSzthQUMvQixDQUFDO1NBQ0wsQ0FBQyxDQUFDO1FBRUgsNkNBQTZDO1FBQzdDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDO1lBQzlELE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQztZQUN6QixTQUFTLEVBQUUsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdDLFVBQVUsRUFBRSxDQUFDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUM1QyxNQUFNLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSztTQUNuQyxDQUFDLENBQUMsQ0FBQztRQUVKLGtCQUFrQjtRQUNsQixNQUFNLFVBQVUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUN0RCxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN2RSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDM0MsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxVQUFVLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDdEQsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDckUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZTtZQUNqRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1NBQzNDLENBQUMsQ0FBQztRQUNILE1BQU0sYUFBYSxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQzVELFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ3hFLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWU7WUFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUMzQyxDQUFDLENBQUM7UUFDSCxNQUFNLFVBQVUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUN0RCxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNyRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDM0MsQ0FBQyxDQUFDO1FBRUgsbUJBQW1CO1FBQ25CLE1BQU0sYUFBYSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQzdELE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsT0FBTyxFQUFFLGVBQWU7WUFDeEIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztZQUN6QyxXQUFXLEVBQUU7Z0JBQ1QsV0FBVyxFQUFFLFVBQVUsQ0FBQyxTQUFTO2dCQUNqQyxXQUFXLEVBQUUsVUFBVSxDQUFDLFNBQVM7Z0JBQ2pDLGNBQWMsRUFBRSxhQUFhLENBQUMsU0FBUztnQkFDdkMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxTQUFTO2dCQUNqQyxhQUFhLEVBQUUsWUFBWSxDQUFDLFVBQVU7Z0JBQ3RDLGNBQWMsRUFBRSxPQUFPLEVBQUUsbUJBQW1CO2FBQy9DO1lBQ0QsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztTQUNwQyxDQUFDLENBQUM7UUFFSCx5Q0FBeUM7UUFDekMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzdDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM3QyxhQUFhLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDaEQsVUFBVSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzdDLFlBQVksQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFM0MsY0FBYztRQUNkLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3JELFdBQVcsRUFBRSwwQkFBMEI7WUFDdkMsMkJBQTJCLEVBQUU7Z0JBQ3pCLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ3pDLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVc7YUFDNUM7U0FDSixDQUFDLENBQUM7UUFFSCxnQkFBZ0I7UUFDaEIsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQ3BHLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUNqRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDbEcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQ2hHLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUNoRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDaEcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBQ3ZHLENBQUM7Q0FDSjtBQWxHRCx3Q0FrR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuXG5leHBvcnQgY2xhc3MgU29jaWFsQXBwU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cblxuICAgICAgICAvLyBTMyBidWNrZXQgZm9yIGltYWdlcyAocHJpdmF0ZSlcbiAgICAgICAgY29uc3QgaW1hZ2VzQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnSW1hZ2VzQnVja2V0Jywge1xuICAgICAgICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICAgICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUzMgYnVja2V0IGZvciBzdGF0aWMgd2Vic2l0ZSBob3N0aW5nIChmcm9udGVuZClcbiAgICAgICAgY29uc3Qgd2Vic2l0ZUJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1dlYnNpdGVCdWNrZXQnLCB7XG4gICAgICAgICAgICB3ZWJzaXRlSW5kZXhEb2N1bWVudDogJ2luZGV4Lmh0bWwnLFxuICAgICAgICAgICAgd2Vic2l0ZUVycm9yRG9jdW1lbnQ6ICdpbmRleC5odG1sJyxcbiAgICAgICAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IHRydWUsXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsXG4gICAgICAgICAgICBibG9ja1B1YmxpY0FjY2VzczogbmV3IHMzLkJsb2NrUHVibGljQWNjZXNzKHtcbiAgICAgICAgICAgICAgICBibG9ja1B1YmxpY0FjbHM6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGJsb2NrUHVibGljUG9saWN5OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IGZhbHNlLFxuICAgICAgICAgICAgfSksXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFkZCBhIGJ1Y2tldCBwb2xpY3kgZm9yIHB1YmxpYyByZWFkIGFjY2Vzc1xuICAgICAgICB3ZWJzaXRlQnVja2V0LmFkZFRvUmVzb3VyY2VQb2xpY3kobmV3IGNkay5hd3NfaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCddLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbd2Vic2l0ZUJ1Y2tldC5hcm5Gb3JPYmplY3RzKCcqJyldLFxuICAgICAgICAgICAgcHJpbmNpcGFsczogW25ldyBjZGsuYXdzX2lhbS5BbnlQcmluY2lwYWwoKV0sXG4gICAgICAgICAgICBlZmZlY3Q6IGNkay5hd3NfaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIC8vIER5bmFtb0RCIHRhYmxlc1xuICAgICAgICBjb25zdCB1c2Vyc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdVc2Vyc1RhYmxlJywge1xuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICd1c2VybmFtZScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHBvc3RzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1Bvc3RzVGFibGUnLCB7XG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Bvc3RJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNvbW1lbnRzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0NvbW1lbnRzVGFibGUnLCB7XG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2NvbW1lbnRJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGxpa2VzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0xpa2VzVGFibGUnLCB7XG4gICAgICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2xpa2VJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gTGFtYmRhIGZ1bmN0aW9uc1xuICAgICAgICBjb25zdCBiYWNrZW5kTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQmFja2VuZExhbWJkYScsIHtcbiAgICAgICAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9iYWNrZW5kJyksXG4gICAgICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgICAgICAgIFVTRVJTX1RBQkxFOiB1c2Vyc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgICAgICAgICBQT1NUU19UQUJMRTogcG9zdHNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgICAgICAgICAgQ09NTUVOVFNfVEFCTEU6IGNvbW1lbnRzVGFibGUudGFibGVOYW1lLFxuICAgICAgICAgICAgICAgIExJS0VTX1RBQkxFOiBsaWtlc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgICAgICAgICBJTUFHRVNfQlVDS0VUOiBpbWFnZXNCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgICAgICAgICBBRE1JTl9VU0VSTkFNRTogJ2FkbWluJywgLy8gQ2hhbmdlIGFzIG5lZWRlZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDIwKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gR3JhbnQgTGFtYmRhIGFjY2VzcyB0byBEeW5hbW9EQiBhbmQgUzNcbiAgICAgICAgdXNlcnNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYmFja2VuZExhbWJkYSk7XG4gICAgICAgIHBvc3RzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGJhY2tlbmRMYW1iZGEpO1xuICAgICAgICBjb21tZW50c1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShiYWNrZW5kTGFtYmRhKTtcbiAgICAgICAgbGlrZXNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYmFja2VuZExhbWJkYSk7XG4gICAgICAgIGltYWdlc0J1Y2tldC5ncmFudFJlYWRXcml0ZShiYWNrZW5kTGFtYmRhKTtcblxuICAgICAgICAvLyBBUEkgR2F0ZXdheVxuICAgICAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdTb2NpYWxBcHBBcGknLCB7XG4gICAgICAgICAgICByZXN0QXBpTmFtZTogJ1NvY2lhbCBNZWRpYSBBcHAgU2VydmljZScsXG4gICAgICAgICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcbiAgICAgICAgICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFQSSBlbmRwb2ludHNcbiAgICAgICAgYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3JlZ2lzdGVyJykuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYmFja2VuZExhbWJkYSkpO1xuICAgICAgICBhcGkucm9vdC5hZGRSZXNvdXJjZSgnbG9naW4nKS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihiYWNrZW5kTGFtYmRhKSk7XG4gICAgICAgIGFwaS5yb290LmFkZFJlc291cmNlKCdsb2dvdXQnKS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihiYWNrZW5kTGFtYmRhKSk7XG4gICAgICAgIGFwaS5yb290LmFkZFJlc291cmNlKCdwb3N0cycpLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYmFja2VuZExhbWJkYSkpO1xuICAgICAgICBhcGkucm9vdC5hZGRSZXNvdXJjZSgncG9zdCcpLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGJhY2tlbmRMYW1iZGEpKTtcbiAgICAgICAgYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2xpa2UnKS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihiYWNrZW5kTGFtYmRhKSk7XG4gICAgICAgIGFwaS5yb290LmFkZFJlc291cmNlKCdjb21tZW50JykuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYmFja2VuZExhbWJkYSkpO1xuICAgIH1cbn1cbiJdfQ==