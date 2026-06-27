import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowLeft, User, Lock, Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface AdminLoginPageProps {
  onLogin: (name: string) => void;
  loggedInAdmin: string | null;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLogin, loggedInAdmin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (loggedInAdmin) {
      navigate('/admin-dashboard');
    }
  }, [loggedInAdmin, navigate]);
  // Ensure any existing auth tokens are cleared when landing on the admin login page
  useEffect(() => {
    const existingToken = localStorage.getItem('sahaja_token');
    if (existingToken) {
      localStorage.removeItem('sahaja_token');
      localStorage.removeItem('sahaja_user');
      window.location.reload(); // Wajib: Paksa refresh browser untuk mereset React State
    }
  }, []);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Harap isi semua kolom.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber: username, password }),
      });

      if (response && response.user) {
        if (response.user.role !== 'ADMIN') {
          setError('Akses ditolak. Akun Anda bukan merupakan Administrator.');
          return;
        }

        localStorage.setItem('sahaja_token', response.accessToken);
        onLogin(response.user.fullName);
        navigate('/admin-dashboard');
      } else {
        setError('Respons login tidak valid.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Silakan periksa kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
      
      {/* Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none -z-10" />

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors py-2 px-4 rounded-full border border-slate-700 bg-slate-800 shadow-lg"
        >
          <ArrowLeft size={14} />
          Kembali ke Beranda
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transform rotate-3">
            <Shield size={28} />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-slate-100 tracking-tight">
          Portal Super Admin
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400 font-medium">
          Totok Punggung Sahaja — Sistem Operasional Internal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-4 border border-slate-700/50 sm:rounded-3xl sm:px-10 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl font-semibold text-left">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-bold text-slate-300 uppercase tracking-wider text-left mb-2">
                Username Admin
              </label>
              <div className="mt-1 relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <User size={16} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="admin"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-slate-600 font-medium transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider text-left mb-2">
                Password
              </label>
              <div className="mt-1 relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="admin123"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-slate-600 font-medium transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-emerald-400 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-lg shadow-emerald-500/10 text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 hover:scale-[1.01] transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
              >
                {loading ? 'Memproses...' : 'Masuk Sistem'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Gunakan Nomor Telepon & Kata Sandi Administrator Terdaftar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
