/*
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { auth, db } from '@/lib/firebase';
import { Creator, NICHES } from '@/types/creator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Instagram, Youtube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';

const INSTAGRAM_APP_ID = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/auth/callback/instagram`;
const YOUTUBE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const YOUTUBE_REDIRECT_URI = `${APP_URL}/api/auth/callback/youtube`;

export function ProfileForm() {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<Partial<Creator>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingIG, setIsFetchingIG] = useState(false);
  const [isFetchingYT, setIsFetchingYT] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const docRef = doc(db, 'creators', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data() as Creator);
      } else {
        setProfile({
          name: user.displayName || '',
          email: user.email || '',
          profileImage: user.photoURL || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Upload Profile Image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];

    try {
      setUploadingImage(true);
     // const storage = getStorage();
      const storageRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setProfile((prev) => ({ ...prev, profileImage: downloadURL }));

      toast({
        title: "Profile Photo Updated",
        description: "Your photo has been uploaded successfully.",
      });
    } catch (err) {
      console.error("Error uploading image:", err);
      toast({
        title: "Error",
        description: "Failed to upload profile photo",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Facebook Login for Graph API
  const handleInstagramLogin = () => {
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights&response_type=code`;
    window.location.href = authUrl;
  };

  // After redirect back from /api/auth/callback/instagram
  useEffect(() => {
    const token = searchParams.get("token");
    const warn = searchParams.get("warn");

    if (warn === "missing_scopes") {
      toast({
        title: "Permissions Warning",
        description:
          "Some permissions were not granted. If username fetch fails, reconnect and approve all requested permissions.",
      });
    }

    if (!token) return;

    const fetchInstagramData = async () => {
      try {
        setIsFetchingIG(true);
        const res = await fetch(`/api/auth/callback/instagram/username?access_token=${token}`);
        const data = await res.json();
        console.log("IG API response:", data);

        if (res.ok && data.username) {
          setProfile((prev) => ({
            ...prev,
            instagramHandle: data.username,
            followerCount: data.followers_count ?? 0,
            bio: data.biography ?? "",
            instagramPostsCount: data.posts_count ?? 0,
            instagramLikesCount: data.likes_count ?? 0,
            instagramCommentsCount: data.comments_count ?? 0,
            instagramSampledPostsCount: data.sampled_posts_count ?? 0,
            instagramEngagementRate: data.engagement_rate ?? 0,
            instagramWeightedEngagementRate: data.weighted_engagement_rate ?? 0,
            instagramPostMetrics: data.post_metrics ?? [],
          }));
          toast({
            title: "Instagram Connected",
            description: `Fetched @${data.username}`,
          });
        } else {
          toast({
            title: "Failed to fetch Instagram data",
            description: data?.error ?? "No Instagram business account found.",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        console.error("Error fetching IG data:", err);
        toast({
          title: "Error",
          description: err.message || "Unable to fetch IG data",
          variant: "destructive",
        });
      } finally {
        setIsFetchingIG(false);
        router.replace("/profile");
      }
    };

    fetchInstagramData();
  }, [searchParams, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const creatorData: Creator = {
        id: user.uid,
        uid: user.uid,
        name: profile.name || '',
        email: profile.email || user.email || '',
        instagramHandle: profile.instagramHandle || '',
        niche: profile.niche || '',
        followerCount: Number(profile.followerCount) || 0,
        location: profile.location || '',
        bio: profile.bio || '',
        about: profile.about || '',
        profileImage: profile.profileImage || user.photoURL || '',
        instagramPostsCount: Number(profile.instagramPostsCount ?? 0) || 0,
        instagramLikesCount: Number(profile.instagramLikesCount ?? 0) || 0,
        instagramCommentsCount: Number(profile.instagramCommentsCount ?? 0) || 0,
        instagramSampledPostsCount: Number(profile.instagramSampledPostsCount ?? 0) || 0,
        instagramEngagementRate: Number(profile.instagramEngagementRate ?? 0) || 0,
        instagramWeightedEngagementRate: Number(profile.instagramWeightedEngagementRate ?? 0) || 0,
        instagramPostMetrics: profile.instagramPostMetrics ?? [],
        createdAt: profile.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'creators', user.uid), creatorData, { merge: true });

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
         
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <div className="flex items-center space-x-4">
              {profile.profileImage && (
                <img
                  src={profile.profileImage}
                  alt="Profile Preview"
                  className="h-16 w-16 rounded-full object-cover"
                />
              )}
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
            </div>
            {uploadingImage && <p className="text-sm text-gray-500">Uploading...</p>}
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram Handle *</Label>
              <Input
                value={profile.instagramHandle ? `@${profile.instagramHandle}` : ''}
                readOnly
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleInstagramLogin}
            disabled={isFetchingIG}
            className="w-full flex items-center justify-center space-x-2"
          >
            {isFetchingIG ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Instagram className="h-4 w-4" />
            )}
            <span>{isFetchingIG ? "Fetching data..." : "Fetch Instagram Data"}</span>
          </Button>

      
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           
            <div className="space-y-2">
              <Label>Niche *</Label>
              <Select
                value={profile.niche && !NICHES.includes(profile.niche) ? "other" : profile.niche}
                onValueChange={(value) => {
                  if (value === "other") {
                    setProfile({ ...profile, niche: "" });
                  } else {
                    setProfile({ ...profile, niche: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your niche" />
                </SelectTrigger>
                <SelectContent>
                  {NICHES.map((niche) => (
                    <SelectItem key={niche} value={niche}>
                      {niche}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other (write your own)</SelectItem>
                </SelectContent>
              </Select>
              {(!profile.niche || !NICHES.includes(profile.niche)) && (
                <Input
                  type="text"
                  placeholder="Enter your niche"
                  value={profile.niche || ""}
                  onChange={(e) => setProfile({ ...profile, niche: e.target.value })}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Follower Count</Label>
              <Input
                type="number"
                value={profile.followerCount?.toString() || ''}
                readOnly
              />
            </div>
          </div>

         
          <div className="space-y-2">
            <Label>Instagram Bio</Label>
            <Textarea value={profile.bio || ''} readOnly rows={3} />
          </div>

          
          <div className="space-y-2">
            <Label htmlFor="about">About You *</Label>
            <Textarea
              id="about"
              required
              placeholder="Tell other creators about yourself..."
              rows={4}
              value={profile.about || ''}
              onChange={(e) => setProfile({ ...profile, about: e.target.value })}
            />
          </div>

         
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              required
              placeholder="City, Country"
              value={profile.location || ''}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}*/
