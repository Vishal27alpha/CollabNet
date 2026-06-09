"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  hasCreatorAppliedToBrand,
  saveBrandApplication,
} from "@/lib/brand-applications";
import { db } from "@/lib/firebase";
import { Brand, BrandApplication } from "@/lib/types";
import { demoBrands, demoCreators } from "@/lib/demo-data";
import {
  getCollaborationTags,
  getLookingForTags,
  getRemainingDaysBadge,
  mergeBrands,
} from "@/lib/brand-directory-utils";
import { getSavedBrands, toggleSavedBrand } from "@/lib/saved-brands";
import { Creator } from "@/types/creator";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, Bookmark, Briefcase, Search, Send, Shirt, SlidersHorizontal, Sparkles, Target, Users } from "lucide-react";

export default function BrandsDirectoryPage() {
  const { user, role } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [savedBrandIds, setSavedBrandIds] = useState<string[]>([]);
  const [appliedBrandIds, setAppliedBrandIds] = useState<string[]>([]);
  const [applyingBrandId, setApplyingBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setSavedBrandIds(getSavedBrands().map((brand) => brand.id));
  }, []);

  useEffect(() => {
    if (!user || role !== "creator" || brands.length === 0) {
      setAppliedBrandIds([]);
      return;
    }

    const appliedIds = brands
      .filter((brand) => hasCreatorAppliedToBrand(brand.uid || brand.id, user.uid))
      .map((brand) => brand.id);

    setAppliedBrandIds(appliedIds);
  }, [brands, role, user]);

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

  const handleSaveBrand = (brand: Brand) => {
    const isSaved = toggleSavedBrand(brand);
    setSavedBrandIds((prev) =>
      isSaved ? [...prev, brand.id] : prev.filter((id) => id !== brand.id)
    );
  };

  const handleApplyToBrand = async (brand: Brand) => {
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

    if (hasCreatorAppliedToBrand(targetBrandDocId, user.uid) || appliedBrandIds.includes(brand.id)) {
      setAppliedBrandIds((prev) => (prev.includes(brand.id) ? prev : [...prev, brand.id]));
      toast({
        title: "Already applied",
        description: `Your application is already saved in ${brand.name}'s applications list.`,
      });
      return;
    }

    setApplyingBrandId(brand.id);

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
      setAppliedBrandIds((prev) => (prev.includes(brand.id) ? prev : [...prev, brand.id]));
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
      setApplyingBrandId(null);
    }
  };

  // Fetch all brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const snap = await getDocs(collection(db, "brands"));
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Brand[];
        const mergedBrands = mergeBrands(list);
        setBrands(mergedBrands);
        setFilteredBrands(mergedBrands);
      } catch (err) {
        console.error("Error fetching brands:", err);
        setBrands(demoBrands);
        setFilteredBrands(demoBrands);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  // Apply filters
  useEffect(() => {
    let results = brands;

    if (industryFilter !== "all") {
      results = results.filter((b) => b.industry?.toLowerCase() === industryFilter.toLowerCase());
    }

    if (search.trim() !== "") {
      results = results.filter(
        (b) =>
          b.name?.toLowerCase().includes(search.toLowerCase()) ||
          b.description?.toLowerCase().includes(search.toLowerCase()) ||
          b.currentCampaign?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredBrands(results);
  }, [search, industryFilter, brands]);

  const aiBrandMatches = useMemo(() => {
    const candidates = (filteredBrands.length > 0 ? filteredBrands : brands).slice(0, 3);
    const scores = [92, 84, 76];

    return candidates.map((candidate, index) => ({
      brandId: candidate.id,
      brandName: candidate.name,
      matchScore: scores[index] || Math.max(68, 92 - index * 8),
      reason: `Strong fit for ${candidate.lookingFor || "creator partnerships"} with ${candidate.collaborationType || "collaboration"} opportunities.`,
      lookingFor: candidate.lookingFor || "creator partnerships",
    }));
  }, [brands, filteredBrands]);

  const topAiBrandMatch = aiBrandMatches[0];
  const secondaryAiBrandMatches = aiBrandMatches.slice(1);
  const isSearching = search.trim().length > 0;
  const shouldShowAiBrandMatches =
    !isSearching && industryFilter === "all" && filteredBrands.length === brands.length;

  if (loading) return <p className="py-10 text-center">Loading brands...</p>;

  return (
    <div className="min-h-screen bg-[#F0EEF8] px-4 py-10 text-slate-900 dark:bg-background dark:text-foreground">
      <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-4xl font-black tracking-tight text-[#2F2A78] dark:text-foreground">Brands Directory</h1>

      {/* Filters Section */}
      <div className="mb-6 flex flex-col items-stretch gap-4">
        <Select value={industryFilter} onValueChange={(val) => setIndustryFilter(val)}>
          <SelectTrigger className="h-16 w-full rounded-[22px] border border-[#D6D0F7] bg-white px-5 text-xl text-slate-700 shadow-[0_8px_24px_rgba(83,74,183,0.06)] focus:ring-[#8E87E8] dark:h-10 dark:rounded-md dark:border-input dark:bg-background dark:px-3 dark:text-base dark:shadow-none md:max-w-[360px]">
            <SlidersHorizontal className="mr-3 h-5 w-5 text-[#534AB7] dark:hidden" />
            <SelectValue placeholder="Filter by industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            <SelectItem value="fashion">Fashion</SelectItem>
            <SelectItem value="tech">Tech</SelectItem>
            <SelectItem value="fitness">Fitness</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="beauty">Beauty</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E87E8] dark:hidden" />
          <Input
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-16 w-full rounded-[22px] border border-[#D6D0F7] bg-white pl-14 text-xl text-slate-700 shadow-[0_8px_24px_rgba(83,74,183,0.06)] placeholder:text-slate-400 focus-visible:ring-[#8E87E8] dark:h-10 dark:rounded-md dark:border-input dark:bg-background dark:pl-3 dark:text-base dark:shadow-none"
          />
        </div>
      </div>

      {shouldShowAiBrandMatches && topAiBrandMatch && (
        <div className="mb-8 space-y-4">
          <Card className="overflow-hidden rounded-[30px] border-0 bg-gradient-to-r from-[#463B98] via-[#5A4FC0] to-[#7D74DD] shadow-[0_22px_44px_rgba(83,74,183,0.18)] transition hover:scale-[1.005] hover:shadow-[0_26px_52px_rgba(83,74,183,0.24)]">
            <CardContent className="p-0">
              <Link href={`/brands/${topAiBrandMatch.brandId}`} className="flex items-center justify-between gap-6 p-10">
              <div className="flex-1">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#D5CFFD]" />
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#D5CFFD]">AI Brand Match</p>
              </div>
                <div>
                  <h2 className="text-5xl font-black tracking-tight text-white">{topAiBrandMatch.brandName}</h2>
                  <p className="mt-2 max-w-3xl text-2xl text-[#D7D1F4]">{topAiBrandMatch.reason}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Badge variant="secondary" className="rounded-full border-0 bg-white/12 px-5 py-2 text-xl font-semibold text-[#ECE8FF]">
                  Looking for: {topAiBrandMatch.lookingFor}
                </Badge>
                <Badge variant="secondary" className="rounded-full border-0 bg-white/16 px-5 py-2 text-xl font-semibold text-white">
                  Best for outreach
                </Badge>
              </div>
              <div className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-full text-center text-white shadow-[0_18px_34px_rgba(38,30,107,0.16)]">
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="rgba(116,107,219,0.9)"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="6"
                  />
                  <circle
                    className="match-score-ring"
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="rgba(255,255,255,0.96)"
                    strokeLinecap="round"
                    strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 48}`}
                    strokeDashoffset={`${2 * Math.PI * 48 * (1 - topAiBrandMatch.matchScore / 100)}`}
                    style={{
                      "--match-ring-start": `${2 * Math.PI * 48}`,
                      "--match-ring-end": `${2 * Math.PI * 48 * (1 - topAiBrandMatch.matchScore / 100)}`,
                    } as CSSProperties}
                  />
                </svg>
                <div className="absolute inset-[12px] rounded-full ring-1 ring-white/35" aria-hidden="true" />
                <div className="relative px-3">
                  <div className="match-score-value text-5xl font-black leading-none">{topAiBrandMatch.matchScore}%</div>
                  <div className="mt-2 text-xl text-[#D7D1F4]">match</div>
                </div>
              </div>
              </Link>
            </CardContent>
          </Card>

          {secondaryAiBrandMatches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {secondaryAiBrandMatches.map((match) => (
                <Card
                  key={match.brandName}
                  className="overflow-hidden rounded-[24px] border border-[#D8D1F4] bg-white shadow-[0_10px_30px_rgba(83,74,183,0.08)] transition hover:border-[#B8AEF0] hover:shadow-[0_16px_34px_rgba(83,74,183,0.12)] dark:border-slate-800 dark:bg-[#131217] dark:hover:border-purple-500/30"
                >
                  <CardContent className="p-0">
                    <Link href={`/brands/${match.brandId}`} className="flex items-center justify-between gap-5 p-6">
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#7D74DD]" />
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7E78C7] dark:text-violet-300/80">
                          AI Brand Match
                        </p>
                      </div>
                      <h3 className="truncate text-3xl font-black tracking-tight text-[#2F2A78] dark:text-white">
                        {match.brandName}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300">
                        {match.reason}
                      </p>
                      <Badge variant="secondary" className="mt-4 rounded-full border-0 bg-[#F2EFFF] px-4 py-1.5 text-sm font-semibold text-[#6C3ACB] dark:bg-violet-500/10 dark:text-violet-200">
                        Looking for: {match.lookingFor}
                      </Badge>
                    </div>
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-center text-[#534AB7] shadow-[0_12px_28px_rgba(83,74,183,0.12)] dark:text-violet-100">
                      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          fill="none"
                          stroke="rgba(117,91,232,0.16)"
                          strokeWidth="7"
                        />
                        <circle
                          className="match-score-ring"
                          cx="60"
                          cy="60"
                          r="46"
                          fill="none"
                          stroke="#755BE8"
                          strokeLinecap="round"
                          strokeWidth="7"
                          strokeDasharray={`${2 * Math.PI * 46}`}
                          strokeDashoffset={`${2 * Math.PI * 46 * (1 - match.matchScore / 100)}`}
                          style={{
                            "--match-ring-start": `${2 * Math.PI * 46}`,
                            "--match-ring-end": `${2 * Math.PI * 46 * (1 - match.matchScore / 100)}`,
                          } as CSSProperties}
                        />
                      </svg>
                      <div className="absolute inset-[12px] rounded-full bg-white dark:bg-[#131217]" aria-hidden="true" />
                      <div className="absolute inset-0 rounded-full ring-1 ring-[#7D74DD]/20 dark:ring-violet-300/10" aria-hidden="true" />
                      <div className="relative px-2">
                        <div className="match-score-value text-2xl font-black leading-none">{match.matchScore}%</div>
                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">match</div>
                      </div>
                    </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Brands List */}
      {filteredBrands.length === 0 ? (
        <p className="text-gray-500">No brands match your filters.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredBrands.map((brand) => (
            <Card
              key={brand.id}
              className="overflow-hidden rounded-[24px] border border-[#D8D1F4] bg-white shadow-[0_10px_30px_rgba(83,74,183,0.08)] transition hover:border-[#B8AEF0] hover:shadow-[0_16px_34px_rgba(83,74,183,0.12)] dark:border-slate-800 dark:bg-[#131217] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)] dark:hover:border-purple-500/30"
            >
              <CardContent className="p-0">
                <div className="flex items-start justify-between gap-3 border-b border-[#E7E2FA] bg-white px-4 py-5 dark:border-slate-800 dark:bg-gradient-to-r dark:from-[#16151d] dark:to-[#1b1726]">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-14 w-14 rounded-[18px] border border-white/5 bg-white p-0">
                      <AvatarImage
                        src={brand.logo}
                        alt={brand.name}
                        className="h-full w-full object-contain object-center p-1.5"
                      />
                      <AvatarFallback className="rounded-[18px] bg-[#E5E0FB] text-base font-semibold text-[#534AB7] dark:bg-slate-800 dark:text-slate-100">
                        {brand.name?.charAt(0)?.toUpperCase() || "B"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="pt-1">
                      <h2 className="text-3xl font-black tracking-tight text-[#2F2A78] dark:text-white">{brand.name}</h2>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500">
                        {brand.brandType || brand.industry || "Fashion & Sportswear"}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-full border border-[#F2B14A] bg-[#FFF2D9] px-3 py-1 text-sm font-semibold text-[#C57A12] shadow-[0_0_20px_rgba(245,158,11,0.08)] dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                    <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-[#F2B14A] align-middle dark:bg-amber-400" />
                    {getRemainingDaysBadge(brand, now)}
                  </div>
                </div>

                <div className="space-y-4 px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const BrandTypeIcon = getBrandTypeIcon(brand.brandType || brand.industry);
                      return (
                        <div className="flex items-center gap-2 rounded-2xl border border-[#E0DBF6] bg-[#F6F2FF] px-3 py-1.5 text-sm font-semibold text-[#5B54BC] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                          <BrandTypeIcon className="h-3.5 w-3.5 text-[#7D74DD] dark:text-slate-400" />
                          <span>{brand.brandType || "Fashion"}</span>
                        </div>
                      );
                    })()}
                    {getCollaborationTags(brand.collaborationType).slice(0, 3).map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-1.5 rounded-2xl border border-[#C7C1F4] bg-[#F2EFFF] px-3 py-1.5 text-sm font-semibold text-[#534AB7] dark:border-violet-500/50 dark:bg-violet-500/10 dark:text-violet-200"
                      >
                        <span className="text-sm text-[#6C63D6] dark:text-violet-300">{getCollaborationIcon(tag)}</span>
                        <span>{tag.charAt(0).toUpperCase() + tag.slice(1)}</span>
                      </div>
                    ))}
                  </div>

                  {brand.currentCampaign && (
                    <div className="rounded-[20px] border border-[#D3CDF8] bg-[#F4F1FF] px-4 py-3.5 dark:border-violet-500/40 dark:bg-[#1d1930]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3DEFF] dark:bg-violet-500/20">
                          <Target className="h-5 w-5 text-[#5B54BC] dark:text-violet-300" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7E78C7] dark:text-violet-300/80">
                            Active Campaign
                          </p>
                          <p className="text-xl font-bold text-[#3F398E] dark:text-white">{brand.currentCampaign}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-400">
                      Looking For
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-lg font-medium text-slate-700 dark:text-slate-200">
                      {getLookingForTags(brand.lookingFor).map((tag, index, arr) => (
                        <div key={`${brand.id}-${tag}-${index}`} className="flex items-center gap-2">
                          <span>{tag}</span>
                          {index < arr.length - 1 ? <span className="text-[#8E87E8] dark:text-violet-300">•</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#ECE7FB] pt-4 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-4 rounded-[20px] border border-[#E0DBF6] bg-[#FCFBFF] px-4 py-3 dark:border-slate-800 dark:bg-[#15131d]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#5B54BC] dark:bg-violet-500/10 dark:text-violet-300">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Min Ideal Reach
                          </p>
                          <p className="text-xl font-black text-[#2F2A78] dark:text-white">
                            {brand.minIdealReach || "10k"}
                          </p>
                        </div>
                      </div>
                      <Badge className="rounded-full border-0 bg-[#F2EFFF] px-3 py-1 text-xs font-semibold text-[#6C3ACB] dark:bg-violet-500/10 dark:text-violet-200">
                        Minimum
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      asChild
                      variant="ghost"
                      size="default"
                      className="h-12 rounded-2xl border border-[#E0DBF6] bg-transparent px-5 text-base font-semibold text-[#5B54BC] hover:bg-[#F4F1FF] dark:border-slate-700 dark:text-white dark:hover:bg-slate-900"
                    >
                      <Link href={`/brands/${brand.id}`}>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    <Button
                      size="default"
                      onClick={() => handleApplyToBrand(brand)}
                      disabled={applyingBrandId === brand.id || appliedBrandIds.includes(brand.id)}
                      className="h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-base font-semibold text-white hover:from-violet-500 hover:to-fuchsia-500"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {applyingBrandId === brand.id
                        ? "Applying..."
                        : appliedBrandIds.includes(brand.id)
                          ? "Applied"
                          : "Apply now"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSaveBrand(brand)}
                      className={`h-12 w-12 rounded-2xl border bg-transparent hover:bg-[#F4F1FF] dark:border-slate-700 dark:text-white dark:hover:bg-slate-900 ${
                        savedBrandIds.includes(brand.id)
                          ? "border-[#B38AF8] bg-[#F2EFFF] text-[#7C3AED] dark:bg-violet-500/10 dark:text-violet-300"
                          : "border-[#E0DBF6] text-[#5B54BC]"
                      }`}
                    >
                      <Bookmark
                        className={`h-4.5 w-4.5 ${savedBrandIds.includes(brand.id) ? "fill-current" : ""}`}
                      />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
