import { default as Button } from "antd/es/button";
import React from "react";

export default class ErrorBoundary extends React.Component<any, { errorMessage?: string }> {
  constructor(props: any) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { errorMessage: error.toString() };
  }

  componentDidCatch(error: any, errorInfo: any) {}

  render() {
    if (this.state.errorMessage) {
      return (
        <>
          <p>{this.state.errorMessage}</p>
          <Button type="primary" onClick={() => this.setState({ errorMessage: "" })}>
            Retry
          </Button>
        </>
      );
    }
    return this.props.children;
  }
}
