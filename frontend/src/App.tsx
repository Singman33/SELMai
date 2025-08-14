import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Marketplace from './pages/Marketplace';

// Import des autres pages (à créer)
const MyServices = React.lazy(() => import('./pages/MyServices'));
const Negotiations = React.lazy(() => import('./pages/Negotiations'));
const Wallet = React.lazy(() => import('./pages/Wallet'));
const Community = React.lazy(() => import('./pages/Community'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Admin = React.lazy(() => import('./pages/Admin'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Navigate to="/marketplace" replace />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/marketplace" element={
            <ProtectedRoute>
              <Layout>
                <Marketplace />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/my-services" element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div>Chargement...</div>}>
                  <MyServices />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/negotiations" element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div>Chargement...</div>}>
                  <Negotiations />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/wallet" element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div>Chargement...</div>}>
                  <Wallet />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/community" element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div>Chargement...</div>}>
                  <Community />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Layout>
                <React.Suspense fallback={<div>Chargement...</div>}>
                  <Notifications />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/*" element={
            <ProtectedRoute adminOnly>
              <Layout>
                <React.Suspense fallback={<div>Chargement...</div>}>
                  <Admin />
                </React.Suspense>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/marketplace" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;