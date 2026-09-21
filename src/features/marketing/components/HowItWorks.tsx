import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import styles from './HowItWorks.module.css'

const STEPS = [
  {
    number: '01',
    title: 'Choose your template.',
    description: 'Pick a design that speaks to you. Classic, creative, or somewhere in between.',
  },
  {
    number: '02',
    title: 'Add your experience.',
    description:
      'Add your experience with a little guidance. Refine every detail in the live editor.',
  },
  {
    number: '03',
    title: 'Download. Apply. Repeat.',
    description: 'Download your finished PDF and send it out into the world. You’ve got this.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section} aria-labelledby="steps-heading">
      <div className={styles.header}>
        <p className={styles.eyebrow}>FROM START TO SEND</p>
        <h2 id="steps-heading">
          Three steps. <em>You’re ready.</em>
        </h2>
        <p>A straightforward process for a resume that does you justice.</p>
      </div>
      <ol className={styles.steps}>
        {STEPS.map(({ number, title, description }) => (
          <li key={number}>
            <span className={styles.number}>
              {number}
              <span aria-hidden="true" />
            </span>
            <h3>{title}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ol>
      <Link to="/templates?create=true" className={styles.startLink}>
        Create your resume <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </section>
  )
}
