# 🔐 Security Configuration - GitHub Secrets

## 🛡️ Environment Variables Setup

Your HagzYomi application uses environment variables for secure configuration. Follow these steps to set up GitHub secrets for Render deployment.

### 🔑 Required Environment Variables:

#### **ADMIN_PASSWORD**
- **Description:** Admin panel login password
- **Default:** `admin123` (if not set)
- **Security:** Should be a strong password for production

### 📋 Setup Instructions:

#### **1. Create GitHub Secret:**
1. Go to your repository: `https://github.com/Mohammed-Azab/HagzYomi`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `ADMIN_PASSWORD`
5. Value: `YourSecurePassword123!` (choose a strong password)
6. Click **Add secret**

#### **2. Configure in Render:**
1. In your Render dashboard
2. Go to your web service
3. Click **Environment**
4. Add environment variable:
   - **Key:** `ADMIN_PASSWORD`
   - **Value:** Your secure password (same as GitHub secret)

### 🎯 Alternative Methods:

#### **Method 1: Render Environment Variables (Recommended)**
```yaml
# In render.yaml (already configured)
envVars:
  - key: ADMIN_PASSWORD
    sync: false  # Manual entry in Render dashboard
```

#### **Method 2: GitHub Actions Deployment**
```yaml
# .github/workflows/deploy.yml (if using CI/CD)
env:
  ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
```

### 🚀 Deployment Flow:
1. **Development:** Uses default password `admin123`
2. **Production:** Uses `ADMIN_PASSWORD` environment variable
3. **Fallback:** If env var not set, falls back to default

### 🔒 Security Best Practices:
- ✅ Use strong passwords (12+ characters)
- ✅ Include uppercase, lowercase, numbers, symbols
- ✅ Never commit passwords to git
- ✅ Use different passwords for different environments
- ✅ Rotate passwords regularly

### 📝 Example Strong Passwords:
- `HagzYomi2025!@#$`
- `FootballCourt$ecure789`
- `MyAdmin#Pass2025!`

### ⚡ Quick Test:
After setting up, your admin panel will be accessible at:
- **URL:** `https://your-app.onrender.com/admin`
- **Username:** Admin login form
- **Password:** Your secure environment variable

---
**© 2025 Mohammed Azab. All rights reserved.**
