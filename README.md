# LocalLens - Provider Web Portal

Next.js web portal for LocalLens service providers, guides, hosts, and merchants to manage their listings, bookings, and customer experiences.

## 🚀 Features

- **Provider Dashboard**: Real-time stats, revenue overview, recent bookings, quick actions.
- **Listings Management**: Create, edit, and manage services, rentals, and stays.
- **Experiences**: Create curated travel experiences and guided tours.
- **Bookings Management**: Accept, reject, reschedule, and track customer reservations.
- **Smart Verification**: Aadhaar OCR / document verification workflow using Tesseract.js.
- **Interactive Maps & Geolocation**: Pinpoint service locations with Leaflet / OpenStreetMap.
- **Supabase Integration**: Auth, real-time database, and storage integration.
- **3D Visualization**: Interactive three.js / React Three Fiber components.

## 🛠 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend & Auth**: Supabase
- **Maps**: Leaflet & React Leaflet
- **Forms & Validation**: React Hook Form + Zod
- **OCR**: Tesseract.js

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and set your credentials:
```bash
cp .env.example .env.local
```

Required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```
