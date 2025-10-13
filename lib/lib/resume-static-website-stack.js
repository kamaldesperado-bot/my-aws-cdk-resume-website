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
const origins = __importStar(require("aws-cdk-lib/aws-cloudfront-origins"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
class ResumeStaticWebsiteStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Create S3 bucket for hosting the resume
        const resumeBucket = new s3.Bucket(this, 'ResumeBucket', {
            bucketName: `resume-website-${this.account}-${this.region}`,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'error.html',
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
        // Create CloudFront distribution
        const distribution = new cloudfront.Distribution(this, 'ResumeDistribution', {
            defaultBehavior: {
                origin: new origins.S3Origin(resumeBucket, {
                    originAccessIdentity: originAccessIdentity,
                }),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdW1lLXN0YXRpYy13ZWJzaXRlLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vcmVzdW1lLXN0YXRpYy13ZWJzaXRlLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBRW5DLHVEQUF5QztBQUN6Qyx3RUFBMEQ7QUFDMUQsdUVBQXlEO0FBQ3pELDRFQUE4RDtBQUM5RCx5REFBMkM7QUFFM0MsTUFBYSx3QkFBeUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNyRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDBDQUEwQztRQUMxQyxNQUFNLFlBQVksR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN2RCxVQUFVLEVBQUUsa0JBQWtCLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUMzRCxvQkFBb0IsRUFBRSxZQUFZO1lBQ2xDLG9CQUFvQixFQUFFLFlBQVk7WUFDbEMsZ0JBQWdCLEVBQUUsS0FBSztZQUN2QixpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsVUFBVSxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVO1lBQzFDLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFNBQVMsRUFBRSxLQUFLO1NBQ2pCLENBQUMsQ0FBQztRQUVILCtDQUErQztRQUMvQyxNQUFNLG9CQUFvQixHQUFHLElBQUksVUFBVSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7WUFDNUUsT0FBTyxFQUFFLHdCQUF3QjtTQUNs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REFpR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgczNkZXBsb3kgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWRlcGxveW1lbnQnO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgKiBhcyBvcmlnaW5zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnMnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuXG5leHBvcnQgY2xhc3MgUmVzdW1lU3RhdGljV2Vic2l0ZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gQ3JlYXRlIFMzIGJ1Y2tldCBmb3IgaG9zdGluZyB0aGUgcmVzdW1lXG4gICAgY29uc3QgcmVzdW1lQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnUmVzdW1lQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYHJlc3VtZS13ZWJzaXRlLSR7dGhpcy5hY2NvdW50fS0ke3RoaXMucmVnaW9ufWAsXG4gICAgICB3ZWJzaXRlSW5kZXhEb2N1bWVudDogJ2luZGV4Lmh0bWwnLFxuICAgICAgd2Vic2l0ZUVycm9yRG9jdW1lbnQ6ICdlcnJvci5odG1sJyxcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIEZvciBkZXYvdGVzdDsgdXNlIFJFVEFJTiBmb3IgcHJvZHVjdGlvblxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsIC8vIEZvciBkZXYvdGVzdDsgdXNlIGZhbHNlIGZvciBwcm9kdWN0aW9uXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxuICAgICAgdmVyc2lvbmVkOiBmYWxzZSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBPcmlnaW4gQWNjZXNzIElkZW50aXR5IGZvciBDbG91ZEZyb250XG4gICAgY29uc3Qgb3JpZ2luQWNjZXNzSWRlbnRpdHkgPSBuZXcgY2xvdWRmcm9udC5PcmlnaW5BY2Nlc3NJZGVudGl0eSh0aGlzLCAnT0FJJywge1xuICAgICAgY29tbWVudDogJ09BSSBmb3IgUmVzdW1lIFdlYnNpdGUnLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgQ2xvdWRGcm9udCBhY2Nlc3MgdG8gdGhlIFMzIGJ1Y2tldFxuICAgIHJlc3VtZUJ1Y2tldC5hZGRUb1Jlc291cmNlUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbJ3MzOkdldE9iamVjdCddLFxuICAgICAgICByZXNvdXJjZXM6IFtyZXN1bWVCdWNrZXQuYXJuRm9yT2JqZWN0cygnKicpXSxcbiAgICAgICAgcHJpbmNpcGFsczogW1xuICAgICAgICAgIG5ldyBpYW0uQ2Fub25pY2FsVXNlclByaW5jaXBhbChcbiAgICAgICAgICAgIG9yaWdpbkFjY2Vzc0lkZW50aXR5LmNsb3VkRnJvbnRPcmlnaW5BY2Nlc3NJZGVudGl0eVMzQ2Fub25pY2FsVXNlcklkXG4gICAgICAgICAgKSxcbiAgICAgICAgXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBDbG91ZEZyb250IGRpc3RyaWJ1dGlvblxuICAgIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbih0aGlzLCAnUmVzdW1lRGlzdHJpYnV0aW9uJywge1xuICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7XG4gICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuUzNPcmlnaW4ocmVzdW1lQnVja2V0LCB7XG4gICAgICAgICAgb3JpZ2luQWNjZXNzSWRlbnRpdHk6IG9yaWdpbkFjY2Vzc0lkZW50aXR5LFxuICAgICAgICB9KSxcbiAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgIGFsbG93ZWRNZXRob2RzOiBjbG91ZGZyb250LkFsbG93ZWRNZXRob2RzLkFMTE9XX0dFVF9IRUFELFxuICAgICAgICBjYWNoZWRNZXRob2RzOiBjbG91ZGZyb250LkNhY2hlZE1ldGhvZHMuQ0FDSEVfR0VUX0hFQUQsXG4gICAgICAgIGNvbXByZXNzOiB0cnVlLFxuICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRCxcbiAgICAgIH0sXG4gICAgICBkZWZhdWx0Um9vdE9iamVjdDogJ2luZGV4Lmh0bWwnLFxuICAgICAgZXJyb3JSZXNwb25zZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2Vycm9yLmh0bWwnLFxuICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBodHRwU3RhdHVzOiA0MDMsXG4gICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiA0MDMsXG4gICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy9lcnJvci5odG1sJyxcbiAgICAgICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHByaWNlQ2xhc3M6IGNsb3VkZnJvbnQuUHJpY2VDbGFzcy5QUklDRV9DTEFTU18xMDAsIC8vIFVzZSBvbmx5IE5vcnRoIEFtZXJpY2EgYW5kIEV1cm9wZVxuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIGNvbW1lbnQ6ICdDbG91ZEZyb250IGRpc3RyaWJ1dGlvbiBmb3IgcmVzdW1lIHdlYnNpdGUnLFxuICAgIH0pO1xuXG4gICAgLy8gRGVwbG95IHJlc3VtZSBjb250ZW50IHRvIFMzXG4gICAgbmV3IHMzZGVwbG95LkJ1Y2tldERlcGxveW1lbnQodGhpcywgJ0RlcGxveVJlc3VtZScsIHtcbiAgICAgIHNvdXJjZXM6IFtzM2RlcGxveS5Tb3VyY2UuYXNzZXQoJy4vcmVzdW1lLWNvbnRlbnQnKV0sXG4gICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogcmVzdW1lQnVja2V0LFxuICAgICAgZGlzdHJpYnV0aW9uOiBkaXN0cmlidXRpb24sXG4gICAgICBkaXN0cmlidXRpb25QYXRoczogWycvKiddLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0IHRoZSBDbG91ZEZyb250IFVSTFxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDbG91ZEZyb250VVJMJywge1xuICAgICAgdmFsdWU6IGBodHRwczovLyR7ZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWV9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gVVJMIGZvciBSZXN1bWUgV2Vic2l0ZScsXG4gICAgICBleHBvcnROYW1lOiAnUmVzdW1lV2Vic2l0ZVVSTCcsXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXQgdGhlIFMzIGJ1Y2tldCBuYW1lXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1MzQnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiByZXN1bWVCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUzMgQnVja2V0IE5hbWUgZm9yIFJlc3VtZSBDb250ZW50JyxcbiAgICAgIGV4cG9ydE5hbWU6ICdSZXN1bWVCdWNrZXROYW1lJyxcbiAgICB9KTtcblxuICAgIC8vIE91dHB1dCB0aGUgQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gSURcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGlzdHJpYnV0aW9uSWQnLCB7XG4gICAgICB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZEZyb250IERpc3RyaWJ1dGlvbiBJRCcsXG4gICAgICBleHBvcnROYW1lOiAnUmVzdW1lRGlzdHJpYnV0aW9uSWQnLFxuICAgIH0pO1xuICB9XG59XG4iXX0=