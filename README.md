# Resume Static Website - AWS CDK

A fully automated AWS infrastructure project that deploys a professional German resume (Lebenslauf) as a static website using AWS CDK, S3, and CloudFront.

## 🌟 Features

- **🔒 Secure S3 Hosting**: Private S3 bucket with encryption
- **🌍 CloudFront CDN**: Global content delivery with HTTPS
- **🔐 Origin Access Identity**: Secure access via CloudFront only
- **⚡ Infrastructure as Code**: Automated deployment using AWS CDK (TypeScript)
- **📱 Responsive Design**: Beautiful, mobile-friendly HTML/CSS resume
- **📜 PDF Certificates**: Downloadable AWS certificates section
- **🎨 Professional Styling**: Modern gradient design with German localization
- **🚀 Auto Deployment**: One-command deployment with cache invalidation

## 🎯 Live Demo

- **Website**: https://d1uya4rdty5ayg.cloudfront.net
- **Short URL**: https://tinyurl.com/kamal-lebenslauf

## 📋 Prerequisites

- **Node.js** (v18.x or later)
- **npm** (comes with Node.js)
- **AWS CLI** configured with credentials
- **AWS Account** (Free Tier eligible)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd my_aws_cdk_infrastructure
npm install
```

### 2. Configure AWS Profile

If using a specific AWS profile (e.g., `personal`):

```bash
aws configure --profile personal
# Enter your Access Key ID, Secret Key, and region (eu-central-1)
```

### 3. Bootstrap CDK (First Time Only)

```bash
npx cdk bootstrap --profile personal
```

### 4. Customize Your Resume

Edit files in the `resume-content/` folder:

- **`index.html`**: Your resume content (currently in German)
- **`styles.css`**: Styling and colors
- **`error.html`**: Custom 404 page
- **`AWS_Certificates.pdf`**: Your certificates (optional)

### 5. Preview Locally

```bash
open resume-content/index.html
# macOS: open | Windows: start | Linux: xdg-open
```

### 6. Deploy to AWS

```bash
npm run build
npx cdk deploy --profile personal --require-approval never
```

### 7. Invalidate CloudFront Cache (After Updates)

```bash
aws cloudfront create-invalidation \
  --distribution-id E1F0TQSJ1LCMBN \
  --paths "/*" \
  --profile personal
```

## 📁 Project Structure

```
my_aws_cdk_infrastructure/
├── bin/
│   ├── resume-stack.ts          # CDK app entry point
│   └── resume-stack.js          # Compiled JavaScript
├── lib/
│   ├── resume-static-website-stack.ts  # Main infrastructure stack
│   └── resume-static-website-stack.js  # Compiled JavaScript
├── resume-content/              # Website content
│   ├── index.html              # Main resume page (German)
│   ├── styles.css              # Professional styling
│   ├── error.html              # 404 error page
│   └── AWS_Certificates.pdf    # Downloadable certificates
├── test/
│   └── resume-static-website.test.ts  # Unit tests
├── cdk.json                    # CDK configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript config
└── README.md                   # This file
```

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run watch` | Watch mode for development |
| `npm run test` | Run unit tests |
| `npm run deploy` | Build and deploy (with default profile) |
| `npx cdk synth --profile personal` | Generate CloudFormation template |
| `npx cdk diff --profile personal` | Show changes before deployment |
| `npx cdk deploy --profile personal` | Deploy to AWS |
| `npx cdk destroy --profile personal` | Delete all resources |

## 🏗️ AWS Infrastructure

### Resources Created:

1. **S3 Bucket**: `resume-website-128945984791-eu-central-1`
   - Private (no public access)
   - Server-side encryption (AES256)
   - Auto-delete on stack removal (dev/test)

2. **CloudFront Distribution**: `E1F0TQSJ1LCMBN`
   - Global CDN with HTTPS
   - Origin Access Identity (OAI)
   - Custom error pages (404, 403)
   - Cache optimization

3. **IAM Resources**:
   - CloudFront OAI with S3 read permissions
   - Auto-delete Lambda execution role

### Stack Outputs:

```
CloudFrontURL: https://d1uya4rdty5ayg.cloudfront.net
S3BucketName: resume-website-128945984791-eu-central-1
DistributionId: E1F0TQSJ1LCMBN
```

## 🔄 Updating Your Resume

