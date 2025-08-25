import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import OperatorDashboard from "@/pages/OperatorDashboard";
import PublicInterface from "@/pages/PublicInterface";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { OfflineIndicator } from "@/components/offline-indicator";
import { OfflineQueueStatus } from "@/components/OfflineQueueStatus";
import { useOnlineStatusWithCallback, useOfflineSubmissionSync } from "@/hooks/use-online-status";
import { Component, ReactNode, useEffect } from "react";

class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Emergency System Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-red-200">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-red-800 mb-4">Emergency System Error</h1>
              <p className="text-red-600 mb-6">The system encountered an error. Please refresh the page to continue.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Refresh System
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  const { isAuthenticated, isLoading, isOperator } = useAuth();
  const { isOnline } = useOnlineStatusWithCallback(() => {
    queryClient.invalidateQueries();
  });
  
  // Enable offline submission syncing
  useOfflineSubmissionSync();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'critical-alert') {
          console.log('Critical alert received from service worker:', event.data);
        }
        if (event.data?.type === 'navigate') {
            window.location.pathname = event.data.url;
        }
      };
      
      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <OfflineQueueStatus />
      <Switch>
        <Route path="/" component={PublicInterface} />
        <Route path="/operator">
          {isAuthenticated && isOperator ? (
            <OperatorDashboard />
          ) : (
            <Login />
          )}
        </Route>
        <Route path="/login" component={Login} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
          </ErrorBoundary>
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
