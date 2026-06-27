import React, { useState } from 'react';
import { X, Phone, Lock, User, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  onLoginSuccess: (name: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation/Errors/Loading states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setError('');
    setSuccessMsg('');
    setPhone('');
    setPassword('');
    setFullName('');
    setConfirmPassword('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!phone || !password) {
      setError('Harap isi semua kolom.');
      return;
    }

    if (phone.length < 10) {
      setError('Nomor telepon tidak valid.');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(phone === '08123456789' ? 'Admin Sahaja' : 'Pasien Sahaja');
      onClose();
    }, 1000);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName || !phone || !password || !confirmPassword) {
      setError('Harap isi semua kolom.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Registrasi berhasil! Silakan masuk.');
      setActiveTab('login');
      setPassword('');
      setConfirmPassword('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-dark-neutral/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-background border border-accent/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Tabs */}
        <div className="flex border-b border-accent/20 bg-accent/10">
          <button
            type="button"
            id="tab-login"
            className={`flex-1 py-4 text-center font-semibold text-sm transition-all duration-300 ${
              activeTab === 'login'
                ? 'text-primary bg-background border-b-2 border-primary'
                : 'text-dark-neutral/60 hover:text-dark-neutral hover:bg-accent/5'
            }`}
            onClick={() => handleTabChange('login')}
          >
            Masuk
          </button>
          <button
            type="button"
            id="tab-register"
            className={`flex-1 py-4 text-center font-semibold text-sm transition-all duration-300 ${
              activeTab === 'register'
                ? 'text-primary bg-background border-b-2 border-primary'
                : 'text-dark-neutral/60 hover:text-dark-neutral hover:bg-accent/5'
            }`}
            onClick={() => handleTabChange('register')}
          >
            Daftar Baru
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-dark-neutral/50 hover:text-dark-neutral p-1.5 rounded-full hover:bg-accent/20 transition-all duration-200"
          aria-label="Tutup modal"
        >
          <X size={18} />
        </button>

        {/* Body */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-center text-primary mb-2">
            {activeTab === 'login' ? 'Selamat Datang Kembali' : 'Bergabung Bersama Kami'}
          </h2>
          <p className="text-xs text-center text-dark-neutral/60 mb-6">
            {activeTab === 'login'
              ? 'Silakan masuk untuk menikmati layanan pemesanan terapi'
              : 'Daftarkan diri Anda untuk konsultasi & terapi praktis di rumah'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-secondary/10 border border-secondary text-primary font-semibold text-xs rounded-lg">
              {successMsg}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-neutral/80 mb-1.5" htmlFor="login-phone">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-neutral/40">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    id="login-phone"
                    placeholder="Contoh: 08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-white border border-accent/40 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 text-dark-neutral"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-neutral/80 mb-1.5" htmlFor="login-password">
                  Kata Sandi
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-neutral/40">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    placeholder="Masukkan kata sandi Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-accent/40 rounded-xl py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 text-dark-neutral"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-neutral/40 hover:text-dark-neutral"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center text-dark-neutral/60">
                  <input type="checkbox" className="mr-1.5 rounded border-accent/40 text-primary focus:ring-primary/30" />
                  Ingat Saya
                </label>
                <a href="#" className="text-primary font-semibold hover:underline">Lupa Sandi?</a>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-background font-semibold py-3 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-75 flex justify-center items-center gap-2 mt-6 text-sm"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                ) : 'Masuk Akun'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-neutral/80 mb-1.5" htmlFor="reg-name">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-neutral/40">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    id="reg-name"
                    placeholder="Masukkan nama lengkap Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-accent/40 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 text-dark-neutral"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-neutral/80 mb-1.5" htmlFor="reg-phone">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-neutral/40">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    id="reg-phone"
                    placeholder="Masukkan nomor telepon aktif"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-white border border-accent/40 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 text-dark-neutral"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-neutral/80 mb-1.5" htmlFor="reg-password">
                  Kata Sandi
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-neutral/40">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="reg-password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-accent/40 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 text-dark-neutral"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-neutral/80 mb-1.5" htmlFor="reg-confirm">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-neutral/40">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="reg-confirm"
                    placeholder="Ulangi kata sandi Anda"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-accent/40 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 text-dark-neutral"
                  />
                </div>
              </div>

              <div className="flex items-center text-[10px] text-dark-neutral/60 pt-1 leading-normal">
                <input type="checkbox" required className="mr-1.5 rounded border-accent/40 text-primary focus:ring-primary/30" />
                <span>Saya menyetujui syarat & ketentuan serta kebijakan privasi Totok Punggung Sahaja.</span>
              </div>

              <button
                type="submit"
                id="btn-submit-register"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-background font-semibold py-3 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-75 flex justify-center items-center gap-2 mt-6 text-sm"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                ) : 'Daftar Sekarang'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
