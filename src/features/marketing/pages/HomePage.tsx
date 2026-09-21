import { PageLayout } from '@/shared/components/layout/PageLayout'
import { Seo } from '@/shared/components/Seo/Seo'
import { HeroSection } from '../components/HeroSection'
import { TemplateShowcase } from '../components/TemplateShowcase'
import { FeatureGrid } from '../components/FeatureGrid'
import { PrivacyBanner } from '../components/PrivacyBanner'
import { HowItWorks } from '../components/HowItWorks'
import { FinalCta } from '../components/FinalCta'
import { SiteFooter } from '../components/SiteFooter'
import styles from './HomePage.module.css'

/** Rich-result markup for the landing page. Google accepts ld+json anywhere in the document. */
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Resume Studio',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  description:
    'Build, customise and export a professional resume entirely in your browser. No account, no upload — your data never leaves your device.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export function HomePage() {
  return (
    <PageLayout className={styles.home}>
      <Seo
        title="Resume Studio — Build a professional resume in your browser"
        description="Create, customise and export a polished resume in minutes. Choose from 40 templates, edit live, review ATS checks, and download a PDF. No account needed — everything stays on your device."
        path="/"
        appendSiteName={false}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <HeroSection />
      <TemplateShowcase />
      <FeatureGrid />
      <HowItWorks />
      <PrivacyBanner />
      <FinalCta />
      <SiteFooter />
    </PageLayout>
  )
}

export default HomePage
