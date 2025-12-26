# GitHub Token Issue - Troubleshooting

## Problem
The Personal Access Token (PAT) you're using doesn't have write access to the repository.

**Error**: `remote: Write access to repository not granted`

## Possible Causes

1. **Token doesn't have 'repo' scope**
2. **You're not the owner/collaborator of the repository**
3. **Token has expired**
4. **Repository settings restrict pushes**

## Solutions

### Solution 1: Create New Token with Correct Permissions

1. **Go to GitHub Token Settings**:
   - Visit: https://github.com/settings/tokens
   - Click "Generate new token (classic)"

2. **Configure Token**:
   - **Note**: "WinADeal Deployment"
   - **Expiration**: 90 days (or your preference)
   - **Select scopes**:
     - ✅ `repo` (Full control of private repositories)
       - ✅ repo:status
       - ✅ repo_deployment
       - ✅ public_repo
       - ✅ repo:invite
       - ✅ security_events
     - ✅ `workflow` (if using GitHub Actions)

3. **Generate and Copy Token**:
   - Click "Generate token"
   - **COPY THE TOKEN IMMEDIATELY** (you won't see it again)

4. **Push with New Token**:
   ```bash
   git push https://YOUR_NEW_TOKEN@github.com/tararajc-gif/winadeal.git main
   ```

### Solution 2: Verify Repository Access

1. **Check if you own the repository**:
   - Go to: https://github.com/tararajc-gif/winadeal
   - Verify you're logged in as `tararajc-gif`
   - Check if you see "Settings" tab (only owners see this)

2. **If you don't own it**:
   - Fork the repository to your account
   - Or ask the owner to add you as a collaborator

### Solution 3: Use GitHub CLI (Easiest)

```bash
# Install GitHub CLI
# Download from: https://cli.github.com/

# Login (will open browser for authentication)
gh auth login

# Push
git push -u origin main
```

### Solution 4: Use SSH Instead

```bash
# 1. Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# 2. Copy public key
cat ~/.ssh/id_ed25519.pub

# 3. Add to GitHub
# Go to: https://github.com/settings/keys
# Click "New SSH key"
# Paste the key

# 4. Change remote to SSH
git remote set-url origin git@github.com:tararajc-gif/winadeal.git

# 5. Push
git push -u origin main
```

## Quick Verification Commands

### Check current remote:
```bash
git remote -v
```

### Check repository ownership:
```bash
# Visit in browser:
https://github.com/tararajc-gif/winadeal/settings
```

### Test token permissions:
```bash
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

## Recommended Approach

**For immediate deployment**, I recommend:

1. **Use GitHub CLI** (simplest):
   ```bash
   # Install from https://cli.github.com/
   gh auth login
   git push -u origin main
   ```

2. **Or create a new token** with full `repo` scope:
   - https://github.com/settings/tokens
   - Select ALL checkboxes under `repo`
   - Copy token
   - Push: `git push https://TOKEN@github.com/tararajc-gif/winadeal.git main`

## After Successful Push

Once pushed successfully:

1. ✅ Verify on GitHub: https://github.com/tararajc-gif/winadeal
2. ✅ Start Railway deployment
3. ✅ Follow `RAILWAY_QUICK_START.md`

## Alternative: Create New Repository

If the repository `tararajc-gif/winadeal` doesn't exist or you don't have access:

1. **Create new repository**:
   - Go to: https://github.com/new
   - Name: `winadeal`
   - Make it Public or Private
   - Don't initialize with README

2. **Update remote**:
   ```bash
   git remote set-url origin https://github.com/YOUR_USERNAME/winadeal.git
   ```

3. **Push**:
   ```bash
   git push -u origin main
   ```

---

**Need immediate help?** Try GitHub CLI - it's the fastest way to authenticate! 🚀
