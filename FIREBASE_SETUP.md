# 🔥 TradeSphere Firebase Setup for `tradesphere-37a5c`

Your Firebase project details have been connected:
- **Project Name**: `tradesphere`
- **Project ID**: `tradesphere-37a5c`
- **Project Number**: `682007896565`
- **Support Email**: `dev7anshvpurohit@gmail.com`

---

## ⚡ Step 1: Register Your Web App in Firebase Console

1. Open your project in [Firebase Console](https://console.firebase.google.com/project/tradesphere-37a5c/settings/general).
2. Scroll down to **"Your apps"** section.
3. Click the **Web icon `</>`** to add a web app (or select your existing web app if already created).
4. Enter App nickname: **TradeSphere Web**.
5. Copy the `apiKey` and `appId` values from the `firebaseConfig` snippet.

---

## 🔑 Step 2: Update `.env.local`

Open `.env.local` in your project root and paste your `apiKey` and `appId`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."   <-- Paste your apiKey here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tradesphere-37a5c.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="tradesphere-37a5c"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="tradesphere-37a5c.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="682007896565"
NEXT_PUBLIC_FIREBASE_APP_ID="1:682007896565:web:..."   <-- Paste your appId here
```

---

## 🛡️ Step 3: Enable Authentication Providers

1. Navigate to [Authentication > Sign-in method](https://console.firebase.google.com/project/tradesphere-37a5c/authentication/providers).
2. Click **Add new provider**:
   - **Email/Password**: Click and toggle **Enable**, then click **Save**.
   - **Google**: Click and toggle **Enable**, select `dev7anshvpurohit@gmail.com` as the Project support email, and click **Save**.

---

## 🗄️ Step 4: Create Cloud Firestore Database & Rules

1. Navigate to [Firestore Database](https://console.firebase.google.com/project/tradesphere-37a5c/firestore).
2. Click **Create database**.
3. Choose location: **`asia-south1` (Mumbai, India)** for the fastest latency with NSE/BSE stocks.
4. Select **Start in test mode** (or production mode) and click **Create**.
5. Go to the **Rules** tab and paste the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile: only the authenticated user can access their account
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Holdings & Portfolios: scoped to owner
    match /portfolios/{portfolioId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }

    // Transactions audit ledger
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }

    // Orders book
    match /orders/{orderId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```
Click **Publish**.

---

## 🚀 Step 5: Run TradeSphere

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). You can now sign up, sign in with Google, or click **"Instant Demo Trader"**!
