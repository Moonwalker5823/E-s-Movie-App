import { Component, type ReactNode } from "react";

/** Catches render/runtime errors so a single bad component can't white-screen the
 *  whole app — the only other recovery on a TV is relaunching it. The NavBar stays
 *  mounted (this wraps just the routed page), so you can still move away. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("App error boundary caught:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg p-8">
          <div className="card p-6 text-center">
            <div className="u-display text-3xl text-cream">Something glitched</div>
            <p className="mt-2 text-cream/75">This screen hit an error. Reload to get back to it.</p>
            <button
              onClick={() => window.location.reload()}
              data-focusable
              data-autofocus
              className="btn-spray mt-4"
            >
              ↻ Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
