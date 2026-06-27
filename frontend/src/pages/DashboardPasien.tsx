import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../utils/api';
import { 
  User, 
  Calendar, 
  History, 
  PlusCircle, 
  LogOut, 
  Menu, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ShieldAlert,
  Star,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  CreditCard,
  RefreshCw
} from 'lucide-react';

interface DashboardPasienProps {
  loggedInUser: string | null;
  onLogout: () => void;
}

interface ProfileData {
  fullName: string;
  phoneNumber: string;
  birthDate: string;
  gender: string;
  mainAddress: string;
}

interface Booking {
  id: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'MENUNGGU_PEMBAYARAN' | 'MENUNGGU_KONFIRMASI_ADMIN' | 'TERAPIS_DITUGASKAN' | 'DALAM_PERJALANAN' | 'SELESAI' | 'DIBATALKAN';
  therapistName: string | null;
  rescheduleCount: number;
  price: number;
  products: string[];
  progressNotes?: string;
  review?: {
    rating: number;
    comment: string;
  };
}

const mapBackendBooking = (b: any): Booking => {
  let uiTime = '08.00';
  if (b.scheduledTime === 'JAM_10_00') uiTime = '10.00';
  else if (b.scheduledTime === 'JAM_12_00') uiTime = '12.00';
  else if (b.scheduledTime === 'JAM_14_00') uiTime = '14.00';

  const uiDate = (b.scheduledDate && typeof b.scheduledDate === 'string') ? b.scheduledDate.split('T')[0] : '';
  const products = b.bookingProducts ? b.bookingProducts.map((bp: any) => bp.product?.name || '') : [];

  return {
    id: b.id,
    serviceName: b.service?.name || 'Terapi Totok Punggung',
    date: uiDate,
    time: uiTime,
    status: b.status,
    therapistName: b.therapist?.fullName || null,
    rescheduleCount: b.rescheduleCount || 0,
    price: Number(b.totalAmount),
    products: products,
    progressNotes: b.therapyProgress?.notes || undefined,
    review: b.review ? {
      rating: b.review.rating,
      comment: b.review.comment
    } : undefined
  };
};

interface EmptyStateProps {
  message: string;
  subMessage: string;
  icon: React.ReactNode;
  onAction?: () => void;
  actionText?: string;
}

