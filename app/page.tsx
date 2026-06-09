'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Search, 
  MessageCircle, 
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { RoleSelectionModal } from "@/components/RoleSelectionModal";

// 🔑 Firebase
import { auth, db, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function HomePage() {
  const { user } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const rotatingHeadlines = [
    { top: "Connect with", bottom: "Creators & Brands" },
    { top: "Collaborations", bottom: "Start Here" },
    { top: "Find. Match.", bottom: "Collaborate." },
  ];
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [typedHeadline, setTypedHeadline] = useState("");
  const router = useRouter();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let index = 0;
    let deleting = false;
    let currentHeadlineIndex = 0;

    const tick = () => {
      const headlineTarget = rotatingHeadlines[currentHeadlineIndex].bottom;

      if (!deleting) {
        index += 1;
        setTypedHeadline(headlineTarget.slice(0, index));

        if (index === headlineTarget.length) {
          deleting = true;
          timeoutId = setTimeout(tick, 1400);
          return;
        }

        timeoutId = setTimeout(tick, 85);
        return;
      }

      index -= 1;
      setTypedHeadline(headlineTarget.slice(0, index));

      if (index === 0) {
        deleting = false;
        currentHeadlineIndex = (currentHeadlineIndex + 1) % rotatingHeadlines.length;
        setHeadlineIndex(currentHeadlineIndex);
        timeoutId = setTimeout(tick, 350);
        return;
      }

      timeoutId = setTimeout(tick, 45);
    };

    timeoutId = setTimeout(tick, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  // ✅ Handle role selection + login
  const handleRoleSelect = async (role: "creator" | "brand") => {
    try {
      // Sign in with Google
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Save role in Firestore
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role,
        },
        { merge: true }
      );

      // Redirect based on role
      if (role === "creator") {
        router.push("/profile");
      } else {
        router.push("/brand/profile");
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
    } finally {
      setShowRoleModal(false);
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-500">
  {/* Hero Section */}
  <section 
    className="relative py-20 bg-gradient-to-br 
      from-purple-50 via-blue-50 to-green-50 
      dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 
      transition-colors duration-500"
  >
    {/* Background Image */}
    <div 
      className="absolute inset-0 bg-center bg-cover opacity-20 dark:opacity-20 pointer-events-none"
      style={{ backgroundImage: "url('/insta_pic.png')" }}
    ></div>

    {/* Content */}
    <div className="relative container mx-auto px-4 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-6 text-5xl font-bold text-gray-900 transition-colors duration-500 dark:text-gray-100 md:text-6xl">
          <span className="block">{rotatingHeadlines[headlineIndex].top}</span>
          <span className="block min-h-[1.2em] text-white">
            <span className="inline-block min-w-[12ch]">
              {typedHeadline}
              <span className="ml-1 inline-block animate-pulse text-purple-300">|</span>
            </span>
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed transition-colors duration-500">
          Find and collaborate with like-minded content creators for sponsorships, 
          partnerships, and creative projects. Build your network and grow together.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <>
              <Link href="/directory">
                <Button size="lg" className="h-14 px-8 text-lg">
                  <Search className="mr-2 h-5 w-5" />
                  Browse Creators
                </Button>
              </Link>

              {/* ✅ Only show "My Profile" if user is a creator */}
              {user.role === 'creator' && (
                <Link href="/profile">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                    <Users className="mr-2 h-5 w-5" />
                    My Profile
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg"
              onClick={() => setShowRoleModal(true)} // ✅ open modal
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
    {/* Wave Divider */}
{/* Wave Divider */}
<div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-[0]">
  <svg
    className="relative block w-full h-20"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1440 320"
    preserveAspectRatio="none"
  >
    <path
      fill="rgb(15, 19, 29)"
      d="M0,192L48,170.7C96,149,192,107,288,117.3C384,128,480,192,576,197.3C672,203,768,149,864,117.3C960,85,1056,75,1152,85.3C1248,96,1344,128,1392,144L1440,160L1440,320L0,320Z"
    ></path>
  </svg>
</div>


  </section>

      {/* Features Section */}
{/* Features Section */}
<section 
  className="relative py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
>
  {/* Background Image */}
  <div 
    className="absolute inset-0 bg-center bg-cover opacity-20 dark:opacity-20"
    style={{ backgroundImage: "url('/feature-bgm.png')", transform: "scale(1.0)" }}
  ></div>

  {/* Overlay to improve readability */}
  <div className="absolute inset-0 bg-white/40 dark:bg-black/40"></div>

  <div className="relative container mx-auto px-4">
    <div className="text-center mb-16">
      <h2 className="text-3xl font-bold text-foreground">
        How CollabNet Works
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Simple steps to discover, connect, and collaborate with creators in your niche
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Card 1 */}
      <Card className="text-center p-8 transition-transform transform hover:scale-105 hover:-translate-y-2 hover:shadow-2xl duration-300 relative">
        <CardContent className="space-y-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
            <Users className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Your Profile
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Set up your creator profile with your Instagram handle, niche, 
            follower count, and collaboration interests.
          </p>
        </CardContent>
      </Card>

      {/* Card 2 */}
      <Card className="text-center p-8 transition-transform transform hover:scale-105 hover:-translate-y-2 hover:shadow-2xl duration-300 relative">
        <CardContent className="space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Search className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Discover Creators
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and filter creators by niche, follower count, location, 
            and find perfect collaboration matches.
          </p>
        </CardContent>
      </Card>

      {/* Card 3 */}
      <Card className="text-center p-8 transition-transform transform hover:scale-105 hover:-translate-y-2 hover:shadow-2xl duration-300 relative">
        <CardContent className="space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <MessageCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Connect & Collaborate
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Reach out directly via email to discuss partnerships, 
            sponsorships, and creative collaborations.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</section>


      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Ready to start Collaborating?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of creators already using CollabNet to find 
              their next collaboration partner.
            </p>

            {!user && (
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg"
                onClick={() => setShowRoleModal(true)} // ✅ open modal here too
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ✅ Role Selection Modal */}
      <RoleSelectionModal
        open={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSelect={handleRoleSelect}
      />
    </div>
  );
}