1. **Edit content** in `resume-content/index.html`
2. **Update styling** in `resume-content/styles.css`
3. **Build and deploy**:

```bash
npm run build
npx cdk deploy --profile personal --require-approval never
```

4. **Invalidate cache** (optional, for immediate updates):

```bash
aws cloudfront create-invalidation \
  --distribution-id E1F0TQSJ1LCMBN \
  --paths "/*" \
  --profile personal
```

## 💰 Cost Breakdown

### AWS Free Tier (12 months):
- ✅ **S3**: 5 GB storage, 20K GET requests
- ✅ **CloudFront**: 1 TB data transfer, 10M HTTPS requests
- ✅ **Lambda**: 1M requests (for auto-delete)

### After Free Tier:
- **S3 Storage**: ~$0.023/GB/month (< $0.01 for resume)
- **CloudFront**: $0.085/GB (first 10 TB)
- **Total**: **~$0.50-$2/month** (typical usage)

## 🔒 Security Best Practices

✅ **S3 Bucket**: Private with `BlockPublicAccess` enabled
✅ **HTTPS Only**: Enforced via CloudFront
✅ **Encryption**: S3 server-side encryption (SSE-S3)
✅ **OAI**: Only CloudFront can access S3 objects
✅ **IAM**: Least privilege access policies

## 🌐 Adding a Custom Domain

To use `resume.yourdomain.com`:

1. **Request SSL Certificate** (ACM in `us-east-1`):
   ```bash
   aws acm request-certificate \
     --domain-name resume.yourdomain.com \
     --validation-method DNS \
     --region us-east-1 \
     --profile personal
   ```

2. **Update CDK Stack** in `lib/resume-static-website-stack.ts`:
   ```typescript
   import * as acm from 'aws-cdk-lib/aws-certificatemanager';
   
   const certificate = acm.Certificate.fromCertificateArn(
     this, 'Certificate',
     'arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID'
   );
   
   const distribution = new cloudfront.Distribution(this, 'ResumeDistribution', {
     certificate: certificate,
     domainNames: ['resume.yourdomain.com'],
     // ... rest of config
   });
   ```

3. **Add Route 53 Record** (CNAME or Alias to CloudFront)

## 🎨 Customization Guide

### Change Colors

Edit `resume-content/styles.css`:

```css
/* Main gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Accent color */
.tagline { color: #667eea; }
```

### Add New Section

In `resume-content/index.html`:

```html
<section class="section">
    <h2>New Section Title</h2>
    <p>Your content here...</p>
</section>
```

### Modify Region

In `lib/resume-static-website-stack.ts`:

```typescript
bucketName: `resume-website-${this.account}-${this.region}`,
```

Then redeploy with different region in AWS profile.

## 🐛 Troubleshooting

### Issue: Access Denied (403)

**Cause**: CloudFront OAI not configured properly
**Solution**: Ensure S3 bucket policy allows OAI access:

```bash
npx cdk deploy --profile personal
aws cloudfront create-invalidation --distribution-id E1F0TQSJ1LCMBN --paths "/*" --profile personal
```

### Issue: Old Content Showing

**Cause**: CloudFront cache
**Solution**: Invalidate cache or wait 24 hours

```bash
aws cloudfront create-invalidation \
  --distribution-id E1F0TQSJ1LCMBN \
  --paths "/*" \
  --profile personal
```

### Issue: Deployment Fails

**Cause**: Missing AWS credentials or permissions
**Solution**: Verify credentials:

```bash
aws sts get-caller-identity --profile personal
```

## 📚 Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/cloudfront/)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [TypeScript CDK Workshop](https://cdkworkshop.com/)

## 🧹 Cleanup

To remove all resources and stop incurring costs:

```bash
npx cdk destroy --profile personal
```

⚠️ **Warning**: This permanently deletes:
- S3 bucket and all content
- CloudFront distribution
- All stack resources

## 📄 License

MIT License - Free to use for personal or commercial projects

## 👤 Author

**Kamalakannan Sundaramurthy**
- 📧 Email: kontaktkamal@yahoo.de
- 🔗 LinkedIn: [kamalakannan-sundaramurthy](https://www.linkedin.com/in/kamalakannan-sundaramurthy-94912a16a/)
- 🌐 Resume: https://tinyurl.com/kamal-lebenslauf

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**Built with ❤️ using AWS CDK | Deployed in EU (Frankfurt) | German Localized**
