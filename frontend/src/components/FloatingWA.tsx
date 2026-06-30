import React from 'react';

interface FloatingWAProps {
  phoneNumber?: string;
}

export const FloatingWA: React.FC<FloatingWAProps> = ({ phoneNumber = '6281298959362' }) => {
  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=Halo%20Admin,%20aku%20ingin%20bertanya%20soal%20sahaja`}
      target="_blank"
      rel="noopener noreferrer"
      id="floating-wa-btn"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center bg-[#25D366] hover:bg-[#20ba56] text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]"
      aria-label="Hubungi kami melalui WhatsApp"
    >
      {/* Official WhatsApp SVG Path */}
      <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zM6.6 18.06l.39.232c1.47.873 3.16 1.334 4.887 1.335 5.517 0 10.007-4.49 10.011-10.008.002-2.673-1.04-5.186-2.936-7.085-1.895-1.9-4.41-2.945-7.087-2.947-5.524 0-10.014 4.491-10.018 10.008-.001 1.79.467 3.54 1.354 5.07l.255.441-1.008 3.68 3.773-.99zM16.92 13.91c-.267-.133-1.58-.78-1.824-.868-.243-.089-.42-.133-.596.133-.176.267-.68 1.86-.834 2.036-.153.176-.307.198-.574.065-1.393-.695-2.285-1.229-3.206-2.81-.243-.418.243-.388.696-1.293.076-.15.038-.282-.019-.397-.057-.115-.42-1.01-.577-1.385-.152-.367-.32-.317-.439-.323l-.374-.007c-.13 0-.34.048-.518.242-.178.193-.68.664-.68 1.62 0 .955.696 1.88.793 2.012.097.133 1.347 2.057 3.264 2.885.457.198.813.316 1.093.404.46.146.88.125 1.214.075.372-.056 1.58-.646 1.802-1.27.222-.625.222-1.162.155-1.272-.066-.11-.242-.198-.51-.33z" />
      </svg>
      <span className="absolute right-16 bg-dark-neutral text-background text-sm font-medium py-1.5 px-3 rounded-lg shadow-md whitespace-nowrap opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none border border-accent/20">
        Butuh Bantuan? Hubungi Kami
      </span>
    </a>
  );
};