'use client';

import { useState, useEffect } from 'react';
import { embeddingModel } from "@/lib/gemini";


import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Creator, NICHES } from '@/types/creator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Instagram, Youtube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';

const INSTAGRAM_APP_ID = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/auth/callback/instagram`;
const YOUTUBE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const YOUTUBE_REDIRECT_URI = `${APP_URL}/api/auth/callback/youtube`;

export function ProfileForm() {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<Partial<Creator>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingIG, setIsFetchingIG] = useState(false);
  const [isFetchingYT, setIsFetchingYT] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const docRef = doc(db, 'creators', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const creatorData = docSnap.data() as Creator;
        setProfile({
          ...creatorData,
          platform: creatorData.platform || (creatorData.youtubeHandle ? 'youtube' : 'instagram'),
          followerCount: Number(creatorData.followerCount ?? 0) || 0,
        });
      } else {
        setProfile({
          name: user.displayName || '',
          email: user.email || '',
          profileImage: user.photoURL || '',
          platform: 'instagram',
          followerCount: 0, // guarantee numeric default
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Upload Profile Image as Base64
 // ✅ Upload Profile Image as Base64
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!user || !e.target.files?.[0]) return;
  const file = e.target.files[0];

  setUploadingImage(true);

  const reader = new FileReader();
  reader.onloadend = () => {
    const base64String = reader.result as string;
    setProfile((prev) => ({ ...prev, profileImage: base64String }));

    setUploadingImage(false); // ✅ stop showing "Uploading..."
    toast({
      title: "Profile Photo Ready",
      description: "Click save to update your profile.",
    });
  };

  reader.onerror = () => {
    setUploadingImage(false);
    toast({
      title: "Error",
      description: "Failed to process the image",
      variant: "destructive",
    });
  };

  reader.readAsDataURL(file); // ✅ converts image → Base64
};

  // Facebook Login for Graph API
  const handleInstagramLogin = () => {
    setProfile((prev) => ({ ...prev, platform: 'instagram' }));
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights&response_type=code`;
    window.location.href = authUrl;
  };

  const handleYouTubeLogin = () => {
    if (!YOUTUBE_CLIENT_ID) {
      toast({
        title: "YouTube OAuth not configured",
        description: "Add NEXT_PUBLIC_GOOGLE_CLIENT_ID before connecting a YouTube account.",
        variant: "destructive",
      });
      return;
    }

    setProfile((prev) => ({ ...prev, platform: 'youtube' }));
    setIsFetchingYT(true);

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      new URLSearchParams({
        client_id: YOUTUBE_CLIENT_ID,
        redirect_uri: YOUTUBE_REDIRECT_URI,
        response_type: "code",
        access_type: "offline",
        include_granted_scopes: "true",
        prompt: "consent",
        scope: "https://www.googleapis.com/auth/youtube.readonly",
      }).toString();

    window.location.href = authUrl;
  };

  // After redirect back from /api/auth/callback/instagram
  useEffect(() => {
    const token = searchParams.get("token");
    const youtubeAccessToken = searchParams.get("youtube_access_token");
    const youtubeError = searchParams.get("youtube_error");
    const warn = searchParams.get("warn");

    if (warn === "missing_scopes") {
      toast({
        title: "Permissions Warning",
        description:
          "Some permissions were not granted. If username fetch fails, reconnect and approve all requested permissions.",
      });
    }

    if (youtubeError) {
      toast({
        title: "YouTube connection failed",
        description: `Google returned: ${youtubeError}`,
        variant: "destructive",
      });
      router.replace("/profile");
      return;
    }

    const fetchInstagramData = async () => {
      try {
        setIsFetchingIG(true);
        const res = await fetch(`/api/auth/callback/instagram/username?access_token=${token}`);
        const data = await res.json();
        console.log("IG API response:", data);

        if (res.ok && data.username) {
          setProfile((prev) => ({
            ...prev,
            platform: 'instagram',
            instagramHandle: data.username,
            youtubeHandle: '',
            followerCount: data.followers_count ?? 0,
            bio: data.biography ?? "",
          }));
          toast({
            title: "Instagram Connected",
            description: `Fetched @${data.username}`,
          });
        } else {
          toast({
            title: "Failed to fetch Instagram data",
            description: data?.error ?? "No Instagram business account found.",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        console.error("Error fetching IG data:", err);
        toast({
          title: "Error",
          description: err.message || "Unable to fetch IG data",
          variant: "destructive",
        });
      } finally {
        setIsFetchingIG(false);
        router.replace("/profile");
      }
    };

    const fetchYouTubeData = async () => {
      try {
        setIsFetchingYT(true);
        const res = await fetch(`/api/auth/callback/youtube/channel?access_token=${youtubeAccessToken}`);
        const data = await res.json();

        if (res.ok && (data.channel_title || data.channel_handle)) {
          setProfile((prev) => ({
            ...prev,
            platform: 'youtube',
            youtubeHandle: data.channel_handle || data.channel_title || '',
            youtubeChannelId: data.channel_id || '',
            youtubeChannelTitle: data.channel_title || '',
            youtubeThumbnailUrl: data.thumbnail_url || '',
            instagramHandle: '',
            followerCount: Number(data.subscriber_count ?? 0),
            bio: data.description ?? '',
          }));
          toast({
            title: "YouTube Connected",
            description: `Fetched ${data.channel_title || data.channel_handle}`,
          });
        } else {
          toast({
            title: "Failed to fetch YouTube data",
            description: data?.error ?? "No YouTube channel found for this Google account.",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        console.error("Error fetching YouTube data:", err);
        toast({
          title: "Error",
          description: err.message || "Unable to fetch YouTube data",
          variant: "destructive",
        });
      } finally {
        setIsFetchingYT(false);
        router.replace("/profile");
      }
    };

    if (token) {
      fetchInstagramData();
    } else if (youtubeAccessToken) {
      fetchYouTubeData();
    }
  }, [searchParams, router, toast]);

// Generate embedding using Gemini
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values; // returns array of floats
  } catch (err) {
    console.error("Gemini embedding error:", err);
    return [];
  }
}
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const creatorData: Creator = {
        id: user.uid,
        uid: user.uid,
        name: profile.name || '',
        email: profile.email || user.email || '',
        platform: profile.platform || 'instagram',
        instagramHandle: profile.instagramHandle || '',
        youtubeHandle: profile.youtubeHandle || '',
        youtubeChannelId: profile.youtubeChannelId || '',
        youtubeChannelTitle: profile.youtubeChannelTitle || '',
        youtubeThumbnailUrl: profile.youtubeThumbnailUrl || '',
        niche: profile.niche || '',
        //followerCount: Number(profile.followerCount) || 0,
        followerCount: (() => {
          const n = Number(profile.followerCount ?? 0);
          return Number.isFinite(n) ? n : 0;
        })(),
        location: profile.location || '',
        bio: profile.bio || '',
        about: profile.about || '',
        profileImage: profile.profileImage || user.photoURL || '',
        createdAt: profile.createdAt || new Date(),
        updatedAt: new Date(),
      };

      const combinedText = `${creatorData.name} ${creatorData.bio || ""} ${creatorData.about || ""} ${creatorData.niche || ""}`;
creatorData.embedding = await generateEmbedding(combinedText);


      await setDoc(doc(db, 'creators', user.uid), creatorData, { merge: true });

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <Card className="mx-auto max-w-4xl rounded-[28px] border border-[#D8D1F4] bg-white shadow-[0_12px_34px_rgba(83,74,183,0.08)] dark:border-border dark:bg-card dark:shadow-none">
      <CardHeader>
        <CardTitle className="text-3xl font-black tracking-tight text-[#2F2A78] dark:text-foreground">
          Complete Your Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-[#2F2A78] dark:text-foreground">Profile Photo</Label>
            <div className="flex items-center space-x-4">
              {profile.profileImage && typeof profile.profileImage === "string" && (
                <img
                  src={profile.profileImage}
                  alt="Profile Preview"
                  className="h-16 w-16 rounded-full border border-[#E5E0FB] object-cover"
                />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="border-[#D6D0F7] bg-[#FCFBFF] text-slate-700 focus-visible:ring-[#8E87E8] dark:border-input dark:bg-background dark:text-foreground"
              />
            </div>
            {uploadingImage && <p className="text-sm text-slate-500 dark:text-gray-500">Processing...</p>}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-semibold text-[#2F2A78] dark:text-foreground">Full Name *</Label>
              <Input
                id="name"
                required
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="border-[#D6D0F7] bg-[#FCFBFF] text-slate-700 focus-visible:ring-[#8E87E8] dark:border-input dark:bg-background dark:text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold text-[#2F2A78] dark:text-foreground">
                {profile.platform === 'youtube' ? 'YouTube Channel *' : 'Instagram Handle *'}
              </Label>
              <Input
                value={
                  profile.platform === 'youtube'
                    ? (profile.youtubeHandle || '')
                    : profile.instagramHandle
                      ? `@${profile.instagramHandle}`
                      : ''
                }
                readOnly
                className="border-[#D6D0F7] bg-[#F4F1FF] text-slate-500 focus-visible:ring-[#8E87E8] dark:border-input dark:bg-background dark:text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold text-[#2F2A78] dark:text-foreground">Platform *</Label>
            <Select
              value={profile.platform || 'instagram'}
              onValueChange={(value: 'instagram' | 'youtube') =>
                setProfile((prev) => ({
                  ...prev,
                  platform: value,
                }))
              }
            >
              <SelectTrigger className="border-[#D6D0F7] bg-[#FCFBFF] text-slate-700 focus:ring-[#8E87E8] dark:border-input dark:bg-background dark:text-foreground">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram creator</SelectItem>
                <SelectItem value="youtube">YouTube creator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {profile.platform === 'youtube' ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleYouTubeLogin}
              disabled={isFetchingYT}
              className="h-14 w-full rounded-[18px] border border-[#F3C28C] bg-white text-lg font-semibold text-[#C36E12] shadow-[0_8px_24px_rgba(195,110,18,0.08)] hover:bg-[#FFF5E8] dark:border-amber-500 dark:bg-background dark:text-amber-300 dark:shadow-none dark:hover:bg-[#22180d] flex items-center gap-3"
            >
              {isFetchingYT ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Youtube className="h-4 w-4" />
              )}
              <span>{isFetchingYT ? "Fetching data..." : "Fetch YouTube Account"}</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleInstagramLogin}
              disabled={isFetchingIG}
              className="h-14 w-full rounded-[18px] border border-[#C7C1F4] bg-white text-lg font-semibold text-[#534AB7] shadow-[0_8px_24px_rgba(83,74,183,0.06)] hover:bg-[#F4F1FF] dark:border-purple-600 dark:bg-background dark:text-purple-300 dark:shadow-none dark:hover:bg-[#171220] flex items-center gap-3"
            >
              {isFetchingIG ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Instagram className="h-4 w-4" />
              )}
              <span>{isFetchingIG ? "Fetching data..." : "Fetch Instagram Account"}</span>
            </Button>
          )}

          {/* Niche and Followers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Niche */}
            <div className="space-y-2">
              <Label className="text-base font-semibold text-[#2F2A78] dark:text-foreground">Niche *</Label>
              <Select
                value={profile.niche && !NICHES.includes(profile.niche) ? "other" : profile.niche}
                onValueChange={(value) => {
                  if (value === "other") {
                    setProfile({ ...profile, niche: "" });
                  } else {
                    setProfile({ ...profile, niche: value });
                  }
                }}
              >
                <SelectTrigger className="border-[#D6D0F7] bg-[#FCFBFF] text-slate-700 focus:ring-[#8E87E8] dark:border-input dark:bg-background dark:text-foreground">
                  <SelectValue placeholder="Select your niche" />
                </SelectTrigger>
                <SelectContent>
                  {NICHES.map((niche) => (
                    <SelectItem key={niche} value={niche}>
                      {niche}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other (write your own)</SelectItem>
                </SelectContent>
              </Select>
              {(!profile.niche || !NICHES.includes(profile.niche)) && (
                <Input
                  type="text"
                  placeholder="Enter your niche"
                  value={profile.niche || ""}
                  onChange={(e) => setProfile({ ...profile, niche: e.target.value })}
                  className="border-[#D6D0F7] bg-[#FCFBFF] text-slate-700 focus-visible:ring-[#8E87E8] dark:border-input dark:bg-background dark:text-foreground"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold text-[#2F2A78] dark:text-foreground">
                {profile.platform === 'youtube' ? 'Subscriber Count' : 'Follower Count'}
              </Label>
              <Input
                type="number"
                //value={profile.followerCount?.toString() || ''}
                value={profile.followerCount !== undefined && profile.followerCount !== null ? String(profile.followerCount) : ''}
                readOnly
                className="border-[#D6D0F7] bg-[#F4F1FF] text-slate-500 focus-visible:ring-[#8E87E8] dark:border-input dark:bg-background dark:text-foreground"
              />
            </div>
          </div>

          {/* Instagram Bio */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-[#2F2A78] dark:text-foreground">
              {profile.platform === 'youtube' ? 'YouTube Bio' : 'Instagram Bio'}
            </Label>
            <Textarea
              value={profile.bio || ''}
              readOnly
              rows={3}
              className="border-[#D6D0F7] bg-[#F4F1FF] text-slate-500 focus-visible:ring-[#8E87E8] dark:border-input dark:bg-background dark:text-foreground"
            />
          </div>

          {/* About You */}
          <div className="space-y-2">
            <Label htmlFor="about" className="text-base font-semibold text-[#2F2A78] dark:text-foreground">About You *</Label>
            <Textarea
              id="about"
              required
              placeholder="Tell other creators about yourself..."
              rows={4}
              value={profile.about || ''}
              onChange={(e) => setProfile({ ...profile, about: e.target.value })}
              className="border-[#D6D0F7] bg-[#FCFBFF] text-slate-700 focus-visible:ring-[#8E87E8] dark:border-input dark:bg-background dark:text-foreground"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-base font-semibold text-[#2F2A78] dark:text-foreground">Location *</Label>
            <Input
              id="location"
              required
              placeholder="City, Country"
              value={profile.location || ''}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="border-[#D6D0F7] bg-[#FCFBFF] text-slate-700 focus-visible:ring-[#8E87E8] dark:border-input dark:bg-background dark:text-foreground"
            />
          </div>

          <Button
            type="submit"
            disabled={isSaving}
            className="h-14 w-full rounded-[18px] bg-gradient-to-r from-violet-600 to-fuchsia-600 text-lg font-semibold text-white hover:from-violet-500 hover:to-fuchsia-500"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
