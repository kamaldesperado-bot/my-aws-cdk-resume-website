# 🚀 Quick Start: GitHub Gist Sync

## ⚡ 3-Step Setup

### 1️⃣ Create GitHub Token (2 minutes)
```
1. Visit: https://github.com/settings/tokens/new
2. Note: "Photo Album Sync"
3. Scope: ✅ gist (only this one!)
4. Click: "Generate token"
5. Copy token: ghp_xxxxxxxxxxxx
```

### 2️⃣ Update Configuration (1 minute)
**File:** `photo-album-content/app-gist-sync.js`

**Line 10:** Replace with your token:
```javascript
const GITHUB_TOKEN = 'ghp_your_actual_token_here';
```

**Line 11:** Leave empty (auto-creates):
```javascript
const GIST_ID = '';
```

### 3️⃣ Deploy (10 minutes)
```bash
cd /Users/sun0001k/IdeaProjects/my_aws_cdk_infrastructure
npm run build
npx cdk deploy PhotoAlbumStack --profile personal --require-approval never
```

---

## ✅ After First Use

When you create your first album, check the console:
```
✅ Created new Gist: abc123def456
```

**Update app-gist-sync.js line 11:**
```javascript
const GIST_ID = 'abc123def456';
```

**Redeploy:**
```bash
npm run build
npx cdk deploy PhotoAlbumStack --profile personal --require-approval never
```

---

## 🎯 How to Use

### On Phone:
1. Open CloudFront URL
2. Create album, upload photos
3. ✅ Auto-syncs to GitHub Gist

### On Mac:
1. Open CloudFront URL  
2. Click "🔄 Sync"
3. ✅ See all albums!

---

## 🔑 Your Info

**CloudFront URL:** https://d370ju67x6x4wu.cloudfront.net
**Login:** photos / Album2024!
**GitHub Token:** Create at https://github.com/settings/tokens/new
**Gist ID:** Auto-created on first use

---

## 💡 Tips

- **Sync Button:** Click anytime to refresh from cloud
- **Offline:** Works offline, syncs when connection restored
- **Backup:** Console: `exportAlbums()` to download JSON
- **Restore:** Console: `importAlbums(file)` to upload JSON

---

## 🔒 Security Note

Your GitHub token will be in the browser code. This is OK because:
- ✅ Login page protects access
- ✅ Private CloudFront URL
- ✅ Personal use only

**Want more security?** Ask me for the localStorage token approach!

---

## 📞 Need Help?

**Token not working?**
- Check it has `gist` scope
- Verify it hasn't expired
- Try creating a gist manually on GitHub

**Gist not creating?**
- Create an album first (triggers auto-create)
- Check browser console for errors
- Verify token is correct

**Albums not syncing?**
- Add Gist ID to app-gist-sync.js after first creation
- Click "🔄 Sync" button
- Hard refresh (Cmd/Ctrl + Shift + R)

---

**Ready? Let's do it! 🎉**

1. Create token
2. Update app-gist-sync.js
3. Deploy
4. Test it!
