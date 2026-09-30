import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './core/Button'

interface Props {
  children: ReactNode
}

export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div
        className="mx-auto mt-[20vh] flex max-w-sm flex-col items-center gap-3 text-center"
        role="alert"
      >
        <h2 className="m-0 text-h2 font-semibold text-ink">Something went wrong</h2>
        <p className="m-0 text-body text-ink-faint">
          Reload the page to continue. Your files were not modified.
        </p>
        <Button onClick={() => location.reload()}>Reload</Button>
      </div>
    )
  }
}
