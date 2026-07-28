import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '@/shared/services/logger'
import styles from './SectionErrorBoundary.module.css'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('SectionErrorBoundary caught error', error, {
      componentStack: info.componentStack ?? undefined,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={styles.fallback}
          role="alert"
        >
          <p className={styles.message}>Section failed to render</p>
        </div>
      )
    }
    return this.props.children
  }
}
