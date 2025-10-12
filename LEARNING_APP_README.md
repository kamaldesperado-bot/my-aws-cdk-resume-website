# Learning App for School Students

A cost-effective, AI-powered educational platform built with AWS CDK that helps school students get instant answers to their questions along with relevant YouTube educational videos.

## � Features

- **Secure Authentication**: User registration and login with JWT tokens
- **AI-Powered Q&A**: Get intelligent answers using Google Gemini AI
- **Educational Videos**: Automatic YouTube video suggestions for each question
- **Serverless Architecture**: Cost-effective AWS Lambda deployment
- **Responsive Web Interface**: Clean, modern UI for desktop and mobile

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │────│  CloudFront     │────│      S3         │
│                 │    │  Distribution   │    │   Static Files  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                         │
                                                         │
┌─────────────────┐    ┌─────────────────┐               │
│   API Gateway   │────│    Lambda       │◄──────────────┘
│                 │    │   Functions     │
└─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   DynamoDB      │    │   Gemini AI     │
│   Users Table   │    │   YouTube API   │
└─────────────────┘    └─────────────────┘
```

### Architecture Components:

1. **Frontend (S3 + CloudFront)**:
   - Static HTML/CSS/JavaScript files hosted on S3
   - Global CDN distribution via CloudFront for fast loading

2. **Backend (API Gateway + Lambda)**:
   - RESTful API endpoints via API Gateway
   - Serverless functions for authentication, chat, and user management

3. **Database (DynamoDB)**:
   - NoSQL database for user credentials and session data

4. **External APIs**:
   - Google Gemini AI for intelligent answers
   - YouTube Data API for educational video suggestions

## 📋 Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- Google Cloud Console account with Gemini API enabled
- YouTube Data API v3 key

## 🚀 Deployment

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd my-aws-cdk-infrastructure
npm install
```

### 2. Configure API Keys

Update the API keys in `lib/learning-app-stack.ts`:

```typescript
environment: {
  GEMINI_API_KEY: 'your-gemini-api-key',
  YOUTUBE_API_KEY: 'your-youtube-api-key',
  JWT_SECRET: 'your-jwt-secret-key',
},
```

### 3. Build and Deploy

```bash
# Build the CDK project
npm run build

# Deploy to AWS
cdk deploy LearningAppStack --profile your-aws-profile
```

### 4. Get the Application URL

After deployment, note the CloudFront URL from the outputs:
```
LearningAppStack.CloudFrontURL = https://your-distribution-id.cloudfront.net
```

## � Usage

### For Students:

1. **Register**: Create an account with username and password
2. **Login**: Sign in to access the learning features
3. **Ask Questions**: Type your question in the chat interface
4. **Get Answers**: Receive AI-generated explanations and YouTube video links

### Example Questions:
- "What is photosynthesis?"
- "How do I solve quadratic equations?"
- "Explain Newton's laws of motion"

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | User registration | No |
| POST | `/login` | User authentication | No |
| POST | `/chat` | Submit question for AI answer | Yes |

### Chat Request Format:
```json
{
  "question": "What is 2+2?"
}
```

### Chat Response Format:
```json
{
  "answer": "2 + 2 = 4",
  "explanation": "2 + 2 equals 4",
  "videos": [
    {
      "title": "Basic Addition Tutorial",
      "url": "https://www.youtube.com/watch?v=example"
    }
  ]
}
```

## 💰 Cost Analysis

This application is designed for cost-effectiveness with serverless architecture and pay-per-use pricing.

### AWS Services (Free Tier Eligible)

| Service | Free Tier | Paid Usage | Estimated Cost |
|---------|-----------|------------|----------------|
| **Lambda** | 1M requests/month | $0.20 per 1M requests | ~$0.20/month (10K requests) |
| **API Gateway** | 1M requests/month | $3.50 per million requests | ~$3.50/month (1M requests) |
| **DynamoDB** | 25GB storage + 200M RCUs | $1.25 per GB/month | ~$0.50/month (5GB) |
| **S3** | 5GB storage + 20K requests | $0.023/GB/month | ~$0.02/month (1GB) |
| **CloudFront** | 1TB data transfer | $0.085/GB (first 10TB) | ~$1.00/month (10GB) |

### External API Costs

| Service | Pricing | Estimated Cost |
|---------|---------|----------------|
| **Google Gemini AI** | $0.002 per request (gemini-2.0-flash) | ~$0.20/month (100 requests) |
| **YouTube Data API** | $0.005 per request | ~$0.50/month (100 requests) |

### Total Estimated Monthly Costs

#### Low Usage (100 students, 10 questions/day)
- **AWS Services**: ~$2.50/month
- **External APIs**: ~$0.70/month
- **Total**: **~$3.20/month**

#### Medium Usage (500 students, 50 questions/day)
- **AWS Services**: ~$15.00/month
- **External APIs**: ~$3.50/month
- **Total**: **~$18.50/month**

#### High Usage (1000 students, 100 questions/day)
- **AWS Services**: ~$45.00/month
- **External APIs**: ~$7.00/month
- **Total**: **~$52.00/month**

### Cost Optimization Strategies

1. **Free Tier Maximization**:
   - Lambda: 1M free requests/month
   - API Gateway: 1M free requests/month
   - DynamoDB: 25GB free storage

2. **Caching**:
   - CloudFront reduces API Gateway calls
   - Implement response caching for common questions

3. **Usage Monitoring**:
   - Set up CloudWatch alarms for cost monitoring
   - Implement rate limiting to control usage

4. **Reserved Capacity** (for high usage):
   - DynamoDB reserved capacity for predictable workloads

### Cost Monitoring

Set up AWS Cost Explorer and CloudWatch dashboards to monitor:

```bash
# Check current costs
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

### Break-Even Analysis

- **Free Tier Coverage**: Up to 1M requests/month
- **Payback Period**: Immediate (no upfront costs)
- **Scalability**: Costs scale linearly with usage
- **ROI**: Educational value vs. minimal operational costs

### Cost-Saving Tips

1. **Implement caching** for frequently asked questions
2. **Use CloudFront** to reduce direct API calls
3. **Monitor usage patterns** and optimize accordingly
4. **Set up billing alerts** at $10/month threshold
5. **Consider reserved instances** for predictable high usage

## 🔧 Development

### Local Testing

Test the APIs locally before deployment:

```bash
cd learning-backend
node test-apis.js
```

### Project Structure

```
├── lib/
│   └── learning-app-stack.ts    # CDK infrastructure
├── learning-frontend/
│   ├── index.html               # Main UI
│   ├── app.js                   # Frontend logic
│   └── style.css                # Styling
├── learning-backend/
│   ├── index.js                 # Chat endpoint
│   ├── register.js              # User registration
│   ├── login.js                 # User authentication
│   └── package.json             # Dependencies
└── README.md                    # This file
```

## 🔒 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Tokens**: Stateless authentication with expiration
- **API Key Protection**: Sensitive keys stored as environment variables
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Validation**: Client and server-side validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues:

1. **403 Forbidden on API calls**: Check that API keys are correctly set in Lambda environment variables
2. **JWT Token errors**: Ensure JWT_SECRET is consistent across all Lambda functions
3. **Model not found**: Gemini API models change; check current available models
4. **Deployment failures**: Verify AWS credentials and permissions

### Getting Help:

- Check AWS CloudWatch logs for Lambda function errors
- Verify API keys are valid and have proper permissions
- Test APIs locally using the provided test scripts

---

Built with ❤️ using AWS CDK, Google Gemini AI, and YouTube Data API
