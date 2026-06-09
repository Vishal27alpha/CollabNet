
/*"use client";

import { useState } from "react";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/src/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/src/components/ui/use-toast";
import { Timestamp } from "firebase/firestore";

export default function BrandProfilePage() {
  const { user } = useAuth();
  const [brand, setBrand] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setBrand((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const brandData = {
        id: user.uid,
        uid: user.uid,
        name: brand.name || "",
        email: brand.email || user.email || "",
        logo: brand.logo || user.photoURL || "",
        industry: brand.industry || "",
        targetAudience: brand.targetAudience || "",
        description: brand.description || "",
        currentCampaign: brand.currentCampaign || "",
        campaignDuration: brand.campaignDuration || "",
        pastCampaigns: brand.pastCampaigns || "",
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      // Save brand profile
      await setDoc(doc(db, "brands", user.uid), brandData, { merge: true });

      // ✅ Update role in users collection
      await updateDoc(doc(db, "users", user.uid), {
        role: "brand",
      });

      toast({
        title: "✅ Success",
        description: "Brand profile saved successfully! Your account is now marked as a Brand.",
      });
    } catch (err) {
      console.error("Error saving brand profile:", err);
      toast({
        title: "❌ Error",
        description: "Could not save brand profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Brand Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Brand Name"
          value={brand.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={brand.email || ""}
          onChange={(e) => handleChange("email", e.target.value)}
          required
        />
        <Input
          placeholder="Industry (e.g., Fashion, Tech, Fitness)"
          value={brand.industry || ""}
          onChange={(e) => handleChange("industry", e.target.value)}
          required
        />
        <Input
          placeholder="Target Audience (e.g., Gen Z in India)"
          value={brand.targetAudience || ""}
          onChange={(e) => handleChange("targetAudience", e.target.value)}
          required
        />
        <Textarea
          placeholder="About / Description"
          value={brand.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
        />

        <Input
          placeholder="Current Campaign (e.g., Summer Collection 2025)"
          value={brand.currentCampaign || ""}
          onChange={(e) => handleChange("currentCampaign", e.target.value)}
        />

        <Input
          placeholder="Campaign Duration (e.g., Jan 2025 - Mar 2025)"
          value={brand.campaignDuration || ""}
          onChange={(e) => handleChange("campaignDuration", e.target.value)}
        />

        <Textarea
          placeholder="Past Campaigns (comma separated or list)"
          value={brand.pastCampaigns || ""}
          onChange={(e) => handleChange("pastCampaigns", e.target.value)}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}*/
/*"use client";

import { useState, useEffect } from "react";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/src/hooks/useAuth"; 
import { Brand } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/src/components/ui/use-toast";

export default function BrandProfilePage() {
  const { user } = useAuth();
  const [brand, setBrand] = useState<Partial<Brand>>({});
  const [loading, setLoading] = useState(false);

  // ✅ Fetch existing brand profile when page loads
  useEffect(() => {
    if (!user) return;

    const fetchBrand = async () => {
      try {
        const docRef = doc(db, "brands", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBrand(docSnap.data() as Brand);
        }
      } catch (err) {
        console.error("Error fetching brand profile:", err);
      }
    };

    fetchBrand();
  }, [user]);

  const handleChange = (field: keyof Brand, value: string) => {
    setBrand((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const brandData: Brand = {
        id: user.uid,
        uid: user.uid,
        name: brand.name || "",
        email: brand.email || user.email || "",
        logo: brand.logo || user.photoURL || "",
        industry: brand.industry || "",
        targetAudience: brand.targetAudience || "",
        description: brand.description || "",
        currentCampaign: brand.currentCampaign || "",
        campaignDuration: brand.campaignDuration || "",
        pastCampaigns: brand.pastCampaigns || "",
        createdAt: brand.createdAt || new Date(),
        updatedAt: new Date(),
      };

      // Save / update brand profile
      await setDoc(doc(db, "brands", user.uid), brandData, { merge: true });

      // Update role in users collection
      await updateDoc(doc(db, "users", user.uid), { role: "brand" });

      toast({
        title: "✅ Success",
        description: "Brand profile saved successfully!",
      });
    } catch (err) {
      console.error("Error saving brand profile:", err);
      toast({
        title: "❌ Error",
        description: "Could not save brand profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Brand Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Brand Name"
          value={brand.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={brand.email || ""}
          onChange={(e) => handleChange("email", e.target.value)}
          required
        />
        <Input
          placeholder="Industry (e.g., Fashion, Tech, Fitness)"
          value={brand.industry || ""}
          onChange={(e) => handleChange("industry", e.target.value)}
          required
        />
        <Input
          placeholder="Target Audience (e.g., Gen Z in India)"
          value={brand.targetAudience || ""}
          onChange={(e) => handleChange("targetAudience", e.target.value)}
          required
        />
        <Textarea
          placeholder="About / Description"
          value={brand.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
        />
        <Input
          placeholder="Current Campaign (e.g., Summer Collection 2025)"
          value={brand.currentCampaign || ""}
          onChange={(e) => handleChange("currentCampaign", e.target.value)}
        />
        <Input
          placeholder="Campaign Duration (e.g., Jan 2025 - Mar 2025)"
          value={brand.campaignDuration || ""}
          onChange={(e) => handleChange("campaignDuration", e.target.value)}
        />
        <Textarea
          placeholder="Past Campaigns (comma separated or list)"
          value={brand.pastCampaigns || ""}
          onChange={(e) => handleChange("pastCampaigns", e.target.value)}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}*/
