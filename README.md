# Prolink Hotspot Dashboard

A production-ready, real-time dashboard for the **Prolink DL-7202 mobile hotspot** built with Next.js 16, TypeScript, TailwindCSS, and Firebase Firestore.

## ✨ Features

- **Real-time Device Tracking** - Monitor all connected devices with live updates every 2 seconds
- **Live Speed Monitoring** - Track download/upload speeds, ping, and signal strength in real-time
- **Historical Usage Analytics** - View usage patterns over today, past 7 days, or past 30 days
- **Device Classification** - Automatic device type detection with Apple device support
- **Beautiful Modern UI** - Glassmorphism design with dark mode support
- **Firebase Firestore Backend** - Persistent storage for historical data and analytics
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Interactive Charts** - Speed history and usage graphs using Recharts

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Firebase project created ([Firebase Console](https://console.firebase.google.com/))
- Access to Prolink DL-7202 router at `http://192.168.1.1`

### Installation

1. **Clone and install dependencies:**

```bash
cd plink-gui
npm install
```

2. **Configure Firebase:**

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. **Set up Firestore:**

- Go to Firebase Console > Firestore Database
- Create a database in production mode
- No manual collection setup needed - they're created automatically

4. **Run the development server:**

```bash
npm run dev
```

5. **Open the dashboard:**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
plink-gui/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard (main page)
│   ├── device/[mac]/page.tsx     # Device detail page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   │   ├── Card.tsx
│   │   ├── StatCard.tsx
│   │   └── Badge.tsx
│   ├── charts/                   # Chart components
│   │   ├── SpeedChart.tsx
│   │   └── UsageChart.tsx
│   └── DeviceCard.tsx            # Device card component
├── lib/                          # Core logic
│   ├── firebase.ts               # Firebase initialization
│   ├── types.ts                  # TypeScript type definitions
│   ├── router/                   # Router API integration
│   │   ├── api.ts                # API client
│   │   └── device-classifier.ts  # Device detection
│   ├── firestore/                # Firestore helpers
│   │   └── device-stats.ts       # Database operations
│   ├── hooks/                    # Custom React hooks
│   │   ├── useRouterData.ts      # Real-time router data
│   │   ├── useDeviceStats.ts     # Device statistics
│   │   └── useUsageHistory.ts    # Historical usage
│   └── test-data.json            # Example API response
├── public/
│   └── images/devices/           # Device images
└── package.json
```

## 🔌 Router API Integration

The app connects to the Prolink DL-7202 router API:

**Endpoint:**
```
http://192.168.1.1/reqproc/proc_get?isTest=false&cmd=sta_info1,sta_info2,sta_info3,sta_info4,sta_info5,sta_info6&multi_data=1
```

**Response Format:**
```json
{
  "sta_info1": "MAC,hostname,rx,tx,rssi,ip",
  "sta_info2": "MAC,hostname,rx,tx,rssi,ip",
  "sta_info3": "none",
  ...
}
```

See `lib/test-data.json` for a complete example.

## 🗄️ Firestore Schema

### Collections Structure

```
devices/
  {mac_address}/                    # Document per device
    - mac: string
    - hostname: string
    - deviceType: string
    - deviceImage: string
    - firstSeen: timestamp
    - lastSeen: timestamp
    
    current/
      latest/                       # Current stats
        - rx, tx, rssi: number
        - downloadSpeed, uploadSpeed: number
        - ping: number
        - lastUpdate: timestamp
    
    usage/
      {auto_id}/                    # Usage snapshots
        - timestamp: timestamp
        - rx, tx: number
        - downloadSpeed, uploadSpeed: number
        - ping, rssi: number
```

## 🎨 UI Components

### Dashboard Page (`/`)
- **Global Stats Cards** - Connected devices, total speeds, usage
- **Network Statistics** - Average ping, peak speeds
- **Device Grid** - All connected devices with live stats
- **Auto-refresh** - Updates every 2 seconds

### Device Detail Page (`/device/[mac]`)
- **Device Hero Section** - Large device image and info
- **Quick Stats** - Current speed, ping, total usage
- **Time Range Selector** - Today / 7 days / 30 days
- **Speed History Chart** - Line chart of download/upload over time
- **Daily Usage Chart** - Bar chart of daily data consumption
- **Usage Timeline** - Detailed daily breakdown

## 🔧 Configuration

### Adjust Refresh Interval

Edit `app/page.tsx`:

```typescript
const { devices, loading, error } = useRouterData({
  refreshInterval: 2000, // milliseconds (default: 2000)
  enableFirestore: true,
});
```

### Customize Device Classification

Edit `lib/router/device-classifier.ts` to add custom device detection logic.

### Add Device Images

Place device images in `public/images/devices/`:
- `iphone-14.png`
- `macbook-pro.png`
- `ipad-air.png`
- `generic-device.png` (fallback)

## 📊 Features in Detail

### Real-time Speed Calculation

Speed is calculated using delta measurements:
```
downloadSpeed = (currentRx - previousRx) / timeDelta
uploadSpeed = (currentTx - previousTx) / timeDelta
```

### Ping Measurement

Ping is measured using `fetch()` timing to the router:
```typescript
const startTime = performance.now();
await fetch(routerUrl, { method: 'HEAD' });
const ping = performance.now() - startTime;
```

### Device Type Detection

Devices are classified by:
1. Hostname pattern matching (iPhone, iPad, MacBook, etc.)
2. MAC address vendor lookup
3. Fallback to generic device

### Historical Data Aggregation

Daily usage is calculated from snapshots:
- Total Rx/Tx for the day
- Average speeds
- Peak speeds
- Average ping

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

### Environment Variables

Make sure to set all Firebase environment variables in your deployment platform.

## 🛠️ Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Lint Code

```bash
npm run lint
```

### Type Check

```bash
npx tsc --noEmit
```

## 📝 API Reference

### Custom Hooks

#### `useRouterData(options)`
Fetches and monitors router devices in real-time.

**Options:**
- `refreshInterval` - Update interval in ms (default: 2000)
- `enableFirestore` - Save to Firestore (default: true)

**Returns:**
- `devices` - Array of DeviceStats
- `loading` - Loading state
- `error` - Error message
- `lastUpdate` - Last update timestamp
- `refresh` - Manual refresh function

#### `useDeviceStats(mac)`
Subscribe to real-time device statistics.

#### `useUsageHistory(mac, timeRange)`
Fetch historical usage data for a device.

## 🎯 Roadmap

- [ ] Device image caching with IndexedDB
- [ ] Apple iTunes API integration for device images
- [ ] Export usage data to CSV
- [ ] Email/SMS alerts for high usage
- [ ] Multi-router support
- [ ] WebSocket support for real-time updates
- [ ] PWA support for mobile installation

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js 16, TypeScript, TailwindCSS, and Firebase**
