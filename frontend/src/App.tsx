import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FloatingWA } from './components/FloatingWA';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPasien } from './pages/DashboardPasien';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => {
    return localStorage.getItem('sahaja_user') || null;
  });
  const [loggedInAdmin, setLoggedInAdmin] = useState<string | null>(() => {
    return localStorage.getItem('sahaja_admin') || null;
  });
  
  // Custom cursor position state
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);


  const handleLogin = (name: string) => {
    setLoggedInUser(name);
    localStorage.setItem('sahaja_user', name);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('sahaja_user');
  };

  const handleAdminLogin = (name: string) => {
    setLoggedInAdmin(name);
    localStorage.setItem('sahaja_admin', name);
  };

  const handleAdminLogout = () => {
    setLoggedInAdmin(null);
    localStorage.removeItem('sahaja_admin');
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen relative overflow-hidden bg-background">
        
        {/* Custom cursor (Hidden on mobile/touch screens via hidden md:block) */}
        <motion.div
          className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-primary/45 pointer-events-none z-50 hidden md:block mix-blend-difference"
          animate={{
            x: mousePosition.x - 16,
            y: mousePosition.y - 16,
          }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 300,
            mass: 0.5
          }}
        />

        {/* Navbar */}
        <Navbar 
          loggedInUser={loggedInUser} 
          onLogout={handleLogout} 
        />

        {/* Main Content Areas */}
        <main className="flex-grow pt-20">
          <Routes>
            <Route 
              path="/" 
              element={
                <LandingPage />
              } 
            />
            <Route 
              path="/login" 
              element={<LoginPage onLogin={handleLogin} loggedInUser={loggedInUser} />} 
            />
            <Route 
              path="/register" 
              element={<RegisterPage onRegister={handleLogin} loggedInUser={loggedInUser} />} 
            />
            <Route 
              path="/dashboard-pasien" 
              element={<DashboardPasien loggedInUser={loggedInUser} onLogout={handleLogout} />} 
            />
            <Route 
              path="/admin-login" 
              element={<AdminLoginPage onLogin={handleAdminLogin} loggedInAdmin={loggedInAdmin} />} 
            />
            <Route 
              path="/admin-dashboard" 
              element={<AdminDashboard loggedInAdmin={loggedInAdmin} onLogout={handleAdminLogout} />} 
            />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />

        {/* Floating WhatsApp Button */}
        <FloatingWA phoneNumber="6281298959362" />
      </div>
    </Router>
  );
}

export default App;
