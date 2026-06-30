import React from 'react';
import { Phone, Mail, Clock, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-neutral text-background border-t border-accent/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand/Slogan */}
          <div className="space-y-4 md:col-span-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-primary text-background font-black rounded-xl flex items-center justify-center text-xl shadow-md">
                TPS
              </div>
              <div>
                <span className="font-extrabold text-lg text-background tracking-tight block">Totok Punggung</span>
                <span className="text-[10px] uppercase font-bold text-secondary tracking-widest block -mt-1">Sahaja</span>
              </div>
            </div>
            <p className="text-xs text-background/70 leading-relaxed max-w-sm">
              Layanan terapi totok punggung home-service terpercaya, mengembalikan keseimbangan tubuh alami Anda dengan penanganan terapis ahli bersertifikat.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/sahajatopung/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-background/5 hover:bg-primary/20 text-background/80 hover:text-primary flex items-center justify-center transition-all duration-300 border border-background/10 hover:border-primary/30"
                aria-label="Instagram"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61591144543437"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-background/5 hover:bg-primary/20 text-background/80 hover:text-primary flex items-center justify-center transition-all duration-300 border border-background/10 hover:border-primary/30"
                aria-label="Facebook"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@sahajatopung"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-background/5 hover:bg-primary/20 text-background/80 hover:text-primary flex items-center justify-center transition-all duration-300 border border-background/10 hover:border-primary/30"
                aria-label="TikTok"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.01 1.62 4.14.94 1.05 2.26 1.73 3.65 1.93v3.74c-1.39-.1-2.76-.64-3.86-1.52-.7-.57-1.25-1.31-1.63-2.14v7.92c-.08 2.06-.92 4.09-2.43 5.48-1.64 1.48-3.95 2.12-6.11 1.75-2.22-.38-4.22-1.84-5.18-3.9-1.04-2.23-.74-5 0.77-6.93 1.25-1.6 3.25-2.48 5.28-2.34v3.86c-1.12-.13-2.31.29-3.08 1.12-.8.88-.99 2.21-.51 3.29.47 1.07 1.6 1.79 2.76 1.84 1.26.06 2.51-.76 2.92-1.94.19-.53.25-1.1.24-1.66V0h.06z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-secondary">Akses Cepat</h4>
            <ul className="space-y-2.5 text-xs text-background/70">
              <li>
                <a href="#tentang" className="hover:text-primary hover:underline transition-colors duration-200">Tentang Kami</a>
              </li>
              <li>
                <a href="#layanan" className="hover:text-primary hover:underline transition-colors duration-200">Layanan Terapi</a>
              </li>
              <li>
                <a href="#keunggulan" className="hover:text-primary hover:underline transition-colors duration-200">Tanya Jawab</a>
              </li>
              <li>
                <a href="#testimoni" className="hover:text-primary hover:underline transition-colors duration-200">Testimoni Pasien</a>
              </li>
              <li>
                <a href="#artikel" className="hover:text-primary hover:underline transition-colors duration-200">Artikel Edukasi</a>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <Clock size={16} />
              Jam Operasional
            </h4>
            <div className="space-y-3 text-xs text-background/70 leading-relaxed">
              <p>Setiap Hari Layanan Home-Service</p>
              <div className="space-y-1.5 font-semibold text-background/90">
                <p>Slot 1: 08:00 WIB</p>
                <p>Slot 2: 10:00 WIB</p>
                <p>Slot 3: 12:00 WIB</p>
                <p>Slot 4: 14:00 WIB</p>
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-secondary">Hubungi Kami</h4>
            <ul className="space-y-3.5 text-xs text-background/70">
              <li className="flex items-start gap-2.5 leading-relaxed">
                <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <span>Jl. Rawagede Wetan No. 70B, RT. 006/RW.002, Jatimelati, Kota Bks, Jawa Barat 17415 Pondok Melati Kota Bekasi Jawa Barat 17415</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-primary flex-shrink-0" />
                <a
                  href="https://wa.me/6281298959362?text=Halo%20Admin,%20aku%20ingin%20bertanya%20soal%20sahaja"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  +62 812-9895-9362
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-primary flex-shrink-0" />
                <a
                  href="mailto:totokpunggungsahaja@gmail.com"
                  className="hover:text-primary transition-colors"
                >
                  totokpunggungsahaja@gmail.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-background/10 text-center text-[10px] text-background/50 font-medium">
          <p>© {currentYear} Totok Punggung Sahaja. Hak Cipta Dilindungi Undang-Undang.</p>
        </div>
      </div>
    </footer>
  );
};
