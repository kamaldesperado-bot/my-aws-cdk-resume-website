# Photo Album Setup Guide

## Overview
This photo album website uses a hybrid approach:
- **Cloudinary FREE tier**: 25GB storage for photos (FREE forever)
- **AWS S3 + CloudFront**: Website hosting (~$0.50-1.00/month after year 1)

## Prerequisites
- AWS CDK project already set up ✅
- Photo album files created ✅
- Cloudinary account needed (FREE) ⚠️

## Step 1: Create FREE Cloudinary Account

1. Visit: https://cloudinary.com/users/register/free
2. Sign up with email (FREE forever - 25GB storage, 25GB bandwidth/month)
3. Verify your email
4. Log in to dashboard

## Step 2: Get Your Cloudinary Credentials

### 2.1 Get Cloud Name
1. Go to **Dashboard** (https://cloudinary.com/console)
2. Find your **Cloud name** (e.g., "dxyz123abc")
3. Copy this value

### 2.2 Create Upload Preset
1. Go to **Settings** → **Upload** (https://cloudinary.com/console/settings/upload)
2. Scroll to **Upload presets** section
3. Click **Add upload preset**
4. Configure:
   - **Preset name**: `photo_album_unsigned` (or your choice)
   - **Signing mode**: Select **Unsigned** ⚠️ (important!)
   - **Folder**: `photo-albums` (optional, organizes uploads)
   - **Unique filename**: Enable (recommended)
   - **Overwrite**: Disable (keep multiple versions)
5. Click **Save**
6. Copy the preset name

## Step 3: Update app.js Configuration

1. Open: `photo-album-content/app.js`
2. Find lines 1-2:
   ```javascript
   const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME';
   const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET';
   ```
3. Replace with your values:
   ```javascript
   const CLOUDINARY_CLOUD_NAME = 'dxyz123abc';  // Your actual cloud name
   const CLOUDINARY_UPLOAD_PRESET = 'photo_album_unsigned';  // Your preset name
   ```
4. Save the file

## Step 4: Build TypeScript

```bash
cd /Users/sun0001k/IdeaProjects/my_aws_cdk_infrastructure
npm run build
```

## Step 5: Deploy Photo Album Stack

```bash
npx cdk deploy PhotoAlbumStack --profile personal --require-approval never
```

Expected deployment time: ~5-10 minutes

**Save these outputs:**
- **PhotoAlbumURL**: Your CloudFront URL (e.g., https://d123abc.cloudfront.net)
- **PhotoAlbumDistributionId**: For cache invalidation (e.g., E2ABCDEF123456)
- **PhotoAlbumBucketName**: S3 bucket name

## Step 6: Test Your Photo Album

1. Visit the **PhotoAlbumURL** from deployment output
2. You'll see the login page
3. Default credentials:
   - **Username**: `photos`
   - **Password**: `Album2024!`

### Test Workflow:
1. **Login** with default credentials
2. **Create Album**: Click "Neues Album" button
   - Enter album name (e.g., "Vacation 2024")
   - Click "Erstellen"
3. **Upload Photos**: 
   - Select the album from dropdown
   - Click "Dateien wählen" or drag files to upload area
   - Select multiple photos
   - Watch real-time progress bars
   - Wait for "✅ Erfolgreich hochgeladen" messages
4. **View Gallery**: Photos appear in grid layout
5. **View Fullscreen**: Click any photo for lightbox view
6. **Logout**: Click logout button

## Step 7: Create TinyURL (Optional)

1. Visit: https://tinyurl.com
2. Paste your **PhotoAlbumURL**
3. Create custom alias (e.g., `kamal-photos`)
4. Save the short URL

## Step 8: Change Default Password (Recommended)

1. Open: `photo-album-content/login.html`
2. Find lines around 198-201:
   ```javascript
   const validCredentials = {
       'photos': 'Album2024!'
   };
   ```
3. Change to your preferred credentials:
   ```javascript
   const validCredentials = {
       'myusername': 'MyNewPassword123!'
   };
   ```
4. Redeploy:
   ```bash
   npm run build
   npx cdk deploy PhotoAlbumStack --profile personal --require-approval never
   ```
5. Invalidate CloudFront cache:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id E2ABCDEF123456 \
     --paths "/*" \
     --profile personal
   ```

## Cost Breakdown

### FREE (Year 1):
- AWS CloudFront: FREE tier (1TB data transfer)
- AWS S3: FREE tier (5GB storage, 20,000 GET, 2,000 PUT)
- Cloudinary: FREE tier forever (25GB storage, 25GB bandwidth/month)
- **Total: $0.00/month**

### After Year 1:
- AWS CloudFront: ~$0.085/GB for first 10TB ($0.42/month for 5GB transfer)
- AWS S3: ~$0.023/GB storage + requests ($0.12/month for 5GB + 10k requests)
- Cloudinary: Still FREE (25GB storage, 25GB bandwidth/month)
- **Total: ~$0.50-1.00/month**

## Features

✅ **Named Albums**: Create and organize photos into albums
✅ **Multi-Upload**: Upload multiple photos simultaneously
✅ **Progress Tracking**: Real-time upload progress bars
✅ **Photo Gallery**: Responsive grid layout
✅ **Lightbox View**: Fullscreen photo viewing
✅ **Drag & Drop**: Drag files to upload area
✅ **Mobile Responsive**: Works on all devices
✅ **Secure Storage**: Photos on Cloudinary CDN (HTTPS, fast global delivery)
✅ **No Backend**: Client-side only (no servers, no databases)
✅ **Free Storage**: 25GB FREE on Cloudinary forever

## Troubleshooting

### Upload Fails with "Configuration Error"
- Check CLOUDINARY_CLOUD_NAME is correct (no quotes, exact match)
- Check CLOUDINARY_UPLOAD_PRESET is correct
- Verify preset is set to **Unsigned** mode in Cloudinary dashboard

### Photos Don't Display After Upload
- Check browser console for errors (F12 → Console)
- Verify Cloudinary account is active
- Check upload preset folder settings

### Login Doesn't Work
- Clear browser cache and try again
- Check sessionStorage is enabled in browser
- Verify credentials in login.html match what you're typing

### CloudFront Shows Old Version
- Invalidate cache:
  ```bash
  aws cloudfront create-invalidation \
    --distribution-id YOUR_DISTRIBUTION_ID \
    --paths "/*" \
    --profile personal
  ```
- Wait 2-5 minutes for invalidation to complete

## Data Management

### Where is Data Stored?
- **Album metadata**: Browser localStorage (per device)
- **Photos**: Cloudinary CDN (global, permanent)
- **Authentication**: Browser sessionStorage (per browser tab)

### Backup Albums
Albums are stored in localStorage. To backup:
1. Open browser console (F12)
2. Type: `localStorage.getItem('photoAlbums')`
3. Copy the JSON output
4. Save to a file

### Restore Albums
1. Open browser console (F12)
2. Type: `localStorage.setItem('photoAlbums', 'PASTE_JSON_HERE')`
3. Refresh page

### Delete Photos from Cloudinary
Photos remain on Cloudinary even if removed from album. To delete:
1. Log in to Cloudinary dashboard
2. Go to **Media Library**
3. Find and delete unwanted photos
4. This frees up storage space

## Security Notes

⚠️ **This is a CLIENT-SIDE ONLY solution**
- Authentication is JavaScript-based (NOT secure against determined attackers)
- Anyone with browser dev tools can bypass login
- Suitable for personal/family use, NOT for sensitive data
- Photos on Cloudinary are publicly accessible if URL is known

**For secure photo storage**, consider upgrading to AWS Cognito + API Gateway + Lambda.

## Support

### Cloudinary Support
- Docs: https://cloudinary.com/documentation
- Community: https://support.cloudinary.com

### AWS CDK Support
- Docs: https://docs.aws.amazon.com/cdk/
- GitHub: https://github.com/aws/aws-cdk

## Project Structure

```
my_aws_cdk_infrastructure/
├── bin/
│   └── resume-stack.ts          # Main CDK app (both stacks)
├── lib/
│   ├── resume-stack.ts          # Resume website stack
│   └── photo-album-stack.ts     # Photo album stack ← NEW
├── resume-content/              # Resume website files
└── photo-album-content/         # Photo album files ← NEW
    ├── login.html              # Login page (photos/Album2024!)
    ├── index.html              # Main photo album interface
    ├── logout.html             # Logout page
    ├── error.html              # 404 error page
    ├── styles.css              # Comprehensive styling
    └── app.js                  # Cloudinary integration ← CONFIGURE THIS
```

## Next Steps After Setup

1. ✅ Upload your 1000+ photos to albums
2. 🔄 Share TinyURL with family/friends
3. 🔄 Consider changing default password
4. 🔄 Organize photos into named albums (Vacation, Family, Events, etc.)
5. 🔄 Monitor Cloudinary usage in dashboard
6. 🔄 Set up CloudWatch alarms for AWS costs (optional)

---

**Enjoy your photo album! 📸**
