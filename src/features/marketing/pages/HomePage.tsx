import { PageLayout } from '@/shared/components/layout/PageLayout'
import { HeroSection } from '../components/HeroSection'
import { TemplateShowcase } from '../components/TemplateShowcase'
import { FeatureGrid } from '../components/FeatureGrid'
import { PrivacyBanner } from '../components/PrivacyBanner'
import { HowItWorks } from '../components/HowItWorks'
import { FinalCta } from '../components/FinalCta'
import { SiteFooter } from '../components/SiteFooter'

export function HomePage() {
  return (
    <PageLayout>
      <HeroSection />
      <TemplateShowcase />
      <FeatureGrid />
      <PrivacyBanner />
      <HowItWorks />
      <FinalCta />
      <SiteFooter />
    </PageLayout>
  )
}

export default HomePage
