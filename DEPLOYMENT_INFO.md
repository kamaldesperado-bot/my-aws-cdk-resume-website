# Deployment Information

## 📄 Resume Website
- **CloudFront URL**: https://d1uya4rdty5ayg.cloudfront.net
- **TinyURL**: https://tinyurl.com/kamal-lebenslauf
- **Distribution ID**: E1F0TQSJ1LCMBN
- **S3 Bucket**: resume-website-128945984791-eu-central-1
- **Login Credentials**:
  - Username: `kamal`
  - Password: `Resume2024!`
  - Guest Access: Click "Gast-Zugang" button (one-time passwords, 100 available)
- **Features**:
  - JavaScript-based authentication (client-side)
  - Guest access with session tracking (one use per browser)
  - PDF downloads (German & English CV)
  - User display in header

## 📸 Photo Album Website
- **CloudFront URL**: https://d370ju67x6x4wu.cloudfront.net
- **TinyURL**: _Create at https://tinyurl.com_ (suggested: `kamal-photos` or `kamal-fotoalbum`)
- **Distribution ID**: E2ZIUNB88P5MH1
- **S3 Bucket**: photo-album-128945984791-eu-central-1
- **Login Credentials**:
  - Username: `photos`
  - Password: `Album2024!`
- **Cloudinary Configuration**:
  - Cloud Name: `dnxxpf1o3`
  - Upload Preset: `upload-preset`
  - Dashboard: https://cloudinary.com/console
- **Features**:
  - Named albums with localStorage
  - Multi-file upload with progress tracking
  - Drag & drop support
  - Photo gallery with responsive grid
  - Lightbox fullscreen view
  - 25GB FREE storage on Cloudinary forever!

## 💰 Cost Summary

### Year 1 (FREE Tier):
- **Resume Website**: $0.00/month
- **Photo Album Website**: $0.00/month
- **Cloudinary**: $0.00/month (FREE 25GB forever)
- **Total**: $0.00/month

### After Year 1:
- **Resume Website**: ~$0.02-0.05/month (negligible)
- **Photo Album Website**: ~$0.50-1.00/month (S3 + CloudFront)
- **Cloudinary**: $0.00/month (FREE 25GB forever)
- **Total**: ~$0.50-1.05/month

## 🔧 AWS Configuration
- **Account ID**: 128945984791
- **Region**: eu-central-1 (Frankfurt)
- **Profile**: personal
- **CDK Version**: 2.100.0
- **Node.js Version**: 20.11.1

## 📂 Git Repository
- **Repository**: kamaldesperado-bot/my-aws-cdk-resume-website
- **Branch**: main
- **Last Commit**: Add photo album website with Cloudinary integration (4d6cb80)

## 🚀 Deployment Commands

### Resume Website
```bash
npm run build
npx cdk deploy ResumeStaticWebsiteStack --profile personal --require-approval never
```

### Photo Album Website
```bash
npm run build
npx cdk deploy PhotoAlbumStack --profile personal --require-approval never
```

### Deploy Both Stacks
```bash
npm run build
npx cdk deploy --all --profile personal --require-approval never
```

### Invalidate CloudFront Cache

**Resume Website:**
```bash
aws cloudfront create-invalidation \
  --distribution-id E1F0TQSJ1LCMBN \
  --paths "/*" \
  --profile personal
```

**Photo Album:**
```bash
aws cloudfront create-invalidation \
  --distribution-id E2ZIUNB88P5MH1 \
  --paths "/*" \
  --profile personal
```

## 📝 Important Notes

### Security
- **Both websites use JavaScript-only authentication** (NOT secure against determined attackers)
- Suitable for personal/family use only
- **Do NOT store sensitive information**
- `guest-passwords.js` is excluded from Git (kept private)
- `photo-album-content/app.js` is excluded from Git (contains Cloudinary credentials)

### Guest Access (Resume)
- 100 one-time passwords available
- Session-based tracking (one use per browser)
- Passwords stored in `resume-content/guest-passwords.js` (NOT in Git)
- Remaining passwords tracked in browser localStorage

### Photo Album Data
- **Album metadata**: Stored in browser localStorage (per device)
- **Photos**: Stored on Cloudinary CDN (global, permanent)
- **Authentication**: Browser sessionStorage (per tab)
- **Backup albums**: Use browser console: `localStorage.getItem('photoAlbums')`

### Cloudinary Management
- **Dashboard**: https://cloudinary.com/console
- **Media Library**: View all uploaded photos
- **Usage**: Monitor storage and bandwidth usage
- **Delete Photos**: Go to Media Library → Select photos → Delete

## 📱 Testing Locally

### Resume Website
```bash
cd resume-content
python3 -m http.server 8000
# Visit: http://localhost:8000/login.html
```

### Photo Album
```bash
cd photo-album-content
python3 -m http.server 8001
# Visit: http://localhost:8001/login.html
```

## 🔄 Update Workflow

1. Make changes to files
2. Test locally
3. Build TypeScript: `npm run build`
4. Deploy to AWS: `npx cdk deploy <StackName> --profile personal --require-approval never`
5. Invalidate CloudFront cache if needed
6. Test deployed version
7. Commit to Git: `git add . && git commit -m "Description"`
8. Push to GitHub: `git push origin main`

## 📊 Monitoring

### CloudWatch (AWS Console)
- Monitor CloudFront requests and data transfer
- Set up billing alerts for unexpected costs
- View error logs and metrics

### Cloudinary Dashboard
- Check storage usage (25GB limit)
- Monitor bandwidth usage (25GB/month limit)
- View uploaded photos and folders

## 🎯 Next Steps

- [ ] Create TinyURL for photo album
- [ ] Upload your 1000+ photos to albums
- [ ] Share URLs with family/friends
- [ ] Consider changing default passwords
- [ ] Set up CloudWatch billing alerts
- [ ] Monitor Cloudinary usage

---

**Deployed on**: October 11, 2025  
**Last Updated**: October 11, 2025
