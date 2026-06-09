# CollabNet

CollabNet(initially CreatorConnect) is an AI-powered platform that helps Instagram and YouTube creators discover, connect, and collaborate with similar creators and brands.  
It reduces the effort of manual creator search by providing smart filtering, AI-based search, and similarity recommendations.

---

## Project Overview

CollabNet bridges the gap between:
- **Creators ↔ Creators** for collaborations
- **Brands ↔ Creators** for sponsorship opportunities

The platform enables users to browse, filter, and discover creators based on niche, follower count, platform, and location, while AI-powered recommendations help brands and creators find better collaboration matches.

---

## Features

- **Creator Discovery**
  - Browse Instagram and YouTube creators by niche, follower count, platform, and location

- **AI Search**
  - Search creators using natural language queries like “fitness creators with more than 10k followers”

- **Brand Discovery**
  - Browse brand campaigns and collaboration opportunities

- **AI Brand Match**
  - Shows creators relevant brand matches with match percentage scores

- **Applications**
  - Creators can apply to brand campaigns
  - Brands can view and filter applications by follower range and niche

- **Authentication**
  - Secure login using Firebase Authentication

- **Responsive UI**
  - Clean and modern interface built with Tailwind CSS

- **Cloud Deployment**
  - Deployable on Vercel

---

## Tech Stack

**Frontend**
- Next.js
- Tailwind CSS
- TypeScript

**Backend / Services**
- Firebase Authentication
- Firestore Database
- Instagram API for creator profile and follower data
- YouTube OAuth API for connecting YouTube creator accounts
- AI APIs for search, matching, and recommendations

**Deployment**
- Vercel

---

## OAuth Setup

### YouTube / Google

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Enable `YouTube Data API v3`.
4. Configure the OAuth consent screen.
5. Create an `OAuth client ID` for a `Web application`.
6. Add this redirect URI:
   - `http://localhost:3000/api/auth/callback/youtube`
7. Copy the values into `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

### Instagram / Meta

Add your existing Meta app values to `.env.local` too:

```env
NEXT_PUBLIC_INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
```

---

## AI Integration

- Uses AI-powered search to understand natural language creator queries
- Matches creators based on niche, follower count, profile metadata, and content descriptions
- Generates brand match recommendations to help creators find suitable collaborations
- Helps brands discover relevant creators for campaigns and sponsorships
