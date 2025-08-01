# 🚂 Deploy HagzYomi to Railway (FREE)

## 🎯 Quick Setup (5 minutes)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (free)
3. Connect your GitHub account

### Step 2: Deploy Your App
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your **HagzYomi** repository
4. Select the **`railway`** branch
5. Click **"Deploy"**

### Step 3: Configure (Optional)
- Railway will auto-detect Node.js and install dependencies
- Your app will be available at: `https://your-app-name.up.railway.app`
- Add custom domain if desired (free with Railway)

## 🔧 Configuration Files Ready

✅ `railway.json` - Railway deployment config  
✅ `package.json` - Correct start command  
✅ `PORT` environment variable - Auto-configured  
✅ All dependencies - Listed in package.json  

## 💾 Database Storage

Your bookings will be stored in:
- **Local file:** `data/bookings.json` (persists between deployments)
- **Railway disk:** 1GB free storage included
- **Backup:** Download data via admin panel exports

## 🌐 Your Live Website Will Have

- ✅ Arabic RTL football booking system
- ✅ Admin panel at `/admin` (password: admin123)
- ✅ PDF/Excel/CSV exports
- ✅ Real-time booking validation
- ✅ Egyptian currency (جنيه)
- ✅ All your preferred localhost design!

## 💰 Cost

**FREE** - $5/month credit covers your app completely!

## 🔄 Development Workflow

### Local Development
```bash
cd localhost-deploy/     # Work on localhost version
npm start               # Test locally
git add . && git commit -m "updates"
git push               # Updates localhost branch
```

### Railway Deployment
```bash
cd railway-deploy/      # Work on railway version  
# Make any railway-specific changes
git add . && git commit -m "railway updates"
git push               # Updates railway branch → auto-deploys
```

## 🌟 Benefits of Separate Branches

- **localhost-deploy/**: Pure development environment
- **railway-deploy/**: Production-ready with Railway configs
- **Independent**: Changes don't affect each other
- **Clean**: Each environment optimized for its purpose

Your choice! Both work perfectly. 🚀
