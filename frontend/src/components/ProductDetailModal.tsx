import React from 'react';
import { X, HelpCircle, Leaf, Sparkles } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  photoUrl?: string;
  benefits?: string;
  composition?: string;
  usageGuide?: string;
}

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-dark-neutral/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-background border border-accent/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-accent/20 bg-accent/5">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <Leaf size={20} className="text-secondary" />
            Detail Produk Herbal
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-dark-neutral/50 hover:text-dark-neutral p-1 rounded-full hover:bg-accent/20 transition-all duration-200"
            aria-label="Tutup detail produk"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Image / Thumbnail */}
            <div className="w-full sm:w-1/3 h-40 rounded-xl overflow-hidden shadow-md border border-accent/40 bg-accent/20 flex items-center justify-center">
              {product.photoUrl ? (
                <img 
                  src={product.photoUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-primary/60 font-semibold p-4 text-center">
                  <Leaf size={48} className="text-primary/40 mb-2 animate-bounce" />
                  <span className="text-xs">{product.name}</span>
                </div>
              )}
            </div>

            {/* Title and Price */}
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-2xl font-extrabold text-primary mb-2">{product.name}</h2>
              <p className="text-lg font-black text-secondary-dark">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(product.price)}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-dark-neutral/60 bg-accent/10 border border-accent/20 py-1 px-3.5 rounded-full w-fit">
                <Sparkles size={14} className="text-primary" />
                <span>Bisa Tambah Saat Pemesanan Terapi</span>
              </div>
            </div>
          </div>

          <hr className="border-accent/20" />

          {/* Details Section */}
          <div className="space-y-4">
            {/* Benefits */}
            {product.benefits && (
              <div>
                <h4 className="text-sm font-bold text-primary mb-1.5 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-secondary" />
                  Manfaat Utama
                </h4>
                <p className="text-xs text-dark-neutral/80 leading-relaxed bg-white border border-accent/10 p-3 rounded-xl">
                  {product.benefits}
                </p>
              </div>
            )}

            {/* Composition */}
            {product.composition && (
              <div>
                <h4 className="text-sm font-bold text-primary mb-1.5 flex items-center gap-1.5">
                  <Leaf size={16} className="text-secondary" />
                  Komposisi
                </h4>
                <p className="text-xs text-dark-neutral/80 leading-relaxed bg-white border border-accent/10 p-3 rounded-xl">
                  {product.composition}
                </p>
              </div>
            )}

            {/* Usage Guide */}
            {product.usageGuide && (
              <div>
                <h4 className="text-sm font-bold text-primary mb-1.5 flex items-center gap-1.5">
                  <HelpCircle size={16} className="text-secondary" />
                  Cara Pemakaian
                </h4>
                <p className="text-xs text-dark-neutral/80 leading-relaxed bg-white border border-accent/10 p-3 rounded-xl">
                  {product.usageGuide}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-accent/20 bg-accent/5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-background font-semibold text-xs rounded-xl shadow transition-all duration-300 hover:shadow-md focus:outline-none"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
