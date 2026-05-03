import React from 'react';

/**
 * Top-level error boundary for the route tree. Prevents a single render error
 * from showing a white screen. Logs a sanitized message only — never the raw
 * error object (may contain API response bodies with PII).
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log only the error name + message + short stack. No raw payload.
    const name = (error && error.name) || 'Error';
    const message = (error && error.message) || 'Unknown error';
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary] ${name}: ${message}`, info?.componentStack?.split('\n')[1] || '');
  }

  handleReload = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#222' }}>Something went wrong.</h2>
        <p style={{ marginTop: '8px', color: '#666', maxWidth: '360px' }}>
          We hit an unexpected error while rendering this page. Please reload to continue.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            marginTop: '16px',
            padding: '10px 24px',
            background: '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
