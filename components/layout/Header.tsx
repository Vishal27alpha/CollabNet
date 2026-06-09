'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from "next-themes";
import { collection, getDoc, getDocs, limit, onSnapshot, orderBy, query, where, doc } from "firebase/firestore";
import { Bell, Bookmark, Moon, Sun, Users, User, LogOut, Menu, X } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useAuth } from '@/context/AuthContext';
import {
  BRAND_APPLICATIONS_EVENT,
  getBrandApplications,
} from '@/lib/brand-applications';
import { db } from '@/lib/firebase';
import { Brand, BrandApplication } from '@/lib/types';
import { getSavedBrands, SAVED_BRANDS_EVENT } from '@/lib/saved-brands';

// 🔹 Theme Toggle Button
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}

export function Header() {
  const { user, role, signOutUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [savedBrands, setSavedBrands] = useState<Brand[]>([]);
  const [brandApplications, setBrandApplications] = useState<BrandApplication[]>([]);
  const [brandDocId, setBrandDocId] = useState<string | null>(null);

  useEffect(() => {
    const syncSavedBrands = () => {
      setSavedBrands(getSavedBrands());
    };

    syncSavedBrands();
    window.addEventListener("storage", syncSavedBrands);
    window.addEventListener(SAVED_BRANDS_EVENT, syncSavedBrands);

    return () => {
      window.removeEventListener("storage", syncSavedBrands);
      window.removeEventListener(SAVED_BRANDS_EVENT, syncSavedBrands);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const resolveBrandDocId = async () => {
      if (!user || role !== "brand") {
        setBrandDocId(null);
        return;
      }

      try {
        const directDoc = await getDoc(doc(db, "brands", user.uid));
        if (!active) return;

        if (directDoc.exists()) {
          setBrandDocId(directDoc.id);
          return;
        }

        const brandQuery = query(
          collection(db, "brands"),
          where("uid", "==", user.uid),
          limit(1)
        );
        const brandSnapshot = await getDocs(brandQuery);
        if (!active) return;

        setBrandDocId(brandSnapshot.docs[0]?.id || null);
      } catch (error) {
        console.error("Error resolving brand doc id:", error);
        if (active) setBrandDocId(null);
      }
    };

    resolveBrandDocId();

    return () => {
      active = false;
    };
  }, [role, user]);

  useEffect(() => {
    if (!user || role !== "brand" || !brandDocId) {
      setBrandApplications([]);
      return;
    }

    const syncLocalApplications = () => {
      const localApplications = getBrandApplications(brandDocId);
      setBrandApplications((prev) => {
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

        setBrandApplications(
          [...localApplications, ...remoteApplications].reduce<BrandApplication[]>((acc, application) => {
            if (!acc.some((item) => item.creatorId === application.creatorId)) {
              acc.push(application);
            }
            return acc;
          }, [])
        );
      },
      (error) => {
        console.error("Error loading brand applications:", error);
      }
    );

    return () => {
      window.removeEventListener("storage", syncLocalApplications);
      window.removeEventListener(BRAND_APPLICATIONS_EVENT, syncLocalApplications);
      unsubscribe();
    };
  }, [brandDocId, role, user]);

  return (
    <header className="border-b bg-white dark:bg-gray-900 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-gray-100">
              CollabNet
            </span>
          </Link>

          {/* Center: Navigation */}
         {/* Center: Navigation */}
<nav className="hidden md:flex items-center space-x-8 -ml-24">
  <Link
    href="/directory"
    className="text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors"
  >
    Creator Directory
  </Link>

  {/* Role-aware Brand section */}
  {user && role === "brand" ? (
    <Link
      href="/brand/profile"
      className="text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors"
    >
      My Brand
    </Link>
  ) : (
    <Link
      href="/brands"
      className="text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors"
    >
      Brands Directory
    </Link>
  )}

  {/* Only for creators */}
  {user && role === "creator" && (
    <Link
      href="/profile"
      className="text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors"
    >
      My Profile
    </Link>
  )}
</nav>

          {/* Right: Theme Toggle + User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {role === "brand" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {brandApplications.length > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
                        {brandApplications.length}
                      </span>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <DropdownMenuLabel>Applications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {brandApplications.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground">
                      No creator applications yet.
                    </div>
                  ) : (
                    brandApplications.slice(0, 8).map((application) => (
                      <DropdownMenuItem key={application.id} asChild>
                        <Link href="/brand/profile#applications" className="flex flex-col items-start py-2">
                          <span className="font-medium">{application.creatorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {application.creatorNiche || "Creator"}
                            {application.campaignName ? ` • ${application.campaignName}` : ""}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/brand/profile#applications" className="font-medium text-violet-600 dark:text-violet-300">
                      Open Applications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bookmark className="h-5 w-5" />
                    {savedBrands.length > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
                        {savedBrands.length}
                      </span>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72" align="end">
                  <DropdownMenuLabel>Saved Brands</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {savedBrands.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground">
                      No saved brands yet.
                    </div>
                  ) : (
                    savedBrands.slice(0, 8).map((brand) => (
                      <DropdownMenuItem key={brand.id} asChild>
                        <Link href={`/brands/${brand.id}`} className="flex flex-col items-start py-2">
                          <span className="font-medium">{brand.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {brand.brandType || brand.industry || "Brand"}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/brands" className="font-medium text-violet-600 dark:text-violet-300">
                      Open Brands Directory
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                      <AvatarFallback>
                        {user.displayName?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {role === "creator" && (
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOutUser}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
