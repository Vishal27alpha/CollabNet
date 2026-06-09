'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { ProfileForm } from '@/components/profile/ProfileForm';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F0EEF8] px-4 py-10 dark:bg-background">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-[#2F2A78] dark:text-gray-100">
  Your Profile
</h1>
<p className="mt-2 text-xl text-slate-500 dark:text-gray-300">
  Complete your profile to connect with other creators
</p>
          </div>
          <ProfileForm />
        </div>
      </div>
    </AuthGuard>
  );
}
