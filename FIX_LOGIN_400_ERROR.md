# 🔧 FIXING LOGIN 400 ERROR

## Problem
Login fails with 400 Bad Request because Prisma client hasn't been regenerated after schema changes.

## Solution

### Option 1: Use the Batch Script (Easiest)

1. **Navigate to backend folder**:
   ```
   e:\Project\webDevelop\WinADeal\backend
   ```

2. **Double-click**: `restart-with-prisma.bat`

3. **Wait** for Prisma to regenerate and server to restart

4. **Try logging in again**

---

### Option 2: Manual Steps

#### Step 1: Stop Backend Server
- Find the terminal/command prompt running the backend
- Press `Ctrl + C` to stop it
- Or close the terminal window

#### Step 2: Regenerate Prisma Client
Open a new terminal in the backend folder:
```bash
cd e:\Project\webDevelop\WinADeal\backend
npx prisma generate
```

**Expected output:**
```
✔ Generated Prisma Client
```

#### Step 3: Restart Backend
```bash
npm run dev
```

**Expected output:**
```
Server running on port 5000
Database connected
```

#### Step 4: Test Login
1. Open customer-web
2. Try logging in again
3. Should work now!

---

## Verification

After restarting, check backend logs for:
```
✅ Server running on port 5000
✅ Database connected
```

Then try login - should succeed!

---

## If Still Getting 400 Error

Check backend console for the actual error message. It might show:
- `Invalid field name: roles` → Prisma not regenerated
- `Column 'roles' does not exist` → Migration not applied
- Other validation errors → Check request payload

### If Prisma Generation Fails

**Error: "EPERM: operation not permitted"**

**Solution:**
1. Make sure backend server is **completely stopped**
2. Close any terminals running backend
3. Try again:
   ```bash
   npx prisma generate
   ```

### If Migration Not Applied

Run:
```bash
cd e:\Project\webDevelop\WinADeal\backend
node migrate_roles.js
```

This will ensure the database has the `roles` column.

---

## Quick Test

After fixing, test with curl:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"+919830450252\",\"password\":\"YOUR_PASSWORD\"}"
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "roles": ["VENDOR", "CUSTOMER"],
      "selectedRole": "VENDOR"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

**Status:** Ready to fix!  
**Action:** Run `restart-with-prisma.bat` or follow manual steps
