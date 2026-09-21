import { Check, Plus, ShieldCheck } from 'lucide-react'
import styles from './PrivacyBanner.module.css'

const QUESTIONS = [
  {
    question: 'Is it really free?',
    answer:
      'Yes. Every template, every customization, and every PDF download is free. There are no watermarks, subscriptions, or payment details to enter.',
  },
  {
    question: 'Where is my resume saved?',
    answer:
      'Your resume is saved in this browser on this device. It isn’t uploaded to a server. Download a PDF for applications, or an editable backup from Settings to move to another device. Clearing site data removes local resumes, so keep a backup of your work.',
  },
  {
    question: 'Can I change templates later?',
    answer:
      'Absolutely. Switch your template in the editor whenever you like. Your experience, education, and other content carry over, so you can explore a new look without starting again.',
  },
  {
    question: 'Will my resume work with hiring systems?',
    answer:
      'The PDF export preserves selectable text. For the broadest compatibility, start with a simple, single-column layout and standard section headings. Parsing can vary between hiring systems, so always check the preview when you upload.',
  },
]

export function PrivacyBanner() {
  return (
    <section id="questions" className={styles.section} aria-labelledby="privacy-heading">
      <div className={styles.privacy}>
        <span className={styles.icon}>
          <ShieldCheck size={25} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className={styles.eyebrow}>BUILT AROUND YOUR PRIVACY</p>
        <h2 id="privacy-heading">
          Your resume.
          <br />
          <em>Your business.</em>
        </h2>
        <p className={styles.description}>
          Your career story belongs to you. Everything you create stays in your browser, on your
          device. That’s how we think it should be.
        </p>
        <ul className={styles.checks}>
          <li>
            <Check size={13} aria-hidden="true" /> No account needed
          </li>
          <li>
            <Check size={13} aria-hidden="true" /> No resume uploads
          </li>
        </ul>
      </div>
      <div className={styles.faq}>
        <p className={styles.eyebrow}>GOOD QUESTIONS. STRAIGHT ANSWERS.</p>
        {QUESTIONS.map(({ question, answer }) => (
          <details key={question}>
            <summary>
              {question}
              <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
