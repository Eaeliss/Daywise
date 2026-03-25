import React, { Component, ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Sentry } from '@/lib/sentry'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  // P-02: resetKey forces a full child subtree remount on retry, preventing
  // the re-crash loop where setState({ hasError: false }) resumes the same
  // faulted component instance rather than mounting a fresh one.
  resetKey: number
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: 0 }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  // P-12: report to Sentry on catch
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
  }

  handleRetry = () => {
    this.setState((prev) => ({ hasError: false, error: undefined, resetKey: prev.resetKey + 1 }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center p-4">
          {/* P-11: show generic message — raw error.message may expose internals */}
          <Text className="text-lg font-semibold text-red-600">Something went wrong</Text>
          <Text className="mt-2 text-sm text-gray-500">Please try restarting the app.</Text>
          <Pressable
            className="mt-4 rounded-md bg-blue-500 px-4 py-2"
            onPress={this.handleRetry}
          >
            <Text className="text-white font-medium">Try Again</Text>
          </Pressable>
        </View>
      )
    }
    // key={resetKey} forces React to unmount and remount the full child tree on retry
    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>
  }
}
