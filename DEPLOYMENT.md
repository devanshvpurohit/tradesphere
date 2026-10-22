# 🚀 TradeSphere — Vercel & Firebase Deployment Guide

This guide explains how to deploy **TradeSphere** to **Vercel** with **Google Firebase** (Firebase Auth, Cloud Firestore & Realtime Database).

---

## 📋 Vercel Build Settings

In your Vercel Project Settings:
- **Framework Preset**: Next.js
- **Build Command**: `next build` (or leave default)
- **Install Command**: `npm install`
- **Output Directory**: `.next` (default)

---

## 🔑 Environment Variables to Set on Vercel

Go to **Vercel Dashboard** -> Your Project -> **Settings** -> **Environment Variables** and add:

| Key | Value | Description |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyDU3LCWY-fFm1feclfuJtZf1hf7HV41UXI` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `tradesphere-37a5c.firebaseapp.com` | Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `tradesphere-37a5c` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | `https://tradesphere-37a5c-default-rtdb.firebaseio.com` | Firebase Realtime Database URL |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `tradesphere-37a5c.firebasestorage.app` | Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `682007896565` | Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:682007896565:web:94ea52e6428a2c5d7940bc` | Firebase Web App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-6YTX1X810B` | Google Analytics ID |
| `FINNHUB_API_KEY` | *(Optional)* | Finnhub Stock API key (realistic mock fallback included) |

---

## ⚡ Firebase Realtime Database Setup

1. In the [Firebase Console](https://console.firebase.google.com/), select your project **`tradesphere-37a5c`**.
2. Go to **Build** -> **Realtime Database** -> Click **Create Database**.
3. Choose location (e.g. `us-central1` or `asia-southeast1`) and click **Next**.
4. Start in **Test mode** (or configure read/write rules for authenticated users):
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
5. Click **Enable**.
6. Note the database URL (e.g. `https://tradesphere-37a5c-default-rtdb.firebaseio.com`) and ensure `NEXT_PUBLIC_FIREBASE_DATABASE_URL` matches it.

---

## 🔄 Deploying Updates

Once pushed to `main`, Vercel automatically deploys your project:
```bash
git push origin main
```
