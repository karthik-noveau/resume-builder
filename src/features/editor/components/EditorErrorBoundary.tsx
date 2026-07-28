import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '@/shared/services/logger'
import styles from './EditorErrorBoundary.module.css'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('EditorErrorBoundary caught error', error, {
      componentStack: info.componentStack ?? undefined,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.fallback}>
          <div className={styles.content}>
            <p className={styles.title}>Canvas failed to render</p>
            <p className={styles.subtitle}>Your resume data is safe.</p>
            <button
              className={styles.retryButton}
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
