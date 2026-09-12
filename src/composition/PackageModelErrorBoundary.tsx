import { Component, type ErrorInfo, type ReactNode } from 'react'

export class PackageModelErrorBoundary extends Component<{
  children: ReactNode
  onError?: (error: Error) => void
}, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void info
    this.props.onError?.(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
