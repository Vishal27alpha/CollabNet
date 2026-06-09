'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Creator, InstagramPostMetric } from '@/types/creator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CreatorCard } from '@/components/creators/CreatorCard';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { 
  Loader2, 
  MapPin, 
  Users, 
  ExternalLink, 
  Mail,
  Instagram,
  Youtube,
  Calendar,
  Heart,
  MessageCircle,
  FileText,
  Activity,
  Flame
} from 'lucide-react';
import { CartesianGrid, Label, Line, LineChart, ReferenceDot, ReferenceLine, XAxis, YAxis } from 'recharts';

type EngagementChartPoint = {
  label: string;
  displayLabel: string;
  weightedRate: number;
  baseRate: number;
  averageRate: number;
  vsAverage: number;
  weightLabel: string;
  isBest: boolean;
};

export default function CreatorDetailPage() {
  const params = useParams();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [similarCreators, setSimilarCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const postMetrics = useMemo<InstagramPostMetric[]>(
    () => {
      const metrics = creator?.instagramPostMetrics;
      return Array.isArray(metrics) ? metrics : [];
    },
    [creator?.instagramPostMetrics]
  );
  const chartData = useMemo<EngagementChartPoint[]>(
    () => {
      const creatorFollowers = Number(creator?.followerCount ?? 0);
      const points = postMetrics.map((post) => {
        const label = post.label.replace('Post ', 'P');
        const baseRate =
          creatorFollowers > 0
            ? Number(((post.engagement / creatorFollowers) * 100).toFixed(2))
            : 0;
        const weightedEngagement = Number(post.weightedEngagement ?? post.engagement * post.weight);
        const weightedRate =
          creatorFollowers > 0
            ? Number(((weightedEngagement / creatorFollowers) * 100).toFixed(2))
            : 0;

        return {
          label,
          displayLabel: label,
          weightedRate,
          baseRate,
          averageRate: 0,
          vsAverage: 0,
          weightLabel: post.weight === 1.5 ? '1.5x recent' : '1.0x older',
          isBest: false,
        };
      });

      if (!points.length) {
        return [];
      }

      const averageRate = Number(
        (points.reduce((sum, point) => sum + point.weightedRate, 0) / points.length).toFixed(2)
      );
      const bestRate = Math.max(...points.map((point) => point.weightedRate));

      return points.map((point) => {
        const isBest = point.weightedRate === bestRate;

        return {
          ...point,
          averageRate,
          vsAverage: Number((point.weightedRate - averageRate).toFixed(2)),
          isBest,
          displayLabel: isBest ? `★ ${point.label}` : point.label,
        };
      });
    },
    [creator?.followerCount, postMetrics]
  );
  const demoChartData = useMemo<EngagementChartPoint[]>(() => {
    const seed = [
      { label: 'P1', weightedRate: 54, baseRate: 48, weightLabel: '1.5x recent' },
      { label: 'P2', weightedRate: 50, baseRate: 47, weightLabel: '1.5x recent' },
      { label: 'P3', weightedRate: 52, baseRate: 48, weightLabel: '1.5x recent' },
      { label: 'P4', weightedRate: 55, baseRate: 49, weightLabel: '1.5x recent' },
      { label: 'P5', weightedRate: 53, baseRate: 47, weightLabel: '1.5x recent' },
      { label: 'P6', weightedRate: 51, baseRate: 46, weightLabel: '1.0x older' },
      { label: 'P7', weightedRate: 56, baseRate: 50, weightLabel: '1.0x older' },
      { label: 'P8', weightedRate: 54, baseRate: 48, weightLabel: '1.0x older' },
      { label: 'P9', weightedRate: 55, baseRate: 49, weightLabel: '1.0x older' },
      { label: 'P10', weightedRate: 53, baseRate: 48, weightLabel: '1.0x older' },
      { label: 'P11', weightedRate: 47, baseRate: 44, weightLabel: '1.0x older' },
      { label: 'P12', weightedRate: 58, baseRate: 51, weightLabel: '1.0x older' },
    ];
    const averageRate = Number(
      (seed.reduce((sum, point) => sum + point.weightedRate, 0) / seed.length).toFixed(2)
    );
    const bestRate = Math.max(...seed.map((point) => point.weightedRate));

    return seed.map((point) => {
      const isBest = point.weightedRate === bestRate;

      return {
        ...point,
        averageRate,
        vsAverage: Number((point.weightedRate - averageRate).toFixed(2)),
        isBest,
        displayLabel: isBest ? `★ ${point.label}` : point.label,
      };
    });
  }, []);
  const displayChartData = chartData.length > 0 ? chartData : demoChartData;
  const isDemoChart = chartData.length === 0;
  const averageWeightedRate = displayChartData[0]?.averageRate ?? 0;
  const bestPostPoint = displayChartData.find((point) => point.isBest);
  const chartConfig = {
    weightedRate: {
      label: 'Weighted ER',
      color: '#2563eb',
    },
    baseRate: {
      label: 'Base ER',
      color: '#cbd5e1',
    },
    averageRate: {
      label: 'Average',
      color: '#34d399',
    },
    bestPost: {
      label: 'Best post',
      color: '#f59e0b',
    },
  };

  useEffect(() => {
    if (params.id) {
      loadCreator(params.id as string);
    }
  }, [params.id]);

  const loadCreator = async (id: string) => {
    try {
      const docRef = doc(db, 'creators', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const creatorData = { ...docSnap.data(), id: docSnap.id } as Creator;
        setCreator(creatorData);

        // Load similar creators
        const q = query(collection(db, 'creators'), limit(6));
        const querySnapshot = await getDocs(q);
        const allCreators = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Creator[];

        const similar = allCreators
          .filter(c => c.id !== id && c.niche === creatorData.niche)
          .slice(0, 3);
        
        setSimilarCreators(similar);
      }
    } catch (error) {
      console.error('Error loading creator:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (creator) {
      const subject = encodeURIComponent(`Collaboration Opportunity - CollabNet`);
      const body = encodeURIComponent(
        `Hi ${creator.name},\n\nI found your profile on CollabNet and would love to discuss potential collaboration opportunities.\n\nBest regards`
      );
      window.open(`mailto:${creator.email}?subject=${subject}&body=${body}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Creator not found</h1>
          <p className="text-gray-600">The creator you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Convert Firestore Timestamp safely
  let joinedDate = "Unknown";
  try {
    if (creator.createdAt) {
      const dateObj =
        (creator.createdAt as any).toDate?.() || new Date(creator.createdAt);
      joinedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    }
  } catch (err) {
    console.warn("Invalid createdAt format", creator.createdAt);
  }

  const followersCount = Number(creator.followerCount ?? 0);
  const platform = creator.platform || (creator.youtubeHandle ? 'youtube' : 'instagram');
  const platformLabel = platform === 'youtube' ? 'YouTube' : 'Instagram';
  const audienceLabel = platform === 'youtube' ? 'Subscribers' : 'Followers';
  const postsCount = Number(creator.instagramPostsCount ?? 0);
  const likesCount = Number(creator.instagramLikesCount ?? 0);
  const commentsCount = Number(creator.instagramCommentsCount ?? 0);
  const sampledPostsCount = Number(creator.instagramSampledPostsCount ?? 0);
  const weightedEngagementRate = Number(creator.instagramWeightedEngagementRate ?? 0);
  const engagementRate =
    typeof creator.instagramEngagementRate === 'number'
      ? creator.instagramEngagementRate
      : followersCount > 0
        ? Number((((likesCount + commentsCount) / followersCount) * 100).toFixed(2))
        : 0;
  const demoEngagementStats = {
    likes: 18420,
    comments: 1264,
    posts: 48,
    weightedRate: 5.86,
    baseRate: 4.92,
  };
  const displayLikesCount = isDemoChart ? demoEngagementStats.likes : likesCount;
  const displayCommentsCount = isDemoChart ? demoEngagementStats.comments : commentsCount;
  const displayPostsCount = isDemoChart ? demoEngagementStats.posts : postsCount;
  const displayWeightedEngagementRate = isDemoChart ? demoEngagementStats.weightedRate : weightedEngagementRate;
  const displayEngagementRate = isDemoChart ? demoEngagementStats.baseRate : engagementRate;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Creator Profile */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col gap-8">
              {/* Avatar */}
              <div className="flex flex-col items-center md:items-start md:flex-row md:gap-8">
                <div className="flex flex-col items-center md:items-start">
              <Avatar className="h-32 w-32 mb-4">
  <AvatarImage
    src={creator.profileImage}
    alt={creator.name}
    className="object-cover object-center"
  />
  <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
    {creator.name.charAt(0)}
  </AvatarFallback>
</Avatar>

                <Button onClick={handleConnect} size="lg" className="w-full md:w-auto">
                  <Mail className="mr-2 h-4 w-4" />
                  Connect via Email
                </Button>
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{creator.name}</h1>
                  <div className="flex items-center text-lg text-gray-600 mb-2">
                    {platform === 'youtube' ? (
                      <>
                        <Youtube className="h-5 w-5 mr-2" />
                        <span className="flex items-center">
                          {creator.youtubeHandle || 'YouTube creator'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Instagram className="h-5 w-5 mr-2" />
                        <a
                          href={`https://instagram.com/${creator.instagramHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-purple-600 transition-colors flex items-center"
                        >
                          @{creator.instagramHandle}
                          <ExternalLink className="h-4 w-4 ml-1" />
                        </a>
                      </>
                    )}
                  </div>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-4 w-4 mr-2" />
                    {creator.location}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <div className="font-semibold text-lg text-gray-900">
                      {creator.followerCount}
                    </div>
                    <div className="text-sm text-gray-600">{audienceLabel}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Calendar className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <div className="font-semibold text-lg text-gray-900">
                      {joinedDate}
                    </div>
                    <div className="text-sm text-gray-600">Joined</div>
                  </div>
                </div>

                {/* Niche */}
                <div className="mb-4">
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-sm px-3 py-1">
                    {creator.niche}
                  </Badge>
                </div>
{/* Instagram Bio */}
<div className="mb-4">
  <h3 className="text-1xl font-bold text-gray-900 dark:text-gray-100">{platformLabel} Bio</h3>
  <p className="text-gray-700 leading-relaxed">
    {creator.bio && creator.bio.trim() !== "" 
      ? creator.bio 
      : "No bio provided."}
  </p>
</div>

{/* About You */}
<div>
  <h3 className="text-1xl font-bold text-gray-900 dark:text-gray-100">About </h3>
  <p className="text-gray-700 leading-relaxed">
    {creator.about && creator.about.trim() !== "" 
      ? creator.about 
      : "No about info yet."}
  </p>
</div>
              </div>
              </div>
            </div>

            {platform === 'instagram' ? (
              <div className="mt-2 rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-pink-600" />
                  <h3 className="text-lg font-bold text-gray-900">Instagram Engagement</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg bg-white/80 p-4 text-center">
                    <Heart className="mx-auto mb-2 h-6 w-6 text-pink-500" />
                    <div className="text-lg font-semibold text-gray-900">{displayLikesCount}</div>
                    <div className="text-sm text-gray-600">Likes</div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-4 text-center">
                    <MessageCircle className="mx-auto mb-2 h-6 w-6 text-orange-500" />
                    <div className="text-lg font-semibold text-gray-900">{displayCommentsCount}</div>
                    <div className="text-sm text-gray-600">Comments</div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-4 text-center">
                    <FileText className="mx-auto mb-2 h-6 w-6 text-blue-500" />
                    <div className="text-lg font-semibold text-gray-900">{displayPostsCount}</div>
                    <div className="text-sm text-gray-600">Posts</div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-4 text-center">
                    <Flame className="mx-auto mb-2 h-6 w-6 text-green-500" />
                    <div className="text-lg font-semibold text-gray-900">{displayWeightedEngagementRate.toFixed(2)}%</div>
                    <div className="text-sm text-gray-600">Weighted ER</div>
                  </div>
                  <div className="rounded-lg bg-white/80 p-4 text-center">
                    <Activity className="mx-auto mb-2 h-6 w-6 text-emerald-500" />
                    <div className="text-lg font-semibold text-gray-900">{displayEngagementRate.toFixed(2)}%</div>
                    <div className="text-sm text-gray-600">Base ER</div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-slate-800 bg-[#090c12] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Weighted Engagement Trend</h4>
                      <p className="text-xs text-slate-400">
                        Recent 5 posts carry 1.5x weight. Older posts carry 1.0x weight.
                      </p>
                    </div>
                    <Badge variant="secondary" className="border border-slate-700 bg-slate-900/40 text-[10px] font-medium tracking-wide text-slate-500">
                      {isDemoChart ? 'Demo preview' : `${sampledPostsCount} posts sampled`}
                    </Badge>
                  </div>

                  <div className="mb-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
                      <div className="text-sm font-semibold text-blue-200">Weighted ER</div>
                      <p className="mt-1 text-xs text-slate-300">
                        Recent posts count 1.5× more — shows your current momentum
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-3">
                      <div className="text-sm font-semibold text-slate-100">Base ER</div>
                      <p className="mt-1 text-xs text-slate-300">
                        All posts weighted equally — your overall average engagement rate
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-slate-900/80 px-4 py-2 text-sm text-slate-200">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      Weighted ER
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200">
                      <span className="w-4 border-t-2 border-dashed border-slate-300" />
                      Base ER
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-slate-900/80 px-4 py-2 text-sm text-slate-200">
                      <span className="w-4 border-t-2 border-dotted border-emerald-400" />
                      Average
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-slate-900/80 px-4 py-2 text-sm text-slate-200">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      Best post marker
                    </div>
                  </div>

                  <ChartContainer
                    config={chartConfig}
                    className="h-[300px] w-full [&_.recharts-cartesian-grid_line]:stroke-white/60 [&_.recharts-cartesian-axis-tick_text]:fill-slate-500"
                  >
                    <LineChart accessibilityLayer data={displayChartData} margin={{ left: 0, right: 6, top: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="6 6" horizontal vertical />
                      <XAxis
                        dataKey="displayLabel"
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.35)' }}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(255,255,255,0.35)' }}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                        width={48}
                        domain={[0, 70]}
                        ticks={[0, 10, 20, 30, 40, 50, 60, 70]}
                      >
                        <Label
                          value="Engagement rate (%)"
                          angle={-90}
                          position="insideLeft"
                          style={{ textAnchor: 'middle', fill: '#94a3b8', fontSize: 12 }}
                        />
                      </YAxis>
                      <ReferenceLine
                        y={averageWeightedRate}
                        stroke="var(--color-averageRate)"
                        strokeDasharray="3 4"
                        ifOverflow="extendDomain"
                      />
                      {bestPostPoint ? (
                        <ReferenceDot
                          x={bestPostPoint.displayLabel}
                          y={bestPostPoint.weightedRate}
                          r={10}
                          fill="var(--color-bestPost)"
                          stroke="#090c12"
                          strokeWidth={3}
                          ifOverflow="extendDomain"
                        />
                      ) : null}
                      <ChartTooltip
                        cursor={false}
                        shared
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) {
                            return null;
                          }

                          const point = payload[0]?.payload as EngagementChartPoint;

                          if (!point) {
                            return null;
                          }

                          const averageDelta = `${point.vsAverage >= 0 ? '+' : ''}${point.vsAverage.toFixed(2)}%`;

                          return (
                            <div className="grid min-w-[13rem] gap-2 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                              <div className="font-medium text-foreground">
                                {point.isBest ? `Best post • ${point.label}` : point.label}
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Weighted ER</span>
                                <span className="font-mono font-medium text-foreground">
                                  {point.weightedRate.toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Base ER</span>
                                <span className="font-mono font-medium text-foreground">
                                  {point.baseRate.toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Average</span>
                                <span className="font-mono font-medium text-foreground">
                                  {point.averageRate.toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">vs average</span>
                                <span className="font-mono font-medium text-foreground">{averageDelta}</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="baseRate"
                        stroke="var(--color-baseRate)"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                        dot={false}
                        activeDot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="weightedRate"
                        stroke="var(--color-weightedRate)"
                        strokeWidth={3}
                        dot={(props) => {
                          const payload = props.payload as EngagementChartPoint;

                          if (payload.isBest) {
                            return (
                              <circle
                                cx={props.cx}
                                cy={props.cy}
                                r={7}
                                fill="#f59e0b"
                                stroke="#090c12"
                                strokeWidth={3}
                              />
                            );
                          }

                          return (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={5}
                              fill="var(--color-weightedRate)"
                              stroke="#090c12"
                              strokeWidth={2}
                            />
                          );
                        }}
                        activeDot={(props: { cx?: number; cy?: number; payload?: EngagementChartPoint }) => {
                          const payload = props.payload as EngagementChartPoint;

                          return (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={payload.isBest ? 8 : 6}
                              fill={payload.isBest ? '#f59e0b' : 'var(--color-weightedRate)'}
                              stroke="#090c12"
                              strokeWidth={3}
                            />
                          );
                        }}
                      />
                    </LineChart>
                  </ChartContainer>

                  {isDemoChart && (
                    <p className="mt-3 text-center text-xs text-slate-500">
                      Demo chart preview. Connect Instagram and refresh this creator profile to replace it with live post metrics.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex justify-start">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:text-slate-700"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-semibold">
                          i
                        </span>
                        Tap to know how it works
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="max-w-xs text-xs leading-relaxed">
                      Base ER = (Likes + Comments) / Followers x 100. Weighted ER = sum of (Likes + Comments) x post weight / Followers x 100.
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Similar Creators */}
        {similarCreators.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Similar Creators</CardTitle>
              <p className="text-gray-600">Other creators in the {creator.niche} niche</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {similarCreators.map((similarCreator) => (
                  <CreatorCard key={similarCreator.id} creator={similarCreator} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
