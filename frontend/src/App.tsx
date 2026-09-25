import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.js';
import { AppLayout } from './layouts/AppLayout.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { GeneratorPage } from './pages/GeneratorPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { ApiKeysPage } from './pages/ApiKeysPage.js';
import { UsagePage } from './pages/UsagePage.js';
import { ProfilesPage } from './pages/ProfilesPage.js';
import { DocsPage } from './pages/DocsPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false
}) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-500 text-xs">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/generate" replace />;
  }

  return <>{children}</>;
};

const RootIndexRoute: React.FC = () => {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/generate" replace />;
  }
  return <DashboardPage />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated Application routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Root index: Admin sees DashboardPage, Normal user redirects to /generate */}
            <Route index element={<RootIndexRoute />} />
            
            {/* Core user routes: AI Content Studio */}
            <Route path="generate" element={<GeneratorPage />} />
            <Route path="history" element={<HistoryPage />} />

            {/* Admin-only routes */}
            <Route
              path="api-keys"
              element={
                <ProtectedRoute requireAdmin>
                  <ApiKeysPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="usage"
              element={
                <ProtectedRoute requireAdmin>
                  <UsagePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profiles"
              element={
                <ProtectedRoute requireAdmin>
                  <ProfilesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="docs"
              element={
                <ProtectedRoute requireAdmin>
                  <DocsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
