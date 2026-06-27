import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  BookOpen, 
  UserCheck, 
  Settings, 
  LogOut, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  Plus, 
  X, 
  Edit2,
  Heart
} from 'lucide-react';
import { apiFetch } from '../utils/api';

interface AdminDashboardProps {
  loggedInAdmin: string | null;
  onLogout: () => void;
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
  patientName?: string;
  patientPhone?: string;
}

interface Therapist {
  id: string;
  name: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN';
  status: 'AKTIF' | 'NON_AKTIF';
  dayOff?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
}

const mapBackendBooking = (b: any): Booking => {
  let uiTime = '08.00';
  if (b.scheduledTime === 'JAM_10_00') uiTime = '10.00';
  else if (b.scheduledTime === 'JAM_12_00') uiTime = '12.00';
  else if (b.scheduledTime === 'JAM_14_00') uiTime = '14.00';

  const uiDate = b.scheduledDate ? b.scheduledDate.split('T')[0] : '';
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
    } : undefined,
    patientName: b.patient?.fullName || 'Pasien',
    patientPhone: b.patient?.phoneNumber || ''
  };
};

const mapBackendTherapist = (t: any): Therapist => {
  return {
    id: t.id,
    name: t.fullName,
    gender: t.gender || (t.fullName.includes('Ibu') || t.fullName.includes('Siti') || t.fullName.includes('Rahmi') ? 'PEREMPUAN' : 'LAKI_LAKI'),
    status: t.isActive ? 'AKTIF' : 'NON_AKTIF',
    dayOff: t.dayOff || null
  };
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ loggedInAdmin, onLogout }) => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<'overview' | 'bookings' | 'therapists' | 'content' | 'services'>('overview');
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loggedInAdmin) {
      navigate('/admin-login');
    }
  }, [loggedInAdmin, navigate]);

  // Real DB state hooks
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceDuration, setServiceDuration] = useState<number>(60);
  const [servicePrice, setServicePrice] = useState<number>(0);
  const [profileSettings, setProfileSettings] = useState({
    whatsappNumber: '628123456789',
    address: 'Kecamatan Cilodong, Kota Depok, Jawa Barat',
    openingHours: '08:00 - 16:00 WIB'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    totalPatients: 0,
    bookingsByStatus: {
      MENUNGGU_PEMBAYARAN: 0,
      MENUNGGU_KONFIRMASI_ADMIN: 0,
      TERAPIS_DITUGASKAN: 0,
      DALAM_PERJALANAN: 0,
      SELESAI: 0,
      DIBATALKAN: 0
    },
    totalRevenue: 0
  });

  const fetchProducts = async () => {
    const productsRes = await apiFetch('/admin/products');
    if (productsRes && productsRes.products) {
      setProducts(productsRes.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        imageUrl: p.imageUrl || '',
        description: p.description || '',
        isActive: p.isActive
      })));
    }
  };

  const fetchServices = async () => {
    const servicesRes = await apiFetch('/services');
    if (servicesRes && servicesRes.services) {
      setServices(servicesRes.services.map((s: any) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        description: s.description || '',
        durationMin: s.durationMin || 0,
        isActive: s.isActive
      })));
    }
  };

  const fetchAllData = async () => {
    try {
      // 1. Summary
      const summaryRes = await apiFetch('/admin/dashboard/summary');
      if (summaryRes && summaryRes.summary) {
        setSummary(summaryRes.summary);
      }

      // 2. Bookings
      const bookingsRes = await apiFetch('/admin/bookings');
      if (bookingsRes && bookingsRes.bookings) {
        setBookings(bookingsRes.bookings.map(mapBackendBooking));
      }

      // 3. Therapists
      const therapistsRes = await apiFetch('/admin/therapists');
      if (therapistsRes && therapistsRes.therapists) {
        setTherapists(therapistsRes.therapists.map(mapBackendTherapist));
      }

      // 4. Products
      await fetchProducts();

      // 5. Services
      await fetchServices();

      // 6. Company Profile
      const profileRes = await apiFetch('/admin/company-profile');
      if (profileRes && profileRes.profile) {
        setProfileSettings({
          whatsappNumber: profileRes.profile.whatsappNumber || '',
          address: profileRes.profile.address || '',
          openingHours: profileRes.profile.openingHours || ''
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyinkronkan data.');
    }
  };

  useEffect(() => {
    if (loggedInAdmin) {
      setLoading(true);
      fetchAllData().finally(() => setLoading(false));
    }
  }, [loggedInAdmin]);

  const saveProfileSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiFetch('/admin/company-profile', {
        method: 'PUT',
        body: JSON.stringify({
          whatsappNumber: profileSettings.whatsappNumber,
          address: profileSettings.address,
          openingHours: profileSettings.openingHours
        })
      });
      alert('Pengaturan profil perusahaan berhasil disimpan!');
      await fetchAllData();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil perusahaan.');
    } finally {
      setLoading(false);
    }
  };

  // Therapist Operations
  const [showAddTherapistModal, setShowAddTherapistModal] = useState(false);
  const [newTherapistName, setNewTherapistName] = useState('');
  const [newTherapistGender, setNewTherapistGender] = useState<'LAKI_LAKI' | 'PEREMPUAN'>('LAKI_LAKI');
  const [newTherapistDayOff, setNewTherapistDayOff] = useState<string>('Tidak Ada');
  const [editingTherapistId, setEditingTherapistId] = useState<string | null>(null);

  const openEditTherapistModal = (t: Therapist) => {
    setEditingTherapistId(t.id);
    setNewTherapistName(t.name);
    setNewTherapistGender(t.gender);
    setNewTherapistDayOff(t.dayOff || 'Tidak Ada');
    setShowAddTherapistModal(true);
  };

  const handleCloseTherapistModal = () => {
    setShowAddTherapistModal(false);
    setNewTherapistName('');
    setNewTherapistGender('LAKI_LAKI');
    setNewTherapistDayOff('Tidak Ada');
    setEditingTherapistId(null);
    setError('');
  };

  const addTherapist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTherapistName) return;

    setLoading(true);
    setError('');
    try {
      if (editingTherapistId) {
        await apiFetch(`/admin/therapists/${editingTherapistId}`, {
          method: 'PUT',
          body: JSON.stringify({
            fullName: newTherapistName,
            gender: newTherapistGender,
            dayOff: newTherapistDayOff === 'Tidak Ada' ? '' : newTherapistDayOff
          })
        });
      } else {
        let finalName = newTherapistName;
        if (newTherapistGender === 'PEREMPUAN' && !finalName.startsWith('Ibu')) {
          finalName = 'Ibu ' + finalName;
        } else if (newTherapistGender === 'LAKI_LAKI' && !finalName.startsWith('Bpk.') && !finalName.startsWith('Pak')) {
          finalName = 'Bpk. ' + finalName;
        }

        await apiFetch('/admin/therapists', {
          method: 'POST',
          body: JSON.stringify({
            fullName: finalName,
            gender: newTherapistGender,
            dayOff: newTherapistDayOff === 'Tidak Ada' ? '' : newTherapistDayOff,
            isActive: true
          })
        });
      }

      await fetchAllData();
      handleCloseTherapistModal();
      alert(editingTherapistId ? 'Data terapis berhasil diperbarui!' : 'Terapis baru berhasil didaftarkan!');
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data terapis.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTherapistStatus = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const therapistObj = therapists.find(t => t.id === id);
      if (!therapistObj) return;

      const newActive = therapistObj.status !== 'AKTIF';
      await apiFetch(`/admin/therapists/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: newActive })
      });

      await fetchAllData();
      alert('Status terapis berhasil diperbarui!');
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui status terapis.');
    } finally {
      setLoading(false);
    }
  };

  // Booking operations
  const [selectedBookingForUpdate, setSelectedBookingForUpdate] = useState<Booking | null>(null);
  const [updateStatus, setUpdateStatus] = useState<Booking['status']>('MENUNGGU_KONFIRMASI_ADMIN');
  const [updateTherapist, setUpdateTherapist] = useState<string>('');
  const [updateNotes, setUpdateNotes] = useState<string>('');

  const handleBookingUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForUpdate) return;

    setLoading(true);
    setError('');
    try {
      const bookingId = selectedBookingForUpdate.id;

      // 1. If status changed
      if (updateStatus !== selectedBookingForUpdate.status) {
        await apiFetch(`/admin/bookings/${bookingId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: updateStatus })
        });
      }

      // 2. If therapist changed
      const selectedTherapistObj = therapists.find(t => t.name === updateTherapist);
      const currentTherapistObj = therapists.find(t => t.name === selectedBookingForUpdate.therapistName);

      if (updateTherapist && (!currentTherapistObj || selectedTherapistObj?.id !== currentTherapistObj.id)) {
        if (selectedTherapistObj) {
          await apiFetch(`/admin/bookings/${bookingId}/assign-therapist`, {
            method: 'PUT',
            body: JSON.stringify({ therapistId: selectedTherapistObj.id })
          });
        }
      }

      // 3. If progress note changed AND status is SELESAI
      if (updateStatus === 'SELESAI' && updateNotes !== selectedBookingForUpdate.progressNotes) {
        if (!updateNotes.trim()) {
          setError('Catatan perkembangan terapi wajib diisi saat status selesai.');
          setLoading(false);
          return;
        }
        await apiFetch(`/admin/bookings/${bookingId}/progress-note`, {
          method: 'POST',
          body: JSON.stringify({ notes: updateNotes })
        });
      }

      await fetchAllData();
      setSelectedBookingForUpdate(null);
      setUpdateTherapist('');
      setUpdateNotes('');
      setError('');
      alert('Booking berhasil diperbarui!');
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui booking.');
    } finally {
      setLoading(false);
    }
  };

  // Product Operations
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState<number>(0);
  const [productDescription, setProductDescription] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductName('');
    setProductPrice(0);
    setProductDescription('');
    setProductImageUrl('');
    setError('');
    setShowProductModal(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setProductName(p.name);
    setProductPrice(p.price);
    setProductDescription(p.description || '');
    setProductImageUrl(p.imageUrl || '');
    setError('');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productName.trim()) {
      setError('Nama produk wajib diisi.');
      return;
    }
    if (!productPrice || productPrice <= 0) {
      setError('Harga produk harus lebih besar dari 0.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const bodyPayload = {
        name: productName.trim(),
        price: productPrice,
        description: productDescription.trim(),
        imageUrl: productImageUrl.trim(),
        isActive: editingProduct ? editingProduct.isActive : true
      };

      if (editingProduct) {
        // Edit existing product
        await apiFetch(`/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(bodyPayload)
        });
        alert('Produk berhasil diperbarui!');
      } else {
        // Add new product
        await apiFetch('/admin/products', {
          method: 'POST',
          body: JSON.stringify(bodyPayload)
        });
        alert('Produk baru berhasil ditambahkan!');
      }

      await fetchProducts();
      setShowProductModal(false);
      setProductName('');
      setProductPrice(0);
      setProductDescription('');
      setProductImageUrl('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan produk.');
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (p: Product) => {
    setLoading(true);
    setError('');
    try {
      const newActive = !p.isActive;
      await apiFetch(`/admin/products/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: newActive })
      });
      await fetchAllData();
      alert(`Status produk berhasil diperbarui!`);
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui status produk.');
    } finally {
      setLoading(false);
    }
  };

  const openAddServiceModal = () => {
    setEditingService(null);
    setServiceName('');
    setServiceDescription('');
    setServiceDuration(60);
    setServicePrice(0);
    setShowServiceModal(true);
    setError('');
  };

  const openEditServiceModal = (s: any) => {
    setEditingService(s);
    setServiceName(s.name);
    setServiceDescription(s.description || '');
    setServiceDuration(s.durationMin || 60);
    setServicePrice(s.price);
    setShowServiceModal(true);
    setError('');
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !serviceName.trim()) {
      setError('Nama layanan wajib diisi.');
      return;
    }
    if (servicePrice <= 0) {
      setError('Harga layanan harus lebih besar dari 0.');
      return;
    }
    if (serviceDuration <= 0) {
      setError('Durasi layanan harus lebih besar dari 0.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        name: serviceName.trim(),
        description: serviceDescription.trim(),
        durationMin: Number(serviceDuration),
        price: Number(servicePrice)
      };

      if (editingService) {
        await apiFetch(`/admin/services/${editingService.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        alert('Layanan berhasil diperbarui!');
      } else {
        await apiFetch('/admin/services', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        alert('Layanan baru berhasil ditambahkan!');
      }

      await fetchServices();
      setShowServiceModal(false);
      setEditingService(null);
      setServiceName('');
      setServiceDescription('');
      setServiceDuration(60);
      setServicePrice(0);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data layanan.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus layanan ini?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiFetch(`/admin/services/${id}`, {
        method: 'DELETE'
      });
      alert('Layanan berhasil dihapus!');
      await fetchServices();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus layanan.');
      alert(err.message || 'Gagal menghapus layanan.');
    } finally {
      setLoading(false);
    }
  };


  // Overview stats mapping from REST API Summary
  const totalPasien = summary.totalPatients;
  const bookingWaiting = summary.bookingsByStatus.MENUNGGU_KONFIRMASI_ADMIN;
  const bookingCompleted = summary.bookingsByStatus.SELESAI;
  const estimatedIncome = summary.totalRevenue;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100 font-sans">
      
      {/* 1. Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between space-y-8 flex-shrink-0 text-left">
        <div className="space-y-8">
          
          {/* Admin Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 text-slate-950 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="font-black text-sm tracking-tight text-slate-100">Portal Admin</h2>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mt-0.5">Super Admin</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-left">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Petugas Aktif,</p>
            <h3 className="font-extrabold text-xs text-emerald-400 mt-0.5">{loggedInAdmin}</h3>
          </div>

          {/* Sidebar Menu Buttons */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => { setActiveMenu('overview'); setError(''); }}
              className={`flex items-center gap-3 py-3.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none ${activeMenu === 'overview' ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/5' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <TrendingUp size={16} />
              Ringkasan Operasional
            </button>
            
            <button
              onClick={() => { setActiveMenu('bookings'); setError(''); }}
              className={`flex items-center justify-between py-3.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none ${activeMenu === 'bookings' ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/5' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <span className="flex items-center gap-3">
                <BookOpen size={16} />
                Manajemen Booking
              </span>
              {bookingWaiting > 0 && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${activeMenu === 'bookings' ? 'bg-slate-950 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'}`}>
                  {bookingWaiting} NEW
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveMenu('therapists'); setError(''); }}
              className={`flex items-center gap-3 py-3.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none ${activeMenu === 'therapists' ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/5' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <UserCheck size={16} />
              Master Data Terapis
            </button>

            <button
              onClick={() => { setActiveMenu('services'); setError(''); }}
              className={`flex items-center gap-3 py-3.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none ${activeMenu === 'services' ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/5' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <Heart size={16} />
              Master Data Layanan
            </button>

            <button
              onClick={() => { setActiveMenu('content'); setError(''); }}
              className={`flex items-center gap-3 py-3.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 focus:outline-none ${activeMenu === 'content' ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/5' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
            >
              <Settings size={16} />
              Manajemen Konten
            </button>
          </nav>
        </div>

        {/* Logout */}
        <div className="pt-6 border-t border-slate-800">
          <button
            onClick={() => { onLogout(); navigate('/'); }}
            className="w-full flex items-center justify-center gap-2 py-3 border border-red-500/20 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-bold text-xs rounded-xl transition-all duration-200 focus:outline-none"
          >
            <LogOut size={16} />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* 2. Main Analytics Panel */}
      <main className="flex-grow p-6 md:p-10 max-w-6xl mx-auto w-full relative overflow-y-auto">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-emerald-400 font-bold">Memproses data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-2xl font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => setError('')} 
              className="text-red-400 hover:text-red-300 font-bold transition-colors focus:outline-none"
            >
              Tutup
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* TAB 1: OVERVIEW */}
          {activeMenu === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 text-left"
            >
              {/* Head Section */}
              <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Metrik Ringkasan Operasional</h1>
                  <p className="text-xs text-slate-400">Analisis sekilas performa transaksi dan status operasional totok punggung.</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">REAL-TIME SYNCED</span>
              </div>

              {/* Grid Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Total Patients */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1.5 z-10">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Pasien</span>
                    <h3 className="text-3xl font-black text-slate-100">{totalPasien}</h3>
                    <span className="text-[9px] font-bold text-emerald-400">+4.8% vs bulan lalu</span>
                  </div>
                  <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl z-10">
                    <Users size={22} />
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                </div>

                {/* 2. Waiting Booking */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1.5 z-10">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Booking Menunggu</span>
                    <h3 className="text-3xl font-black text-amber-500">{bookingWaiting}</h3>
                    <span className="text-[9px] font-bold text-slate-500">Perlu tindak lanjut admin</span>
                  </div>
                  <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl z-10">
                    <Clock size={22} />
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
                </div>

                {/* 3. Completed Booking */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1.5 z-10">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Booking Selesai</span>
                    <h3 className="text-3xl font-black text-slate-100">{bookingCompleted + 1}</h3>
                    <span className="text-[9px] font-bold text-emerald-400">+12 Sesi minggu ini</span>
                  </div>
                  <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl z-10">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                </div>

                {/* 4. Estimated income */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-md flex items-center justify-between relative overflow-hidden">
                  <div className="space-y-1.5 z-10">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Estimasi Omzet</span>
                    <h3 className="text-xl font-black text-emerald-400 leading-tight">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(estimatedIncome)}
                    </h3>
                    <span className="text-[9px] font-bold text-emerald-400">+18.2% vs target</span>
                  </div>
                  <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl z-10">
                    <DollarSign size={22} />
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                </div>

              </div>

              {/* Informative Admin Notice */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <h4 className="font-extrabold text-sm text-slate-100">Petunjuk Sinkronisasi Real-Time</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-400 leading-relaxed font-semibold">
                  <div className="space-y-2">
                    <p className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      Semua pemesanan yang dibuat oleh pasien di halaman dashboard pasien akan otomatis masuk di tabel **Manajemen Booking** admin.
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      Pembaruan status pemesanan, penugasan terapis, dan catatan medis/perkembangan yang dimasukkan di sini akan langsung dikirim dan di-render di dashboard pasien.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      Gunakan browser untuk masuk ke tab Dashboard Pasien di localhost, lakukan pesanan baru, lalu kembali ke Dashboard Admin untuk memprosesnya.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: BOOKINGS */}
          {activeMenu === 'bookings' && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div className="border-b border-slate-800 pb-6">
                <h1 className="text-2xl font-black tracking-tight text-slate-100">Manajemen Booking Pasien</h1>
                <p className="text-xs text-slate-400">Kelola konfirmasi, alokasi terapis, dan status terapi pasien.</p>
              </div>

              {bookings.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <BookOpen size={48} className="text-slate-700" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-300">Belum Ada Pesanan Masuk</h3>
                    <p className="text-xs text-slate-500 max-w-sm">Jadwal booking yang dibuat pasien secara otomatis akan terdaftar di sini.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-800/50 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-4 px-6">ID / Layanan</th>
                          <th className="py-4 px-6">Pasien</th>
                          <th className="py-4 px-6">Jadwal Slot</th>
                          <th className="py-4 px-6">Terapis</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6">Total Harga</th>
                          <th className="py-4 px-6 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                        {bookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-850 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-extrabold text-slate-200">{b.serviceName}</div>
                              <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase block mt-1">CODE: {b.id}</span>
                              {b.products.length > 0 && (
                                <div className="flex gap-1.5 flex-wrap mt-1.5">
                                  {b.products.map((p, i) => (
                                    <span key={i} className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/15">{p}</span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-200">{b.patientName}</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] font-semibold text-slate-400">{b.patientPhone}</span>
                                {b.patientPhone && (
                                  <a
                                    href={`https://wa.me/${b.patientPhone.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Halo%20${encodeURIComponent(b.patientName || 'Pasien')},%20kami%20dari%20Sahaja%20ingin%20mengonfirmasi%20terkait%20pemesanan%20terapi%20Anda.`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center p-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded transition-colors"
                                    title="Hubungi via WhatsApp"
                                  >
                                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.503-5.714-1.458L0 24zm6.208-4.225l.322.192c1.62.962 3.538 1.471 5.485 1.472 5.518 0 10.009-4.49 10.014-10.013.002-2.677-1.039-5.192-2.932-7.087-1.895-1.895-4.41-2.934-7.086-2.936-5.524 0-10.014 4.492-10.018 10.015-.002 1.848.484 3.655 1.411 5.234l.21.356-.994 3.633 3.717-.975zm10.741-5.72c-.293-.146-1.737-.857-2.005-.955-.268-.099-.463-.146-.658.146-.195.293-.755.955-.927 1.15-.171.196-.341.22-.634.073-.293-.146-1.237-.456-2.356-1.455-.87-.777-1.458-1.738-1.628-2.03-.171-.293-.018-.452.129-.597.132-.13.293-.341.439-.512.146-.171.195-.293.293-.488.098-.195.049-.366-.024-.512-.073-.146-.658-1.586-.902-2.172-.237-.573-.479-.496-.658-.505-.17-.008-.365-.009-.56-.009-.195 0-.512.073-.78.366-.268.293-1.024 1.001-1.024 2.44 0 1.439 1.048 2.83 1.195 3.025.146.195 2.062 3.149 4.996 4.413.698.301 1.243.481 1.668.616.7.223 1.338.192 1.843.116.563-.085 1.737-.708 1.981-1.391.243-.684.243-1.27.171-1.391-.072-.121-.268-.195-.561-.341z" />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 font-semibold">
                              <div>{new Date(b.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                              <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 block">Jam {b.time} WIB</span>
                            </td>
                            <td className="py-4 px-6 font-bold text-emerald-400">
                              {b.therapistName || <span className="text-slate-500 font-medium italic">Belum Ditugaskan</span>}
                            </td>
                            <td className="py-4 px-6">
                              {b.status === 'MENUNGGU_KONFIRMASI_ADMIN' && <span className="inline-block bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold py-0.5 px-2 rounded-full">Menunggu Konfirmasi</span>}
                              {b.status === 'TERAPIS_DITUGASKAN' && <span className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold py-0.5 px-2 rounded-full">Terapis Ditugaskan</span>}
                              {b.status === 'SELESAI' && <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold py-0.5 px-2 rounded-full">Selesai</span>}
                              {b.status === 'DIBATALKAN' && <span className="inline-block bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold py-0.5 px-2 rounded-full">Dibatalkan</span>}
                            </td>
                            <td className="py-4 px-6 font-extrabold text-slate-200">
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(b.price)}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => {
                                  setSelectedBookingForUpdate(b);
                                  setUpdateStatus(b.status);
                                  setUpdateTherapist(b.therapistName || '');
                                  setUpdateNotes(b.progressNotes || '');
                                }}
                                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors border border-slate-700 focus:outline-none"
                              >
                                <Edit2 size={12} />
                                Kelola
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: THERAPISTS */}
          {activeMenu === 'therapists' && (
            <motion.div
              key="therapists"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Master Data Terapis</h1>
                  <p className="text-xs text-slate-400">Database pendaftaran terapis dan status operasional aktif.</p>
                </div>
                <button
                  onClick={() => setShowAddTherapistModal(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow focus:outline-none"
                >
                  <Plus size={16} />
                  Tambah Terapis
                </button>
              </div>

              {/* Therapists Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/50 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-6">ID / Nama Terapis</th>
                        <th className="py-4 px-6">Jenis Kelamin</th>
                        <th className="py-4 px-6">Hari Libur</th>
                        <th className="py-4 px-6">Status Keaktifan</th>
                        <th className="py-4 px-6 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                      {therapists.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-850 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-200">{t.name}</td>
                          <td className="py-4 px-6 font-semibold">
                            {t.gender === 'LAKI_LAKI' ? 'Pria' : 'Wanita'}
                          </td>
                          <td className="py-4 px-6 font-semibold text-amber-400">
                            {t.dayOff || <span className="text-slate-500 italic">Tidak Ada</span>}
                          </td>
                          <td className="py-4 px-6">
                            {t.status === 'AKTIF' ? (
                              <span className="inline-block bg-green-500/10 border border-green-500/20 text-emerald-400 text-[10px] font-bold py-0.5 px-2 rounded-full">Aktif</span>
                            ) : (
                              <span className="inline-block bg-slate-800 border border-slate-700 text-slate-500 text-[10px] font-bold py-0.5 px-2 rounded-full">Nonaktif</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right flex justify-end gap-2">
                            <button
                              onClick={() => openEditTherapistModal(t)}
                              className="text-[10px] font-bold py-1.5 px-3 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 bg-slate-900 focus:outline-none"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => toggleTherapistStatus(t.id)}
                              className={`
                                text-[10px] font-bold py-1.5 px-3 rounded-lg border transition-colors focus:outline-none
                                ${t.status === 'AKTIF'
                                  ? 'border-red-500/20 hover:bg-red-500/10 text-red-400 bg-red-500/5'
                                  : 'border-slate-700 hover:bg-slate-800 text-emerald-400 bg-slate-900'
                                }
                              `}
                            >
                              {t.status === 'AKTIF' ? 'Deaktifkan' : 'Aktifkan'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: CONTENT */}
          {activeMenu === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8 text-left"
            >
              <div className="border-b border-slate-800 pb-6">
                <h1 className="text-2xl font-black tracking-tight text-slate-100">Manajemen Konten & Landing Page</h1>
                <p className="text-xs text-slate-400">Pengaturan profil perusahaan, data harga produk add-on, dan kurasi ulasan.</p>
              </div>

              {/* Grid Forms */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. Company Profile Form */}
                <form onSubmit={saveProfileSettings} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                  <h3 className="font-extrabold text-sm text-emerald-400 uppercase tracking-wider">Pengaturan Profil Perusahaan</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nomor WhatsApp CS</label>
                      <input
                        type="text"
                        required
                        value={profileSettings.whatsappNumber}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                        className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Jam Buka Layanan</label>
                      <input
                        type="text"
                        required
                        value={profileSettings.openingHours}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, openingHours: e.target.value }))}
                        className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Alamat Kantor</label>
                      <textarea
                        rows={3}
                        required
                        value={profileSettings.address}
                        onChange={(e) => setProfileSettings(prev => ({ ...prev, address: e.target.value }))}
                        className="block w-full px-4 py-3 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2.5 px-6 rounded-full shadow transition-all focus:outline-none"
                    >
                      Simpan Profil
                    </button>
                  </div>
                </form>

                {/* 2. Master Data Produk (Dynamic List & Table) */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-emerald-400 uppercase tracking-wider">Master Data Produk Herbal (Add-on)</h3>
                    <button
                      type="button"
                      onClick={openAddProductModal}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow focus:outline-none"
                    >
                      <Plus size={16} />
                      Tambah Produk Baru
                    </button>
                  </div>
                  
                  <div className="overflow-hidden rounded-2xl border border-slate-800">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-800/50 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-4 px-6">Foto / Nama Produk</th>
                            <th className="py-4 px-6">Harga</th>
                            <th className="py-4 px-6">Deskripsi</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                          {products.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-850 transition-colors">
                              <td className="py-4 px-6 flex items-center gap-3">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-slate-750" />
                                ) : (
                                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-750 text-slate-500 font-bold">P</div>
                                )}
                                <span className="font-bold text-slate-200">{p.name}</span>
                              </td>
                              <td className="py-4 px-6 font-extrabold text-emerald-400">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p.price)}
                              </td>
                              <td className="py-4 px-6 text-slate-400 max-w-[200px] truncate" title={p.description}>
                                {p.description || '-'}
                              </td>
                              <td className="py-4 px-6">
                                {p.isActive ? (
                                  <span className="inline-block bg-green-500/10 border border-green-500/20 text-emerald-400 text-[10px] font-bold py-0.5 px-2 rounded-full">Aktif</span>
                                ) : (
                                  <span className="inline-block bg-slate-800 border border-slate-700 text-slate-500 text-[10px] font-bold py-0.5 px-2 rounded-full">Nonaktif</span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => openEditProductModal(p)}
                                  className="text-[10px] font-bold py-1 px-2.5 rounded bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleProductStatus(p)}
                                  className={`
                                    text-[10px] font-bold py-1 px-2.5 rounded border transition-colors focus:outline-none
                                    ${p.isActive
                                      ? 'border-red-500/20 hover:bg-red-500/10 text-red-400 bg-red-500/5'
                                      : 'border-slate-700 hover:bg-slate-800 text-emerald-400 bg-slate-900'
                                    }
                                  `}
                                >
                                  {p.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 5: SERVICES */}
          {activeMenu === 'services' && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Master Data Layanan Utama</h1>
                  <p className="text-xs text-slate-400">Atur harga operasional untuk layanan totok punggung Sahaja secara dinamis.</p>
                </div>
                <button
                  type="button"
                  onClick={openAddServiceModal}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow focus:outline-none"
                >
                  <Plus size={16} />
                  Tambah Layanan Baru
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/50 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Nama Layanan</th>
                        <th className="py-4 px-6">Deskripsi</th>
                        <th className="py-4 px-6">Durasi</th>
                        <th className="py-4 px-6 font-semibold">Harga Saat Ini</th>
                        <th className="py-4 px-6 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                      {services.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-850 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-200">{s.name}</td>
                          <td className="py-4 px-6 text-slate-400 max-w-[300px] leading-relaxed whitespace-pre-wrap">{s.description || '-'}</td>
                          <td className="py-4 px-6 font-semibold text-amber-400">{s.durationMin} Menit</td>
                          <td className="py-4 px-6 font-extrabold text-emerald-400">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(s.price)}
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => openEditServiceModal(s)}
                              className="text-[10px] font-bold py-1.5 px-3 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 bg-slate-900 focus:outline-none"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteService(s.id)}
                              className="text-[10px] font-bold py-1.5 px-3 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 bg-red-500/5 focus:outline-none"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 5. MODAL: ADD THERAPIST FORM */}
      {showAddTherapistModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative text-left">
            <button
              onClick={handleCloseTherapistModal}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-100 p-1.5 rounded-full transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-emerald-400">
                  {editingTherapistId ? 'Edit Data Terapis' : 'Daftar Terapis Baru'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingTherapistId ? 'Perbarui data operasional dan ketersediaan terapis.' : 'Tambahkan berkas terapis berlisensi ke dalam data operasional.'}
                </p>
              </div>

              <form onSubmit={addTherapist} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap Terapis</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bpk. Junaidi"
                    value={newTherapistName}
                    onChange={(e) => setNewTherapistName(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Kelamin</label>
                  <select
                    required
                    value={newTherapistGender}
                    onChange={(e) => setNewTherapistGender(e.target.value as Therapist['gender'])}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  >
                    <option value="LAKI_LAKI">Pria</option>
                    <option value="PEREMPUAN">Wanita</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hari Libur Rutin</label>
                  <select
                    required
                    value={newTherapistDayOff}
                    onChange={(e) => setNewTherapistDayOff(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  >
                    <option value="Tidak Ada">Tidak Ada</option>
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                    <option value="Minggu">Minggu</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseTherapistModal}
                    className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs font-bold py-3 rounded-full transition-colors focus:outline-none text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-3 rounded-full shadow-lg shadow-emerald-500/10 transition-colors focus:outline-none"
                  >
                    {editingTherapistId ? 'Simpan Perubahan' : 'Daftar Terapis'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: MANAGE/UPDATE BOOKING STATUS */}
      {selectedBookingForUpdate && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative text-left">
            <button
              onClick={() => { setSelectedBookingForUpdate(null); setError(''); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-100 p-1.5 rounded-full transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-emerald-400">Kelola Pemesanan Pasien</h3>
                <p className="text-[11px] text-slate-500">Perbarui status booking, tugaskan terapis, dan masukkan catatan rekam medis.</p>
              </div>

              <form onSubmit={handleBookingUpdateSubmit} className="space-y-4">
                
                {/* 1. Status Selection */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Pemesanan</label>
                  <select
                    required
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value as Booking['status'])}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  >
                    <option value="MENUNGGU_PEMBAYARAN">Menunggu Pembayaran</option>
                    <option value="MENUNGGU_KONFIRMASI_ADMIN">Menunggu Konfirmasi Admin</option>
                    <option value="TERAPIS_DITUGASKAN">Terapis Ditugaskan</option>
                    <option value="SELESAI">Selesai</option>
                    <option value="DIBATALKAN">Dibatalkan</option>
                  </select>
                </div>

                {/* 2. Assign Therapist selection */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tugaskan Terapis</label>
                  <select
                    value={updateTherapist}
                    onChange={(e) => setUpdateTherapist(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  >
                    <option value="">-- Pilih Terapis --</option>
                    {therapists.map(t => (
                      <option key={t.id} value={t.name}>{t.name} ({t.gender === 'LAKI_LAKI' ? 'Pria' : 'Wanita'})</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 block leading-tight">Harap sesuaikan gender terapis dengan jenis kelamin pasien demi adab syar'i.</span>
                </div>

                {/* 3. Therapy Progress Notes (Conditional & Required only when SELESAI) */}
                {updateStatus === 'SELESAI' && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan Perkembangan Terapi</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Sumbatan bagian belikat telah terurai, dst. Catatan ini akan tampil di dashboard pasien saat status Selesai."
                      value={updateNotes}
                      onChange={(e) => setUpdateNotes(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-slate-700 font-medium"
                    />
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedBookingForUpdate(null); setError(''); }}
                    className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs font-bold py-3 rounded-full transition-colors focus:outline-none text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-3 rounded-full shadow transition-all focus:outline-none"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: ADD/EDIT PRODUCT FORM */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative text-left">
            <button
              onClick={() => { setShowProductModal(false); setError(''); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-100 p-1.5 rounded-full transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-emerald-400">
                  {editingProduct ? 'Ubah Detail Produk' : 'Tambah Produk Baru'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingProduct ? 'Perbarui informasi produk herbal di katalog.' : 'Daftarkan produk herbal baru ke dalam katalog.'}
                </p>
              </div>

              {/* Error message inside the modal */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0 animate-pulse" />
                    <span>{error}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setError('')} 
                    className="text-red-400 hover:text-red-300 font-bold transition-colors focus:outline-none"
                  >
                    Tutup
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Produk</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Minyak Herba Sinergi"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Harga (Rupiah)</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 45000"
                    value={productPrice || ''}
                    onChange={(e) => setProductPrice(parseInt(e.target.value) || 0)}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi Lengkap</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Membantu meredakan pegal linu..."
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link URL Foto</label>
                  <input
                    type="text"
                    placeholder="https://example.com/foto-produk.png"
                    value={productImageUrl}
                    onChange={(e) => setProductImageUrl(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowProductModal(false); setError(''); }}
                    className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs font-bold py-3 rounded-full transition-colors focus:outline-none text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-3 rounded-full shadow transition-all focus:outline-none"
                  >
                    {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: CREATE/EDIT SERVICE */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative text-left">
            <button
              onClick={() => { setShowServiceModal(false); setEditingService(null); setError(''); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-100 p-1.5 rounded-full transition-colors focus:outline-none"
            >
              <X size={20} />
            </button>

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-emerald-400">
                  {editingService ? 'Ubah Detail Layanan' : 'Tambah Layanan Baru'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingService ? 'Perbarui informasi dan harga layanan.' : 'Daftarkan layanan terapi totok punggung baru.'}
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0 animate-pulse" />
                    <span>{error}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setError('')} 
                    className="text-red-400 hover:text-red-300 font-bold transition-colors focus:outline-none"
                  >
                    Tutup
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveService} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Layanan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Terapi Totok Punggung"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi Layanan</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Terapi menyeluruh pada bagian punggung..."
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Durasi (Menit)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 60"
                      value={serviceDuration || ''}
                      onChange={(e) => setServiceDuration(parseInt(e.target.value) || 0)}
                      className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Harga (Rupiah)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 200000"
                      value={servicePrice || ''}
                      onChange={(e) => setServicePrice(parseInt(e.target.value) || 0)}
                      className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowServiceModal(false); setEditingService(null); setError(''); }}
                    className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs font-bold py-3 rounded-full transition-colors focus:outline-none text-center"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-3 rounded-full shadow transition-all focus:outline-none"
                  >
                    {editingService ? 'Simpan Perubahan' : 'Tambah Layanan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
