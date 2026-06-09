/*'use client';

import Link from 'next/link';
import { Creator } from '@/types/creator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, ExternalLink } from 'lucide-react';

interface CreatorCardProps {
  creator: Creator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const platform = creator.platform || (creator.youtubeHandle ? 'youtube' : 'instagram');
  const displayHandle = platform === 'youtube'
    ? creator.youtubeHandle || 'YouTube creator'
    : creator.instagramHandle
      ? `@${creator.instagramHandle}`
      : 'Instagram creator';

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
      <Link href={`/creator/${creator.id}`}>
        <CardHeader className="pb-4">
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={creator.profileImage} alt={creator.name} />
              <AvatarFallback className="text-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                {creator.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground">{creator.name}</h3>

              <p className="text-sm text-gray-600 flex items-center mt-1">
                <ExternalLink className="h-3 w-3 mr-1" />
                @{creator.instagramHandle}
              </p>
              <div className="flex items-center text-sm text-gray-500 mt-2">
                <Users className="h-4 w-4 mr-1" />
                {creator.followerCount} followers
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              {creator.location}
            </div>
            
            <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
              {creator.niche}
            </Badge>
            
            <p className="text-sm text-gray-600 line-clamp-3">
              {creator.bio}
            </p>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}*/
'use client';

import Link from 'next/link';
import { Creator } from '@/types/creator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, ExternalLink, MapPin } from 'lucide-react';

interface CreatorCardProps {
  creator: Creator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const platform = creator.platform || (creator.youtubeHandle ? 'youtube' : 'instagram');
  const displayHandle =
    platform === 'youtube'
      ? creator.youtubeHandle || 'YouTube creator'
      : creator.instagramHandle
        ? `@${creator.instagramHandle}`
        : 'Instagram creator';

  return (
    <Card className="group min-h-[310px] cursor-pointer overflow-hidden rounded-[24px] border border-[#D8D1F4] bg-white shadow-[0_10px_30px_rgba(83,74,183,0.08)] transition-all duration-200 hover:border-[#B8AEF0] hover:shadow-[0_16px_34px_rgba(83,74,183,0.12)] dark:border-[#2A2438] dark:bg-card dark:shadow-none dark:hover:border-purple-500/30 dark:hover:shadow-none">
      <Link href={`/creator/${creator.id}`}>
        <CardHeader className="pb-4">
          <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16 rounded-2xl border border-[#E5E0FB] bg-[#F4F1FF] dark:border-[#2A2438] dark:bg-[#171220]">
  <AvatarImage
    src={creator.profileImage}
    alt={creator.name}
    className="object-cover"
  />
  <AvatarFallback className="text-lg bg-gradient-to-br from-[#6C63D6] to-[#8E87E8] text-white">
    {creator.name.charAt(0)}
  </AvatarFallback>
</Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold tracking-tight text-[#2F2A78] dark:text-foreground">{creator.name}</h3>

              <p className="mt-1 flex items-center text-base text-slate-500 dark:text-gray-600">
                <ExternalLink className="h-3 w-3 mr-1" />
                {displayHandle}
              </p>
              <div className="mt-2 flex items-center text-base text-slate-500 dark:text-gray-500">
                <Users className="h-4 w-4 mr-1" />
                {creator.followerCount} {platform === 'youtube' ? 'subscribers' : 'followers'}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center text-base text-slate-500 dark:text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              {creator.location}
            </div>

            <Badge
              variant="secondary"
              className="border-0 bg-[#F2EFFF] text-[#534AB7] hover:bg-[#ECE7FF] dark:bg-purple-50 dark:text-purple-700 dark:hover:bg-purple-100"
            >
              {creator.niche}
            </Badge>
            <Badge
              variant="secondary"
              className="border-0 bg-[#EAF6FF] text-[#1E6A93] hover:bg-[#DDF0FC] dark:bg-slate-800 dark:text-slate-200"
            >
              {platform === 'youtube' ? 'YouTube' : 'Instagram'}
            </Badge>

            {/* Bio */}
            {creator.bio && (
              <p className="line-clamp-3 text-base text-slate-500 dark:text-gray-600">{creator.bio}</p>
            )}

            {/* About You (new) */}
            {creator.about && (
              <p className="line-clamp-3 text-base italic text-slate-500 dark:text-gray-600">
                About: {creator.about}
              </p>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
