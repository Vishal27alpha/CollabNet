/*'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { demoCreators } from '@/lib/demo-data';
import { Creator, CreatorFilters, FOLLOWER_RANGES } from '@/types/creator';
import { CreatorCard } from '@/components/creators/CreatorCard';
import { CreatorFiltersComponent } from '@/components/creators/CreatorFilters';
import { Loader2, Users } from 'lucide-react';

export default function DirectoryPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CreatorFilters>({
    platform: 'all',
    niche: 'all',
    followerRange: 'all',
    location: '',
    searchQuery: '',
  });

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      const q = collection(db, 'creators');
      const querySnapshot = await getDocs(q);

      let creatorsData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Creator[];

      // 🔹 Fetch Instagram followers count for each creator
      const enrichedCreators = await Promise.all(
        creatorsData.map(async (creator) => {
          if (creator.instagramHandle) {
            try {
              const res = await fetch('/api/instagram'); // calls our backend API
              const data = await res.json();

              console.log('Instagram API response:', data);

              return {
                ...creator,
                followerCount: data.followers_count || creator.followerCount || 0,
              };
            } catch (err) {
              console.error('Error fetching Instagram data:', err);
              return creator;
            }
          }
          return creator;
        })
      );

      setCreators(enrichedCreators);
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCreators = useMemo(() => {
    return creators.filter((creator) => {
      // 🔹 Search query filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesSearch =
          creator.name.toLowerCase().includes(searchLower) ||
          creator.instagramHandle.toLowerCase().includes(searchLower) ||
          creator.bio.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // 🔹 Niche filter
      if (filters.niche && filters.niche !== 'all' && creator.niche !== filters.niche) {
        return false;
      }

      // 🔹 Follower range filter
      if (filters.followerRange && filters.followerRange !== 'all') {
        const range = FOLLOWER_RANGES.find((r) => r.label === filters.followerRange);
        if (range && !(creator.followerCount >= range.min && creator.followerCount <= range.max)) {
          return false;
        }
      }

      // 🔹 Location filter
      if (filters.location) {
        const locationLower = filters.location.toLowerCase();
        if (!creator.location.toLowerCase().includes(locationLower)) {
          return false;
        }
      }

      return true;
    });
  }, [creators, filters]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Creator Directory</h1>
        <p className="text-muted-foreground">
          Discover and connect with Instagram creators in your niche
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <div className="lg:col-span-1">
          <CreatorFiltersComponent filters={filters} onFiltersChange={setFilters} />
        </div>

        
        <div className="lg:col-span-3">
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center text-muted-foreground">
              <Users className="h-5 w-5 mr-2" />
              <span>
                {filteredCreators.length} creator
                {filteredCreators.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>

          
          {filteredCreators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-3xl font-bold text-foreground">No Creators Found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}*/
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { demoCreators } from '@/lib/demo-data';


import { Creator, CreatorFilters, FOLLOWER_RANGES, NICHES } from '@/types/creator';
import { CreatorCard } from '@/components/creators/CreatorCard';
import { CreatorFiltersComponent } from '@/components/creators/CreatorFilters';
import { Loader2, Search, Sparkles, Users } from "lucide-react";


import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const mergeCreators = (creators: Creator[]) => {
  const merged = [...creators];
  const existingNames = new Set(creators.map((creator) => creator.name?.trim().toLowerCase()).filter(Boolean));

  demoCreators.forEach((creator) => {
    const normalizedName = creator.name?.trim().toLowerCase();
    if (!normalizedName || existingNames.has(normalizedName)) {
      return;
    }

    merged.push(creator);
  });

  return merged;
};

