import Image from "next/image";
import LandingPage from "@/app/Landing/page";
import { Navbar } from '@/components/sections/Navbar';
import { Hero } from '@/components/sections/Hero';
import { TrustedBy } from '@/components/sections/TrustedBy';
import { Problem } from '@/components/sections/Problem';
import { Process } from '@/components/sections/Process';
import { Features } from '@/components/sections/Features';
import { Pricing } from '@/components/sections/Pricing';
import { CTA } from '@/components/sections/CTA';
import { Footer } from '@/components/sections/Footer';


export default function Home() {
  return (
    <LandingPage />
  );
}
