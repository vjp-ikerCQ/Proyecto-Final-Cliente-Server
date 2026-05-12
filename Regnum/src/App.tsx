import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/Login/LoginPage';
import MainMenu from './pages/Menu/MainMenu';
import SplashPage from './pages/Splash/SplashPage';

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

function App() {
  const [user, setUser] = useState<{ name: string; isGuest: boolean } | null>(null);

  return (
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
              user ? <MainMenu user={user} /> : <Navigate to="/" />
            } 
          />

          {/* Gallery Route */}
          <Route 
            path="/gallery" 
            element={
              user ? <CardGallery /> : <Navigate to="/" />
            } 
          />

          {/* Default Redirect to Splash */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
