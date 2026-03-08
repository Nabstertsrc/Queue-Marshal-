import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import { LocationTrackingProvider } from './contexts/LocationTrackingContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import WelcomePage from './pages/WelcomePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import PaymentPage from './pages/PaymentPage';
import MessagesPage from './pages/MessagesPage';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import PushNotificationManager from './components/PushNotificationManager';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <LocationTrackingProvider>
            <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Main />
            </HashRouter>
          </LocationTrackingProvider>
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

const Main: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/reset-password' || location.pathname === '/welcome';

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isAuthPage ? 'bg-transparent' : 'bg-dark-900 bg-app-gradient'}`}>
      {isAuthenticated && <Header />}
      {isAuthenticated && <PushNotificationManager />}
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
        <Route path="/reset-password" element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/" />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="/messages" element={isAuthenticated ? <MessagesPage /> : <Navigate to="/login" />} />
        <Route path="/chat/:taskId" element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />} />
        <Route path="/payment" element={isAuthenticated ? <PaymentPage /> : <Navigate to="/login" />} />
        <Route path="/admin" element={isAuthenticated && user?.isAdmin ? <AdminPage /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
