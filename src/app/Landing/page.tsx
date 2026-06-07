
"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth/auth';
import { Navbar } from '@/components/sections/Navbar';
import { Hero } from '@/components/sections/Hero';
import { TrustedBy } from '@/components/sections/TrustedBy';
import { Problem } from '@/components/sections/Problem';
import { Process } from '@/components/sections/Process';
import { Features } from '@/components/sections/Features';
import { Pricing } from '@/components/sections/Pricing';
import { CTA } from '@/components/sections/CTA';
import ModernLanding from '@/components/sections/ModernLanding';
import SmoothScroll from '@/components/SmoothScroll';

export default function LandingPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await getUser();
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

  return (
    <SmoothScroll>
      <ModernLanding />
    </SmoothScroll>
  );
}

