import { PageLayout } from '@/shared/components/layout/PageLayout'
import { Seo } from '@/shared/components/Seo/Seo'
import { HeroSection } from '../components/HeroSection'
import { TemplateShowcase } from '../components/TemplateShowcase'
import { PrivacyBanner } from '../components/PrivacyBanner'
import { FinalCta } from '../components/FinalCta'
import { SiteFooter } from '../components/SiteFooter'
import { RevealSection } from '../components/RevealSection'
import styles from './HomePage.module.css'
import { PUBLIC_PAGES, publicPageSchema } from '@/shared/seo/publicPages'

export function HomePage() {
  return (
    <PageLayout className={styles.home}>
      <Seo {...PUBLIC_PAGES.home} appendSiteName={false} structuredData={publicPageSchema('home')} />
      <HeroSection />
      <RevealSection>
        <TemplateShowcase />
      </RevealSection>
      <RevealSection>
        <PrivacyBanner />
      </RevealSection>
      <RevealSection>
        <FinalCta />
      </RevealSection>
      <SiteFooter />
    </PageLayout>
  )
}

export default HomePage
