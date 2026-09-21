import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '@/shared/services/logger'
import styles from './RootErrorBoundary.module.css'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('RootErrorBoundary caught an error', error, {
      componentStack: info.componentStack ?? undefined,
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.root}>
          <div className={styles.card}>
            <div className={styles.textGroup}>
              <h1 className={styles.title}>Something went wrong</h1>
              <p className={styles.description}>
                The workspace couldn’t load. Your previously saved resumes remain in this browser.
                Reload to try again.
              </p>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <p className={styles.errorMessage}>{this.state.error.message}</p>
            )}
            <button
              onClick={this.handleReload}
              className={styles.reloadButton}
              aria-label="Reload the application"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
