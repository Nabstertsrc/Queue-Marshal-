import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import { LocationTrackingProvider } from './contexts/LocationTrackingContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <TaskProvider>
        <LocationTrackingProvider>
          <HashRouter>
            <Main />
          </HashRouter>
        </LocationTrackingProvider>
      </TaskProvider>
    </AuthProvider>
  );
};

const Main: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <div className={`flex flex-col h-screen ${isAuthPage ? 'bg-transparent' : 'bg-secondary'}`}>
      {isAuthenticated && <Header />}
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
        <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="/chat/:taskId" element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
