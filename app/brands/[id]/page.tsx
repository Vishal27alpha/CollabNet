'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Brand, BrandApplication } from "@/lib/types";
import { demoBrands, demoCreators } from "@/lib/demo-data";
import {
  getCollaborationTags,
  getLookingForTags,
  getRemainingDaysBadge,
  getRemainingDaysText,
  mergeBrands,
} from "@/lib/brand-directory-utils";
import {
  hasCreatorAppliedToBrand,
  saveBrandApplication,
} from "@/lib/brand-applications";
import { getSavedBrands, toggleSavedBrand } from "@/lib/saved-brands";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Creator } from "@/types/creator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Briefcase,
  Calendar,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  Shirt,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

const getBrandTypeIcon = (brandType?: string) => {
  const normalized = brandType?.toLowerCase() || "";
  if (normalized.includes("fashion")) return Shirt;
  return Briefcase;
};

const getCollaborationIcon = (tag: string) => {
  const normalized = tag.toLowerCase();
  if (normalized.includes("paid")) return "$";
  if (normalized.includes("affiliate")) return "↗";
  if (normalized.includes("barter")) return "⇄";
  if (normalized.includes("ambassador")) return "★";
  return "•";
};

export default function BrandDetailPage() {
  const params = useParams();
  const brandId = params.id as string;
  const { user, role } = useAuth();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [relatedBrands, setRelatedBrands] = useState<Brand[]>([]);
  const [saved, setSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setSaved(getSavedBrands().some((item) => item.id === brandId));
  }, [brandId]);

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!user || role !== "creator" || !brand) {
        setHasApplied(false);
        return;
      }

      try {
        const targetBrandDocId = brand.uid || brand.id;
        if (hasCreatorAppliedToBrand(targetBrandDocId, user.uid)) {
          setHasApplied(true);
          return;
        }
        const applicationRef = doc(db, "brands", targetBrandDocId, "applications", user.uid);
        const applicationSnap = await getDoc(applicationRef);
        setHasApplied(applicationSnap.exists());
      } catch (error) {
        console.error("Error checking application state:", error);
      }
    };

    checkExistingApplication();
  }, [brand, brandId, role, user]);

  useEffect(() => {
    const loadBrand = async () => {
      try {
        const docRef = doc(db, "brands", brandId);
        const docSnap = await getDoc(docRef);
        let currentBrand: Brand | null = null;

        if (docSnap.exists()) {
          currentBrand = { id: docSnap.id, ...docSnap.data() } as Brand;
        } else {
          currentBrand = demoBrands.find((item) => item.id === brandId) || null;
        }

        setBrand(currentBrand);

        const snap = await getDocs(collection(db, "brands"));
        const liveBrands = snap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Brand[];
        const mergedBrands = mergeBrands(liveBrands);

        if (currentBrand) {
          const selectedBrand = currentBrand;
          setRelatedBrands(
            mergedBrands
              .filter(
                (item) =>
                  item.id !== selectedBrand.id &&
                  (item.industry === selectedBrand.industry || item.brandType === selectedBrand.brandType)
              )
              .slice(0, 3)
          );
        }
      } catch (error) {
        console.error("Error loading brand:", error);
        const fallbackBrand = demoBrands.find((item) => item.id === brandId) || null;
        setBrand(fallbackBrand);
        if (fallbackBrand) {
          setRelatedBrands(
            demoBrands
              .filter(
                (item) =>
                  item.id !== fallbackBrand.id &&
                  (item.industry === fallbackBrand.industry || item.brandType === fallbackBrand.brandType)
              )
              .slice(0, 3)
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadBrand();
  }, [brandId]);

  const handleSave = () => {
    if (!brand) return;
    const nextSaved = toggleSavedBrand(brand);
    setSaved(nextSaved);
  };

  const handleApply = async () => {
    if (!brand) return;
    const targetBrandDocId = brand.uid || brand.id;

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in as a creator before applying to a brand.",
        variant: "destructive",
      });
      return;
    }

    if (role === "brand") {
      toast({
        title: "Brand accounts cannot apply",
        description: "Switch to a creator account to apply for brand campaigns.",
        variant: "destructive",
      });
      return;
    }

    if (hasApplied) {
      toast({
        title: "Already applied",
        description: `Your application is already saved in ${brand.name}'s applications list.`,
      });
      return;
    }

    setApplying(true);

    try {
      const creatorRef = doc(db, "creators", user.uid);
      const creatorSnap = await getDoc(creatorRef);

      let creatorProfile: Partial<Creator> | null = null;

      if (creatorSnap.exists()) {
        creatorProfile = creatorSnap.data() as Creator;
      } else {
        creatorProfile = demoCreators.find((item) => item.id === user.uid || item.uid === user.uid) || null;
      }

      const createdAt = new Date();
      const creatorHandle =
        creatorProfile?.instagramHandle ||
        creatorProfile?.youtubeHandle ||
        user.displayName ||
        user.email ||
        "Creator";

      const application: BrandApplication = {
        id: user.uid,
        brandId: targetBrandDocId,
        brandName: brand.name,
        creatorId: user.uid,
        creatorName: creatorProfile?.name || user.displayName || "Creator",
        creatorEmail: creatorProfile?.email || user.email || "",
        creatorHandle,
        creatorPlatform: creatorProfile?.platform || (creatorProfile?.youtubeHandle ? "youtube" : "instagram"),
        creatorNiche: creatorProfile?.niche || "",
        creatorFollowers: Number(creatorProfile?.followerCount || 0),
        creatorLocation: creatorProfile?.location || "",
        creatorBio: creatorProfile?.bio || creatorProfile?.about || "",
        creatorProfileImage: creatorProfile?.profileImage || user.photoURL || "",
        campaignName: brand.currentCampaign || "",
        status: "new",
        createdAt,
        updatedAt: createdAt,
      };

      saveBrandApplication(targetBrandDocId, application);
      setHasApplied(true);
      toast({
        title: "Application sent",
        description: `${brand.name} can now see your application in their Applications section.`,
      });

      try {
        await setDoc(doc(db, "brands", targetBrandDocId, "applications", user.uid), application, { merge: true });
      } catch (error) {
        console.error("Error syncing application to Firestore:", error);
      }
    } catch (error) {
      console.error("Error applying to brand:", error);
      toast({
        title: "Application failed",
        description: "Something went wrong while saving your application.",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  const collaborationTags = useMemo(
    () => getCollaborationTags(brand?.collaborationType),
    [brand?.collaborationType]
  );
  const lookingForTags = useMemo(
    () => getLookingForTags(brand?.lookingFor),
    [brand?.lookingFor]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0EEF8] dark:bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0EEF8] px-4 dark:bg-background">
        <Card className="max-w-xl rounded-[24px] border border-[#D8D1F4] bg-white shadow-[0_10px_30px_rgba(83,74,183,0.08)] dark:border-slate-800 dark:bg-card dark:shadow-none">
          <CardContent className="p-8 text-center">
            <h1 className="text-3xl font-black text-[#2F2A78] dark:text-white">Brand not found</h1>
            <p className="mt-3 text-slate-500 dark:text-slate-300">
              The brand you are looking for does not exist or has been removed.
            </p>
            <Button asChild className="mt-6 rounded-2xl bg-violet-600 px-6 hover:bg-violet-500">
              <Link href="/brands">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Brands
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const BrandTypeIcon = getBrandTypeIcon(brand.brandType || brand.industry);
  const daysBadge = getRemainingDaysBadge(brand, now);
  const daysText = getRemainingDaysText(brand, now);
  const audiencePoints = (brand.targetAudience || "Gen Z, young professionals, creator-first audiences")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const campaignHighlights = [
    `Campaign Duration: ${brand.campaignDuration || "Jun 2026 - Aug 2026"}`,
    `Brand Type: ${brand.brandType || brand.industry || "Lifestyle Brand"}`,
    `Status: ${brand.campaignStatus || "open"}`,
  ];

  return (
    <div className="min-h-screen bg-[#F0EEF8] px-4 py-10 text-slate-900 dark:bg-background dark:text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button
            asChild
            variant="ghost"
            className="rounded-2xl border border-[#D8D1F4] bg-white px-5 text-[#534AB7] hover:bg-[#F4F1FF] dark:border-slate-800 dark:bg-card dark:text-white dark:hover:bg-slate-900"
          >
            <Link href="/brands">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Brands
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleSave}
              className={`rounded-2xl border px-5 ${
                saved
                  ? "border-[#B38AF8] bg-[#F2EFFF] text-[#7C3AED] dark:border-violet-500/50 dark:bg-violet-500/10 dark:text-violet-300"
                  : "border-[#D8D1F4] bg-white text-[#534AB7] dark:border-slate-800 dark:bg-card dark:text-white"
              }`}
            >
              <Bookmark className={`mr-2 h-4 w-4 ${saved ? "fill-current" : ""}`} />
              {saved ? "Saved" : "Save Brand"}
            </Button>
            <Button
              onClick={handleApply}
              disabled={applying || hasApplied}
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Send className="mr-2 h-4 w-4" />
              {applying ? "Applying..." : hasApplied ? "Applied" : "Apply Now"}
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[28px] border border-[#D8D1F4] bg-white shadow-[0_12px_34px_rgba(83,74,183,0.08)] dark:border-slate-800 dark:bg-[#131217] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <CardContent className="p-0">
            <div className="border-b border-[#E7E2FA] bg-gradient-to-r from-white to-[#F6F2FF] px-8 py-8 dark:border-slate-800 dark:from-[#16151d] dark:to-[#1b1726]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-5">
                  <Avatar className="h-24 w-24 rounded-[28px] border border-white/10 bg-white p-0">
                    <AvatarImage
                      src={brand.logo}
                      alt={brand.name}
                      className="h-full w-full object-contain object-center p-2"
                    />
                    <AvatarFallback className="rounded-[28px] bg-[#E5E0FB] text-3xl font-black text-[#534AB7] dark:bg-slate-800 dark:text-slate-100">
                      {brand.name?.charAt(0)?.toUpperCase() || "B"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-[#7E78C7] dark:text-violet-300/80">
                      Brand Profile
                    </p>
                    <h1 className="text-5xl font-black tracking-tight text-[#2F2A78] dark:text-white">{brand.name}</h1>
                    <p className="mt-2 text-base font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
                      {brand.brandType || brand.industry || "Fashion & Sportswear"}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Badge className="rounded-full border-0 bg-[#EEF2FF] px-4 py-2 text-sm font-semibold text-[#4338CA] dark:bg-violet-500/10 dark:text-violet-200">
                        {brand.industry || "Industry not specified"}
                      </Badge>
                      <Badge className="rounded-full border-0 bg-[#ECFDF3] px-4 py-2 text-sm font-semibold text-[#027A48] dark:bg-emerald-500/10 dark:text-emerald-300">
                        Verified campaign-ready brand
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 lg:min-w-[220px]">
                  <div className="rounded-full border border-[#F2B14A] bg-[#FFF2D9] px-4 py-2 text-center text-base font-semibold text-[#C57A12] shadow-[0_0_20px_rgba(245,158,11,0.08)] dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                    <span className="mr-2 inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-[#F2B14A] align-middle dark:bg-amber-400" />
                    {daysBadge}
                  </div>
                  <div className="rounded-[22px] border border-[#E7E2FA] bg-white/80 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200">
                    <p className="font-semibold text-[#2F2A78] dark:text-white">Campaign timeline</p>
                    <p className="mt-2">{daysText}</p>
                    <p className="mt-1">{brand.campaignDuration || "Duration to be announced"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-8 px-8 py-8 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="space-y-8">
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 rounded-2xl border border-[#E0DBF6] bg-[#F6F2FF] px-3 py-2 text-sm font-semibold text-[#5B54BC] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    <BrandTypeIcon className="h-4 w-4 text-[#7D74DD] dark:text-slate-400" />
                    <span>{brand.brandType || "Brand"}</span>
                  </div>
                  {collaborationTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1.5 rounded-2xl border border-[#C7C1F4] bg-[#F2EFFF] px-3 py-2 text-sm font-semibold text-[#534AB7] dark:border-violet-500/50 dark:bg-violet-500/10 dark:text-violet-200"
                    >
                      <span className="text-sm text-[#6C63D6] dark:text-violet-300">{getCollaborationIcon(tag)}</span>
                      <span>{tag.charAt(0).toUpperCase() + tag.slice(1)}</span>
                    </div>
                  ))}
                </div>

                {brand.currentCampaign ? (
                  <div className="rounded-[24px] border border-[#D3CDF8] bg-[#F4F1FF] p-6 dark:border-violet-500/30 dark:bg-[#1d1930]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E3DEFF] dark:bg-violet-500/20">
                        <Target className="h-6 w-6 text-[#5B54BC] dark:text-violet-300" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7E78C7] dark:text-violet-300/80">
                          Active Campaign
                        </p>
                        <h2 className="mt-1 text-3xl font-black tracking-tight text-[#3F398E] dark:text-white">
                          {brand.currentCampaign}
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-200">
                          {brand.description ||
                            "This brand is actively scouting creators for a campaign with strong storytelling, authentic content integration, and measurable audience relevance."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="rounded-[24px] border border-[#E7E2FA] bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader>
                      <CardTitle className="text-xl text-[#2F2A78] dark:text-white">Looking For</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap items-center gap-2 text-lg font-medium text-slate-700 dark:text-slate-200">
                        {lookingForTags.map((tag, index) => (
                          <div key={`${brand.id}-${tag}-${index}`} className="flex items-center gap-2">
                            <span>{tag}</span>
                            {index < lookingForTags.length - 1 ? (
                              <span className="text-[#8E87E8] dark:text-violet-300">•</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[24px] border border-[#E7E2FA] bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader>
                      <CardTitle className="text-xl text-[#2F2A78] dark:text-white">Target Audience</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {audiencePoints.map((point) => (
                          <div key={point} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-200">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-[24px] border border-[#E7E2FA] bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#2F2A78] dark:text-white">Campaign Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 pt-0 md:grid-cols-3">
                    {campaignHighlights.map((item) => (
                      <div key={item} className="rounded-2xl border border-[#ECE7FB] bg-[#FCFBFF] p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-[#15131d] dark:text-slate-200">
                        {item}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-[24px] border border-[#E7E2FA] bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#2F2A78] dark:text-white">Past Campaigns & Brand Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0 text-sm leading-relaxed text-slate-600 dark:text-slate-200">
                    <p>
                      {brand.pastCampaigns
                        ? `Past campaigns include ${brand.pastCampaigns}. These campaigns indicate the brand's prior collaboration themes and style preferences.`
                        : "This brand is preparing future creator collaborations and has not published public past campaign details yet."}
                    </p>
                    <p>
                      Ideal creators for this brand should have strong niche alignment, clean audience trust, and content quality that feels natural for partnership integration.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="rounded-[24px] border border-[#E7E2FA] bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#2F2A78] dark:text-white">Quick Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex items-center gap-3 rounded-2xl border border-[#ECE7FB] bg-[#FCFBFF] p-4 dark:border-slate-800 dark:bg-[#15131d]">
                      <Mail className="h-5 w-5 text-[#6C63D6] dark:text-violet-300" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Email</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-100">{brand.email || "not provided"}</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleApply}
                      disabled={applying || hasApplied}
                      className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-6 text-base font-semibold hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {applying ? "Applying..." : hasApplied ? "Applied" : "Apply Now"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full rounded-2xl border border-[#D8D1F4] bg-white py-6 text-base font-semibold text-[#534AB7] hover:bg-[#F4F1FF] dark:border-slate-800 dark:bg-card dark:text-white dark:hover:bg-slate-900"
                    >
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Visit Campaign Flow
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-[24px] border border-[#E7E2FA] bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-[#2F2A78] dark:text-white">
                      <Sparkles className="h-5 w-5 text-violet-500" />
                      Why This Brand Stands Out
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0 text-sm text-slate-600 dark:text-slate-200">
                    <div className="flex items-start gap-2">
                      <Users className="mt-0.5 h-4 w-4 text-[#6C63D6] dark:text-violet-300" />
                      <span>Clear creator targeting with niche-specific collaboration goals.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="mt-0.5 h-4 w-4 text-[#6C63D6] dark:text-violet-300" />
                      <span>Defined campaign timeline that helps creators assess urgency and availability.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Target className="mt-0.5 h-4 w-4 text-[#6C63D6] dark:text-violet-300" />
                      <span>Strong fit for creators who want more structured outreach and campaign clarity.</span>
                    </div>
                  </CardContent>
                </Card>

                {relatedBrands.length > 0 ? (
                  <Card className="rounded-[24px] border border-[#E7E2FA] bg-white shadow-none dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader>
                      <CardTitle className="text-xl text-[#2F2A78] dark:text-white">Similar Brands</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {relatedBrands.map((item) => (
                        <Link
                          key={item.id}
                          href={`/brands/${item.id}`}
                          className="block rounded-2xl border border-[#ECE7FB] bg-[#FCFBFF] p-4 transition hover:border-[#B8AEF0] hover:bg-[#F7F4FF] dark:border-slate-800 dark:bg-[#15131d] dark:hover:border-violet-500/40 dark:hover:bg-[#1a1724]"
                        >
                          <p className="font-semibold text-[#2F2A78] dark:text-white">{item.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                            {item.brandType || item.industry || "Brand"}
                          </p>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
