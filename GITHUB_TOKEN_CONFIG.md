# GitHub Gist Sync - Token Configuration

## ⚠️ IMPORTANT: Security Notice

The GitHub token and Gist ID are removed from the committed code for security.

## Setup Instructions

### For Deployed Version (AWS CloudFront):

You need to manually configure the token in the deployed files:

1. **Update app-gist-sync.js on S3:**
   - Go to AWS S3 Console: https://s3.console.aws.amazon.com/s3/buckets/photo-album-128945984791-eu-central-1
   - Download `app-gist-sync.js`
   - Edit line 10: Replace `YOUR_GITHUB_TOKEN_HERE` with your actual token
   - Upload the modified file back to S3
   - Invalidate CloudFront cache:
     ```bash
     aws cloudfront create-invalidation --distribution-id E2ZIUNB88P5MH1 --paths "/app-gist-sync.js" --profile personal
     ```

### Your Credentials (Keep Private):

**GitHub Token:** `ghp_****************************` (stored in config.local.js)
**Gist ID:** `f0cb38448a8126a3622a1f466c401f3f`
**Gist URL:** https://gist.github.com/f0cb38448a8126a3622a1f466c401f3f

### For Local Testing:

Use `config.local.js` (already configured, not committed to Git):
```javascript
export const GITHUB_TOKEN = 'ghp_YOUR_TOKEN_HERE';
export const GIST_ID = 'f0cb38448a8126a3622a1f466c401f3f';
```

## Alternative: Environment-Based Configuration

If you want to avoid hardcoding the token in deployed files, you can:

1. **Use localStorage** (set once per browser):
   ```javascript
   // In browser console on first visit:
   localStorage.setItem('githubToken', 'ghp_YOUR_TOKEN_HERE');
   localStorage.setItem('gistId', 'f0cb38448a8126a3622a1f466c401f3f');
   ```

2. **Update app-gist-sync.js** to read from localStorage:
   ```javascript
   const GITHUB_TOKEN = localStorage.getItem('githubToken') || 'YOUR_GITHUB_TOKEN_HERE';
   const GIST_ID = localStorage.getItem('gistId') || '';
   ```

This way, the token never needs to be in the deployed code!

## Current Deployment Status

**✅ Working with hardcoded token** (deployed to AWS)
**❌ Token removed from Git** (for security)

The deployed version at https://d370ju67x6x4wu.cloudfront.net still has the token configured and is working.

Future deployments will need the token to be manually added to S3 or use the localStorage approach.