export default function DirectoryPage() {
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState<Creator[]>([]);
  const [aiHasSearched, setAiHasSearched] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CreatorFilters>({
    platform: 'all',
    niche: 'all',
    followerRange: 'all',
    location: '',
    searchQuery: '',
  });

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      const q = collection(db, 'creators');
      const querySnapshot = await getDocs(q);

      let creatorsData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Creator[];

      setCreators(mergeCreators(creatorsData));
    } catch (error) {
      console.error('Error loading creators:', error);
      setCreators(demoCreators);
    } finally {
      setLoading(false);
    }
  };

  // ✅ AI Search Function
  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiError("");
    setAiHasSearched(true);

    try {
      const res = await fetch("/api/aiSearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI search failed");
      }

      setAiResults(data.results || []);
    } catch (err) {
      console.error("AI search failed", err);
      setAiResults([]);
      setAiError("AI search failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // ✅ Apply regular filters
  const filteredCreators = useMemo(() => {
    return creators.filter((creator) => {
      if (filters.platform && filters.platform !== 'all') {
        if ((creator.platform || 'instagram') !== filters.platform) {
          return false;
        }
      }

      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesSearch =
          creator.name.toLowerCase().includes(searchLower) ||
          creator.instagramHandle.toLowerCase().includes(searchLower) ||
          (creator.youtubeHandle?.toLowerCase().includes(searchLower) ?? false) ||
          (creator.bio?.toLowerCase().includes(searchLower) ?? false) ||
          (creator.about?.toLowerCase().includes(searchLower) ?? false);

        if (!matchesSearch) return false;
      }

      if (filters.niche && filters.niche !== 'all') {
        if (NICHES.includes(filters.niche)) {
          if (creator.niche !== filters.niche) return false;
        } else {
          if (!creator.niche?.toLowerCase().includes(filters.niche.toLowerCase())) {
            return false;
          }
        }
      }

      if (filters.followerRange && filters.followerRange !== 'all') {
        const range = FOLLOWER_RANGES.find((r) => r.label === filters.followerRange);
        if (range && !(creator.followerCount >= range.min && creator.followerCount <= range.max)) {
          return false;
        }
      }

      if (filters.location) {
        const locationLower = filters.location.toLowerCase();
        if (!creator.location.toLowerCase().includes(locationLower)) {
          return false;
        }
      }

      return true;
    });
  }, [creators, filters]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0EEF8] dark:bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EEF8] px-4 py-10 text-slate-900 dark:bg-background dark:text-foreground">
      <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-[#2F2A78] dark:text-foreground">Creator Directory</h1>
        <p className="mt-2 text-xl text-slate-500 dark:text-muted-foreground">
          Discover and connect with Instagram and YouTube creators in your niche
        </p>
      </div>

      {/* 🔹 AI Search Input */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E87E8] dark:hidden" />
          <Input
            placeholder="Ask AI... (e.g. fitness creators on Instagram or YouTube)"
            value={aiQuery}
            onChange={(e) => {
              setAiQuery(e.target.value);
              if (!e.target.value.trim()) {
                setAiHasSearched(false);
                setAiResults([]);
                setAiError("");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAiSearch();
              }
            }}
            className="h-16 rounded-[22px] border border-[#D6D0F7] bg-white pl-14 text-xl text-slate-700 shadow-[0_8px_24px_rgba(83,74,183,0.06)] placeholder:text-slate-400 focus-visible:ring-[#8E87E8] dark:border-[#2A2438] dark:bg-background dark:text-foreground dark:placeholder:text-slate-500 dark:shadow-none"
          />
        </div>
        <Button
          onClick={handleAiSearch}
          disabled={aiLoading}
          variant="outline"
          className="h-16 min-w-[210px] rounded-[22px] border border-[#C7C1F4] bg-white px-6 text-xl font-semibold text-[#534AB7] shadow-[0_8px_24px_rgba(83,74,183,0.06)] hover:bg-[#F4F1FF] dark:border-purple-600 dark:bg-background dark:text-purple-300 dark:shadow-none dark:hover:bg-[#171220]"
        >
          {aiLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          <span>{aiLoading ? "Searching..." : "AI Search"}</span>
        </Button>
      </div>

      {aiHasSearched ? (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#2F2A78] dark:text-foreground">AI Search Results</h2>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAiHasSearched(false);
                setAiResults([]);
                setAiError("");
              }}
            >
              Show all creators
            </Button>
          </div>

          {aiError ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {aiError}
            </div>
          ) : aiLoading ? (
            <div className="rounded-[24px] border border-[#D8D1F4] bg-white py-12 text-center shadow-[0_10px_30px_rgba(83,74,183,0.08)] dark:border-slate-800 dark:bg-card dark:shadow-none">
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#8E87E8]" />
              <p className="text-slate-500 dark:text-muted-foreground">Finding matching creators...</p>
            </div>
          ) : aiResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {aiResults.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-[#D8D1F4] bg-white py-12 text-center shadow-[0_10px_30px_rgba(83,74,183,0.08)] dark:border-slate-800 dark:bg-card dark:shadow-none">
              <Users className="mx-auto mb-4 h-16 w-16 text-[#8E87E8] dark:text-muted-foreground" />
              <h3 className="text-3xl font-bold text-[#2F2A78] dark:text-foreground">No AI Matches Found</h3>
              <p className="text-slate-500 dark:text-muted-foreground">Try a broader query or lower follower range.</p>
            </div>
          )}
        </div>
      ) : null}

      {!aiHasSearched ? (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <CreatorFiltersComponent filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Normal Filtered Results */}
        <div className="lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center text-slate-600 dark:text-muted-foreground">
              <Users className="mr-2 h-5 w-5" />
              <span>
                {filteredCreators.length} creator
                {filteredCreators.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>

          {filteredCreators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCreators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-[#D8D1F4] bg-white py-12 text-center shadow-[0_10px_30px_rgba(83,74,183,0.08)] dark:border-slate-800 dark:bg-card dark:shadow-none">
              <Users className="mx-auto mb-4 h-16 w-16 text-[#8E87E8] dark:text-muted-foreground" />
              <h3 className="text-3xl font-bold text-[#2F2A78] dark:text-foreground">No Creators Found</h3>
              <p className="text-slate-500 dark:text-muted-foreground">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
      ) : null}
      </div>
    </div>
  );
}
