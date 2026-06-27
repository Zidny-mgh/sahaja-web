import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react';
import logoSahaja from '../assets/logo-sahaja.webp';

interface NavbarProps {
  loggedInUser: string | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ loggedInUser, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Beranda', href: '/#hero' },
    { name: 'Layanan', href: '/#layanan' },
    { name: 'Cara Kerja', href: '/#tentang' },
    { name: 'Tanya Jawab', href: '/#keunggulan' },
  ];

  const handleCTAClick = () => {
    if (loggedInUser) {
      navigate('/dashboard-pasien');
    } else {
      navigate('/register');
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <img src={logoSahaja} alt="Logo Sahaja" className="h-10 w-auto object-contain" />
            <span className="text-2xl font-bold text-[#384e31] tracking-wide">Sahaja</span>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-dark-neutral/70 hover:text-dark-neutral transition-all duration-200"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* CTA Button / User Profile */}
          <div className="hidden md:flex items-center gap-4 text-left">
            {loggedInUser ? (
              <div className="flex items-center gap-4 bg-accent/20 py-1.5 px-4 rounded-full border border-accent/40">
                <Link to="/dashboard-pasien" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <User size={14} className="text-primary" />
                  <span className="text-xs font-bold text-dark-neutral hover:text-primary truncate max-w-[100px]">{loggedInUser}</span>
                </Link>
                <Link to="/dashboard-pasien" className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1">
                  <LayoutDashboard size={14} />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => { onLogout(); navigate('/'); }}
                  id="btn-logout"
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 focus:outline-none"
                >
                  <LogOut size={14} />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-bold text-dark-neutral/70 hover:text-primary transition-colors">
                  Masuk
                </Link>
                <button
                  type="button"
                  id="btn-navbar-cta"
                  onClick={handleCTAClick}
                  className="bg-primary hover:bg-primary-dark text-background text-sm font-semibold px-6 py-2.5 rounded-full shadow-sm hover:shadow transition-all duration-300 hover:scale-[1.02] focus:outline-none"
                >
                  Pesan Sekarang
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-full text-primary hover:bg-accent/20 focus:outline-none transition-all duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-screen bg-background border-t border-accent/15' : 'max-h-0'}`}>
        <div className="px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-dark-neutral/80 hover:bg-accent/15 transition-all duration-200"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-4 border-t border-accent/20 flex flex-col gap-3 px-3 text-left">
            {loggedInUser ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 bg-accent/20 py-2 px-4 rounded-xl border border-accent/40 w-fit">
                  <User size={16} className="text-primary" />
                  <span className="text-xs font-bold text-dark-neutral truncate max-w-[120px]">{loggedInUser}</span>
                </div>
                <Link
                  to="/dashboard-pasien"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-2 py-2"
                >
                  <LayoutDashboard size={16} />
                  Dashboard Pasien
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                    navigate('/');
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-2 py-2 focus:outline-none"
                >
                  <LogOut size={16} />
                  Keluar Akun
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center font-bold border border-accent hover:border-primary text-primary py-3 rounded-full transition-all text-xs bg-white"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center font-bold bg-primary hover:bg-primary-dark text-background py-3 rounded-full shadow transition-all text-xs"
                >
                  Pesan Sekarang (Daftar)
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
