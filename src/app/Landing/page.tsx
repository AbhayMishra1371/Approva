
"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/appwrite/client';
import { Navbar } from '@/components/sections/Navbar';
import { Hero } from '@/components/sections/Hero';
import { TrustedBy } from '@/components/sections/TrustedBy';
import { Problem } from '@/components/sections/Problem';
import { Process } from '@/components/sections/Process';
import { Features } from '@/components/sections/Features';
import { Pricing } from '@/components/sections/Pricing';
import { CTA } from '@/components/sections/CTA';
import ModernLanding from '@/components/sections/ModernLanding';

export default function LandingPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { account } = createBrowserClient();
        const user = await account.get();
        if (user) {
          router.push("/dashboard");
        } else {
          setIsChecking(false);
        }
      } catch (err) {
        setIsChecking(false);
      }
    };
    checkSession();
  }, [router]);

  if (isChecking) {
    return <div className="min-h-screen bg-[#0b0c10]" />;
  }

  return <ModernLanding />;
}