// app/brand/profile/page.tsx (or src/page where you keep it)
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where } from "firebase/firestore";
import {
  BRAND_APPLICATIONS_EVENT,
  getBrandApplications,
} from "@/lib/brand-applications";
import { db } from "@/lib/firebase";
import { useAuth } from "@/src/hooks/useAuth";
import { Brand, BrandApplication } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/src/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NICHES } from "@/types/creator";

const APPLICATION_FOLLOWER_RANGES = [
  { label: "Under 1K", min: 0, max: 999 },
  { label: "1K-10K", min: 1000, max: 10000 },
  { label: "10K-50K", min: 10000, max: 50000 },
  { label: "50K-100K", min: 50000, max: 100000 },
  { label: "100K-500K", min: 100000, max: 500000 },
  { label: "500K-1M", min: 500000, max: 1000000 },
  { label: "1M+", min: 1000000, max: Number.POSITIVE_INFINITY },
];

export default function BrandProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [brand, setBrand] = useState<Partial<Brand>>({});
  const [applications, setApplications] = useState<BrandApplication[]>([]);
  const [applicationFollowerRange, setApplicationFollowerRange] = useState("all");
  const [applicationNiche, setApplicationNiche] = useState("all");
  const [brandDocId, setBrandDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState([1]);
  const [cropOffsetX, setCropOffsetX] = useState([0]);
  const [cropOffsetY, setCropOffsetY] = useState([0]);

  // Load existing brand doc on mount
  useEffect(() => {
    if (!user) return;
    const fetchBrand = async () => {
      try {
        let resolvedBrandDocId = user.uid;
        let snap = await getDoc(doc(db, "brands", user.uid));

        if (!snap.exists()) {
          const brandQuery = query(
            collection(db, "brands"),
            where("uid", "==", user.uid),
            limit(1)
          );
          const brandSnapshot = await getDocs(brandQuery);

          if (brandSnapshot.docs[0]) {
            resolvedBrandDocId = brandSnapshot.docs[0].id;
            snap = brandSnapshot.docs[0];
          }
        }

        if (snap.exists()) {
          setBrandDocId(resolvedBrandDocId);
          const data = snap.data() as any;
          // Normalize Firestore Timestamp -> Date if needed
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt;
          const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt;
          const campaignCloseDate = data.campaignCloseDate?.toDate
            ? data.campaignCloseDate.toDate()
            : data.campaignCloseDate;
          const remainingDays =
            campaignCloseDate instanceof Date
              ? String(
                  Math.max(
                    0,
                    Math.ceil((campaignCloseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  )
                )
              : data.campaignCloseInDays;

          setBrand({
            ...data,
            createdAt,
            updatedAt,
            campaignCloseDate,
            campaignCloseInDays: remainingDays,
          } as Partial<Brand>);
        } else {
          setBrandDocId(null);
        }
      } catch (err) {
        console.error("Error fetching brand profile:", err);
      }
    };
    fetchBrand();
  }, [user]);

  useEffect(() => {
    if (!user || !brandDocId) {
      setApplications([]);
      return;
    }

    const syncLocalApplications = () => {
      const localApplications = getBrandApplications(brandDocId);
      setApplications((prev) => {
        const merged = [...localApplications, ...prev].reduce<BrandApplication[]>((acc, application) => {
          if (!acc.some((item) => item.creatorId === application.creatorId)) {
            acc.push(application);
          }
          return acc;
        }, []);

        return merged;
      });
    };

    syncLocalApplications();
    window.addEventListener("storage", syncLocalApplications);
    window.addEventListener(BRAND_APPLICATIONS_EVENT, syncLocalApplications);

    const applicationsQuery = query(
      collection(db, "brands", brandDocId, "applications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      applicationsQuery,
      (snapshot) => {
        const remoteApplications = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as BrandApplication[];
        const localApplications = getBrandApplications(brandDocId);

        setApplications(
          [...localApplications, ...remoteApplications].reduce<BrandApplication[]>((acc, application) => {
            if (!acc.some((item) => item.creatorId === application.creatorId)) {
              acc.push(application);
            }
            return acc;
          }, [])
        );
      },
      (error) => {
        console.error("Error fetching applications:", error);
      }
    );

    return () => {
      window.removeEventListener("storage", syncLocalApplications);
      window.removeEventListener(BRAND_APPLICATIONS_EVENT, syncLocalApplications);
      unsubscribe();
    };
  }, [brandDocId, user]);

  const applicationNiches = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...NICHES,
            ...applications
              .map((application) => application.creatorNiche?.trim())
              .filter((niche): niche is string => Boolean(niche)),
          ].filter((niche) => niche !== "Other")
        )
      ),
    [applications]
  );

  const filteredApplications = useMemo(() => {
    const selectedRange = APPLICATION_FOLLOWER_RANGES.find(
      (range) => range.label === applicationFollowerRange
    );

    return applications.filter((application) => {
      const matchesNiche =
        applicationNiche === "all" ||
        application.creatorNiche?.toLowerCase() === applicationNiche.toLowerCase();

      const followerCount = Number(application.creatorFollowers || 0);
      const matchesFollowerRange =
        !selectedRange ||
        (followerCount >= selectedRange.min && followerCount <= selectedRange.max);

      return matchesNiche && matchesFollowerRange;
    });
  }, [applicationFollowerRange, applicationNiche, applications]);

  const hasApplicationFilters =
    applicationFollowerRange !== "all" || applicationNiche !== "all";

  const formatApplicationDate = (value: BrandApplication["createdAt"]) => {
    if (!value) return "Just now";
    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof value.toDate === "function"
    ) {
      date = value.toDate();
    } else if (typeof value === "object" && value !== null && "seconds" in value) {
      date = new Date(value.seconds * 1000);
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) return "Just now";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // safer key type now that Brand includes the campaign fields
  const handleChange = (field: keyof Brand, value: string) => {
    setBrand((p) => ({ ...p, [field]: value }));
  };

  const resetCropControls = () => {
    setCropZoom([1]);
    setCropOffsetX([0]);
    setCropOffsetY([0]);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageSrc = reader.result as string;
      setCropSource(imageSrc);
      resetCropControls();
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCrop = () => {
    if (!brand.logo) return;
    setCropSource(brand.logo);
    resetCropControls();
    setCropOpen(true);
  };

  const handleApplyCrop = async () => {
    if (!cropSource) return;

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });

    try {
      const image = await loadImage(cropSource);
      const zoom = cropZoom[0];
      const xOffset = cropOffsetX[0];
      const yOffset = cropOffsetY[0];
      const cropSize = Math.min(image.width, image.height) / zoom;
      const maxOffsetX = Math.max(0, (image.width - cropSize) / 2);
      const maxOffsetY = Math.max(0, (image.height - cropSize) / 2);
      const sourceX = Math.min(
        Math.max((image.width - cropSize) / 2 + (xOffset / 100) * maxOffsetX, 0),
        image.width - cropSize
      );
      const sourceY = Math.min(
        Math.max((image.height - cropSize) / 2 + (yOffset / 100) * maxOffsetY, 0),
        image.height - cropSize
      );

      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to prepare image crop");
      }

      context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, 400, 400);
      const croppedLogo = canvas.toDataURL("image/png");
      setBrand((prev) => ({ ...prev, logo: croppedLogo }));
      setCropOpen(false);
    } catch (err) {
      console.error("Logo crop failed:", err);
      toast({
        title: "❌ Error",
        description: "Unable to crop the brand logo",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const closeInDays = Number(brand.campaignCloseInDays || 0);
      const campaignCloseDate =
        Number.isFinite(closeInDays) && closeInDays > 0
          ? new Date(Date.now() + closeInDays * 24 * 60 * 60 * 1000)
          : null;

      const brandData: Brand = {
        id: user.uid,
        uid: user.uid,
        name: brand.name || "",
        email: brand.email || user.email || "",
        logo: brand.logo || user.photoURL || "",
        industry: brand.industry || "",
        targetAudience: brand.targetAudience || "",
        description: brand.description || "",
        brandType: brand.brandType || "",
        collaborationType: brand.collaborationType || "",
        lookingFor: brand.lookingFor || "",
        campaignStatus: brand.campaignStatus || "",
        campaignCloseInDays: brand.campaignCloseInDays || "",
        campaignCloseDate,
        // new campaign fields
        currentCampaign: brand.currentCampaign || "",
        campaignDuration: brand.campaignDuration || "",
        pastCampaigns: brand.pastCampaigns || "",
        // preserve existing createdAt if present, otherwise use now
        createdAt: (brand.createdAt as any) || new Date(),
        updatedAt: new Date(),
      };

      // Save brand profile
      await setDoc(doc(db, "brands", user.uid), brandData, { merge: true });

      // Update role in users collection (if you want to mark them as brand)
      await updateDoc(doc(db, "users", user.uid), { role: "brand" });

      toast({
        title: "✅ Success",
        description: "Brand profile saved successfully!",
      });
    } catch (err) {
      console.error("Error saving brand profile:", err);
      toast({
        title: "❌ Error",
        description: "Could not save brand profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Brand Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="logo">Brand Logo</Label>
          <div className="flex items-center gap-4">
            {brand.logo ? (
              <button
                type="button"
                onClick={handleOpenCrop}
                className="overflow-hidden rounded-xl border border-border transition hover:border-purple-500/40"
              >
                <img
                  src={brand.logo}
                  alt="Brand logo preview"
                  className="h-16 w-16 object-contain bg-white p-1"
                />
              </button>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                No logo
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Input id="logo" type="file" accept="image/*" onChange={handleLogoUpload} />
              <p className="text-xs text-muted-foreground">
                Click the logo preview to crop and reposition it.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Brand Name</Label>
          <Input
            id="name"
            placeholder="Brand Name"
            value={brand.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={brand.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            placeholder="Industry (e.g., Fashion, Tech, Fitness)"
            value={brand.industry || ""}
            onChange={(e) => handleChange("industry", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Input
            id="targetAudience"
            placeholder="Target Audience (e.g., Gen Z in India)"
            value={brand.targetAudience || ""}
            onChange={(e) => handleChange("targetAudience", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">About / Description</Label>
          <Textarea
            id="description"
            placeholder="About / Description"
            value={brand.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brandType">Brand Type</Label>
          <Input
            id="brandType"
            placeholder="Brand type"
            value={brand.brandType || ""}
            onChange={(e) => handleChange("brandType", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="collaborationType">Collaboration Type</Label>
          <Input
            id="collaborationType"
            placeholder="paid, barter, affiliate, ambassador"
            value={brand.collaborationType || ""}
            onChange={(e) => handleChange("collaborationType", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lookingFor">Looking For</Label>
          <Input
            id="lookingFor"
            placeholder="fitness + lifestyle creators"
            value={brand.lookingFor || ""}
            onChange={(e) => handleChange("lookingFor", e.target.value)}
          />
        </div>

        {/* campaign fields */}
        <div className="space-y-2">
          <Label htmlFor="currentCampaign">Current Campaign</Label>
          <Input
            id="currentCampaign"
            placeholder="Current Campaign (e.g., Summer Collection 2025)"
            value={brand.currentCampaign || ""}
            onChange={(e) => handleChange("currentCampaign", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaignStatus">Campaign Status</Label>
          <Input
            id="campaignStatus"
            placeholder="open / closed"
            value={brand.campaignStatus || ""}
            onChange={(e) => handleChange("campaignStatus", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaignCloseInDays">Campaign Closes In</Label>
          <Input
            id="campaignCloseInDays"
            type="number"
            min="0"
            placeholder="5"
            value={brand.campaignCloseInDays || ""}
            onChange={(e) => handleChange("campaignCloseInDays", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter number of days remaining. The directory will reduce this automatically each day.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaignDuration">Campaign Duration</Label>
          <Input
            id="campaignDuration"
            placeholder="Campaign Duration (e.g., Jan 2025 - Mar 2025)"
            value={brand.campaignDuration || ""}
            onChange={(e) => handleChange("campaignDuration", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pastCampaigns">Past Campaigns</Label>
          <Textarea
            id="pastCampaigns"
            placeholder="Past Campaigns (comma separated or list)"
            value={brand.pastCampaigns || ""}
            onChange={(e) => handleChange("pastCampaigns", e.target.value)}
          />
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </form>

      <Card id="applications" className="mt-10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Applications</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Creators who clicked apply on your brand page appear here automatically.
            </p>
          </div>
          <Badge variant="secondary">
            {filteredApplications.length}
            {hasApplicationFilters ? ` of ${applications.length}` : ""}
          </Badge>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No applications yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-2xl border border-border bg-accent/20 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <div className="space-y-2">
                  <Label>Follower range</Label>
                  <Select value={applicationFollowerRange} onValueChange={setApplicationFollowerRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All follower ranges" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All follower ranges</SelectItem>
                      {APPLICATION_FOLLOWER_RANGES.map((range) => (
                        <SelectItem key={range.label} value={range.label}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Niche</Label>
                  <Select value={applicationNiche} onValueChange={setApplicationNiche}>
                    <SelectTrigger>
                      <SelectValue placeholder="All niches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All niches</SelectItem>
                      {applicationNiches.map((niche) => (
                        <SelectItem key={niche} value={niche}>
                          {niche}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasApplicationFilters}
                  onClick={() => {
                    setApplicationFollowerRange("all");
                    setApplicationNiche("all");
                  }}
                >
                  Clear
                </Button>
              </div>

              {filteredApplications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No applications match these filters.
                </div>
              ) : null}

              {filteredApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex cursor-pointer flex-col gap-4 rounded-2xl border border-border p-4 transition hover:border-violet-500/40 hover:bg-accent/30 md:flex-row md:items-start md:justify-between"
                  onClick={() => router.push(`/creator/${application.creatorId}`)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={application.creatorProfileImage} alt={application.creatorName} />
                      <AvatarFallback>
                        {application.creatorName?.charAt(0)?.toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{application.creatorName}</p>
                        <Badge variant="outline" className="capitalize">
                          {application.status || "new"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {application.creatorHandle || application.creatorEmail}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {[application.creatorNiche, application.creatorLocation]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                      {application.creatorBio ? (
                        <p className="max-w-2xl text-sm text-foreground/80">{application.creatorBio}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground md:text-right">
                    <p>{application.creatorFollowers ? `${application.creatorFollowers.toLocaleString()} followers` : "Follower count unavailable"}</p>
                    <p>{application.campaignName || brand.currentCampaign || "General application"}</p>
                    <p>{formatApplicationDate(application.createdAt)}</p>
                    {application.creatorEmail ? (
                      <a
                        href={`mailto:${application.creatorEmail}`}
                        className="inline-block font-medium text-violet-600"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {application.creatorEmail}
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Crop Brand Logo</DialogTitle>
            <DialogDescription>
              Adjust the logo so it fits well inside the square preview.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="mx-auto h-72 w-72 overflow-hidden rounded-3xl border border-border bg-slate-950">
              {cropSource ? (
                <img
                  src={cropSource}
                  alt="Crop preview"
                  className="h-full w-full object-cover"
                  style={{
                    transform: `translate(${cropOffsetX[0]}px, ${cropOffsetY[0]}px) scale(${cropZoom[0]})`,
                  }}
                />
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Zoom</Label>
                <Slider min={1} max={3} step={0.1} value={cropZoom} onValueChange={setCropZoom} />
              </div>
              <div className="space-y-2">
                <Label>Move Left / Right</Label>
                <Slider min={-100} max={100} step={1} value={cropOffsetX} onValueChange={setCropOffsetX} />
              </div>
              <div className="space-y-2">
                <Label>Move Up / Down</Label>
                <Slider min={-100} max={100} step={1} value={cropOffsetY} onValueChange={setCropOffsetY} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCropOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleApplyCrop}>
              Apply Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
