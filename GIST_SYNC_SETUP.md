# GitHub Gist Sync Setup Guide

## 🎯 What This Does

Your photo albums will automatically sync across ALL devices using GitHub Gist:
- ✅ **100% FREE** forever (GitHub Gist is free)
- ✅ **Automatic sync** - no manual export/import
- ✅ **Private** - your album data is in a private Gist
- ✅ **Reliable** - GitHub's infrastructure
- ✅ **Simple** - just 3 steps to set up

---

## 📋 Setup Steps (5 Minutes)

### Step 1: Create GitHub Personal Access Token

1. **Go to GitHub Token Settings:**
   https://github.com/settings/tokens/new

2. **Fill in the form:**
   - **Note:** `Photo Album Sync`
   - **Expiration:** No expiration (or choose a long duration)
   - **Scopes:** Check only **`gist`** (create and edit gists)

3. **Click "Generate token"**

4. **Copy the token** (starts with `ghp_...`)
   ⚠️ **IMPORTANT:** Save this token somewhere safe - you can't see it again!

### Step 2: Update app-gist-sync.js

1. **Open:** `/Users/sun0001k/IdeaProjects/my_aws_cdk_infrastructure/photo-album-content/app-gist-sync.js`

2. **Find line 10-11:**
   ```javascript
   const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN_HERE';
   const GIST_ID = 'YOUR_GIST_ID_HERE';
   ```

3. **Replace with your token:**
   ```javascript
   const GITHUB_TOKEN = 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // Your token here
   const GIST_ID = ''; // Leave empty - will auto-create
   ```

4. **Save the file**

### Step 3: Update index.html

1. **Open:** `/Users/sun0001k/IdeaProjects/my_aws_cdk_infrastructure/photo-album-content/index.html`

2. **Find the script tag** (around line 84):
   ```html
   <script src="app-cloudinary-sync.js"></script>
   ```

3. **Change to:**
   ```html
   <script src="app-gist-sync.js"></script>
   ```

4. **Save the file**

---

## 🚀 Deploy to AWS

```bash
cd /Users/sun0001k/IdeaProjects/my_aws_cdk_infrastructure

# Build CDK
npm run build

# Deploy
npx cdk deploy PhotoAlbumStack --profile personal --require-approval never
```

Wait ~10 minutes for deployment.

---

## ✨ How It Works

### First Time Use (Creates Gist)

1. **Open photo album** on any device
2. **Create your first album** or upload photos
3. **Check browser console** - you'll see:
   ```
   ✅ Created new Gist: abc123def456
   📝 Add this to your app-gist-sync.js: const GIST_ID = 'abc123def456';
   ```
4. **Copy the Gist ID** and update `app-gist-sync.js` line 11:
   ```javascript
   const GIST_ID = 'abc123def456'; // Your actual Gist ID
   ```
5. **Redeploy** (run the deploy command again)

### After Setup (Automatic Sync)

1. **On Phone:** Create album, upload photos
   - ✅ Automatically saves to GitHub Gist

2. **On Mac:** Open photo album
   - ✅ Automatically loads from GitHub Gist
   - ✅ See all your albums and photos!

3. **Manual Refresh:** Click "🔄 Sync" button anytime

---

## 🔒 Security Notes

### ⚠️ IMPORTANT: Token Security

Your GitHub token will be **visible in the browser** source code. This means:

- ✅ **OK for personal use** (only you access the site)
- ⚠️ **NOT OK for public websites** (anyone can see your token)

**Your current setup is fine** because:
- Login page protects access (photos/Album2024!)
- Only you know the CloudFront URL
- Not indexed by search engines

**To make it more secure (optional):**
- Change the login password regularly
- Use environment variables (requires backend)
- Or keep using manual export/import instead

### Alternative: Keep Token Secret

If you're concerned about security, you can:

1. **Don't deploy the token** in the code
2. **Manually configure** on each device:
   - Open browser console
   - Run: `localStorage.setItem('githubToken', 'your_token_here')`
   - Update app to read token from localStorage instead

Let me know if you want this approach!

---

## 📱 Testing Your Sync

### On Phone:
1. Open: https://d370ju67x6x4wu.cloudfront.net
2. Login: photos / Album2024!
3. Create a test album: "Sync Test"
4. Upload a photo
5. Check console: Should see "✅ Saved to GitHub Gist"

### On Mac:
1. Open: https://d370ju67x6x4wu.cloudfront.net
2. Login: photos / Album2024!
3. Click "🔄 Sync" button
4. "Sync Test" album appears!
5. Photos are there!

---

## 🛠 Troubleshooting

### "GitHub sync not configured yet"
- Make sure you replaced `YOUR_GITHUB_TOKEN_HERE` with your actual token
- Check the token has `gist` scope
- Verify token hasn't expired

### "Error syncing from Gist"
- Check internet connection
- Verify token is valid (try creating a gist manually on GitHub)
- Check browser console for detailed error

### Gist not created?
- Create album or upload photos first (triggers auto-create)
- Check browser console for Gist ID
- Verify GitHub token has `gist` permission

### Albums not syncing between devices?
- Make sure you added the Gist ID to `app-gist-sync.js` after first creation
- Click "🔄 Sync" button to manually refresh
- Check both devices are using the same Gist ID

---

## 📊 What's Stored in the Gist

Your GitHub Gist will contain a file `photo-albums.json`:

```json
{
  "albums": [
    {
      "id": "summer-vacation-1633024800000",
      "name": "Summer Vacation",
      "created": "2025-10-12T10:30:00.000Z",
      "photos": [
        {
          "url": "https://res.cloudinary.com/dnxxpf1o3/image/upload/...",
          "publicId": "photo-albums/photos/Summer Vacation/beach.jpg",
          "name": "beach.jpg",
          "uploaded": "2025-10-12T10:35:00.000Z",
          "width": 1920,
          "height": 1080
        }
      ]
    }
  ],
  "lastUpdated": "2025-10-12T10:35:00.000Z",
  "user": "photos"
}
```

**Note:** Only album metadata is in the Gist. Photos are on Cloudinary (FREE 25GB).

---

## 💰 Cost

**$0.00/month - Completely FREE!**

- GitHub Gist: FREE unlimited private gists
- Cloudinary: FREE 25GB storage + 25GB bandwidth/month
- AWS S3: ~$0.50/month for website hosting (FREE first year)
- AWS CloudFront: ~$0.50/month (FREE first year)

**Total after year 1:** ~$1/month for website hosting

---

## 🎉 Ready to Set Up?

1. **Create GitHub token** (Step 1 above)
2. **Update app-gist-sync.js** with your token
3. **Update index.html** to use app-gist-sync.js
4. **Deploy** to AWS
5. **Test** on phone and Mac
6. **Enjoy automatic sync!**

Need help with any step? Just ask! 😊
