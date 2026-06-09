/*'use client';

import { CreatorFilters, NICHES, FOLLOWER_RANGES } from '@/types/creator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface CreatorFiltersProps {
  filters: CreatorFilters;
  onFiltersChange: (filters: CreatorFilters) => void;
}

export function CreatorFiltersComponent({ filters, onFiltersChange }: CreatorFiltersProps) {
  const updateFilter = (key: keyof CreatorFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filter Creators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
       
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search by name or handle..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

       
        <div className="space-y-2">
          <Label>Niche</Label>
          <Select value={filters.niche || "all"} onValueChange={(value) => updateFilter('niche', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All niches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All niches</SelectItem>
              {NICHES.map((niche) => (
                <SelectItem key={niche} value={niche}>
                  {niche}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

       
        <div className="space-y-2">
          <Label>Follower Count</Label>
          <Select value={filters.followerRange || "all"} onValueChange={(value) => updateFilter('followerRange', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All ranges" />
            </SelectTrigger>
            <SelectContent>
  <SelectItem value="all">All ranges</SelectItem>
  {FOLLOWER_RANGES.map((range) => (
    <SelectItem key={range.label} value={range.label}>
      {range.label}
    </SelectItem>
  ))}
</SelectContent>

          </Select>
        </div>

   
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Enter city or country..."
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}*/
'use client';

import { useState } from 'react';
import { CreatorFilters, FOLLOWER_RANGES, NICHES } from '@/types/creator';

interface Props {
  filters: CreatorFilters;
  onFiltersChange: (filters: CreatorFilters) => void;
}

export function CreatorFiltersComponent({ filters, onFiltersChange }: Props) {
  const [customNiche, setCustomNiche] = useState('');

  const handleChange = (field: keyof CreatorFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4 rounded-[24px] border border-[#D8D1F4] bg-white p-6 shadow-[0_10px_30px_rgba(83,74,183,0.08)] dark:border-border dark:bg-card dark:shadow-sm">
      {/* Search */}
      <div>
        <label className="mb-2 block text-lg font-semibold text-[#2F2A78] dark:text-foreground">Search</label>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => handleChange('searchQuery', e.target.value)}
          placeholder="Search by name or handle..."
          className="w-full rounded-2xl border border-[#D6D0F7] bg-[#FCFBFF] px-4 py-3 text-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8E87E8] dark:border-input dark:bg-background dark:px-3 dark:py-2 dark:text-foreground"
        />
      </div>

      <div>
        <label className="mb-2 block text-lg font-semibold text-[#2F2A78] dark:text-foreground">Platform</label>
        <select
          value={filters.platform}
          onChange={(e) => handleChange('platform', e.target.value)}
          className="w-full rounded-2xl border border-[#D6D0F7] bg-[#FCFBFF] px-4 py-3 text-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8E87E8] dark:border-input dark:bg-background dark:px-3 dark:py-2 dark:text-foreground"
        >
          <option value="all">All platforms</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
        </select>
      </div>

      {/* Niche */}
      <div>
        <label className="mb-2 block text-lg font-semibold text-[#2F2A78] dark:text-foreground">Niche</label>
        <select
          value={NICHES.includes(filters.niche) ? filters.niche : 'Other'}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'Other') {
              handleChange('niche', customNiche); // keep whatever user typed
            } else {
              handleChange('niche', val);
              setCustomNiche('');
            }
          }}
          className="w-full rounded-2xl border border-[#D6D0F7] bg-[#FCFBFF] px-4 py-3 text-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8E87E8] dark:border-input dark:bg-background dark:px-3 dark:py-2 dark:text-foreground"
        >
          <option value="all">All</option>
          {NICHES.map((niche) => (
            <option key={niche} value={niche}>
              {niche}
            </option>
          ))}
          <option value="Other">Other (write your own)</option>
        </select>

        {/* If "Other" selected → show text input */}
        {(!NICHES.includes(filters.niche) && filters.niche !== 'all') && (
          <input
            type="text"
            value={customNiche}
            onChange={(e) => {
              setCustomNiche(e.target.value);
              handleChange('niche', e.target.value);
            }}
            placeholder="Enter custom niche..."
            className="mt-2 w-full rounded-2xl border border-[#D6D0F7] bg-[#FCFBFF] px-4 py-3 text-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8E87E8] dark:border-input dark:bg-background dark:px-3 dark:py-2 dark:text-foreground"
          />
        )}
      </div>

      {/* Followers */}
      <div>
        <label className="mb-2 block text-lg font-semibold text-[#2F2A78] dark:text-foreground">Follower Count</label>
        <select
          value={filters.followerRange}
          onChange={(e) => handleChange('followerRange', e.target.value)}
          className="w-full rounded-2xl border border-[#D6D0F7] bg-[#FCFBFF] px-4 py-3 text-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8E87E8] dark:border-input dark:bg-background dark:px-3 dark:py-2 dark:text-foreground"
        >
          <option value="all">All ranges</option>
          {FOLLOWER_RANGES.map((range) => (
            <option key={range.label} value={range.label}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label className="mb-2 block text-lg font-semibold text-[#2F2A78] dark:text-foreground">Location</label>
        <input
          type="text"
          value={filters.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="Enter city or country..."
          className="w-full rounded-2xl border border-[#D6D0F7] bg-[#FCFBFF] px-4 py-3 text-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8E87E8] dark:border-input dark:bg-background dark:px-3 dark:py-2 dark:text-foreground"
        />
      </div>
    </div>
  );
}
