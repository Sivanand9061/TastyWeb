# 🍔 Tasty Hot — Developer Update Guide

This is your complete reference for making changes to the website and pushing them live.

---

## ⚡ The Golden Rule

Every time you make a change and want it live, run these **3 commands** in PowerShell:

```powershell
git add .
git commit -m "What you changed"
git push
```

Vercel auto-deploys the frontend in ~60 seconds.
Render auto-deploys the backend in ~2 minutes.

---

## 🖥️ Starting Your Local Environment

Before making any changes, start your local servers so you can preview live.

**Open Terminal 1 — Frontend:**
```powershell
cd "C:\Users\sivan\Downloads\TastyWeb"
npm run dev
```
Then open: http://localhost:5173

**Open Terminal 2 — Backend:**
```powershell
cd "C:\Users\sivan\Downloads\TastyWeb\Backend"
npm run dev
```
Backend runs at: http://localhost:5000

> Keep both running while you work. Vite hot-reloads the frontend instantly on every save.

---

## 🗂️ Where Is Everything?

```
TastyWeb/
├── src/
│   ├── styles/
│   │   └── index.css              ← Global colors, fonts, spacing
│   ├── app/
│   │   ├── App.tsx                ← Main app routing
│   │   └── AuthContext.tsx        ← Login/auth state
│   └── imports/
│       ├── Auth/
│       │   └── LoginSignupModal.tsx   ← Sign in / Sign up / Phone OTP
│       ├── CartPage/
│       │   ├── CartPage.tsx           ← Cart, checkout form, order submit
│       │   └── AddressAutocomplete.tsx ← Address search box
│       ├── Categories/
│       │   └── CategoriesFixed.tsx    ← Menu items / category grid
│       ├── Admin/
│       │   ├── AdminAddItems.tsx      ← Admin panel (add/edit menu, settings)
│       │   └── KitchenDashboard.tsx   ← Live kitchen order board
│       └── [Other pages...]
│
├── Backend/
│   ├── server.js                  ← Express server entry point
│   ├── routes/
│   │   ├── orders.js              ← Order API (place, update, list)
│   │   ├── menu.js                ← Menu API
│   │   └── kitchen.js             ← Kitchen status API
│   └── utils/
│       └── mailer.js              ← Email receipt logic (Resend)
│
├── .env.local                     ← Frontend secrets (NEVER commit this)
├── Backend/.env                   ← Backend secrets (NEVER commit this)
└── vercel.json                    ← Vercel routing config
```

---

## 🎨 Making Design Changes

### Change Colors or Fonts
Edit: `src/styles/index.css`

### Change a Specific Page Layout
Find the file in `src/imports/` and edit the JSX/CSS directly.
Save the file → browser auto-refreshes at http://localhost:5173

### Add a New Menu Item
Go to your live site → Log in as Admin → Admin Panel → Add Item.
No code changes needed.

### Change the Delivery Radius
Admin Panel → Store Settings → Update delivery radius → Save.
No code changes needed.

---

## 🔧 Making Backend Changes

Edit files inside `Backend/`.

Test locally (http://localhost:5000/api/health should return OK).

Then push to deploy on Render.

---

## 🚀 Pushing Changes Live — Step by Step

**1. Make sure your changes look good locally** at http://localhost:5173

**2. Open PowerShell in the project root:**
```powershell
cd "C:\Users\sivan\Downloads\TastyWeb"
```

**3. Stage all changes:**
```powershell
git add .
```

**4. Commit with a clear message:**
```powershell
git commit -m "Fix: describe what you changed"
```
> Examples:
> - `"Design: updated homepage hero section"`
> - `"Fix: corrected cart item price display"`
> - `"Feature: added new shawarma category"`

**5. Push to GitHub:**
```powershell
git push
```

**6. Wait for auto-deploy:**
- Frontend (Vercel): Live in ~60 seconds at https://tasty-web.vercel.app
- Backend (Render): Live in ~2 minutes at https://tastyhot-api.onrender.com

---

## 🧪 How to Test After Pushing

1. Open https://tasty-web.vercel.app
2. Hard refresh the page: **Ctrl + Shift + R**
3. Test whatever you changed
4. Check Render logs if backend-related (Render → tastyhot-api → Logs)

---

## ⚠️ Things to NEVER Do

| ❌ Don't | ✅ Instead |
|---|---|
| Commit `.env.local` | Keep it local only, set values on Vercel dashboard |
| Commit `Backend/.env` | Keep it local only, set values on Render dashboard |
| Commit `firebase-service-account.json` | Already in `.gitignore`, stays safe |
| Edit files directly on GitHub | Always edit locally → push |

---

## 🆘 Quick Fixes

**Changes not showing on live site?**
→ Hard refresh: Ctrl + Shift + R
→ Check Vercel dashboard — confirm latest deploy is "Ready"

**Backend not working on live site?**
→ Check Render logs
→ Make sure all env vars are set in Render dashboard

**Local server not starting?**
→ Make sure you're in the right directory
→ Run `npm install` first if node_modules is missing

**Forgot to add an env variable to Vercel/Render?**
→ Go to the dashboard → Add the variable → It auto-redeploys

---

*Last updated: April 2026 — Tasty Hot v1.0*
