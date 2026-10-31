import { Component, type ReactNode } from 'react';
import { ErrorState } from '@/components/ui/States';

/** Catches render errors so travellers see a friendly message, never a stack trace. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) { return { error }; }
  componentDidCatch(error: unknown) {
    // Hook for the monitoring/logging service.
    if (import.meta.env.DEV) console.error(error);
  }
  render() {
    if (this.state.error) {
      return <div className="page"><ErrorState error={this.state.error} onRetry={() => this.setState({ error: null })} /></div>;
    }
    return this.props.children;
  }
}
