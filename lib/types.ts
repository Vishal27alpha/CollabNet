// src/lib/types.ts
export interface Brand {
  id: string;
  uid: string;
  name: string;
  email: string;
  logo?: string;
  industry?: string;
  targetAudience?: string;
  description?: string;
  minIdealReach?: string;
  brandType?: string;
  collaborationType?: string;
  lookingFor?: string;
  campaignStatus?: "open" | "closed" | string;
  campaignCloseInDays?: string;
  campaignCloseDate?: Date | { seconds: number; nanoseconds: number } | string | null;

  // ---- new campaign fields ----
  currentCampaign?: string;
  campaignDuration?: string;
  pastCampaigns?: string; // keep as comma-separated string for now (or string[] if you prefer)
  // -----------------------------

  // createdAt/updatedAt — allow Date or Firestore Timestamp-like object
  createdAt?: Date | { seconds: number; nanoseconds: number } | null;
  updatedAt?: Date | { seconds: number; nanoseconds: number } | null;
}

export interface BrandApplication {
  id: string;
  brandId: string;
  brandName: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorHandle?: string;
  creatorPlatform?: "instagram" | "youtube" | string;
  creatorNiche?: string;
  creatorFollowers?: number;
  creatorLocation?: string;
  creatorBio?: string;
  creatorProfileImage?: string;
  campaignName?: string;
  status?: "new" | "reviewed" | string;
  createdAt?: Date | { seconds: number; nanoseconds: number } | null;
  updatedAt?: Date | { seconds: number; nanoseconds: number } | null;
}

// export other types if you have them...
