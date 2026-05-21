import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/Login/LoginPage';
import MainMenu from './pages/Menu/MainMenu';
import SplashPage from './pages/Splash/SplashPage';
import AdminPanel from './pages/Admin/AdminPanel';
import { SettingsProvider } from './contexts/SettingsContext';
import SupportButton from './components/SupportButton';

import { testMongoConnection } from './services/mongotest';

function InitialRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    testMongoConnection();
    // If the user refreshes on any page other than Splash, send them to Splash
    if (location.pathname !== '/') {
      navigate('/');
    }
  }, []); // Only run once on mount

  return null;
}

import CardGallery from './pages/Menu/CardGallery';
import Game from './pages/Game/Game';

function App() {
  const [user, setUser] = useState<{ name: string; isGuest: boolean } | null>(null);

  return (
    <SettingsProvider>
      <Router>
        <InitialRedirect />
        <div className="app bg-black min-h-screen">
          <Routes>
            {/* Splash Route - Entry Point */}
            <Route path="/" element={<SplashPage />} />

            {/* Login Route */}
            <Route 
              path="/login" 
              element={
                user ? <Navigate to="/menu" /> : <LoginPage onLogin={(name, isGuest) => setUser({ name, isGuest })} />
              } 
            />

            {/* Menu Route */}
            <Route 
              path="/menu" 
              element={
                user?.name === 'admin' ? <AdminPanel /> : (user ? <MainMenu user={user} /> : <Navigate to="/" />)
              } 
            />

            {/* Admin Route */}
            <Route 
              path="/admin" 
              element={
                user?.name === 'admin' ? <AdminPanel /> : <Navigate to="/" />
              } 
            />

            {/* Gallery Route */}
            <Route 
              path="/gallery" 
              element={
                user ? <CardGallery /> : <Navigate to="/" />
              } 
            />

            {/* Game Route */}
            <Route
              path="/game"
              element={
                user ? <Game user={user} /> : <Navigate to="/" />
              }
            />

            {/* Default Redirect to Splash */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          {user?.name !== 'admin' && <SupportButton user={user} />}
        </div>
      </Router>
    </SettingsProvider>
  );
}

export default App;
