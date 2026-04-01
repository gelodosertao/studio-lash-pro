import React, { useState, useEffect, createContext, useContext, useMemo, useRef } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isBefore, startOfToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { cn } from './lib/utils';

// --- Types ---
interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  images: string[];
  video?: string;
  order?: number;
}

// --- Context ---
const AuthContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Constants ---
const TIME_SLOTS = ['08:00', '10:00', '13:00', '15:00', '17:00', '19:00'];

const normalizePhone = (phone: string | undefined | null) => (phone || '').replace(/\D/g, '');

// --- Hooks ---

function useFCM() {
  return null;
}

// --- Components ---

function Navbar({ activeView, setView }: { activeView: string; setView: (v: string) => void }) {
  const navItems = [
    { id: 'home', label: 'Início', icon: '🏠' },
    { id: 'catalog', label: 'Serviços', icon: '✨' },
    { id: 'booking', label: 'Agendar', icon: '📅' },
    { id: 'fidelity', label: 'Clube', icon: '💖' },
  ];

  return (
    <nav className="fixed bottom-6 left-6 right-6 bg-white/70 backdrop-blur-2xl border border-ink/5 z-50 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden pb-safe">
      <div className="flex justify-around items-center h-16 md:h-20 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300 relative py-2 px-3 md:px-4 flex-1",
              activeView === item.id ? "text-gold" : "text-ink/30"
            )}
          >
            <span className={cn(
              "text-xl md:text-2xl transition-transform duration-500",
              activeView === item.id ? "scale-110 -translate-y-1" : ""
            )}>{item.icon}</span>
            <span className={cn(
              "text-[8px] md:text-[9px] uppercase tracking-[0.1em] font-black transition-opacity",
              activeView === item.id ? "opacity-100" : "opacity-40"
            )}>{item.label}</span>
            {activeView === item.id && (
              <motion.div
                layoutId="nav-active-bg"
                className="absolute inset-x-1 inset-y-1 bg-gold/5 rounded-2xl -z-10"
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

const ServiceCard: React.FC<{ service: Service; onSelect: (s: Service) => void; onShowDetail: () => void }> = ({ service, onSelect, onShowDetail }) => {
  const [currentImg, setCurrentImg] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white rounded-[32px] overflow-hidden border border-ink/5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(255,51,102,0.1)]"
    >
      {/* Image Carousel */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImg}
            src={service.images[currentImg]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>

        {/* Soft Pink Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />

        {/* Quick Info Overlay */}
        <div className="absolute inset-x-6 bottom-6 z-20">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl space-y-1 border border-white/20">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest font-black text-gold">Procedimento Ativo 💖</span>
              <span className="text-gold text-xs">✨</span>
            </div>
            <p className="text-[10px] text-ink/60 leading-relaxed font-medium line-clamp-1">{service.description}</p>
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-6 left-6 flex flex-col gap-3 z-20">
          <div className="px-3 py-1.5 rounded-full bg-gold/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
            R$ {service.price}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 space-y-6">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">{service.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-widest opacity-40 font-bold">⏱️ {service.duration}</span>
            <div className="w-1 h-1 rounded-full bg-gold/40" />
            <span className="text-[9px] uppercase tracking-widest text-gold font-black">Design Exclusivo 💅</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onSelect(service)}
            className="flex-[2] py-5 bg-gold text-white rounded-2xl text-[10px] uppercase tracking-widest font-black shadow-[0_10px_20px_rgba(255,51,102,0.3)] active:scale-95 transition-all"
          >
            Agendar Agora 📅
          </button>
          <button
            onClick={onShowDetail}
            className="flex-1 py-5 border border-ink/10 rounded-2xl text-[10px] uppercase tracking-widest font-black active:bg-ink/5 transition-all"
          >
            Info
          </button>
        </div>
      </div>
    </motion.div>
  );
};

function HomeView({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col -mt-12 -mx-6 relative overflow-hidden bg-white">
      {/* Hero Section */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5 }}
          src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=1000"
          className="w-full h-full object-cover"
          alt="Extensão de cílios profissional na Lash Studio Pro"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />

        {/* Modern Label */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-16 left-8 bg-gold px-5 py-2.5 rounded-full text-white shadow-xl flex items-center gap-3"
        >
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest font-black">Agende seu Horário Online ✨</span>
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="flex-1 px-8 pb-12 space-y-8 relative z-10 -mt-8 bg-white rounded-t-[40px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-10"
        >
          <div className="flex items-center gap-3 text-gold">
            <span className="text-[11px] uppercase tracking-widest font-black">Bem-vinda ao seu Estúdio 💖</span>
          </div>

          <h1 className="text-[34px] md:text-[42px] font-black leading-[1.1] tracking-tight text-ink">
            O Realce <br />
            <span className="text-gold">Perfeito</span> para <br />
            seu Olhar ✨.
          </h1>

          <p className="text-sm leading-relaxed text-ink/40 font-medium max-w-[90%]">
            Transformando cílios em arte. Venha viver a experiência de um olhar renovado com a técnica que mais combina com você 💅.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <button
            onClick={onStart}
            className="w-full py-6 bg-gold text-white rounded-[24px] text-[11px] uppercase tracking-widest font-black transition-all active:scale-95 shadow-[0_20px_40px_rgba(255,51,102,0.3)] flex items-center justify-center gap-4"
          >
            Ver Procedimentos ✨
          </button>

          <div className="p-6 bg-olive rounded-3xl border border-gold/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm">
                🏆
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gold">Especialistas 💡</p>
                <p className="text-[9px] opacity-40 font-bold">Inovação e Técnica</p>
              </div>
            </div>
            <span className="text-gold">→</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function CatalogView({ services, loading, onSelect }: { services: Service[]; loading: boolean; onSelect: (s: Service) => void }) {
  const [selectedDetail, setSelectedDetail] = useState<Service | null>(null);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 border-t-2 border-gold rounded-full animate-spin mb-6" />
        <p className="serif text-xl opacity-40">Carregando catálogo... ⏳</p>
      </div>
    );
  }

  return (
    <div className="px-0 md:px-6 py-6 md:py-12 space-y-12 pb-32">
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-3 text-gold">
          <span className="text-[10px] uppercase tracking-[0.2em] font-black">Nosso Menu 💖</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight">Serviços <span className="text-gold">Premium</span></h2>
        <p className="text-[10px] md:text-xs opacity-40 max-w-[280px] mx-auto leading-relaxed font-black uppercase tracking-widest">
          Técnicas exclusivas para realçar sua beleza natural 💅.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {services.sort((a, b) => (a.order || 0) - (b.order || 0)).map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onSelect={onSelect}
            onShowDetail={() => setSelectedDetail(service)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedDetail && (
          <ServiceDetailModal
            service={selectedDetail}
            onClose={() => setSelectedDetail(null)}
            onBook={() => {
              onSelect(selectedDetail);
              setSelectedDetail(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ServiceDetailModal({ service, onClose, onBook }: { service: Service; onClose: () => void; onBook: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-ink z-[100] overflow-y-auto"
    >
      <div className="min-h-screen flex flex-col bg-paper">
        {/* Header Image */}
        <div className="relative h-[45vh] w-full shrink-0">
          <img
            src={service.images[0]}
            className="w-full h-full object-cover"
            alt={service.name}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-8 right-8 w-12 h-12 rounded-full glass flex items-center justify-center text-xl border border-white/20"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 py-10 space-y-10 -mt-12 relative z-10">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <h3 className="serif text-5xl leading-tight">{service.name}</h3>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-black">Procedimento de Elite</p>
              </div>
              <div className="text-right">
                <p className="serif text-3xl text-gold">R$ {service.price}</p>
                <p className="text-[9px] opacity-40 uppercase tracking-widest">{service.duration}</p>
              </div>
            </div>

            <div className="h-px w-full bg-ink/5" />

            <p className="text-sm leading-relaxed opacity-60 font-medium">
              {service.description}
            </p>
          </div>

          {/* Benefits Section */}
          <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-black opacity-40">Benefícios & Cuidados</h4>
            <div className="grid grid-cols-1 gap-4">
              {[
                { icon: '✨', title: 'Acabamento Natural', desc: 'Fios leves e curvatura perfeita.' },
                { icon: '🛡️', title: 'Materiais Hipoalergênicos', desc: 'Segurança total para seus olhos.' },
                { icon: '⏳', title: 'Alta Durabilidade', desc: 'Retenção superior de até 4 semanas.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-5 glass rounded-3xl border border-ink/5">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest">{item.title}</p>
                    <p className="text-[10px] opacity-40 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 left-0 right-0 flex gap-4 p-8 bg-paper/80 backdrop-blur-md border-t border-ink/5 z-50 pb-safe">
            <button
              onClick={onBook}
              className="flex-[2] py-5 bg-ink text-paper rounded-2xl text-[9px] uppercase tracking-[0.3em] font-black shadow-2xl active:scale-95 transition-all"
            >
              Agendar ✨
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-5 border border-ink/10 rounded-2xl text-[9px] uppercase tracking-[0.3em] font-black active:bg-ink/5 transition-all"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CalendarSelector({ selectedDate, onSelect, monthAvailability }: {
  selectedDate: string;
  onSelect: (date: string) => void;
  monthAvailability: Record<string, number>;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const months = [0, 1, 2].map(i => addMonths(new Date(), i));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

  return (
    <div className="space-y-8">
      {/* Month Tabs */}
      <div className="flex justify-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {months.map((m, i) => {
          const isSelected = isSameMonth(m, currentMonth);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentMonth(m)}
              className={cn(
                "px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-black transition-all whitespace-nowrap",
                isSelected ? "bg-gold text-white shadow-lg" : "bg-ink/5 opacity-40 hover:opacity-100"
              )}
            >
              {format(m, 'MMMM yyyy', { locale: ptBR })}
            </button>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {weekdays.map(w => (
          <div key={w} className="text-center text-[9px] font-black opacity-30 py-2">{w}</div>
        ))}
        {days.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = selectedDate === dateStr;
          const isPast = isBefore(day, startOfToday());
          const isOtherMonth = !isSameMonth(day, currentMonth);
          const bookedCount = monthAvailability[dateStr] || 0;
          const availableCount = TIME_SLOTS.length - bookedCount;
          const isFull = availableCount <= 0;

          return (
            <button
              key={i}
              type="button"
              disabled={isPast || isFull || isOtherMonth}
              onClick={() => onSelect(dateStr)}
              className={cn(
                "aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border relative",
                isOtherMonth ? "opacity-0 pointer-events-none" : "",
                isPast || isFull
                  ? "bg-ink/5 border-transparent opacity-20 cursor-not-allowed"
                  : isSelected
                    ? "bg-gold border-gold text-white shadow-xl scale-105 z-10"
                    : "bg-white border-ink/5 hover:border-gold/50"
              )}
            >
              <span className="text-sm font-black">{format(day, 'd')}</span>
              {!isPast && !isFull && (
                <span className={cn("text-[7px] uppercase font-bold", isSelected ? "text-white/80" : "text-gold")}>
                  {availableCount} disp.
                </span>
              )}
              {isFull && !isPast && (
                <span className="text-[7px] uppercase font-bold opacity-30">indisp.</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BookingView({ selectedService, onBack }: { selectedService: Service | null; onBack: () => void }) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientWhatsapp: '',
    date: '',
    time: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fidelityCount, setFidelityCount] = useState(0);
  const [checkingFidelity, setCheckingFidelity] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [monthAvailability, setMonthAvailability] = useState<Record<string, number>>({});

  // Check fidelity when WhatsApp number is entered
  useEffect(() => {
    const checkFidelity = async () => {
      const normalized = normalizePhone(formData.clientWhatsapp);
      if (normalized.length >= 10) {
        setCheckingFidelity(true);
        try {
          const { count, error } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .or(`clientWhatsapp.eq.${normalized},clientPhone.eq.${normalized}`)
            .eq('status', 'Concluído');

          if (error) throw error;
          setFidelityCount(count || 0);
        } catch (error) {
          console.error("Error checking fidelity:", error);
        } finally {
          setCheckingFidelity(false);
        }
      } else {
        setFidelityCount(0);
      }
    };

    const timer = setTimeout(checkFidelity, 1000);
    return () => clearTimeout(timer);
  }, [formData.clientWhatsapp]);

  // Fetch availability for the next 3 months
  useEffect(() => {
    const fetchMonthAvailability = async () => {
      const start = format(startOfToday(), 'yyyy-MM-dd');
      const end = format(addMonths(new Date(), 3), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('availability')
        .select('date, booked_times')
        .gte('date', start)
        .lte('date', end);

      if (error) {
        console.error('Error fetching month availability:', error);
      } else {
        const availabilityMap: Record<string, number> = {};
        data?.forEach(row => {
          availabilityMap[row.date] = row.booked_times?.length || 0;
        });
        setMonthAvailability(availabilityMap);
      }
    };

    fetchMonthAvailability();
  }, []);

  // Fetch booked slots for the selected date
  useEffect(() => {
    if (!formData.date) return;
    setLoadingSlots(true);

    const fetchAvailability = async () => {
      const { data, error } = await supabase
        .from('availability')
        .select('booked_times')
        .eq('date', formData.date)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching availability:', error);
      } else {
        setBookedTimes(data?.booked_times || []);
      }
      setLoadingSlots(false);
    };

    fetchAvailability();
  }, [formData.date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.time) {
      alert("Por favor, selecione data e horário.");
      return;
    }
    setShowConfirmation(true);
  };

  const saveBooking = async () => {
    setIsSaving(true);
    try {
      const bookingData = {
        ...formData,
        clientWhatsapp: normalizePhone(formData.clientWhatsapp),
        serviceId: selectedService?.id || 'custom',
        serviceName: selectedService?.name || 'Personalizado',
        status: 'Pendente',
        created_at: new Date().toISOString(),
        fcmToken: localStorage.getItem('fcm_token') || null
      };

      const { error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData]);

      if (bookingError) throw bookingError;

      const { data: availData, error: fetchError } = await supabase
        .from('availability')
        .select('booked_times')
        .eq('date', formData.date)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const currentBooked = availData?.booked_times || [];
      const updatedBooked = [...new Set([...currentBooked, formData.time])];

      const { error: availError } = await supabase
        .from('availability')
        .upsert({
          date: formData.date,
          booked_times: updatedBooked
        }, { onConflict: 'date' });

      if (availError) throw availError;

      setIsSubmitted(true);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error saving booking:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-32 text-center space-y-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-32 h-32 bg-gold/20 rounded-full flex items-center justify-center text-6xl mx-auto"
        >
          ✨
        </motion.div>
        <div className="space-y-6">
          <h2 className="text-6xl font-black">Pronto! 💖</h2>
          <p className="opacity-50 text-lg">Solicitação enviada. Entraremos em contato via WhatsApp para confirmar.</p>
        </div>
        <button
          onClick={onBack}
          className="px-12 py-6 bg-gold text-white rounded-full text-[10px] uppercase tracking-[0.4em] font-black shadow-xl active:scale-95 transition-all"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      <header className="text-center space-y-4">
        <button onClick={onBack} className="text-[10px] uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity">← Voltar</button>
        <h2 className="text-5xl md:text-7xl font-black tracking-tight">Escolha sua <span className="text-gold">Data</span></h2>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 md:p-12 rounded-[40px] space-y-12 shadow-2xl border border-ink/5"
      >
        {/* Step 1: Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.3em] opacity-50 font-black block">Nome Completo</label>
            <input
              type="text" required placeholder="Seu nome..."
              className="w-full bg-ink/5 p-6 rounded-2xl outline-none focus:ring-2 focus:ring-gold transition-all font-bold"
              value={formData.clientName}
              onChange={e => setFormData({ ...formData, clientName: e.target.value })}
            />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.3em] opacity-50 font-black block">WhatsApp</label>
            <input
              type="tel" required placeholder="(00) 00000-0000"
              className="w-full bg-ink/5 p-6 rounded-2xl outline-none focus:ring-2 focus:ring-gold transition-all font-bold"
              value={formData.clientWhatsapp}
              onChange={e => setFormData({ ...formData, clientWhatsapp: e.target.value })}
            />
          </div>
        </div>

        {/* Step 2: Calendar */}
        <div className="space-y-6">
          <label className="text-[10px] uppercase tracking-[0.3em] opacity-50 font-black block">Selecione o Dia</label>
          <CalendarSelector
            selectedDate={formData.date}
            onSelect={(date) => setFormData({ ...formData, date, time: '' })}
            monthAvailability={monthAvailability}
          />
        </div>

        {/* Step 3: Time Slots */}
        {formData.date && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-8 border-t border-ink/5">
            <label className="text-[10px] uppercase tracking-[0.3em] opacity-50 font-black block">Horários no dia {formData.date.split('-').reverse().join('/')}</label>
            {loadingSlots ? (
              <div className="py-10 text-center animate-pulse opacity-40">Consultando horários...</div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {TIME_SLOTS.map(slot => {
                  const isBooked = bookedTimes.includes(slot);
                  const isSelected = formData.time === slot;
                  return (
                    <button
                      key={slot} type="button" disabled={isBooked}
                      onClick={() => setFormData({ ...formData, time: slot })}
                      className={cn(
                        "py-4 rounded-xl text-xs font-black transition-all border",
                        isBooked
                          ? "bg-ink/5 border-transparent opacity-20 cursor-not-allowed"
                          : isSelected
                            ? "bg-gold border-gold text-white shadow-lg"
                            : "bg-white border-ink/5 hover:border-gold/50"
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full py-8 bg-ink text-white font-black text-[12px] uppercase tracking-[0.5em] hover:bg-gold transition-all duration-500 rounded-3xl shadow-2xl mt-8"
        >
          Confirmar Agendamento ✨
        </button>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setShowConfirmation(false)}
              className="absolute inset-0 bg-ink/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-paper p-12 md:p-16 rounded-[40px] shadow-2xl space-y-12 text-center"
            >
              <div className="space-y-4">
                <span className="text-4xl">📅</span>
                <h3 className="serif text-5xl">Confirme seu <span className="italic text-gold">Agendamento</span></h3>
                <p className="text-[10px] uppercase tracking-[0.3em] opacity-50">Revise os detalhes abaixo</p>
              </div>

              <div className="space-y-8 py-8 border-y border-ink/5">
                <div className="grid grid-cols-2 gap-8 text-left">
                  <div className="space-y-1">
                    <p className="text-[8px] uppercase tracking-widest opacity-40">Serviço</p>
                    <p className="serif text-xl">{selectedService?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] uppercase tracking-widest opacity-40">Cliente</p>
                    <p className="serif text-xl">{formData.clientName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] uppercase tracking-widest opacity-40">Data</p>
                    <p className="serif text-xl">{formData.date.split('-').reverse().join('/')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] uppercase tracking-widest opacity-40">Horário</p>
                    <p className="serif text-xl">{formData.time}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={saveBooking}
                  disabled={isSaving}
                  className="w-full py-6 bg-ink text-paper rounded-full text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-gold transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-paper/30 border-t-paper rounded-full animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Confirmar Agendamento"
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isSaving}
                  className="w-full py-6 border border-ink/10 rounded-full text-[10px] uppercase tracking-[0.4em] hover:bg-ink/5 transition-colors disabled:opacity-50"
                >
                  Ajustar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FidelityView() {
  const [whatsapp, setWhatsapp] = useState('');
  const [fidelityCount, setFidelityCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const checkFidelity = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizePhone(whatsapp);
    if (normalized.length < 10) return;

    setLoading(true);
    try {
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .or(`clientWhatsapp.eq.${normalized},clientPhone.eq.${normalized}`)
        .eq('status', 'Concluído');

      if (error) throw error;
      setFidelityCount(count || 0);
    } catch (error) {
      console.error("Error checking fidelity:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-16 pb-32">
      <header className="text-center space-y-6">
        <span className="text-[10px] uppercase tracking-[0.5em] text-gold font-bold">Exclusivo para Clientes</span>
        <h2 className="display text-6xl md:text-8xl">Seu Cartão <span className="italic text-gold">Fidelidade</span></h2>
        <p className="opacity-50 text-lg">Consulte seu progresso e resgate seus prêmios.</p>
      </header>

      <form onSubmit={checkFidelity} className="space-y-8">
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.3em] opacity-50 font-bold block text-center">Digite seu WhatsApp</label>
          <input
            type="tel"
            required
            placeholder="(00) 00000-0000"
            className="w-full bg-transparent border-b border-ink/10 py-8 focus:border-gold outline-none transition-colors serif text-5xl text-center placeholder:opacity-20"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-8 bg-ink text-paper rounded-full text-[10px] uppercase tracking-[0.5em] font-bold hover:bg-gold hover:text-ink transition-all duration-700 shadow-2xl disabled:opacity-50"
        >
          {loading ? "Consultando..." : "Verificar Pontos 💎"}
        </button>
      </form>

      <AnimatePresence>
        {fidelityCount !== null && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative"
          >
            {/* Luxury Card Aesthetic */}
            <div className="aspect-[1.5/1] md:aspect-[1.6/1] w-full glass-dark rounded-[32px] md:rounded-[40px] p-6 md:p-12 flex flex-col justify-between border border-white/20 shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />

              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <h3 className="serif text-2xl md:text-4xl text-white">Lash Studio <span className="italic text-gold">Pro</span></h3>
                  <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-white/40 font-black">Membro Exclusive</p>
                </div>
                <span className="text-2xl md:text-4xl grayscale group-hover:grayscale-0 transition-all duration-700">💎</span>
              </div>

              <div className="space-y-6 md:space-y-8 relative z-10">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] text-gold font-black">Progresso Atual</p>
                    <p className="serif text-3xl md:text-5xl text-white font-black">
                      {fidelityCount % 10}/10 <span className="text-sm md:text-xl opacity-40 italic font-normal">sessões</span>
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2 font-black">Próximo Nível</p>
                    <div className="flex gap-1 justify-end">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-2 md:w-4 h-1 rounded-full transition-all duration-500",
                            i < (fidelityCount % 10) ? "bg-gold" : "bg-white/10"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 md:pt-8 border-t border-white/10 flex justify-between items-center">
                  <p className="text-[7px] md:text-[9px] uppercase tracking-[0.4em] text-white/30 font-black">Válido em todas as unidades</p>
                  <p className="serif text-sm md:text-xl text-gold italic">
                    {fidelityCount >= 10 ? "Prêmio Disponível! 🎁" : `${10 - (fidelityCount % 10)} para o prêmio`}
                  </p>
                </div>
              </div>
            </div>

            {/* Reward Message */}
            {fidelityCount >= 10 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-12 p-10 glass rounded-[40px] border border-gold/30 text-center space-y-4"
              >
                <span className="text-5xl block">🎉</span>
                <h4 className="serif text-4xl">Parabéns!</h4>
                <p className="text-sm opacity-60">Você completou seu ciclo de fidelidade. <br /> Sua próxima sessão de sobrancelha é por nossa conta!</p>
                <button
                  onClick={() => window.open(`https://wa.me/5511999999999?text=Olá! Gostaria de consultar sobre o meu prêmio de fidelidade disponível no sistema.`, '_blank')}
                  className="mt-4 px-12 py-6 bg-gold text-ink rounded-full text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-ink hover:text-paper transition-all"
                >
                  Solicitar Resgate 📱
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminView({ services }: { services: Service[] }) {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'agenda' | 'clientes' | 'despesas' | 'servicos'>('agenda');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
      } else {
        setBookings(data || []);
      }
    };

    const fetchExpenses = async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
      } else {
        setExpenses(data || []);
      }
    };

    fetchBookings();
    fetchExpenses();

    // Subscribe to changes
    const bookingsSub = supabase
      .channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    const expensesSub = supabase
      .channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        fetchExpenses();
      })
      .subscribe();

    return () => {
      bookingsSub.unsubscribe();
      expensesSub.unsubscribe();
    };
  }, [user]);

  if (authLoading) return <div className="py-32 text-center serif text-4xl animate-pulse">Carregando...</div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 space-y-12">
        <header className="text-center space-y-4">
          <h2 className="text-4xl font-black">Área de <span className="text-gold">Gestão</span></h2>
          <p className="opacity-40 text-xs uppercase tracking-widest font-bold">Acesso Restrito</p>
        </header>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setIsLoggingIn(true);
            setAuthError('');
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setAuthError('Credenciais inválidas. Tente novamente.');
            setIsLoggingIn(false);
          }}
          className="bg-white p-10 rounded-[32px] border border-ink/5 shadow-2xl space-y-6"
        >
          <div className="space-y-4">
            <input
              type="email" placeholder="E-mail" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-ink/5 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-gold transition-all"
            />
            <input
              type="password" placeholder="Senha" required
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-ink/5 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-gold transition-all"
            />
          </div>
          {authError && <p className="text-red-500 text-[10px] text-center font-bold uppercase tracking-widest">{authError}</p>}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-6 bg-gold text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50 transition-all"
          >
            {isLoggingIn ? 'Entrando...' : 'Entrar no Painel 🔑'}
          </button>
        </form>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const estimatedRevenue = bookings.filter(b => b.status === 'Concluído').length * 180; // Média
  const balance = estimatedRevenue - totalExpenses;

  return (
    <div className="space-y-16 pb-32">
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div className="space-y-2">
          <h2 className="text-[34px] md:text-6xl font-black tracking-tight leading-tight">Painel de <span className="text-gold">Gestão</span></h2>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.4em] opacity-40 font-black">Bem-vinda, {user.email?.split('@')[0]}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
          <div className="grid grid-cols-2 lg:flex gap-2 bg-ink/5 p-1.5 rounded-[24px] md:rounded-full backdrop-blur-md w-full">
            <button
              onClick={() => setActiveTab('agenda')}
              className={cn(
                "px-4 md:px-8 py-3 rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black transition-all duration-500",
                activeTab === 'agenda' ? "bg-ink text-paper shadow-xl" : "opacity-40 hover:opacity-100"
              )}
            >
              Agenda
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={cn(
                "px-4 md:px-8 py-3 rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black transition-all duration-500",
                activeTab === 'clientes' ? "bg-ink text-paper shadow-xl" : "opacity-40 hover:opacity-100"
              )}
            >
              Clientes
            </button>
            <button
              onClick={() => setActiveTab('despesas')}
              className={cn(
                "px-4 md:px-8 py-3 rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black transition-all duration-500",
                activeTab === 'despesas' ? "bg-ink text-paper shadow-xl" : "opacity-40 hover:opacity-100"
              )}
            >
              Despesas
            </button>
            <button
              onClick={() => setActiveTab('servicos')}
              className={cn(
                "px-4 md:px-8 py-3 rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black transition-all duration-500",
                activeTab === 'servicos' ? "bg-ink text-paper shadow-xl" : "opacity-40 hover:opacity-100"
              )}
            >
              Catálogo
            </button>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-6 py-4 border border-red-100 text-red-600 rounded-2xl md:rounded-full text-[9px] uppercase tracking-widest font-black hover:bg-red-50 transition-all shrink-0"
          >
            Sair 🚪
          </button>
        </div>
      </header>

      {/* Stats Grid with 3D feel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="Faturamento Est." value={`R$ ${estimatedRevenue}`} color="text-gold" />
        <StatCard title="Despesas Totais" value={`R$ ${totalExpenses}`} color="text-red-800" />
        <StatCard title="Saldo Líquido" value={`R$ ${balance}`} color={balance >= 0 ? "text-gold" : "text-red-800"} highlight />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'agenda' ? (
          <motion.div
            key="agenda"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <h3 className="serif text-4xl">Próximos Atendimentos</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] opacity-40">{bookings.length} registros</span>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {bookings.map(booking => (
                <div key={booking.id}>
                  <BookingCard booking={booking} allBookings={bookings} />
                </div>
              ))}
            </div>
          </motion.div>
        ) : activeTab === 'clientes' ? (
          <motion.div
            key="clientes"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <ClientsTab bookings={bookings} />
          </motion.div>
        ) : activeTab === 'servicos' ? (
          <motion.div
            key="servicos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <h3 className="serif text-4xl">Gestão do Catálogo</h3>
              <button
                onClick={() => { setEditingService(null); setShowServiceModal(true); }}
                className="px-8 py-3 bg-gold text-ink rounded-full text-[10px] uppercase tracking-[0.2em] font-bold shadow-lg hover:scale-105 transition-transform"
              >
                ➕ Adicionar Item
              </button>
            </div>
            <ServicesTab
              services={services}
              onEdit={(s) => { setEditingService(s); setShowServiceModal(true); }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="despesas"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <h3 className="serif text-4xl">Fluxo de Caixa</h3>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-8 py-3 bg-gold text-ink rounded-full text-[10px] uppercase tracking-[0.2em] font-bold shadow-lg hover:scale-105 transition-transform"
              >
                ➕ Lançar Despesa
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {expenses.map(expense => (
                <div key={expense.id}>
                  <ExpenseCard expense={expense} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showExpenseModal && <ExpenseModal onClose={() => setShowExpenseModal(false)} />}
      {showServiceModal && (
        <ServiceModal
          service={editingService}
          onClose={() => { setShowServiceModal(false); setEditingService(null); }}
        />
      )}
    </div>
  );
}

function ServicesTab({ services, onEdit }: { services: Service[]; onEdit: (s: Service) => void }) {
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item do catálogo?')) return;
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {services.length === 0 ? (
        <div className="py-20 text-center glass rounded-[40px] border border-dashed border-ink/10">
          <p className="serif text-xl opacity-40 italic">Nenhum item cadastrado.</p>
        </div>
      ) : (
        services.sort((a, b) => (a.order || 0) - (b.order || 0)).map((service) => (
          <motion.div
            key={service.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-[32px] border border-ink/5 space-y-6"
          >
            <div className="flex gap-5">
              <div className="relative shrink-0">
                <img
                  src={service.images[0]}
                  className="w-24 h-24 rounded-2xl object-cover shadow-xl"
                  alt={service.name}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gold text-ink rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">
                  #{service.order || 0}
                </div>
              </div>
              <div className="space-y-2 min-w-0 flex-1">
                <div className="space-y-0.5">
                  <h4 className="serif text-2xl truncate">{service.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest font-black text-gold">R$ {service.price}</span>
                    <span className="w-1 h-1 bg-ink/10 rounded-full" />
                    <span className="text-[9px] uppercase tracking-widest opacity-40">{service.duration}</span>
                  </div>
                </div>
                <p className="text-[10px] opacity-50 line-clamp-2 leading-relaxed">{service.description}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onEdit(service)}
                className="flex-1 py-4 bg-ink text-paper rounded-xl text-[9px] uppercase tracking-widest font-black active:scale-95 transition-all"
              >
                Editar ✏️
              </button>
              <button
                onClick={() => handleDelete(service.id)}
                className="px-6 py-4 border border-red-100 text-red-600 rounded-xl text-[9px] uppercase tracking-widest font-black active:bg-red-50 transition-all"
              >
                Excluir 🗑️
              </button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}

function ServiceModal({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price || 0,
    duration: service?.duration || '',
    images: service?.images.join(', ') || '',
    video: service?.video || '',
    order: service?.order || 0
  });
  const [isSaving, setIsSaving] = useState(false);

  const imageList = formData.images.split(',').map(s => s.trim()).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        ...formData,
        price: Number(formData.price),
        order: Number(formData.order),
        images: imageList
      };

      if (service) {
        const { error } = await supabase
          .from('services')
          .update(data)
          .eq('id', service.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert([data]);
        if (error) throw error;
      }
      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink z-[100] overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex flex-col bg-paper"
      >
        {/* Header */}
        <div className="p-8 flex justify-between items-center border-b border-ink/5">
          <div className="space-y-1">
            <h3 className="serif text-3xl">{service ? 'Editar' : 'Novo'} <span className="italic text-gold">Item</span></h3>
            <p className="text-[9px] uppercase tracking-[0.3em] opacity-40">Gestão do Catálogo</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center text-lg">✕</button>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Preview Section (Mobile) */}
          <div className="p-4 md:p-8 bg-ink/5 border-b border-ink/5">
            <h4 className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] font-black opacity-40 mb-4">Preview em Tempo Real</h4>
            {imageList.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                <div className="w-32 h-40 shrink-0 rounded-2xl overflow-hidden shadow-xl relative">
                  <img src={imageList[0]} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[10px] text-white truncate font-bold">{formData.name || 'Nome'}</p>
                    <p className="text-[8px] text-gold font-black">R$ {formData.price || '0'}</p>
                  </div>
                </div>
                {imageList.slice(1).map((img, i) => (
                  <img key={i} src={img} className="w-32 h-40 shrink-0 rounded-2xl object-cover border border-white/10" alt="Preview" referrerPolicy="no-referrer" />
                ))}
              </div>
            ) : (
              <div className="h-40 rounded-2xl border-2 border-dashed border-ink/10 flex flex-col items-center justify-center text-center p-6 opacity-40">
                <span className="text-2xl">📸</span>
                <p className="text-[9px] italic">Adicione URLs para ver o preview.</p>
              </div>
            )}
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 md:space-y-8 pb-32">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest opacity-40 font-black">Nome do Item</label>
                <input
                  type="text" required placeholder="Ex: Volume Russo"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-ink/5 border-none rounded-xl p-4 text-sm focus:ring-1 focus:ring-gold outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest opacity-40 font-black">Preço (R$)</label>
                  <input
                    type="number" required placeholder="0,00"
                    value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-ink/5 border-none rounded-xl p-4 text-sm focus:ring-1 focus:ring-gold outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest opacity-40 font-black">Duração</label>
                  <input
                    type="text" required placeholder="Ex: 2h"
                    value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full bg-ink/5 border-none rounded-xl p-4 text-sm focus:ring-1 focus:ring-gold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest opacity-40 font-black">Ordem</label>
                <input
                  type="number" placeholder="0"
                  value={formData.order} onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                  className="w-full bg-ink/5 border-none rounded-xl p-4 text-sm focus:ring-1 focus:ring-gold outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest opacity-40 font-black">Descrição</label>
                <textarea
                  required rows={4} placeholder="Detalhes do serviço..."
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-ink/5 border-none rounded-2xl p-4 text-sm focus:ring-1 focus:ring-gold outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest opacity-40 font-black">URLs das Imagens (vírgula)</label>
                <textarea
                  required rows={3} placeholder="https://..."
                  value={formData.images} onChange={e => setFormData({ ...formData, images: e.target.value })}
                  className="w-full bg-ink/5 border-none rounded-2xl p-4 text-sm focus:ring-1 focus:ring-gold outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest opacity-40 font-black">URL do Vídeo</label>
                <input
                  type="text" placeholder="Opcional"
                  value={formData.video} onChange={e => setFormData({ ...formData, video: e.target.value })}
                  className="w-full bg-ink/5 border-none rounded-xl p-4 text-sm focus:ring-1 focus:ring-gold outline-none"
                />
              </div>
            </div>

            {/* Sticky Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-paper/80 backdrop-blur-md border-t border-ink/5 flex gap-4 z-50 pb-safe">
              <button
                type="button" onClick={onClose}
                className="flex-1 py-5 border border-ink/10 rounded-xl text-[9px] uppercase tracking-widest font-black active:bg-ink/5"
              >
                Cancelar
              </button>
              <button
                type="submit" disabled={isSaving}
                className="flex-[2] py-5 bg-gold text-ink rounded-xl text-[9px] uppercase tracking-widest font-black shadow-xl active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar Item ✨'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function ClientsTab({ bookings }: { bookings: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Group bookings by client WhatsApp or Phone
  const clientsMap = bookings.reduce((acc: any, booking: any) => {
    const phone = normalizePhone(booking.clientWhatsapp || booking.clientPhone);
    if (!phone) return acc;

    if (!acc[phone]) {
      acc[phone] = {
        name: booking.clientName,
        phone: phone,
        originalPhone: booking.clientWhatsapp || booking.clientPhone,
        bookings: []
      };
    }
    acc[phone].bookings.push(booking);
    // Use the most recent name if it changes
    acc[phone].name = booking.clientName;
    return acc;
  }, {});

  const clientsList = Object.values(clientsMap).filter((client: any) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-2">
          <h3 className="display text-4xl">Gestão de <span className="italic text-gold">Clientes</span></h3>
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-40">Base de dados e histórico de fidelidade</p>
        </div>
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-8 py-5 glass border-none rounded-full text-sm focus:ring-2 focus:ring-gold transition-all placeholder:opacity-30"
          />
          <span className="absolute right-8 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {clientsList.length === 0 ? (
          <div className="py-20 md:py-32 text-center glass rounded-[40px] border border-dashed border-ink/10 opacity-40 italic">Nenhum cliente encontrado.</div>
        ) : (
          clientsList.map((client: any) => (
            <div
              key={client.phone}
              className="glass p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-ink/5 hover:border-gold/30 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gold/20 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 md:gap-8">
                <div className="flex items-center gap-4 md:gap-8">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-ink text-paper rounded-full flex items-center justify-center text-2xl md:text-3xl serif shadow-xl shrink-0">
                    {client.name.charAt(0)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="serif text-2xl md:text-3xl truncate">{client.name}</h4>
                    <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-40 font-black">{client.originalPhone}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 md:gap-12 w-full xl:w-auto">
                  <div className="text-left md:text-center flex-1 md:flex-none">
                    <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] opacity-40 mb-1 font-black">Total Visitas</p>
                    <p className="display text-2xl md:text-3xl font-black">{client.bookings.length}</p>
                  </div>
                  <div className="text-left md:text-center flex-1 md:flex-none">
                    <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] opacity-40 mb-1 font-black">Status</p>
                    <div className={cn(
                      "text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3 md:px-4 py-1.5 rounded-full inline-block",
                      client.bookings.filter((b: any) => b.status === 'Concluído').length >= 5
                        ? "bg-gold/10 text-gold"
                        : "bg-ink/5 opacity-40"
                    )}>
                      {client.bookings.filter((b: any) => b.status === 'Concluído').length >= 5 ? '💎 Fiel' : '✨ Novo'}
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <a
                      href={`https://wa.me/55${client.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-sm"
                      title="Contactar via WhatsApp"
                    >
                      📱
                    </a>
                    <button
                      onClick={() => setSelectedClient(selectedClient === client.phone ? null : client.phone)}
                      className="flex-1 md:flex-none px-6 md:px-8 py-3 border border-ink/10 rounded-2xl md:rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-black hover:bg-ink hover:text-paper transition-all shadow-sm"
                    >
                      {selectedClient === client.phone ? 'Fechar' : 'Histórico'}
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {selectedClient === client.phone && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-10 pt-10 border-t border-ink/5 space-y-6">
                      <p className="text-[9px] uppercase tracking-[0.5em] opacity-40 mb-6">Linha do Tempo de Agendamentos</p>
                      <div className="grid grid-cols-1 gap-4">
                        {client.bookings.sort((a: any, b: any) => b.date.localeCompare(a.date)).map((b: any) => (
                          <div key={b.id} className="flex justify-between items-center p-6 bg-ink/5 rounded-3xl text-sm hover:bg-ink/10 transition-colors">
                            <div className="flex items-center gap-6">
                              <span className="opacity-40 font-mono text-xs">📅 {b.date.split('-').reverse().join('/')}</span>
                              <span className="opacity-40 font-mono text-xs">🕒 {b.time}</span>
                              <span className="serif text-lg">{b.serviceName}</span>
                            </div>
                            <span className={cn(
                              "text-[9px] uppercase tracking-widest font-bold px-4 py-1 rounded-full",
                              b.status === 'Concluído' ? "bg-olive/10 text-olive" :
                                b.status === 'Cancelado' ? "bg-red-100 text-red-800" :
                                  "bg-gold/10 text-gold"
                            )}>
                              {b.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color, highlight }: { title: string, value: string, color: string, highlight?: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -10, rotateX: 5 }}
      className={cn(
        "bento-card p-8 md:p-10 flex flex-col justify-between min-h-[160px] md:min-h-[200px] transition-all duration-500",
        highlight ? "bg-ink text-paper shadow-3xl" : "glass"
      )}
    >
      <div className="space-y-2">
        <p className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] opacity-40 font-black">{title}</p>
        <div className="h-px w-8 bg-gold/30" />
      </div>
      <p className={cn("display text-3xl md:text-6xl font-black", !highlight && color)}>{value}</p>
    </motion.div>
  );
}

function BookingCard({ booking, allBookings }: { booking: any, allBookings: any[] }) {
  const clientBookings = allBookings.filter(b => {
    const bPhone = normalizePhone(b.clientWhatsapp || b.clientPhone);
    const currentPhone = normalizePhone(booking.clientWhatsapp || booking.clientPhone);
    return bPhone === currentPhone && b.status === 'Concluído';
  }).length;
  const isRewardReady = clientBookings > 0 && clientBookings % 10 === 0;
  const displayProgress = isRewardReady ? 10 : clientBookings % 10;

  const updateStatus = async (newStatus: string) => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          clientWhatsapp: normalizePhone(booking.clientWhatsapp || booking.clientPhone)
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      if (newStatus === 'Cancelado') {
        const { data: availData, error: fetchError } = await supabase
          .from('availability')
          .select('booked_times')
          .eq('date', booking.date)
          .single();

        if (!fetchError && availData) {
          const updatedBooked = (availData.booked_times || []).filter((t: string) => t !== booking.time);
          await supabase
            .from('availability')
            .update({ booked_times: updatedBooked })
            .eq('date', booking.date);
        }
      } else if (booking.status === 'Cancelado' && ['Pendente', 'Confirmado', 'Concluído'].includes(newStatus)) {
        const { data: availData, error: fetchError } = await supabase
          .from('availability')
          .select('booked_times')
          .eq('date', booking.date)
          .single();

        const currentBooked = availData?.booked_times || [];
        const updatedBooked = [...new Set([...currentBooked, booking.time])];

        await supabase
          .from('availability')
          .upsert({
            date: booking.date,
            booked_times: updatedBooked
          }, { onConflict: 'date' });
      }

      if (booking.fcmToken) {
        let title = '';
        let body = '';

        if (newStatus === 'Confirmado') {
          title = 'Agendamento Confirmado! ✨';
          body = `Seu horário para ${booking.serviceName} no dia ${booking.date.split('-').reverse().join('/')} às ${booking.time} foi confirmado.`;
        } else if (newStatus === 'Concluído') {
          title = 'Sessão Concluída! 💎';
          body = `Obrigada pela preferência! Você acumulou mais um ponto no seu cartão fidelidade.`;
        }

        if (title && body) {
          try {
            await fetch('/api/send-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: booking.fcmToken,
                title,
                body
              })
            });
          } catch (err) {
            console.error('Error sending notification:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  const deleteBooking = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este agendamento?")) return;
    try {
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id);

      if (deleteError) throw deleteError;

      const { data: availData, error: fetchError } = await supabase
        .from('availability')
        .select('booked_times')
        .eq('date', booking.date)
        .single();

      if (!fetchError && availData) {
        const updatedBooked = (availData.booked_times || []).filter((t: string) => t !== booking.time);
        await supabase
          .from('availability')
          .update({ booked_times: updatedBooked })
          .eq('date', booking.date);
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const statusColors: any = {
    'Pendente': 'bg-yellow-100 text-yellow-800',
    'Confirmado': 'bg-blue-100 text-blue-800',
    'Concluído': 'bg-green-100 text-green-800',
    'Cancelado': 'bg-red-100 text-red-800'
  };

  return (
    <div className="glass p-6 md:p-8 rounded-[32px] flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-8 group hover:border-gold/30 transition-all duration-500 hover:shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-gold/20 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Client Info */}
      <div className="flex items-center gap-5 md:gap-8">
        <div className="w-14 h-14 md:w-16 md:h-16 bg-ink text-paper rounded-full flex items-center justify-center text-lg md:text-xl serif shrink-0">
          {booking.clientName.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="serif text-2xl md:text-3xl truncate">{booking.clientName}</h4>
            <span className={cn(
              "px-3 py-1 rounded-full text-[7px] md:text-[8px] uppercase tracking-widest font-black",
              isRewardReady ? "bg-gold text-ink animate-pulse" : "bg-ink/5 opacity-60"
            )}>
              {displayProgress}/10 {isRewardReady && "🎁"}
            </span>
          </div>
          <p className="text-[10px] md:text-xs opacity-50 tracking-widest truncate">{booking.clientPhone || booking.clientWhatsapp}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-12 items-center">
        <div className="space-y-1">
          <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] opacity-40 font-black">Serviço</p>
          <p className="serif text-lg md:text-xl truncate">{booking.serviceName}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] opacity-40 font-black">Data/Hora</p>
          <p className="serif text-lg md:text-xl whitespace-nowrap">
            {booking.date.split('-').reverse().join('/')} <span className="text-gold italic text-sm md:text-base">às</span> {booking.time}
          </p>
        </div>
        <div className="space-y-1 col-span-2 md:col-span-1">
          <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] opacity-40 font-black">Status</p>
          <span className={cn("px-4 py-1.5 rounded-full text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-black inline-block", statusColors[booking.status])}>
            {booking.status}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-4 xl:pt-0 border-t xl:border-none border-ink/5">
        <a
          href={`https://wa.me/55${normalizePhone(booking.clientWhatsapp || booking.clientPhone)}?text=${encodeURIComponent(`Olá ${booking.clientName}! Aqui é da Lash Studio Pro. Gostaria de confirmar seu agendamento de ${booking.serviceName} para o dia ${booking.date.split('-').reverse().join('/')} às ${booking.time}?`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-sm"
          title="Confirmar via WhatsApp"
        >
          📱
        </a>
        <div className="flex gap-2 flex-1 xl:flex-none">
          {['Confirmado', 'Concluído', 'Cancelado'].map(s => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={cn(
                "px-3 md:px-4 py-3 rounded-xl text-[7px] md:text-[8px] uppercase tracking-widest font-black transition-all flex-1 md:flex-none",
                booking.status === s ? "bg-ink text-paper" : "bg-ink/5 opacity-40 hover:opacity-100"
              )}
            >
              {s === 'Confirmado' ? 'Confirm' : s === 'Concluído' ? 'Concluir' : 'Canc'}
            </button>
          ))}
        </div>
        <button
          onClick={deleteBooking}
          className="w-12 h-12 border border-red-100 text-red-600 rounded-2xl flex items-center justify-center text-xs hover:bg-red-50 transition-all shrink-0"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function ExpenseCard({ expense }: { expense: any }) {
  return (
    <div className="glass p-6 md:p-8 rounded-[32px] flex flex-row items-center justify-between group hover:border-red-800/20 transition-all duration-500 hover:shadow-xl relative overflow-hidden gap-4">
      <div className="absolute top-0 left-0 w-1 h-full bg-red-800/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-4 md:gap-8 min-w-0">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-red-800/5 rounded-full flex items-center justify-center text-xl md:text-2xl shrink-0">
          💸
        </div>
        <div className="min-w-0">
          <h4 className="serif text-xl md:text-3xl mb-1 truncate">{expense.description}</h4>
          <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-40 font-black truncate">{expense.category} • {expense.date.split('-').reverse().join('/')}</p>
        </div>
      </div>
      <p className="display text-xl md:text-3xl text-red-800 shrink-0 font-black">- R$ {expense.value}</p>
    </div>
  );
}

function ExpenseModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    description: '',
    value: '',
    category: 'Material',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          ...formData,
          value: Number(formData.value),
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/80 backdrop-blur-xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-paper p-8 md:p-16 rounded-[40px] md:rounded-[50px] shadow-3xl space-y-8 md:space-y-12 overflow-hidden mx-4"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-30" />

        <div className="text-center space-y-4">
          <h3 className="display text-5xl">Nova <span className="italic text-gold">Despesa</span></h3>
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-40">Registre um novo gasto no fluxo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.3em] opacity-50 font-bold block">Descrição</label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel, Materiais..."
              className="w-full bg-transparent border-b border-ink/10 py-4 focus:border-gold outline-none transition-colors serif text-2xl placeholder:opacity-20"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-[0.3em] opacity-50 font-bold block">Valor (R$)</label>
              <input
                type="number"
                required
                placeholder="0,00"
                className="w-full bg-transparent border-b border-ink/10 py-4 focus:border-gold outline-none transition-colors serif text-2xl placeholder:opacity-20"
                value={formData.value}
                onChange={e => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-[0.3em] opacity-50 font-bold block">Data</label>
              <input
                type="date"
                required
                className="w-full bg-transparent border-b border-ink/10 py-4 focus:border-gold outline-none transition-colors serif text-2xl"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.3em] opacity-50 font-bold block">Categoria</label>
            <select
              className="w-full bg-transparent border-b border-ink/10 py-4 focus:border-gold outline-none transition-colors serif text-2xl appearance-none"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Material">Material</option>
              <option value="Aluguel">Aluguel</option>
              <option value="Marketing">Marketing</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="flex gap-4 pt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-6 border border-ink/10 rounded-full text-[10px] uppercase tracking-[0.3em] hover:bg-ink/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-8 bg-ink text-paper rounded-full text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-gold hover:text-ink transition-all shadow-xl"
            >
              Salvar Registro ✨
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function App() {
  const [view, setView] = useState('home');

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') setView('admin');
      if (window.location.hash === '#home') setView('home');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const fcmToken = useFCM();

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        console.error('Error fetching services:', error);
      } else {
        setServices(data as Service[]);
      }
      setLoadingServices(false);
    };

    fetchServices();

    // Subscribe to changes
    const subscription = supabase
      .channel('services-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        fetchServices();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setView('booking');
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-paper text-ink font-sans selection:bg-gold selection:text-ink overflow-x-hidden">
        {/* Atmospheric Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 100, 0],
              y: [0, 50, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gold/5 blur-[120px] rounded-full"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
              x: [0, -100, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-olive/5 blur-[120px] rounded-full"
          />
        </div>

        <Navbar activeView={view} setView={setView} />


        <main className={cn(
          "max-w-7xl mx-auto px-6 md:px-12 relative z-10",
          view === 'home' ? "pt-12 md:pt-40" : "pt-32 md:pt-48 pb-32"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === 'home' && <HomeView onStart={() => setView('catalog')} />}
              {view === 'catalog' && <CatalogView services={services} loading={loadingServices} onSelect={handleServiceSelect} />}
              {view === 'booking' && <BookingView selectedService={selectedService} onBack={() => setView('catalog')} />}
              {view === 'fidelity' && <FidelityView />}
              {view === 'admin' && <AdminView services={services} />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Decorative Floating Elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.2, 0],
                y: [0, -200],
                x: Math.random() * 100 - 50
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
              className="absolute text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
