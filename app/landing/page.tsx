import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { EventFormPreview } from '@/components/landing/EventFormPreview'
import { Pricing } from '@/components/landing/Pricing'
import { Testimonials } from '@/components/landing/Testimonials'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { FAQ } from '@/components/landing/FAQ'
import { CTA } from '@/components/landing/CTA'
import { Footer } from '@/components/landing/Footer'
import { ScrollToTop } from '@/components/landing/ScrollToTop'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <EventFormPreview />
        <Pricing />
        <Testimonials />
        <HowItWorks />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  )
}
