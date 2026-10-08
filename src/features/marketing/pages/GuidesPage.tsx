import { Link, useParams } from 'react-router'
import { ArrowUpRight, Check } from 'lucide-react'
import { Seo } from '@/shared/components/Seo/Seo'
import { BRAND, PUBLIC_PAGES, siteUrl } from '@/shared/config/site'
import { breadcrumbSchema, pageSchema, schemaGraph } from '@/shared/config/structuredData'
import { NotFound } from '@/shared/pages/NotFound'
import { RESUME_GUIDES } from '../content/guides'
import { SiteFooter } from '../components/SiteFooter'
import { PillCta } from '../components/PillCta'
import homeStyles from './HomePage.module.css'
import styles from './GuidesPage.module.css'

export function GuidesPage() {
  const { slug } = useParams()
  const guide = RESUME_GUIDES.find((item) => item.slug === slug)
  if (slug && !guide) return <NotFound />
  const path = guide ? `/guides/${guide.slug}` : PUBLIC_PAGES.guides.path
  const title = guide?.title ?? PUBLIC_PAGES.guides.title
  const description = guide?.description ?? PUBLIC_PAGES.guides.description
  const breadcrumbs = [{ name: 'Home', path: '/' }, { name: 'Resume guides', path: '/guides' }]
  if (guide) breadcrumbs.push({ name: guide.title, path })
  const structuredData = schemaGraph(
    pageSchema(path, title, description, guide ? 'WebPage' : 'CollectionPage'),
    breadcrumbSchema(breadcrumbs),
    ...(guide ? [{
      '@type': 'Article', '@id': `${siteUrl(path)}#article`, headline: guide.title,
      description: guide.description, inLanguage: 'en',
      mainEntityOfPage: { '@id': `${siteUrl(path)}#webpage` },
      image: siteUrl(BRAND.socialImage),
      author: { '@type': 'Organization', name: BRAND.name, url: siteUrl() },
    }] : [{
      '@type': 'ItemList', itemListElement: RESUME_GUIDES.map((item, index) => ({
        '@type': 'ListItem', position: index + 1, name: item.title, url: siteUrl(`/guides/${item.slug}`),
      })),
    }]),
  )
  return (
    <div id="top" className={homeStyles.home}>
      <Seo title={title} description={description} path={path}
        type={guide ? 'article' : 'website'} structuredData={structuredData} />
      <main className={styles.main}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <ol>{breadcrumbs.map((item, index) => <li key={item.path}>
            {index === breadcrumbs.length - 1 ? <span aria-current="page">{item.name}</span>
              : <Link to={item.path}>{item.name}</Link>}
          </li>)}</ol>
        </nav>
        <header className={styles.header}>
          <p className={styles.eyebrow}>{guide?.label ?? 'A LITTLE GUIDANCE. A STRONGER RESUME.'}</p>
          <h1>{guide?.title ?? <>Your next move,<br /><em>with a little know-how.</em></>}</h1>
          <p className={styles.intro}>{guide?.introduction ?? 'Practical advice for a resume that is clear, considered, and ready to send. Take what you need, then make it yours.'}</p>
          {guide && <p className={styles.byline}>By {BRAND.name} · Practical resume guide</p>}
        </header>
        {guide ? <div className={styles.articleLayout}>
          <nav className={styles.contents} aria-label="On this page">
            <p>IN THIS GUIDE</p>
            {guide.sections.map((section, index) => <a key={section.title} href={`#step-${index + 1}`}>{section.title}</a>)}
          </nav>
          <article className={styles.article} aria-label={guide.title}>
            {guide.sections.map((section, index) => <section id={`step-${index + 1}`} key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.checklist && <ul className={styles.checklist}>
                {section.checklist.map((item) => <li key={item}><Check size={17} aria-hidden="true" />{item}</li>)}
              </ul>}
            </section>)}
            {guide.slug === 'ats-resume' && <p className={styles.source}>Further reading: <a href="https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse">Greenhouse’s resume parsing guidance</a>.</p>}
            <Link className={styles.back} to="/guides">← All resume guides</Link>
          </article>
        </div> : <div className={styles.grid}>
          {RESUME_GUIDES.map((item, index) => <Link className={styles.card} to={`/guides/${item.slug}`} key={item.slug}>
            <span className={styles.cardNumber}>0{index + 1} / {item.label}</span>
            <h2>{item.title}</h2><p>{item.description}</p>
            <span className={styles.cardAction}>Read the guide <ArrowUpRight size={18} aria-hidden="true" /></span>
          </Link>)}
        </div>}
        <aside className={styles.cta}>
          <div><p className={styles.eyebrow}>PUT IT INTO PRACTICE</p><h2>Your story. Your next chapter.</h2><p>Choose a free template and build a resume that feels like you.</p></div>
          <PillCta to="/templates?create=true">Build my resume</PillCta>
        </aside>
        {guide && <nav className={styles.related} aria-label="Related guides">
          {RESUME_GUIDES.filter((item) => item.slug !== slug).map((item) => <Link key={item.slug} to={`/guides/${item.slug}`}>{item.title} <ArrowUpRight size={16} aria-hidden="true" /></Link>)}
        </nav>}
      </main>
      <SiteFooter />
    </div>
  )
}
