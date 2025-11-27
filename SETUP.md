# Setup Guide

## Step-by-Step Installation

### 1. Install Dependencies

```bash
npm install
```

This will install:
- **Next.js 16** - React framework
- **Firebase 11** - Backend database
- **Recharts 2** - Chart library
- **Lucide React** - Icon library
- **date-fns 4** - Date utilities
- **clsx** - Utility for className management
- **TailwindCSS 4** - Styling framework

### 2. Configure Firebase

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `prolink-hotspot-dashboard`
4. Disable Google Analytics (optional)
5. Click "Create project"

#### Enable Firestore

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Select "Start in production mode"
4. Choose a location (closest to you)
5. Click "Enable"

#### Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon `</>`
4. Register app with nickname: `Prolink Dashboard`
5. Copy the `firebaseConfig` object

#### Create Environment File

Create `.env.local` in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Configure Firestore Security Rules

In Firebase Console > Firestore Database > Rules, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write to devices collection
    match /devices/{deviceId}/{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note:** For production, implement proper authentication and security rules.

### 4. Connect to Router

Make sure your computer is connected to the Prolink DL-7202 hotspot:

1. Connect to WiFi: `Prolink_XXXX`
2. Verify router access: Open `http://192.168.1.1` in browser
3. Test API endpoint:
   ```bash
   curl "http://192.168.1.1/reqproc/proc_get?isTest=false&cmd=sta_info1&multi_data=1"
   ```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Verify Everything Works

You should see:
- ✅ Dashboard loads without errors
- ✅ Connected devices appear (if any are connected to hotspot)
- ✅ Real-time updates every 2 seconds
- ✅ Click on device card opens detail page
- ✅ Charts display usage data

## Troubleshooting

### "Cannot connect to router"

**Problem:** Dashboard shows connection error

**Solutions:**
1. Verify you're connected to the Prolink hotspot WiFi
2. Check router is accessible at `http://192.168.1.1`
3. Try accessing router admin panel in browser
4. Check if router API endpoint is correct
5. Disable browser CORS extensions if any

### "Firebase error"

**Problem:** Console shows Firebase errors

**Solutions:**
1. Verify `.env.local` file exists and has correct values
2. Check Firebase project is created and Firestore is enabled
3. Verify Firestore security rules allow read/write
4. Check browser console for specific error messages

### "No devices showing"

**Problem:** Dashboard shows 0 devices

**Solutions:**
1. Connect a device to the Prolink hotspot
2. Wait 2-5 seconds for auto-refresh
3. Click the Refresh button manually
4. Check browser console for API errors
5. Verify router API is returning device data

### "Charts not displaying"

**Problem:** Device detail page shows empty charts

**Solutions:**
1. Wait for data to accumulate (takes a few minutes)
2. Check Firestore has `usage` subcollection with snapshots
3. Verify time range selector is set correctly
4. Check browser console for errors

### "Images not loading"

**Problem:** Device images show broken icon

**Solutions:**
1. This is normal - generic device image will be used
2. Add custom device images to `public/images/devices/`
3. Name them according to device type (e.g., `iphone-14.png`)
4. Fallback SVG should always work

## Testing Without Router

If you don't have access to the router, you can test with mock data:

1. Edit `lib/hooks/useRouterData.ts`
2. Replace `fetchRouterDevices()` with `getTestDevices()`
3. This will show 3 mock devices

```typescript
// In useRouterData.ts, line ~47
const routerDevices = getTestDevices(); // Instead of await fetchRouterDevices()
```

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add all `NEXT_PUBLIC_FIREBASE_*` variables

### Deploy to Other Platforms

The app can be deployed to:
- **Vercel** (recommended)
- **Netlify**
- **AWS Amplify**
- **Google Cloud Run**
- **Docker** (create Dockerfile)

## Next Steps

1. **Customize Device Images**
   - Add device-specific images to `public/images/devices/`
   - Update `device-classifier.ts` with custom detection logic

2. **Adjust Refresh Rate**
   - Edit `app/page.tsx`, change `refreshInterval: 2000` to desired milliseconds

3. **Add Authentication**
   - Implement Firebase Authentication
   - Update Firestore security rules
   - Add login page

4. **Export Data**
   - Add CSV export functionality
   - Create backup/restore features

5. **Mobile App**
   - Enable PWA features
   - Add service worker for offline support
   - Create app manifest

## Support

For issues or questions:
- Check the main README.md
- Review `lib/test-data.json` for API format
- Check browser console for errors
- Verify Firebase Console for data

---

**Happy monitoring! 🚀**
