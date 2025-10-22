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
exports.ResumeStaticWebsiteStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const s3deploy = __importStar(require("aws-cdk-lib/aws-s3-deployment"));
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const aws_cloudfront_origins_1 = require("aws-cdk-lib/aws-cloudfront-origins");
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
class ResumeStaticWebsiteStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Create S3 bucket for hosting the resume
        const resumeBucket = new s3.Bucket(this, 'ResumeBucket', {
            bucketName: `resume-website-${this.account}-${this.region}`,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            versioned: false,
        });
        // Create Origin Access Identity for CloudFront
        const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
            comment: 'OAI for Resume Website',
        });
        // Grant CloudFront access to the S3 bucket
        resumeBucket.addToResourcePolicy(new iam.PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [resumeBucket.arnForObjects('*')],
            principals: [
                new iam.CanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId),
            ],
        }));
        // Create CloudFront distribution (no authentication - using client-side JavaScript instead)
        const distribution = new cloudfront.Distribution(this, 'ResumeDistribution', {
            defaultBehavior: {
                origin: aws_cloudfront_origins_1.S3BucketOrigin.withOriginAccessControl(resumeBucket),
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
            comment: 'CloudFront distribution for resume website',
        });
        // Deploy resume content to S3
        new s3deploy.BucketDeployment(this, 'DeployResume', {
            sources: [s3deploy.Source.asset('./resume-content')],
            destinationBucket: resumeBucket,
            distribution: distribution,
            distributionPaths: ['/*'],
        });
        // Output the CloudFront URL
        new cdk.CfnOutput(this, 'CloudFrontURL', {
            value: `https://${distribution.distributionDomainName}`,
            description: 'CloudFront Distribution URL for Resume Website',
            exportName: 'ResumeWebsiteURL',
        });
        // Output the S3 bucket name
        new cdk.CfnOutput(this, 'S3BucketName', {
            value: resumeBucket.bucketName,
            description: 'S3 Bucket Name for Resume Content',
            exportName: 'ResumeBucketName',
        });
        // Output the CloudFront Distribution ID
        new cdk.CfnOutput(this, 'DistributionId', {
            value: distribution.distributionId,
            description: 'CloudFront Distribution ID',
            exportName: 'ResumeDistributionId',
        });
    }
}
exports.ResumeStaticWebsiteStack = ResumeStaticWebsiteStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdW1lLXN0YXRpYy13ZWJzaXRlLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVzdW1lLXN0YXRpYy13ZWJzaXRlLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBRW5DLHVEQUF5QztBQUN6Qyx3RUFBMEQ7QUFDMUQsdUVBQXlEO0FBQ3pELCtFQUFvRTtBQUNwRSx5REFBMkM7QUFFM0MsTUFBYSx3QkFBeUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNyRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDBDQUEwQztRQUMxQyxNQUFNLFlBQVksR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN2RCxVQUFVLEVBQUUsa0JBQWtCLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUMzRCxnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDeEMsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7WUFDMUMsVUFBVSxFQUFFLElBQUk7WUFDaEIsU0FBUyxFQUFFLEtBQUs7U0FDakIsQ0FBQyxDQUFDO1FBRUgsK0NBQStDO1FBQy9DLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxVQUFVLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUM1RSxPQUFPLEVBQUUsd0JBQXdCO1NBQ2xDLENBQUMsQ0FBQztRQUVILDJDQUEyQztRQUMzQyxZQUFZLENBQUMsbUJBQW1CLENBQzlCLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUN0QixPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUM7WUFDekIsU0FBUyxFQUFFLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1QyxVQUFVLEVBQUU7Z0JBQ1YsSUFBSSxHQUFHLENBQUMsc0JBQXNCLENBQzVCLG9CQUFvQixDQUFDLCtDQUErQyxDQUNyRTthQUNGO1NBQ0YsQ0FBQyxDQUNILENBQUM7UUFFRiw0RkFBNEY7UUFDNUYsTUFBTSxZQUFZLEdBQUcsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUMzRSxlQUFlLEVBQUU7Z0JBQ2YsTUFBTSxFQUFFLHVDQUFjLENBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDO2dCQUM1RCxvQkFBb0IsRUFBRSxVQUFVLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCO2dCQUN2RSxjQUFjLEVBQUUsVUFBVSxDQUFDLGNBQWMsQ0FBQyxjQUFjO2dCQUN4RCxhQUFhLEVBQUUsVUFBVSxDQUFDLGFBQWEsQ0FBQyxjQUFjO2dCQUN0RCxRQUFRLEVBQUUsSUFBSTtnQkFDZCxXQUFXLEVBQUUsVUFBVSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUI7YUFDdEQ7WUFDRCxpQkFBaUIsRUFBRSxZQUFZO1lBQy9CLGNBQWMsRUFBRTtnQkFDZDtvQkFDRSxVQUFVLEVBQUUsR0FBRztvQkFDZixrQkFBa0IsRUFBRSxHQUFHO29CQUN2QixnQkFBZ0IsRUFBRSxhQUFhO29CQUMvQixHQUFHLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUM3QjtnQkFDRDtvQkFDRSxVQUFVLEVBQUUsR0FBRztvQkFDZixrQkFBa0IsRUFBRSxHQUFHO29CQUN2QixnQkFBZ0IsRUFBRSxhQUFhO29CQUMvQixHQUFHLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUM3QjthQUNGO1lBQ0QsVUFBVSxFQUFFLFVBQVUsQ0FBQyxVQUFVLENBQUMsZUFBZTtZQUNqRCxPQUFPLEVBQUUsSUFBSTtZQUNiLE9BQU8sRUFBRSw0Q0FBNEM7U0FDdEQsQ0FBQyxDQUFDO1FBRUgsOEJBQThCO1FBQzlCLElBQUksUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDbEQsT0FBTyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUNwRCxpQkFBaUIsRUFBRSxZQUFZO1lBQy9CLFlBQVksRUFBRSxZQUFZO1lBQzFCLGlCQUFpQixFQUFFLENBQUMsSUFBSSxDQUFDO1NBQzFCLENBQUMsQ0FBQztRQUVILDRCQUE0QjtRQUM1QixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUN2QyxLQUFLLEVBQUUsV0FBVyxZQUFZLENBQUMsc0JBQXNCLEVBQUU7WUFDdkQsV0FBVyxFQUFFLGdEQUFnRDtZQUM3RCxVQUFVLEVBQUUsa0JBQWtCO1NBQy9CLENBQUMsQ0FBQztRQUVILDRCQUE0QjtRQUM1QixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN0QyxLQUFLLEVBQUUsWUFBWSxDQUFDLFVBQVU7WUFDOUIsV0FBVyxFQUFFLG1DQUFtQztZQUNoRCxVQUFVLEVBQUUsa0JBQWtCO1NBQy9CLENBQUMsQ0FBQztRQUVILHdDQUF3QztRQUN4QyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ3hDLEtBQUssRUFBRSxZQUFZLENBQUMsY0FBYztZQUNsQyxXQUFXLEVBQUUsNEJBQTRCO1lBQ3pDLFVBQVUsRUFBRSxzQkFBc0I7U0FDbkMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBN0ZELDREQTZGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBzM2RlcGxveSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMtZGVwbG95bWVudCc7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCB7IFMzQnVja2V0T3JpZ2luIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5cbmV4cG9ydCBjbGFzcyBSZXN1bWVTdGF0aWNXZWJzaXRlU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBDcmVhdGUgUzMgYnVja2V0IGZvciBob3N0aW5nIHRoZSByZXN1bWVcbiAgICBjb25zdCByZXN1bWVCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdSZXN1bWVCdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiBgcmVzdW1lLXdlYnNpdGUtJHt0aGlzLmFjY291bnR9LSR7dGhpcy5yZWdpb259YCxcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIEZvciBkZXYvdGVzdDsgdXNlIFJFVEFJTiBmb3IgcHJvZHVjdGlvblxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsIC8vIEZvciBkZXYvdGVzdDsgdXNlIGZhbHNlIGZvciBwcm9kdWN0aW9uXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxuICAgICAgdmVyc2lvbmVkOiBmYWxzZSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBPcmlnaW4gQWNjZXNzIElkZW50aXR5IGZvciBDbG91ZEZyb250XG4gICAgY29uc3Qgb3JpZ2luQWNjZXNzSWRlbnRpdHkgPSBuZXcgY2xvdWRmcm9udC5PcmlnaW5BY2Nlc3NJZGVudGl0eSh0aGlzLCAnT0FJJywge1xuICAgICAgY29tbWVudDogJ09BSSBmb3IgUmVzdW1lIFdlYnNpdGUnLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgQ2xvdWRGcm9udCBhY2Nlc3MgdG8gdGhlIFMzIGJ1Y2tldFxuICAgIHJlc3VtZUJ1Y2tldC5hZGRUb1Jlc291cmNlUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCddLFxuICAgICAgICByZXNvdXJjZXM6IFtyZXN1bWVCdWNrZXQuYXJuRm9yT2JqZWN0cygnKicpXSxcbiAgICAgICAgcHJpbmNpcGFsczogW1xuICAgICAgICAgIG5ldyBpYW0uQ2Fub25pY2FsVXNlclByaW5jaXBhbChcbiAgICAgICAgICAgIG9yaWdpbkFjY2Vzc0lkZW50aXR5LmNsb3VkRnJvbnRPcmlnaW5BY2Nlc3NJZGVudGl0eVMzQ2Fub25pY2FsVXNlcklkXG4gICAgICAgICAgKSxcbiAgICAgICAgXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBDbG91ZEZyb250IGRpc3RyaWJ1dGlvbiAobm8gYXV0aGVudGljYXRpb24gLSB1c2luZyBjbGllbnQtc2lkZSBKYXZhU2NyaXB0IGluc3RlYWQpXG4gICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsICdSZXN1bWVEaXN0cmlidXRpb24nLCB7XG4gICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcbiAgICAgICAgb3JpZ2luOiBTM0J1Y2tldE9yaWdpbi53aXRoT3JpZ2luQWNjZXNzQ29udHJvbChyZXN1bWVCdWNrZXQpLFxuICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfR0VUX0hFQUQsXG4gICAgICAgIGNhY2hlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQ2FjaGVkTWV0aG9kcy5DQUNIRV9HRVRfSEVBRCxcbiAgICAgICAgY29tcHJlc3M6IHRydWUsXG4gICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfT1BUSU1JWkVELFxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRSb290T2JqZWN0OiAnaW5kZXguaHRtbCcsXG4gICAgICBlcnJvclJlc3BvbnNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgaHR0cFN0YXR1czogNDA0LFxuICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogNDA0LFxuICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvZXJyb3IuaHRtbCcsXG4gICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwMyxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDQwMyxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2Vycm9yLmh0bWwnLFxuICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgcHJpY2VDbGFzczogY2xvdWRmcm9udC5QcmljZUNsYXNzLlBSSUNFX0NMQVNTXzEwMCwgLy8gVXNlIG9ubHkgTm9ydGggQW1lcmljYSBhbmQgRXVyb3BlXG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgY29tbWVudDogJ0Nsb3VkRnJvbnQgZGlzdHJpYnV0aW9uIGZvciByZXN1bWUgd2Vic2l0ZScsXG4gICAgfSk7XG5cbiAgICAvLyBEZXBsb3kgcmVzdW1lIGNvbnRlbnQgdG8gUzNcbiAgICBuZXcgczNkZXBsb3kuQnVja2V0RGVwbG95bWVudCh0aGlzLCAnRGVwbG95UmVzdW1lJywge1xuICAgICAgc291cmNlczogW3MzZGVwbG95LlNvdXJjZS5hc3NldCgnLi9yZXN1bWUtY29udGVudCcpXSxcbiAgICAgIGRlc3RpbmF0aW9uQnVja2V0OiByZXN1bWVCdWNrZXQsXG4gICAgICBkaXN0cmlidXRpb246IGRpc3RyaWJ1dGlvbixcbiAgICAgIGRpc3RyaWJ1dGlvblBhdGhzOiBbJy8qJ10sXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXQgdGhlIENsb3VkRnJvbnQgVVJMXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Nsb3VkRnJvbnRVUkwnLCB7XG4gICAgICB2YWx1ZTogYGh0dHBzOi8vJHtkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZX1gLFxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZEZyb250IERpc3RyaWJ1dGlvbiBVUkwgZm9yIFJlc3VtZSBXZWJzaXRlJyxcbiAgICAgIGV4cG9ydE5hbWU6ICdSZXN1bWVXZWJzaXRlVVJMJyxcbiAgICB9KTtcblxuICAgIC8vIE91dHB1dCB0aGUgUzMgYnVja2V0IG5hbWVcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUzNCdWNrZXROYW1lJywge1xuICAgICAgdmFsdWU6IHJlc3VtZUJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdTMyBCdWNrZXQgTmFtZSBmb3IgUmVzdW1lIENvbnRlbnQnLFxuICAgICAgZXhwb3J0TmFtZTogJ1Jlc3VtZUJ1Y2tldE5hbWUnLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0IHRoZSBDbG91ZEZyb250IERpc3RyaWJ1dGlvbiBJRFxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEaXN0cmlidXRpb25JZCcsIHtcbiAgICAgIHZhbHVlOiBkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nsb3VkRnJvbnQgRGlzdHJpYnV0aW9uIElEJyxcbiAgICAgIGV4cG9ydE5hbWU6ICdSZXN1bWVEaXN0cmlidXRpb25JZCcsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==