const EmptyStateY2K: React.FC<EmptyStateProps> = ({ message, subMessage, icon, onAction, actionText }) => {
  return (
    <div className="bg-amber-50 border-[3px] border-slate-900 rounded-3xl p-8 md:p-12 text-center shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex flex-col items-center justify-center space-y-5 max-w-lg mx-auto my-6 text-slate-900">
      <div className="p-4 bg-emerald-400 border-2 border-slate-900 rounded-full text-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] animate-bounce flex items-center justify-center">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight">{message}</h3>
        <p className="text-xs text-slate-700 font-semibold max-w-md mx-auto leading-relaxed">{subMessage}</p>
      </div>
      {onAction && actionText && (
        <button
          onClick={onAction}
          className="bg-[#00FF66] hover:bg-[#00E55C] text-slate-900 text-xs font-black py-3 px-6 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all focus:outline-none uppercase tracking-wider"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="flex-none w-72 bg-white border-[3px] border-slate-900 rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] animate-pulse flex flex-col justify-between space-y-4 text-left">
      <div className="w-full h-36 rounded-lg border-2 border-slate-900 bg-slate-200 animate-pulse" />
      <div className="space-y-2 flex-grow">
        <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-slate-200 rounded w-full animate-pulse" />
        <div className="h-3 bg-slate-200 rounded w-5/6 animate-pulse" />
      </div>
      <div className="flex items-center justify-between border-t-2 border-dashed border-slate-200 pt-3 mt-auto">
        <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
        <div className="h-6 bg-slate-200 rounded w-1/4 animate-pulse" />
      </div>
    </div>
  );
};

const ProductGridSkeleton: React.FC = () => {
  return (
    <div className="bg-white border-[3px] border-slate-900 rounded-xl p-4 animate-pulse flex flex-col justify-between space-y-4 text-left">
      <div className="w-full h-32 rounded-lg border-2 border-slate-900 bg-slate-200 animate-pulse" />
      <div className="space-y-2 flex-grow">
        <div className="h-3.5 bg-slate-200 rounded w-3/4 animate-pulse" />
        <div className="h-2.5 bg-slate-200 rounded w-full animate-pulse" />
        <div className="h-2.5 bg-slate-200 rounded w-5/6 animate-pulse" />
      </div>
      <div className="flex items-center justify-between border-t-2 border-dashed border-slate-200 pt-3 mt-auto">
        <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
        <div className="h-5 bg-slate-200 rounded w-1/4 animate-pulse" />
      </div>
    </div>
  );
};

const serviceAreas = [
  "Pondok Melati",
  "Kampung Sawah",
  "Pondok Gede",
  "Jati Asih",
  "Jati Sampurna",
  "Bintara",
  "Pondok Kelapa"
];

const parseAddress = (fullAddress: any) => {
  const addressString = typeof fullAddress === 'string' ? fullAddress : '';
  if (!addressString) {
    return { area: "", detail: "" };
  }
  const match = addressString.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (match) {
    const area = match[1] ? match[1].trim() : '';
    const detail = match[2] ? match[2].trim() : '';
    if (serviceAreas.includes(area)) {
      return { area, detail };
    }
  }
  return { area: "", detail: addressString };
};

export const DashboardPasien: React.FC<DashboardPasienProps> = ({ loggedInUser, onLogout }) => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<'profil' | 'jadwal' | 'riwayat' | 'booking'>('profil');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Redirect to login if not logged in
  useEffect(() => {
    if (!loggedInUser) {
      navigate('/login');
    }
  }, [loggedInUser, navigate]);

  // Profile State
  const [profile, setProfile] = useState<ProfileData>({
    fullName: loggedInUser || '',
    phoneNumber: '',
    birthDate: '',
    gender: '',
    mainAddress: ''
  });

  const [profileArea, setProfileArea] = useState('');
  const [profileAddressDetail, setProfileAddressDetail] = useState('');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  // Fetch initial profile, bookings and products data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Fetch patient profile
        const profileRes = await apiFetch('/patients/me');
        if (profileRes && profileRes.patient) {
          const p = profileRes.patient;
          const birthDateStr = (p.birthDate && typeof p.birthDate === 'string') ? p.birthDate.split('T')[0] : '';
          setProfile({
            fullName: p.fullName || '',
            phoneNumber: p.phoneNumber || '',
            birthDate: birthDateStr,
            gender: p.gender || '',
            mainAddress: p.mainAddress || ''
          });

          const parsed = parseAddress(p.mainAddress || '');
          setProfileArea(parsed.area);
          setProfileAddressDetail(parsed.detail);

          // Sync the user name back to local storage and state just in case
          if (p.fullName && p.fullName !== loggedInUser) {
            localStorage.setItem('sahaja_user', p.fullName);
          }
        }

        // 2. Fetch patient bookings
        const bookingsRes = await apiFetch('/bookings');
        if (bookingsRes && bookingsRes.bookings) {
          const mapped = bookingsRes.bookings.map(mapBackendBooking);
          setBookings(mapped);
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data dari server.');
      } finally {
        setLoading(false);
      }
    };

    const fetchProductsData = async () => {
      setFetchingProducts(true);
      try {
        const productsRes = await apiFetch('/products');
        if (productsRes && productsRes.products) {
          setHerbalProducts(productsRes.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            desc: p.description || '',
            imageUrl: p.imageUrl || '',
            benefits: p.benefits || '',
            composition: p.composition || '',
            usageGuide: p.usageGuide || ''
          })));
        }
      } catch (err: any) {
        console.error('Gagal memuat produk herbal:', err);
      } finally {
        setFetchingProducts(false);
      }
    };
    const fetchServicesData = async () => {
      try {
        const servicesRes = await apiFetch('/services');
        if (servicesRes && servicesRes.services) {
          setServices(servicesRes.services.map((s: any) => ({
            id: s.id,
            name: s.name,
            price: Number(s.price),
            duration: s.durationMin || 0,
            desc: s.description || ''
          })));
        }
      } catch (err: any) {
        console.error('Gagal memuat layanan:', err);
      }
    };

    if (loggedInUser) {
      fetchInitialData();
      fetchProductsData();
      fetchServicesData();
    }
  }, [loggedInUser]);

  // Completeness logic
  const isProfileComplete = !!(
    profile.birthDate &&
    profile.gender &&
    profileArea &&
    typeof profileAddressDetail === 'string' &&
    profileAddressDetail.trim()
  );

  // Reschedule State
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  // Review State
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Booking Wizard State
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedService, setSelectedService] = useState<{ id: string; name: string; price: number; duration: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [showQRISModal, setShowQRISModal] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [availability, setAvailability] = useState<Record<string, { available: boolean; remaining: number }>>({});
  const [fetchingAvailability, setFetchingAvailability] = useState(false);

  // Fetch real-time availability when date changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDate) {
        setAvailability({});
        return;
      }
      setFetchingAvailability(true);
      setBookingError('');
      try {
        const res = await apiFetch(`/patients/availability?date=${selectedDate}`);
        if (res && res.availability) {
          setAvailability(res.availability);
        } else {
          setAvailability({});
        }
      } catch (err: any) {
        setBookingError(err.message || 'Gagal memuat ketersediaan jadwal.');
      } finally {
        setFetchingAvailability(false);
      }
    };

    fetchAvailability();
  }, [selectedDate]);

  const mapUiTimeToBackendSlot = (time: string): string => {
    if (time === '08.00') return 'JAM_08_00';
    if (time === '10.00') return 'JAM_10_00';
    if (time === '12.00') return 'JAM_12_00';
    if (time === '14.00') return 'JAM_14_00';
    return 'JAM_08_00';
  };

  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [herbalProducts, setHerbalProducts] = useState<any[]>([]);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<any | null>(null);
  const [showFullCatalogModal, setShowFullCatalogModal] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const openDetailModal = (product: any) => {
    setSelectedProductForDetail(product);
  };

  const closeDetailModal = () => {
    setSelectedProductForDetail(null);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const filteredProducts = herbalProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!showFullCatalogModal) {
      setSearchQuery('');
    }
  }, [showFullCatalogModal]);

  // Dynamic state for services (initially matches seed, updated via API)
  const [services, setServices] = useState<any[]>([
    { id: 's1', name: 'Terapi Totok Punggung', price: 200000, duration: 60, desc: 'Terapi menyeluruh pada bagian punggung untuk menstimulasi saraf dan mengurai sumbatan aliran darah.' },
    { id: 's2', name: 'Terapi Totok Punggung + Bekam', price: 340000, duration: 60, desc: 'Kombinasi terapi totok punggung dengan bekam syar\'i untuk melancarkan sirkulasi darah dan mengeluarkan angin.' },
    { id: 's3', name: 'Terapi Totok Anak (Di bawah 5 Tahun)', price: 250000, duration: 45, desc: 'Terapi totok punggung lembut yang dirancang khusus untuk mengoptimalkan tumbuh kembang anak di bawah 5 tahun.' }
  ]);



  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setProfileSavedMsg('');
    try {
      const combinedAddress = `[${profileArea}] ${profileAddressDetail}`.trim();
      const response = await apiFetch('/patients/me', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: profile.fullName,
          birthDate: profile.birthDate,
          gender: profile.gender,
          mainAddress: combinedAddress
        })
      });

      if (response && response.user) {
        const u = response.user;
        const birthDateStr = (u.birthDate && typeof u.birthDate === 'string') ? u.birthDate.split('T')[0] : '';
        setProfile({
          fullName: u.fullName || '',
          phoneNumber: u.phoneNumber || '',
          birthDate: birthDateStr,
          gender: u.gender || '',
          mainAddress: u.mainAddress || ''
        });

        const parsed = parseAddress(u.mainAddress || '');
        setProfileArea(parsed.area);
        setProfileAddressDetail(parsed.detail);

        localStorage.setItem('sahaja_user', u.fullName);
      }
      setProfileSavedMsg('Profil Anda telah berhasil diperbarui!');
      setTimeout(() => setProfileSavedMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  // Reschedule validation and execution
  const executeReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForReschedule) return;

    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError('Harap pilih tanggal dan jam baru.');
      return;
    }

    // Business Rule 1: Cannot reschedule on the same day (H-0)
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedBookingForReschedule.date === todayStr) {
      setRescheduleError('Reschedule tidak diperbolehkan pada hari-H terapi.');
      return;
    }

    // Business Rule 2: Scheduled date must not be in the past
    if (rescheduleDate < todayStr) {
      setRescheduleError('Tanggal tidak boleh di masa lampau.');
      return;
    }

    // Business Rule 3: Max 2 reschedules
    if (selectedBookingForReschedule.rescheduleCount >= 2) {
      setRescheduleError('Batas reschedule maksimal 2 kali telah tercapai.');
      return;
    }

    setLoading(true);
    setRescheduleError('');
    try {
      const backendTime = mapUiTimeToBackendSlot(rescheduleTime);
      await apiFetch(`/bookings/${selectedBookingForReschedule.id}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({
          scheduledDate: rescheduleDate,
          scheduledTime: backendTime
        })
      });

      // Fetch bookings from database to sync UI
      const bookingsRes = await apiFetch('/bookings');
      if (bookingsRes && bookingsRes.bookings) {
        setBookings(bookingsRes.bookings.map(mapBackendBooking));
      }

      setSelectedBookingForReschedule(null);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleError('');
      alert('Jadwal berhasil diperbarui! Menunggu konfirmasi ulang dari Admin.');
    } catch (err: any) {
      setRescheduleError(err.message || 'Gagal mengubah jadwal terapi.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Review
  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;

    setBookings(prev => prev.map(b => {
      if (b.id === selectedBookingForReview.id) {
        return {
          ...b,
          review: {
            rating,
            comment: reviewComment
          }
        };
      }
      return b;
    }));

    setSelectedBookingForReview(null);
    setRating(5);
    setReviewComment('');
    alert('Terima kasih atas ulasan Anda! Masukan Anda sangat berharga.');
  };

  // Booking Flow operations
  const nextStep = () => {
    if (bookingStep === 1 && !selectedService) {
      setBookingError('Harap pilih layanan terapi terlebih dahulu.');
      return;
    }
    if (bookingStep === 2) {
      if (!selectedDate || !selectedTime) {
        setBookingError('Harap tentukan tanggal dan jam terapi.');
        return;
      }
      const backendSlot = mapUiTimeToBackendSlot(selectedTime);
      const slotInfo = availability[backendSlot];
      if (slotInfo && !slotInfo.available) {
        setBookingError('Maaf, slot untuk jadwal ini sudah penuh.');
        return;
      }
    }

    setBookingError('');
    setBookingStep(prev => prev + 1);
  };

  const prevStep = () => {
    setBookingError('');
    setBookingStep(prev => prev - 1);
  };

  const toggleHerbalProduct = (product: { id: string; name: string; price: number }) => {
    setSelectedProducts(prev => {
      if (prev.some(p => p.id === product.id)) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleCheckoutSubmit = () => {
    setShowQRISModal(true);
  };

  const simulateQRISPaymentSuccess = async () => {
    if (!selectedService) {
      setError('Gagal membuat booking: Layanan terapi belum dipilih.');
      setBookingError('Gagal membuat booking: Layanan terapi belum dipilih.');
      setShowQRISModal(false);
      return;
    }
    if (!selectedDate) {
      setError('Gagal membuat booking: Tanggal terapi belum ditentukan.');
      setBookingError('Gagal membuat booking: Tanggal terapi belum ditentukan.');
      setShowQRISModal(false);
      return;
    }
    if (!selectedTime) {
      setError('Gagal membuat booking: Waktu terapi belum ditentukan.');
      setBookingError('Gagal membuat booking: Waktu terapi belum ditentukan.');
      setShowQRISModal(false);
      return;
    }
    if (!profileArea || !profileAddressDetail.trim()) {
      setError('Gagal membuat booking: Alamat profil Anda belum lengkap. Harap lengkapi area layanan dan detail alamat di profil Anda terlebih dahulu.');
      setBookingError('Gagal membuat booking: Alamat profil Anda belum lengkap. Harap lengkapi area layanan dan detail alamat di profil Anda terlebih dahulu.');
      setShowQRISModal(false);
      return;
    }

    setLoading(true);
    setError('');
    setBookingError('');
    try {
      // Map selectedTime back to backend TimeSlot enum (JAM_08_00 etc)
      let backendTime = 'JAM_08_00';
      if (selectedTime === '10.00') backendTime = 'JAM_10_00';
      else if (selectedTime === '12.00') backendTime = 'JAM_12_00';
      else if (selectedTime === '14.00') backendTime = 'JAM_14_00';

      const combinedAddress = `[${profileArea}] ${profileAddressDetail}`.trim();
      const payload = {
        serviceId: selectedService.id,
        scheduledDate: selectedDate,
        scheduledTime: backendTime,
        therapyAddress: combinedAddress,
        productIds: selectedProducts.map(p => p.id)
      };

      console.log("Tombol bayar ditekan", payload);

      const response = await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response && response.booking) {
        // Re-fetch bookings from server to stay synchronized
        const bookingsRes = await apiFetch('/bookings');
        if (bookingsRes && bookingsRes.bookings) {
          setBookings(bookingsRes.bookings.map(mapBackendBooking));
        }
        
        // Reset wizard
        setSelectedService(null);
        setSelectedDate('');
        setSelectedTime('');
        setSelectedProducts([]);
        setBookingStep(1);
        setShowQRISModal(false);

        alert('Pembayaran Berhasil! Pesanan terapi Anda telah ditambahkan.');
        setActiveMenu('jadwal');
      }
    } catch (err: any) {
      setBookingError(err.message || 'Gagal membuat booking.');
      setError(err.message || 'Gagal membuat booking.');
      setShowQRISModal(false);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const servicePrice = selectedService ? selectedService.price : 0;
    const productsPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);
    return servicePrice + productsPrice;
  };

  const activeSchedules = bookings.filter(b => b.status !== 'SELESAI' && b.status !== 'DIBATALKAN');
  const finishedSchedules = bookings.filter(b => b.status === 'SELESAI' || b.status === 'DIBATALKAN');

  const statusBadge = (status: string) => {
    switch (status) {
      case 'MENUNGGU_PEMBAYARAN':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold py-1 px-2.5 rounded-full">Menunggu Pembayaran</span>;
      case 'MENUNGGU_KONFIRMASI_ADMIN':
        return <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] font-bold py-1 px-2.5 rounded-full">Menunggu Konfirmasi Admin</span>;
      case 'TERAPIS_DITUGASKAN':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold py-1 px-2.5 rounded-full">Terapis Ditugaskan</span>;
      case 'SELESAI':
        return <span className="bg-green-100 text-green-800 border border-green-200 text-[10px] font-bold py-1 px-2.5 rounded-full">Selesai</span>;
      case 'DIBATALKAN':
        return <span className="bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold py-1 px-2.5 rounded-full">Dibatalkan</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row relative">
      
      {/* 1. Hamburger Header for Mobile */}
      <div className="md:hidden bg-white border-b border-accent/25 px-6 py-4 flex items-center justify-between z-30 sticky top-20 left-0 w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary text-background rounded-full flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <span className="font-bold text-dark-neutral">Dashboard Pasien</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-primary hover:bg-accent/15 p-2 rounded-full transition-all focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 2. Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
        w-64 bg-white border-r border-accent/25 flex flex-col justify-between p-6 z-40
        ${isMobileMenuOpen ? 'translate-x-0 pt-24' : '-translate-x-full md:block'}
      `}>
        <div className="space-y-8">
          {/* Logo & User profile head */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-background rounded-full flex items-center justify-center shadow-md">
              <Sparkles size={20} />
            </div>
            <div className="text-left">
              <h2 className="font-black text-sm text-dark-neutral">Sahaja Dashboard</h2>
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Pasien</span>
            </div>
          </div>

          <div className="bg-accent/10 p-4 rounded-2xl text-left border border-accent/10">
            <p className="text-[10px] text-dark-neutral/50 font-bold uppercase tracking-wider">Selamat datang,</p>
            <h3 className="font-extrabold text-sm text-primary mt-0.5 truncate">{profile.fullName}</h3>
            <p className="text-[10px] text-dark-neutral/60 font-semibold mt-1 truncate">{profile.phoneNumber}</p>
          </div>

          {/* Menus List */}
          <nav className="flex flex-col gap-1.5 text-left">
            <button
              onClick={() => { setActiveMenu('profil'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none ${activeMenu === 'profil' ? 'bg-primary text-background shadow-sm' : 'text-dark-neutral/70 hover:bg-accent/15 hover:text-dark-neutral'}`}
            >
              <User size={16} />
              Profil Lengkap
            </button>
            <button
              onClick={() => { setActiveMenu('jadwal'); setIsMobileMenuOpen(false); }}
              className={`flex items-center justify-between py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none ${activeMenu === 'jadwal' ? 'bg-primary text-background shadow-sm' : 'text-dark-neutral/70 hover:bg-accent/15 hover:text-dark-neutral'}`}
            >
              <span className="flex items-center gap-3">
                <Calendar size={16} />
                Jadwal Terapi
              </span>
              {activeSchedules.length > 0 && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeMenu === 'jadwal' ? 'bg-background text-primary' : 'bg-primary text-background'}`}>
                  {activeSchedules.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveMenu('riwayat'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none ${activeMenu === 'riwayat' ? 'bg-primary text-background shadow-sm' : 'text-dark-neutral/70 hover:bg-accent/15 hover:text-dark-neutral'}`}
            >
              <History size={16} />
              Riwayat Terapi
            </button>

            <hr className="my-3 border-accent/20" />

            {/* Locked Booking button trigger */}
            <button
              disabled={!isProfileComplete}
              onClick={() => { setActiveMenu('booking'); setIsMobileMenuOpen(false); }}
              className={`
                flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 focus:outline-none
                ${activeMenu === 'booking' 
                  ? 'bg-primary text-background shadow-sm' 
                  : isProfileComplete
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }
              `}
            >
              <PlusCircle size={16} />
              Pesan Terapi
              {!isProfileComplete && <span className="ml-auto text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md uppercase font-black">Terkunci</span>}
            </button>
          </nav>
        </div>

        {/* Logout Section */}
        <div className="pt-6 border-t border-accent/20">
          <button
            onClick={() => { onLogout(); navigate('/'); }}
            className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold text-xs rounded-xl transition-all duration-200 focus:outline-none"
          >
            <LogOut size={16} />
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-dark-neutral/40 z-30 md:hidden"
        />
      )}

      {/* 3. Main Dashboard Content Container */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full relative overflow-y-auto">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-primary">Memproses data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => setError('')} 
              className="text-red-500 hover:text-red-700 font-bold transition-colors focus:outline-none"
            >
              Tutup
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* PROFILE VIEW */}
          {activeMenu === 'profil' && (
            <motion.div
              key="profil"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 text-left"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-accent/25 pb-6">
                <div>
                  <h1 className="text-2xl font-black text-primary">Profil Pasien</h1>
                  <p className="text-xs text-dark-neutral/60">Lengkapi data diri Anda untuk membuka kunci pemesanan terapi (booking).</p>
                </div>
                {isProfileComplete ? (
                  <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 py-1.5 px-3.5 rounded-full text-xs font-bold w-fit">
                    <CheckCircle size={14} />
                    Profil Lengkap & Booking Aktif
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 py-1.5 px-3.5 rounded-full text-xs font-bold w-fit">
                    <AlertCircle size={14} />
                    Profil Belum Lengkap (Booking Terkunci)
                  </div>
                )}
              </div>

              {!isProfileComplete && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 text-xs leading-relaxed font-semibold">
                  <ShieldAlert size={18} className="flex-shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Booking Terkunci:</span> Anda belum dapat memesan terapi baru. Silakan lengkapi bidang **Tanggal Lahir**, **Jenis Kelamin**, dan **Alamat Lengkap** pada formulir di bawah ini untuk membuka akses.
                  </div>
                </div>
              )}

              {profileSavedMsg && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-2 text-green-800 text-xs font-semibold">
                  <CheckCircle size={16} className="text-green-600" />
                  {profileSavedMsg}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="bg-white border border-accent/25 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-dark-neutral uppercase tracking-wider mb-2">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={profile.fullName}
                      onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                      className="block w-full px-4 py-3 border border-accent/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dark-neutral uppercase tracking-wider mb-2">Nomor Telepon</label>
                    <input
                      type="tel"
                      disabled
                      value={profile.phoneNumber}
                      className="block w-full px-4 py-3 border border-accent/20 bg-gray-50 text-dark-neutral/50 rounded-xl text-sm focus:outline-none font-medium cursor-not-allowed"
                    />
                    <span className="text-[10px] text-dark-neutral/40 mt-1 block">Nomor telepon terdaftar tidak dapat diubah secara langsung.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dark-neutral uppercase tracking-wider mb-2">Tanggal Lahir</label>
                    <input
                      type="date"
                      required
                      value={profile.birthDate}
                      onChange={(e) => setProfile(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="block w-full px-4 py-3 border border-accent/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dark-neutral uppercase tracking-wider mb-2">Jenis Kelamin</label>
                    <select
                      required
                      value={profile.gender}
                      onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                      className="block w-full px-4 py-3 border border-accent/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium bg-white"
                    >
                      <option value="">-- Pilih Jenis Kelamin --</option>
                      <option value="LAKI_LAKI">Laki-laki</option>
                      <option value="PEREMPUAN">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-dark-neutral uppercase tracking-wider mb-2">Area Layanan</label>
                    <select
                      required
                      value={profileArea}
                      onChange={(e) => setProfileArea(e.target.value)}
                      className="block w-full px-4 py-3 border border-accent/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium bg-white"
                    >
                      <option value="">-- Pilih Area Layanan --</option>
                      {serviceAreas.map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-dark-neutral uppercase tracking-wider mb-2">Detail Alamat</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Contoh: Jl. Mawar No. 10, rumah cat biru..."
                      value={profileAddressDetail}
                      onChange={(e) => setProfileAddressDetail(e.target.value)}
                      className="block w-full px-4 py-3 border border-accent/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-dark-neutral/30 font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={!profileArea || !profileAddressDetail.trim()}
                    className={`text-xs font-bold py-3 px-8 rounded-full transition-all duration-300 focus:outline-none ${
                      (!profileArea || !profileAddressDetail.trim())
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-dark text-background shadow-md hover:shadow-lg hover:scale-[1.02]'
                    }`}
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ACTIVE SCHEDULE VIEW */}
          {activeMenu === 'jadwal' && (
            <motion.div
              key="jadwal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 text-left"
            >
              <div className="border-b border-accent/25 pb-6">
                <h1 className="text-2xl font-black text-primary">Jadwal Terapi Aktif</h1>
                <p className="text-xs text-dark-neutral/60">Daftar terapi kunjungan yang sedang berjalan atau menunggu konfirmasi.</p>
              </div>

              {activeSchedules.length === 0 ? (
                <EmptyStateY2K
                  message={isProfileComplete ? "Belum ada jadwal nih!" : "Profilmu belum lengkap nih!"}
                  subMessage={
                    isProfileComplete
                      ? "Yuk booking terapi pertamamu dan rasakan segarnya tubuh terbebas dari sumbatan!"
                      : "Lengkapi data dirimu sekarang agar bisa langsung melakukan pemesanan terapi totok punggung."
                  }
                  icon={<Calendar size={32} />}
                  onAction={() => setActiveMenu(isProfileComplete ? 'booking' : 'profil')}
                  actionText={isProfileComplete ? "Booking Terapi Sekarang" : "Lengkapi Profil Sekarang"}
                />
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {activeSchedules.map((item) => (
                    <div key={item.id} className="bg-white border border-accent/25 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between gap-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-primary">{item.serviceName}</h3>
                            {statusBadge(item.status)}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-xs font-semibold text-dark-neutral/60 pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} className="text-primary" />
                              {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} className="text-primary" />
                              Jam {item.time} WIB
                            </span>
                          </div>

                          {item.products.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-[10px] font-bold text-secondary-dark uppercase tracking-wider">Add-ons:</span>
                              {item.products.map((p, idx) => (
                                <span key={idx} className="bg-secondary/15 text-primary border border-secondary/35 text-[9px] font-bold py-0.5 px-2 rounded-full">{p}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-dark-neutral/50 font-bold uppercase tracking-wider block">Harga Total</span>
                          <span className="text-xl font-black text-primary">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-accent/15 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-xs font-semibold text-dark-neutral/70">
                          {item.therapistName ? (
                            <span>Terapis ditugaskan: <strong className="text-primary font-bold">{item.therapistName}</strong></span>
                          ) : (
                            <span className="text-dark-neutral/50">Mencari terapis yang sesuai...</span>
                          )}
                           {item.rescheduleCount > 0 && (
                            <span className="block text-[10px] text-amber-600 mt-1">Jadwal telah diubah {item.rescheduleCount}/2 kali</span>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setSelectedBookingForReschedule(item);
                              setRescheduleDate(item.date);
                              setRescheduleTime(item.time);
                            }}
                            className="border border-accent hover:border-primary text-primary hover:bg-primary/5 text-xs font-bold py-2.5 px-5 rounded-full transition-colors focus:outline-none flex items-center gap-1.5"
                          >
                            <RefreshCw size={14} />
                            Ubah Jadwal
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* HISTORY VIEW */}
          {activeMenu === 'riwayat' && (
            <motion.div
              key="riwayat"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 text-left"
            >
              <div className="border-b border-accent/25 pb-6">
                <h1 className="text-2xl font-black text-primary">Riwayat Terapi Selesai</h1>
                <p className="text-xs text-dark-neutral/60">Histori kunjungan terapi Anda beserta perkembangan kesehatan dan ulasan.</p>
              </div>

              {finishedSchedules.length === 0 ? (
                <EmptyStateY2K
                  message="Belum ada riwayat terapi nih!"
                  subMessage="Yuk mulai perjalanan sehatmu bersama Sahaja dan rasakan khasiat totok punggung syar'i!"
                  icon={<History size={32} />}
                  onAction={() => setActiveMenu(isProfileComplete ? 'booking' : 'profil')}
                  actionText={isProfileComplete ? "Mulai Terapi Pertamamu" : "Lengkapi Profil Sekarang"}
                />
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {finishedSchedules.map((item) => (
                    <div key={item.id} className="bg-white border border-accent/25 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between gap-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-primary">{item.serviceName}</h3>
                            {statusBadge(item.status)}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-xs font-semibold text-dark-neutral/60 pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} className="text-primary" />
                              {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} className="text-primary" />
                              Jam {item.time} WIB
                            </span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-dark-neutral/50 font-bold uppercase tracking-wider block">Harga Total</span>
                          <span className="text-xl font-black text-primary">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                          </span>
                        </div>
                      </div>

                      {/* Therapy progress notes */}
                      {item.progressNotes && (
                        <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 text-xs text-dark-neutral/80 leading-relaxed text-left">
                          <span className="font-extrabold text-primary uppercase text-[10px] tracking-wider block mb-1.5">Catatan Perkembangan Terapi:</span>
                          "{item.progressNotes}"
                        </div>
                      )}

                      <div className="border-t border-accent/15 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="text-xs font-semibold text-dark-neutral/70 text-left">
                          <span>Dilayani oleh terapis: <strong className="text-primary font-bold">{item.therapistName || 'Terapis Sahaja'}</strong></span>
                        </div>

                        <div>
                          {item.review ? (
                            <div className="flex items-center gap-3 text-left">
                              <span className="text-xs font-bold text-dark-neutral/50">Ulasan Anda:</span>
                              <div className="flex text-amber-400">
                                {[...Array(item.review.rating)].map((_, i) => (
                                  <Star key={i} size={14} className="fill-current" />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedBookingForReview(item)}
                              className="bg-primary hover:bg-primary-dark text-background text-xs font-bold py-2.5 px-6 rounded-full transition-colors focus:outline-none flex items-center gap-1.5"
                            >
                              <Star size={14} />
                              Beri Ulasan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* BOOKING WIZARD VIEW */}
          {activeMenu === 'booking' && (
            <motion.div
              key="booking"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 text-left"
            >
              <div className="border-b border-accent/25 pb-6">
                <h1 className="text-2xl font-black text-primary">Booking Terapi Baru</h1>
                <p className="text-xs text-dark-neutral/60">Pesan layanan totok punggung home-service dalam 3 langkah mudah.</p>
              </div>

              {/* Steps Indicator */}
              <div className="flex items-center justify-between max-w-lg mx-auto py-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${bookingStep >= step ? 'bg-primary text-background' : 'bg-gray-200 text-gray-500'}`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`w-20 md:w-32 h-1 transition-all duration-300 ${bookingStep > step ? 'bg-primary' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between max-w-lg mx-auto text-[10px] font-bold text-dark-neutral/50 uppercase tracking-wider px-1">
                <span>1. Pilih Layanan</span>
                <span className="pr-4">2. Jadwal & Waktu</span>
                <span>3. Add-on & Checkout</span>
              </div>

              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-2xl font-semibold flex items-center gap-2 max-w-xl mx-auto">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  {bookingError}
                </div>
              )}

              {/* STEP 1: SELECT SERVICE */}
              {bookingStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-dark-neutral uppercase tracking-widest text-left">Langkah 1: Pilih Layanan Terapi</h3>
                  <div className="grid grid-cols-1 gap-6">
                    {services.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedService(item)}
                        className={`
                          border rounded-3xl p-6 text-left cursor-pointer transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6
                          ${selectedService?.id === item.id 
                            ? 'border-primary bg-primary/5 shadow-md scale-[1.01]' 
                            : 'border-accent/30 bg-white hover:border-primary/20 shadow-sm'
                          }
                        `}
                      >
                        <div className="space-y-2 flex-grow max-w-xl">
                          <h4 className="font-extrabold text-lg text-primary">{item.name}</h4>
                          <p className="text-xs text-dark-neutral/70 leading-relaxed">{item.desc}</p>
                          <span className="inline-block bg-accent/35 text-dark-neutral/80 text-[10px] font-bold px-3 py-1 rounded-full border border-accent/25">Durasi: {item.duration} Menit</span>
                        </div>
                        <div className="text-left md:text-right min-w-[140px] flex-shrink-0">
                          <span className="text-[10px] text-dark-neutral/50 font-bold uppercase tracking-wider block">Mulai Dari</span>
                          <span className="text-xl font-black text-primary">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={nextStep}
                      className="bg-primary hover:bg-primary-dark text-background text-xs font-bold py-3 px-8 rounded-full shadow-md flex items-center gap-1.5 focus:outline-none"
                    >
                      Pilih & Lanjutkan
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT DATE & TIME */}
              {bookingStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-dark-neutral uppercase tracking-widest text-left">Langkah 2: Tentukan Tanggal & Waktu Kunjungan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Date Picker */}
                    <div className="bg-white border border-accent/25 rounded-3xl p-6 shadow-sm space-y-4">
                      <label className="block text-xs font-bold text-dark-neutral uppercase tracking-wider">Pilih Tanggal Terapi</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setBookingError('');
                        }}
                        className="block w-full px-4 py-3 border border-accent/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                      />
                      <p className="text-[10px] text-dark-neutral/50 leading-relaxed font-semibold">Terapis kami melayani kunjungan ke rumah setiap hari sesuai jam slot yang dipilih.</p>
                    </div>

                    {/* Time Slots */}
                    <div className="bg-white border border-accent/25 rounded-3xl p-6 shadow-sm space-y-4">
                      <label className="block text-xs font-bold text-dark-neutral uppercase tracking-wider">Pilih Slot Jam Terapi</label>
                      {fetchingAvailability ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-bold text-primary">Memeriksa ketersediaan slot...</span>
                        </div>
                      ) : !selectedDate ? (
                        <div className="text-center py-8 text-xs text-dark-neutral/50 font-bold">
                          Silakan pilih tanggal terlebih dahulu.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {['08.00', '10.00', '12.00', '14.00'].map((time) => {
                            const backendSlot = mapUiTimeToBackendSlot(time);
                            const slotInfo = availability[backendSlot];
                            const isFull = slotInfo ? !slotInfo.available : false;
                            const remaining = slotInfo ? slotInfo.remaining : 0;
                            return (
                              <button
                                key={time}
                                type="button"
                                disabled={isFull}
                                onClick={() => {
                                  setSelectedTime(time);
                                  setBookingError('');
                                }}
                                className={`
                                  py-3.5 px-4 rounded-2xl text-xs font-bold transition-all duration-300 focus:outline-none border flex flex-col items-center justify-center
                                  ${isFull 
                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                                    : selectedTime === time
                                      ? 'bg-primary border-primary text-background shadow-md'
                                      : 'bg-white border-accent/30 text-dark-neutral hover:border-primary/45'
                                  }
                                `}
                              >
                                <span>Jam {time} WIB</span>
                                {isFull ? (
                                  <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded mt-1 uppercase">Penuh</span>
                                ) : (
                                  <span className={`text-[8px] font-bold mt-1 ${selectedTime === time ? 'text-white' : 'text-primary'}`}>Sisa {remaining} slot</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-[10px] text-dark-neutral/50 leading-relaxed font-semibold">Terapis kami melayani secara syar'i (terapis pria untuk pasien pria, terapis wanita untuk pasien wanita). Slot dinonaktifkan secara dinamis jika seluruh terapis yang bertugas pada hari tersebut sudah terisi penuh.</p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6 border-t border-accent/15">
                    <button
                      onClick={prevStep}
                      className="border border-accent hover:border-primary text-primary text-xs font-bold py-3 px-8 rounded-full transition-colors focus:outline-none"
                    >
                      Sebelumnya
                    </button>
                    <button
                      onClick={nextStep}
                      className="bg-primary hover:bg-primary-dark text-background text-xs font-bold py-3 px-8 rounded-full shadow-md flex items-center gap-1.5 focus:outline-none"
                    >
                      Lanjutkan
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: ADD-ON PRODUCTS & CHECKOUT SUMMARY */}
              {bookingStep === 3 && (
                <div className="space-y-8">
                  <h3 className="text-sm font-bold text-dark-neutral uppercase tracking-widest text-left">Langkah 3: Tambah Produk Herbal (Add-on) & Ringkasan Checkout</h3>
                  
                  {/* Summary card */}
                  <div className="bg-white border border-accent/25 rounded-3xl p-6 shadow-sm space-y-4 text-left">
                    <h4 className="font-extrabold text-sm text-primary uppercase tracking-wider">Ringkasan Pemesanan</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-dark-neutral/80 border-b border-accent/15 pb-3">
                      <div className="space-y-1.5">
                        <p>Layanan: <span className="text-primary">{selectedService?.name}</span></p>
                        <p>Durasi: <span className="text-primary">{selectedService?.duration} Menit</span></p>
                      </div>
                      <div className="space-y-1.5">
                        <p>Tanggal: <span className="text-primary">{selectedDate ? new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span></p>
                        <p>Waktu Slot: <span className="text-primary">Jam {selectedTime} WIB</span></p>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-dark-neutral/80 space-y-1 pt-1">
                      <p className="text-[10px] text-dark-neutral/50 font-bold uppercase tracking-wider">Alamat Kunjungan Terapi</p>
                      <p className="text-primary mt-1 font-extrabold">
                        {profileArea ? `[${profileArea}] ${profileAddressDetail}` : 'Alamat belum diatur'}
                      </p>
                    </div>
                  </div>

                  {/* Add-on Products Y2K/Kalcer Grid */}
                  <div className="space-y-4 text-left">
                    <div>
                      <h4 className="font-extrabold text-sm text-primary uppercase tracking-wider">Add-on Produk Herbal Rekomendasi</h4>
                      <p className="text-[11px] text-dark-neutral/60">Dukung pemulihan energi tubuh pasca terapi dengan produk rempah herbal alami Sahaja.</p>
                    </div>

                    {/* Y2K / Kalcer Horizontal Scroll Carousel Wrapper */}
                    <div className="relative group/carousel">
                      {/* Left Arrow Button */}
                      <button
                        type="button"
                        onClick={() => scrollCarousel('left')}
                        className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border-[3px] border-slate-900 flex items-center justify-center font-black text-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all hover:bg-[#00FF66] focus:outline-none text-base"
                      >
                        &lt;
                      </button>

                      {/* Right Arrow Button */}
                      <button
                        type="button"
                        onClick={() => scrollCarousel('right')}
                        className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border-[3px] border-slate-900 flex items-center justify-center font-black text-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all hover:bg-[#00FF66] focus:outline-none text-base"
                      >
                        &gt;
                      </button>

                      {/* Y2K / Kalcer Horizontal Scroll Carousel */}
                      <div 
                        ref={carouselRef}
                        className="flex overflow-x-auto flex-nowrap gap-6 pb-6 pt-2 snap-x scrollbar-none [&::-webkit-scrollbar]:hidden" 
                        style={{ scrollbarWidth: 'none' }}
                      >
                        {fetchingProducts ? (
                          <>
                            <ProductCardSkeleton />
                            <ProductCardSkeleton />
                            <ProductCardSkeleton />
                          </>
                        ) : (
                          herbalProducts.map((prod) => {
                            const isAdded = selectedProducts.some(p => p.id === prod.id);
                            return (
                              <div
                                key={prod.id}
                                className={`
                                  flex-none w-72 bg-white border-[3px] border-slate-900 rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 text-left relative snap-start
                                  ${isAdded 
                                    ? 'bg-emerald-50 border-slate-950 shadow-[6px_6px_0px_0px_#10B981]' 
                                    : 'hover:bg-slate-50 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]'
                                  }
                                `}
                                onClick={() => toggleHerbalProduct(prod)}
                              >
                                {/* Product Image or Placeholder */}
                                <div className="w-full h-36 rounded-lg overflow-hidden border-2 border-slate-900 bg-slate-100 flex-shrink-0 relative">
                                  {prod.imageUrl ? (
                                    <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" loading="lazy" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center font-black text-white text-3xl tracking-widest uppercase">
                                      {prod.name.substring(0, 2)}
                                    </div>
                                  )}
                                  <span className="absolute top-2 right-2 bg-slate-900 text-white text-[8px] font-black tracking-widest uppercase px-2 py-1 border border-slate-900 rounded shadow-[2px_2px_0px_0px_#10B981]">
                                    ADD-ON
                                  </span>
                                </div>

                                <div className="space-y-1.5 flex-grow">
                                  <h5 className="font-extrabold text-sm text-slate-900 tracking-tight">{prod.name}</h5>
                                  <p className="text-[10px] text-slate-600 leading-normal line-clamp-2">{prod.desc}</p>
                                </div>

                                <div className="flex items-center justify-between border-t-2 border-dashed border-slate-900 pt-3 mt-auto">
                                  <span className="font-black text-xs text-slate-900">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(prod.price)}
                                  </span>
                                  
                                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => openDetailModal(prod)}
                                      className="text-[9px] font-black border-2 border-slate-900 bg-white hover:bg-slate-100 text-slate-900 py-1 px-2.5 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                    >
                                      Selengkapnya
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => toggleHerbalProduct(prod)}
                                      className={`text-[9px] font-black py-1 px-3 border-2 border-slate-900 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all
                                        ${isAdded ? 'bg-emerald-400 text-slate-900' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                    >
                                      {isAdded ? 'Hapus' : '+ Tambah'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* Card "Lihat Semua" */}
                        {!fetchingProducts && (
                          <div
                            onClick={() => setShowFullCatalogModal(true)}
                            className="flex-none w-72 bg-white border-[3px] border-slate-900 rounded-xl p-6 cursor-pointer transition-all duration-200 flex flex-col justify-center items-center text-center snap-start shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] group"
                          >
                            <ShoppingBag size={32} className="text-slate-900 mb-3 group-hover:scale-110 transition-transform" />
                            <h5 className="font-black text-sm text-slate-900 tracking-tight uppercase">
                              Lihat Semua Katalog &rarr;
                            </h5>
                            <p className="text-[10px] text-slate-500 font-bold mt-1">
                              Buka pop-up katalog lengkap ({herbalProducts.length} produk)
                            </p>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>

                  {/* Checkout Final Total */}
                  <div className="bg-white border border-accent/25 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="text-left">
                      <span className="text-[10px] text-dark-neutral/50 font-bold uppercase tracking-wider block">Total Pembayaran</span>
                      <span className="text-2xl font-black text-primary">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(calculateTotal())}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={prevStep}
                        className="border border-accent hover:border-primary text-primary text-xs font-bold py-3 px-8 rounded-full transition-colors focus:outline-none"
                      >
                        Sebelumnya
                      </button>
                      <button
                        onClick={handleCheckoutSubmit}
                        className="bg-primary hover:bg-primary-dark text-background text-xs font-bold py-3 px-8 rounded-full shadow-md hover:scale-[1.02] transition-transform duration-200 flex items-center gap-1.5 focus:outline-none"
                      >
                        <CreditCard size={14} />
                        Bayar Sekarang
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. MODAL: RESCHEDULE FORM */}
      {selectedBookingForReschedule && (
        <div className="fixed inset-0 bg-dark-neutral/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-accent/20 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative text-left">
            <button
              onClick={() => { setSelectedBookingForReschedule(null); setRescheduleError(''); }}
              className="absolute top-4 right-4 text-dark-neutral/40 hover:text-primary p-1.5 rounded-full transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-primary">Ubah Jadwal Terapi</h3>
                <p className="text-[11px] text-dark-neutral/50">Jadwal ulang kunjungan terapis ke rumah Anda.</p>
              </div>

              {rescheduleError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl font-semibold flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  {rescheduleError}
                </div>
              )}

              <form onSubmit={executeReschedule} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-dark-neutral uppercase tracking-wider">Pilih Tanggal Baru</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleDate}
                    onChange={(e) => { setRescheduleDate(e.target.value); setRescheduleError(''); }}
                    className="block w-full px-4 py-2.5 border border-accent/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-dark-neutral uppercase tracking-wider">Pilih Jam Slot Baru</label>
                  <select
                    required
                    value={rescheduleTime}
                    onChange={(e) => { setRescheduleTime(e.target.value); setRescheduleError(''); }}
                    className="block w-full px-4 py-2.5 border border-accent/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium bg-white"
                  >
                    <option value="">-- Pilih Jam --</option>
                    <option value="08.00">08.00 WIB</option>
                    <option value="10.00">10.00 WIB</option>
                    <option value="12.00">12.00 WIB</option>
                    <option value="14.00">14.00 WIB</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedBookingForReschedule(null); setRescheduleError(''); }}
                    className="flex-1 border border-accent hover:border-primary text-primary text-xs font-bold py-3 rounded-full transition-colors focus:outline-none text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-dark text-background text-xs font-bold py-3 rounded-full shadow transition-all focus:outline-none"
                  >
                    Konfirmasi Ubah Jadwal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: RATING & REVIEW FORM */}
      {selectedBookingForReview && (
        <div className="fixed inset-0 bg-dark-neutral/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-accent/20 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative text-left">
            <button
              onClick={() => setSelectedBookingForReview(null)}
              className="absolute top-4 right-4 text-dark-neutral/40 hover:text-primary p-1.5 rounded-full transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-primary">Beri Ulasan Terapi</h3>
                <p className="text-[11px] text-dark-neutral/50">Bagikan pengalaman Anda saat diterapi terapis Sahaja.</p>
              </div>

              <form onSubmit={submitReview} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-dark-neutral uppercase tracking-wider">Rating Pelayanan</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-amber-400 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star size={24} className={rating >= star ? 'fill-current' : ''} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-dark-neutral uppercase tracking-wider">Komentar & Masukan</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tulis ulasan jujur Anda di sini..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="block w-full px-4 py-3 border border-accent/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-dark-neutral/30 font-medium"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForReview(null)}
                    className="flex-1 border border-accent hover:border-primary text-primary text-xs font-bold py-3 rounded-full transition-colors focus:outline-none text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-dark text-background text-xs font-bold py-3 rounded-full shadow transition-all focus:outline-none"
                  >
                    Kirim Ulasan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: QRIS SIMULATOR */}
      {showQRISModal && (
        <div className="fixed inset-0 bg-dark-neutral/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-accent/20 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative text-center">
            <button
              onClick={() => setShowQRISModal(false)}
              className="absolute top-4 right-4 text-dark-neutral/40 hover:text-primary p-1.5 rounded-full transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>

            <div className="space-y-6">
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-extrabold text-primary">Scan QRIS Untuk Membayar</h3>
                <p className="text-[11px] text-dark-neutral/50">Silakan scan kode QR di bawah menggunakan e-wallet/m-banking Anda.</p>
              </div>

              {/* Mock QRIS SVG */}
              <div className="w-56 h-56 mx-auto bg-white border border-accent/35 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative">
                {/* Visual simulator QR Code grid */}
                <svg className="w-full h-full text-dark-neutral" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer markers */}
                  <rect x="5" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="10" y="10" width="10" height="10" />
                  <rect x="75" y="5" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="80" y="10" width="10" height="10" />
                  <rect x="5" y="75" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="10" y="80" width="10" height="10" />
                  {/* Central details */}
                  <rect x="35" y="35" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path d="M 45,45 H 55 V 55 H 45 Z" />
                  {/* Random dots simulation */}
                  <path d="M30 10h5v5h-5zM45 15h10v5H45zM60 10h10v5H60zM30 30h10v5H30zM70 30h5v5h-5zM15 45h5v15h-5zM25 50h5v5h-5zM75 50h10v5H75zM35 75h10v5H35zM55 80h15v5H55zM80 70h5v10h-5z" />
                </svg>
                <div className="absolute inset-0 bg-primary/5 flex items-center justify-center pointer-events-none rounded-2xl" />
              </div>

              <div className="space-y-1.5 text-center">
                <span className="text-[10px] text-dark-neutral/50 font-bold uppercase tracking-wider block">Total Bayar</span>
                <span className="text-2xl font-black text-primary">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(calculateTotal())}
                </span>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={simulateQRISPaymentSuccess}
                  className="w-full bg-primary hover:bg-primary-dark text-background text-xs font-bold py-3.5 rounded-full shadow-md flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <CheckCircle size={16} />
                  Simulasikan Bayar Sukses
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowQRISModal(false)}
                  className="w-full border border-accent hover:border-primary text-primary text-xs font-bold py-3.5 rounded-full transition-colors focus:outline-none"
                >
                  Batalkan Pembayaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: DETIL PRODUK (POP-UP SELENGKAPNYA) */}
      {selectedProductForDetail && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[3px] border-slate-900 rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative text-left">
            <button
              type="button"
              onClick={closeDetailModal}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 border-2 border-slate-900 hover:bg-slate-100 p-1.5 rounded-full transition-colors focus:outline-none flex items-center justify-center"
            >
              <X size={18} />
            </button>

            <div className="space-y-6">
              {/* Product Photo */}
              <div className="w-full h-56 rounded-xl overflow-hidden border-[3px] border-slate-900 bg-slate-100 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {selectedProductForDetail.imageUrl ? (
                  <img src={selectedProductForDetail.imageUrl} alt={selectedProductForDetail.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center font-black text-white text-5xl tracking-widest uppercase">
                    {selectedProductForDetail.name.substring(0, 2)}
                  </div>
                )}
              </div>

              {/* Title & Price */}
              <div className="space-y-1 border-b-2 border-slate-900 pb-3">
                <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedProductForDetail.name}</h3>
                <span className="text-base font-black text-emerald-600 block">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedProductForDetail.price)}
                </span>
              </div>

              {/* Description & Details */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin text-xs font-semibold text-slate-700 leading-relaxed">
                <div>
                  <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] mb-1">Deskripsi Produk</h4>
                  <p>{selectedProductForDetail.desc || 'Tidak ada deskripsi produk.'}</p>
                </div>
                
                {selectedProductForDetail.benefits && (
                  <div>
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] mb-1">Manfaat Utama</h4>
                    <p>{selectedProductForDetail.benefits}</p>
                  </div>
                )}

                {selectedProductForDetail.composition && (
                  <div>
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] mb-1">Komposisi</h4>
                    <p>{selectedProductForDetail.composition}</p>
                  </div>
                )}

                {selectedProductForDetail.usageGuide && (
                  <div>
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] mb-1">Cara Pemakaian</h4>
                    <p>{selectedProductForDetail.usageGuide}</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    toggleHerbalProduct(selectedProductForDetail);
                    closeDetailModal();
                  }}
                  className={`w-full py-3 border-[3px] border-slate-900 font-black rounded-xl text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-center
                    ${selectedProducts.some(p => p.id === selectedProductForDetail.id)
                      ? 'bg-red-400 text-slate-900 hover:bg-red-500'
                      : 'bg-emerald-400 text-slate-900 hover:bg-emerald-500'}`}
                >
                  {selectedProducts.some(p => p.id === selectedProductForDetail.id)
                    ? 'Hapus dari Pesanan'
                    : 'Tambahkan Ke Pesanan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: KATALOG PENUH */}
      {showFullCatalogModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[3px] border-slate-900 rounded-2xl p-6 md:p-8 w-full max-w-4xl max-h-[90vh] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative text-left flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <ShoppingBag className="text-emerald-500" size={24} />
                  Katalog Lengkap Produk Herbal
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Pilih produk herbal tambahan untuk mendukung kesembuhan terapi Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullCatalogModal(false)}
                className="text-slate-500 hover:text-slate-900 border-2 border-slate-900 hover:bg-slate-100 p-1.5 rounded-full transition-colors focus:outline-none flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input Bar Y2K Style */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Cari produk herbal berdasarkan nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-slate-55 border-[3px] border-slate-900 text-slate-950 font-bold rounded-xl text-xs focus:outline-none focus:bg-white placeholder-slate-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px] transition-all"
              />
            </div>

            {/* Modal Body: Scrollable Grid */}
            <div className="flex-1 overflow-y-auto pr-2 mb-6 scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {fetchingProducts ? (
                  <>
                    <ProductGridSkeleton />
                    <ProductGridSkeleton />
                    <ProductGridSkeleton />
                    <ProductGridSkeleton />
                    <ProductGridSkeleton />
                    <ProductGridSkeleton />
                  </>
                ) : filteredProducts.length === 0 ? (
                  <div className="col-span-full py-16 text-center flex flex-col items-center justify-center space-y-3">
                    <ShoppingBag size={48} className="text-slate-450 animate-bounce" />
                    <p className="text-xs text-slate-500 font-bold uppercase">Produk "{searchQuery}" tidak ditemukan.</p>
                  </div>
                ) : (
                  filteredProducts.map((prod) => {
                    const isAdded = selectedProducts.some(p => p.id === prod.id);
                    return (
                      <div
                        key={prod.id}
                        className={`
                          bg-white border-[3px] border-slate-900 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between space-y-4 text-left relative
                          ${isAdded 
                            ? 'bg-emerald-50 border-slate-950 shadow-[4px_4px_0px_0px_#10B981]' 
                            : 'hover:bg-slate-50 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]'
                          }
                        `}
                      >
                        {/* Product Image or Placeholder */}
                        <div className="w-full h-32 rounded-lg overflow-hidden border-2 border-slate-900 bg-slate-100 flex-shrink-0 relative">
                          {prod.imageUrl ? (
                            <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center font-black text-white text-2xl tracking-widest uppercase">
                              {prod.name.substring(0, 2)}
                            </div>
                          )}
                          <span className="absolute top-2 right-2 bg-slate-900 text-white text-[8px] font-black tracking-widest uppercase px-2 py-1 border border-slate-900 rounded shadow-[2px_2px_0px_0px_#10B981]">
                            ADD-ON
                          </span>
                        </div>

                        <div className="space-y-1 flex-grow">
                          <h5 className="font-extrabold text-xs text-slate-900 tracking-tight">{prod.name}</h5>
                          <p className="text-[10px] text-slate-600 leading-normal line-clamp-3">{prod.desc}</p>
                        </div>

                        <div className="flex items-center justify-between border-t-2 border-dashed border-slate-900 pt-3 mt-auto">
                          <span className="font-black text-xs text-slate-900">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(prod.price)}
                          </span>
                          
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => openDetailModal(prod)}
                              className="text-[9px] font-black border-2 border-slate-900 bg-white hover:bg-slate-100 text-slate-900 py-1 px-2 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                            >
                              Detail
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => toggleHerbalProduct(prod)}
                              className={`text-[9px] font-black py-1 px-2.5 border-2 border-slate-900 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all
                                ${isAdded ? 'bg-emerald-400 text-slate-900' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                              {isAdded ? 'Hapus' : '+ Tambah'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t-2 border-slate-900 pt-4 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Produk Terpilih ({selectedProducts.length})</span>
                <span className="text-xs font-semibold text-slate-700">
                  Total Tambahan: <strong className="text-slate-900 font-black">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedProducts.reduce((sum, p) => sum + p.price, 0))}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowFullCatalogModal(false)}
                className="bg-emerald-400 hover:bg-emerald-500 text-slate-900 text-xs font-black py-3 px-8 border-[3px] border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all focus:outline-none uppercase"
              >
                Kembali ke Checkout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
