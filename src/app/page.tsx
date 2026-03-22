import { Hero } from "@/components/landing/Hero"
import { SocialProof } from "@/components/landing/SocialProof"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { PricingTable } from "@/components/landing/PricingTable"
import { Testimonials } from "@/components/landing/Testimonials"
import { FAQ } from "@/components/landing/FAQ"
import { Footer } from "@/components/landing/Footer"
import { SocialNotification } from "@/components/landing/SocialNotification"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg-primary">
      <SocialNotification />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <PricingTable />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  )
}
