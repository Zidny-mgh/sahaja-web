import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Clock,
  ChevronRight,
  Check,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import depanImg from '../assets/depan.webp';
import pijatImg from '../assets/pijat tradisional.webp';
import detoxImg from '../assets/detox.webp';
import syariImg from "../assets/syar'i.webp";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Parallax Background Animation variables
  const { scrollY } = useScroll();
  const yBlob1 = useTransform(scrollY, [0, 2000], [0, -250]);
  const yBlob2 = useTransform(scrollY, [0, 2000], [0, -450]);
  const yBlob3 = useTransform(scrollY, [0, 2000], [0, -150]);

  const [services, setServices] = useState<any[]>([
    {
      id: 's1',
      name: 'Terapi Totok Punggung',
      price: 200000,
      duration: 60,
      description: 'Terapi menyeluruh pada bagian punggung untuk menstimulasi titik saraf, melancarkan peredaran darah, meningkatkan kekebalan tubuh, dan meredakan ketegangan otot kronis.',
      features: ['Pemeriksaan Titik Sumbatan', 'Terapi Punggung Menyeluruh', 'Relaksasi Akhir', 'Konsultasi Pasca Terapi'],
    },
    {
      id: 's2',
      name: 'Terapi Totok Punggung + Bekam',
      price: 340000,
      duration: 60,
      description: 'Kombinasi terapi totok punggung dengan bekam syar\'i untuk melancarkan sirkulasi darah dan mengeluarkan angin.',
      features: ['Pemeriksaan Fokus Sumbatan', 'Terapi Bekam & Totok', 'Relaksasi Akhir'],
    },
    {
      id: 's3',
      name: 'Terapi Totok Anak (Di bawah 5 Tahun)',
      price: 250000,
      duration: 45,
      description: 'Terapi totok punggung lembut yang dirancang khusus untuk mengoptimalkan tumbuh kembang anak di bawah 5 tahun.',
      features: ['Penanganan Lembut Anak', 'Konsultasi Tumbuh Kembang', 'Stimulasi Saraf Anak'],
    },
  ]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await apiFetch('/services');
        if (res && res.services) {
          const mapped = res.services.map((s: any) => {
            let features = ['Pemeriksaan Titik Sumbatan', 'Terapi Punggung Menyeluruh', 'Relaksasi Akhir'];
            if (s.id === 's2') {
              features = ['Pemeriksaan Fokus Sumbatan', 'Terapi Bekam & Totok', 'Relaksasi Akhir'];
            } else if (s.id === 's3') {
              features = ['Penanganan Lembut Anak', 'Konsultasi Tumbuh Kembang', 'Stimulasi Saraf Anak'];
            }
            return {
              id: s.id,
              name: s.name,
              price: Number(s.price),
              duration: s.durationMin || 60,
              description: s.description || '',
              features
            };
          });
          setServices(mapped);
        }
      } catch (err) {
        console.error('Gagal mengambil data layanan:', err);
      }
    };
    fetchServices();
  }, []);


  const reviews = [
    {
      name: 'Ibu Rahma',
      age: 45,
      city: 'Jakarta',
      rating: 5,
      comment: 'Sangat puas dengan layanannya! Terapisnya ramah, tepat waktu, dan sangat paham masalah punggung saya. Setelah diterapi, tidur saya jadi nyenyak.',
    },
    {
      name: 'Bpk. Danang',
      age: 33,
      city: 'Depok',
      rating: 5,
      comment: 'Awalnya iseng coba home-service karena punggung kaku akibat WFH. Ternyata praktis banget, nggak perlu macet-macetan keluar rumah. Sangat recommended!',
    },
    {
      name: 'Ibu Fitri',
      age: 29,
      city: 'Tangerang',
      rating: 5,
      comment: 'Anak saya susah tidur dan sering kembung. Setelah diterapi totok punggung anak di rumah, badannya jadi lebih segar dan nafsu makannya naik.',
    },
  ];


  const handleBooking = () => {
    navigate('/dashboard-pasien');
  };


  const faqData = [
    {
      question: "Apakah terapisnya bisa disesuaikan dengan jenis kelamin?",
      answer: "Ya, kami menjamin terapis pria untuk pasien pria, dan terapis wanita untuk pasien wanita demi kenyamanan dan kesesuaian adab syar'i."
    },
    {
      question: "Apakah terapis sudah tersertifikasi resmi?",
      answer: "Seluruh terapis Totok Punggung Sahaja telah memiliki sertifikasi resmi dari lembaga BNSP dan berpengalaman luas di bidang terapi stimulasi saraf."
    },
    {
      question: "Bagaimana protokol kebersihan yang diterapkan?",
      answer: "Terapis kami mematuhi protokol kesehatan ketat, selalu mencuci tangan sebelum & sesudah tindakan, memakai masker, serta memastikan seluruh peralatan bersih & steril."
    },
    {
      question: "Apakah saya bisa menjadwalkan ulang (ubah jadwal) terapi?",
      answer: "Tentu saja. Anda dapat melakukan ubah jadwal secara mandiri melalui halaman dashboard maksimal H-1 sebelum jadwal terapi. Layanan ubah jadwal ini gratis dan dibatasi maksimal 2 kali."
    }
  ];

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % reviews.length);
  };

  return (
    <div className="space-y-24 pb-20 relative">
      {/* Decorative Parallax Background Orbs */}
      <motion.div 
        style={{ y: yBlob1 }}
        className="absolute top-48 left-10 w-72 h-72 rounded-full bg-[#384e31]/5 blur-3xl pointer-events-none -z-20"
      />
      <motion.div 
        style={{ y: yBlob2 }}
        className="absolute top-[40%] -right-20 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none -z-20"
      />
      <motion.div 
        style={{ y: yBlob3 }}
        className="absolute top-[75%] left-5 w-80 h-80 rounded-full bg-[#384e31]/5 blur-3xl pointer-events-none -z-20"
      />
      
      {/* 1. Hero Section */}
      <section id="hero" className="relative overflow-hidden pt-8 md:pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <h1 className="text-6xl sm:text-7xl lg:text-[5.5rem] font-extrabold text-dark-neutral leading-none tracking-tight">
              Perawatan Syar'i yang Aman dan Modern, <span className="text-[#384e31] block mt-1">Langsung ke Rumah Anda.</span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg text-dark-neutral/70 leading-relaxed max-w-xl font-medium pt-2">
              Layanan totok punggung & bekam syar'i. Terapis sesuai gender, jadwal otomatis, dan herbal alami. Anda cukup istirahat, biar kami yang datang.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                id="btn-hero-booking"
                onClick={handleBooking}
                className="bg-[#384e31] hover:bg-[#2a3b25] text-white text-sm font-bold py-4 px-8 rounded-full shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2 focus:outline-none"
              >
                Pesan Sekarang
                <ArrowRight size={18} />
              </button>
              <a
                href="#tentang"
                className="border border-accent/80 hover:bg-accent/15 text-dark-neutral text-sm font-bold py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none"
              >
                Lihat cara kerja
              </a>
            </div>
          </div>

          {/* Hero Image & Badge */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              {/* Outer soft background accent */}
              <div className="absolute -inset-4 bg-[#384e31]/5 rounded-[3rem] -z-10 blur-xl" />
              
              {/* Image Frame */}
              <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-accent/20">
                <img 
                  src={depanImg} 
                  alt="Terapi Relaksasi Totok Punggung Sahaja"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Overlapping Floating Badge */}
              <div className="absolute -bottom-6 -left-6 sm:left-4 bg-white rounded-2xl shadow-xl p-4 border border-accent/20 flex items-center gap-3.5 max-w-[280px] animate-in slide-in-from-bottom-5 duration-700">
                <div className="w-10 h-10 bg-[#384e31]/10 text-[#384e31] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.85.85 2.23.85 3.08 0L15 8" />
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-sm text-dark-neutral leading-tight">2.000+ sesi</h4>
                  <p className="text-[10px] font-semibold text-dark-neutral/60 mt-0.5">Dilayani dengan penuh adab</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Profil Singkat & Galeri Section */}
      <section id="tentang" className="bg-[#b99d7b]/10 py-16 border-y border-[#b99d7b]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-black text-[#384e31]">Profil Totok Punggung Sahaja</h2>
            <p className="text-xs text-dark-neutral/70 leading-relaxed">
              Mengenal lebih dekat platform terapi kesehatan home-service terintegrasi yang berkomitmen menjaga kebugaran tubuh Anda dengan prinsip pengobatan alami.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6 text-left">
              <h3 className="text-xl font-bold text-[#384e31]">Metode Alami & Berkelanjutan</h3>
              <p className="text-xs text-dark-neutral/80 leading-relaxed">
                Totok Punggung adalah metode terapi stimulasi saraf pada punggung dengan cara menekan titik-titik sumbatan aliran darah. Punggung merupakan pusat saraf pusat yang menghubungkan otak dengan organ tubuh bagian dalam. Dengan mengurai sumbatan di punggung, sirkulasi oksigen dan nutrisi dalam tubuh kembali lancar, memicu fungsi regenerasi organ tubuh secara mandiri.
              </p>
              <p className="text-xs text-dark-neutral/80 leading-relaxed">
                Kami di **Totok Punggung Sahaja** menyatukan kemudahan teknologi booking online dengan keaslian metode terapi tradisional agar Anda bisa menikmati layanan pemulihan tubuh terbaik langsung di rumah.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-[#b99d7b]/20 p-4 rounded-2xl">
                  <h4 className="font-extrabold text-sm text-[#384e31] mb-1">Misi Kami</h4>
                  <p className="text-[10px] text-dark-neutral/60 leading-normal">
                    Menyediakan pengobatan alami alternatif yang aman, terstandarisasi, dan mudah diakses dari rumah.
                  </p>
                </div>
                <div className="bg-white border border-[#b99d7b]/20 p-4 rounded-2xl">
                  <h4 className="font-extrabold text-sm text-[#384e31] mb-1">Standar Higienis</h4>
                  <p className="text-[10px] text-dark-neutral/60 leading-normal">
                    Terapis kami patuh protokol kebersihan, mencuci tangan, dan menggunakan perlengkapan bersih.
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="space-y-4">
              <h3 className="text-center lg:text-left text-sm font-bold text-[#384e31] tracking-wider uppercase">Galeri Kegiatan Kami</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { id: 1, url: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=500&auto=format&fit=crop", tag: "Terapi Punggung" },
                  { id: 2, url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=500&auto=format&fit=crop", tag: "Relaksasi Tubuh" },
                  { id: 3, url: pijatImg, tag: "Pijat Tradisional" },
                  { id: 4, url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=500&auto=format&fit=crop", tag: "Minyak Herbal" },
                  { id: 5, url: detoxImg, tag: "Detoks Teh" },
                  { id: 6, url: syariImg, tag: "SYAR'I" },
                ].map((item) => (
                  <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-[#b99d7b]/40 transition-all duration-300 hover:shadow-xl">
                    <img
                      src={item.url}
                      alt={item.tag}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-dark-neutral/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3 text-center">
                      <span className="text-[10px] font-bold text-background uppercase tracking-widest">{item.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section Layanan */}
      <section id="layanan" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-black text-[#384e31]">Pilihan Layanan Terapi</h2>
          <p className="text-xs text-dark-neutral/70 leading-relaxed">
            Dapatkan kenyamanan terapi totok punggung home-service dengan harga terjangkau dan penanganan terapis yang tepercaya.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-accent/30 hover:border-[#384e31]/40 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="space-y-6 text-left">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1 bg-secondary/15 text-[#384e31] text-[10px] font-bold py-1 px-3 rounded-full border border-secondary/30">
                    <Clock size={12} />
                    {service.duration} Menit
                  </div>
                  <Heart size={20} className="text-accent/80 group-hover:text-[#384e31] transition-colors duration-300" />
                </div>

                <h3 className="text-xl font-bold text-[#384e31] leading-tight group-hover:text-[#2a3b25]">
                  {service.name}
                </h3>

                <p className="text-xs text-dark-neutral/70 leading-relaxed">
                  {service.description}
                </p>

                <hr className="border-accent/20" />

                <ul className="space-y-2.5">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-dark-neutral/80">
                      <span className="p-0.5 bg-secondary-light/40 text-[#384e31] rounded-full">
                        <Check size={12} className="stroke-[3]" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 space-y-4 pt-6 border-t border-accent/20">
                <div className="text-left">
                  <span className="text-[10px] text-dark-neutral/50 font-bold uppercase tracking-wider block">Mulai Dari</span>
                  <span className="text-2xl font-black text-[#384e31]">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(service.price)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleBooking}
                  className="w-full bg-[#384e31] hover:bg-[#2a3b25] text-white font-bold py-3 px-4 rounded-2xl shadow transition-all duration-300 hover:shadow-md flex items-center justify-center gap-2 text-xs focus:outline-none"
                >
                  Pesan Terapi Sekarang
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2.5 Section Keunggulan (FAQ Accordion) */}
      <section id="keunggulan" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-[#384e31]">Keunggulan & Tanya Jawab</h2>
          <p className="text-xs text-dark-neutral/70 leading-relaxed">
            Berikut adalah keunggulan utama layanan kami serta jawaban atas beberapa pertanyaan yang paling sering diajukan oleh pasien.
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white border border-accent/30 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:border-[#384e31]/30"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full py-5 px-6 flex items-center justify-between text-left font-bold text-dark-neutral hover:text-[#384e31] transition-colors focus:outline-none"
                >
                  <span className="text-sm md:text-base font-bold text-dark-neutral">{faq.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[#384e31] ml-4 flex-shrink-0"
                  >
                    <ChevronDown size={20} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-xs md:text-sm text-dark-neutral/70 leading-relaxed border-t border-accent/10 pt-3 text-left">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>


      {/* 5. Section Testimoni */}
      <section id="testimoni" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-3 text-left">
            <h2 className="text-3xl font-black text-[#384e31]">Apa Kata Pasien Kami?</h2>
            <p className="text-xs text-dark-neutral/70 leading-relaxed">
              Testimoni jujur dari pasien yang telah merasakan kemudahan dan khasiat nyata layanan terapi Totok Punggung Sahaja.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              className="p-3 rounded-full border border-accent/40 bg-white text-[#384e31] hover:bg-[#384e31] hover:text-white transition-all duration-300 shadow-sm focus:outline-none"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="p-3 rounded-full border border-accent/40 bg-white text-[#384e31] hover:bg-[#384e31] hover:text-white transition-all duration-300 shadow-sm focus:outline-none"
              aria-label="Next testimonial"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Carousel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[180px]">
          {/* Active Card */}
          <motion.div
            key={`rev-${activeIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-accent/25 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between text-left space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-dark-neutral leading-tight">{reviews[activeIndex].name}</h4>
                <p className="text-[10px] text-dark-neutral/50 font-semibold">{reviews[activeIndex].age} Tahun, {reviews[activeIndex].city}</p>
              </div>
              <div className="flex text-amber-400">
                {[...Array(reviews[activeIndex].rating)].map((_, i) => (
                  <Star key={i} size={13} className="fill-current" />
                ))}
              </div>
            </div>
            <p className="text-xs text-dark-neutral/70 italic leading-relaxed">
              "{reviews[activeIndex].comment}"
            </p>
          </motion.div>

          {/* Next Card (Desktop only) */}
          <motion.div
            key={`rev-next-${activeIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="hidden md:flex bg-white border border-accent/25 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between text-left space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-dark-neutral leading-tight">
                  {reviews[(activeIndex + 1) % reviews.length].name}
                </h4>
                <p className="text-[10px] text-dark-neutral/50 font-semibold">
                  {reviews[(activeIndex + 1) % reviews.length].age} Tahun, {reviews[(activeIndex + 1) % reviews.length].city}
                </p>
              </div>
              <div className="flex text-amber-400">
                {[...Array(reviews[(activeIndex + 1) % reviews.length].rating)].map((_, i) => (
                  <Star key={i} size={13} className="fill-current" />
                ))}
              </div>
            </div>
            <p className="text-xs text-dark-neutral/70 italic leading-relaxed">
              "{reviews[(activeIndex + 1) % reviews.length].comment}"
            </p>
          </motion.div>
        </div>

        {/* Carousel Indicators (Dots) */}
        <div className="flex justify-center gap-1.5 pt-2">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-6 bg-[#384e31]' : 'w-2 bg-accent/40'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>



    </div>
  );
};
