import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, ArrowLeft, User, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface RegisterPageProps {
  onRegister: (name: string) => void;
  loggedInUser: string | null;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, loggedInUser }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (loggedInUser) {
      navigate('/dashboard-pasien');
    }
  }, [loggedInUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phoneNumber || !password || !confirmPassword) {
      setError('Harap isi semua kolom.');
      return;
    }

    if (phoneNumber.length < 8) {
      setError('Nomor telepon tidak valid.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi harus minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, phoneNumber, password }),
      });

      localStorage.setItem('sahaja_token', response.accessToken);
      onRegister(response.user.fullName);
      navigate('/dashboard-pasien');
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none -z-10" />

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-xs font-bold text-dark-neutral/60 hover:text-primary transition-colors py-2 px-4 rounded-full border border-accent/20 bg-white shadow-sm"
        >
          <ArrowLeft size={14} />
          Kembali ke Beranda
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-primary text-background rounded-full flex items-center justify-center shadow-md">
            <Leaf size={24} />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-primary">
          Daftar Akun Sahaja
        </h2>
        <p className="mt-2 text-center text-xs text-dark-neutral/60">
          Buat akun untuk melakukan booking online dan memantau terapi Anda.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-accent/20 sm:rounded-3xl sm:px-10 shadow-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl font-medium text-left">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs font-bold text-dark-neutral uppercase tracking-wider text-left mb-2">
                Nama Lengkap
              </label>
              <div className="mt-1 relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-neutral/40">
                  <User size={16} />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Contoh: Rahmawati"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setError('');
                  }}
                  className="block w-full pl-11 pr-4 py-3.5 border border-accent/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-dark-neutral/30 font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-dark-neutral uppercase tracking-wider text-left mb-2">
                Nomor Telepon
              </label>
              <div className="mt-1 relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-neutral/40">
                  <Phone size={16} />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  required
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setError('');
                  }}
                  className="block w-full pl-11 pr-4 py-3.5 border border-accent/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-dark-neutral/30 font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-dark-neutral uppercase tracking-wider text-left mb-2">
                Kata Sandi (Min. 6 Karakter)
              </label>
              <div className="mt-1 relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-neutral/40">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Buat kata sandi"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="block w-full pl-11 pr-12 py-3.5 border border-accent/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-dark-neutral/30 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-dark-neutral/40 hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-dark-neutral uppercase tracking-wider text-left mb-2">
                Konfirmasi Kata Sandi
              </label>
              <div className="mt-1 relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-neutral/40">
                  <Lock size={16} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ulangi kata sandi"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  className="block w-full pl-11 pr-4 py-3.5 border border-accent/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-dark-neutral/30 font-medium"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-background bg-primary hover:bg-primary-dark hover:scale-[1.01] transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
              >
                {loading ? 'Memproses...' : 'Daftar Akun'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-accent/20" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-dark-neutral/50 font-semibold">
                  Sudah punya akun?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-3.5 px-4 border border-accent hover:border-primary rounded-2xl text-sm font-bold text-primary bg-white hover:bg-primary/5 transition-all duration-300 focus:outline-none"
              >
                Masuk ke Akun
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
