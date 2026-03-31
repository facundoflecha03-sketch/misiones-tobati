import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  PlusCircle, 
  Flame, 
  Heart, 
  Church, 
  History,
  Sparkles,
  Share2,
  Camera,
  MapPin,
  Cross,
  Activity,
  ChevronRight
} from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
// Reemplaza los valores vacíos "" con tus credenciales reales de la consola de Firebase
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Si estás probando aquí mismo, usamos la configuración del entorno
const finalConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : firebaseConfig;

const app = initializeApp(finalConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'misiones-tobati-2026';

const App = () => {
  const [user, setUser] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('form'); 
  const [showStoryCard, setShowStoryCard] = useState(false);
  const [lastContribution, setLastContribution] = useState(null);

  const [formData, setFormData] = useState({ 
    nombre: '', 
    rosarios: 0, 
    misa: 0, 
    adoracion: 0, 
    entrega: 0 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const COMMUNITY_GOAL = 1000;

  // Autenticación
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Error Auth:", e); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Escuchar aportes en tiempo real
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'contributions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContributions(data);
      setLoading(false);
    }, (error) => {
      console.error("Error Firestore:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Cálculos de estadísticas
  const stats = useMemo(() => {
    let totals = { rosarios: 0, misa: 0, adoracion: 0, entrega: 0, global: 0 };
    contributions.forEach(c => {
      totals.rosarios += (c.rosarios || 0);
      totals.misa += (c.misa || 0);
      totals.adoracion += (c.adoracion || 0);
      totals.entrega += (c.entrega || 0);
    });
    totals.global = totals.rosarios + totals.misa + totals.adoracion + totals.entrega;
    const history = [...contributions].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    return { history, ...totals };
  }, [contributions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;
    const totalAdded = formData.rosarios + formData.misa + formData.adoracion + formData.entrega;
    if (totalAdded <= 0) return;

    setIsSubmitting(true);
    try {
      const docData = { ...formData, timestamp: serverTimestamp(), userId: user.uid };
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'contributions'), docData);
      setLastContribution(docData);
      setFormData({ ...formData, rosarios: 0, misa: 0, adoracion: 0, entrega: 0 });
      setView('success');
    } catch (e) { console.error("Error al guardar:", e); }
    setIsSubmitting(false);
  };

  const handleShareWhatsApp = () => {
    const currentUrl = "https://misiones-tobati.vercel.app"; // Reemplazar con tu URL real
    const total = lastContribution.rosarios + lastContribution.misa + lastContribution.adoracion + lastContribution.entrega;
    const text = `¡Acabo de sumar ${total} aportes al Capital de Gracias de Tobatí! ❤️🏔️\n\n"Peregrino en Alianza, Levanta el corazón". Súmate aquí: 👇\n${currentUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-orange-200">
      <div className="animate-spin mb-4"><Activity size={40} /></div>
      <p className="font-black tracking-widest uppercase text-sm">Uniendo oraciones...</p>
    </div>
  );

  // --- VISTA DE ESTAMPA DIGITAL (HISTORIAS) ---
  if (showStoryCard && lastContribution) {
    const totalStory = lastContribution.rosarios + lastContribution.misa + lastContribution.adoracion + lastContribution.entrega;
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div id="story-card" className="relative w-full max-w-[380px] aspect-[9/16] bg-orange-950 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10 flex flex-col items-center justify-center text-center p-10">
          <img src="Iglesia_de_Tobati.jpg" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" alt="Fondo" />
          <div className="absolute inset-0 bg-gradient-to-b from-orange-900/50 to-black/90" />
          
          <div className="relative z-10 space-y-8">
            <div className="bg-white/10 p-5 rounded-full backdrop-blur-md inline-block border border-white/20 shadow-xl">
              <Cross size={56} className="text-orange-200" />
            </div>
            <div className="space-y-2">
              <h2 className="text-white text-4xl font-black uppercase tracking-tighter">MI ENTREGA</h2>
              <div className="h-1 w-20 bg-orange-500 mx-auto rounded-full" />
            </div>
            <div className="py-4">
              <span className="text-8xl font-black text-orange-400 drop-shadow-[0_4px_15px_rgba(251,146,60,0.5)] leading-none">{totalStory}</span>
              <p className="text-orange-200 text-xl font-bold uppercase tracking-widest mt-2">Aportes Ofrecidos</p>
            </div>
            <p className="text-white/80 italic font-serif text-2xl leading-tight">"Peregrino en Alianza, <br/>Levanta el corazón"</p>
            <div className="pt-8">
              <div className="bg-white/10 px-6 py-2 rounded-full text-white font-bold text-xs uppercase tracking-[0.3em] border border-white/20 backdrop-blur-sm">Tobatí 2026</div>
            </div>
          </div>
          <button onClick={() => setShowStoryCard(false)} className="absolute top-8 right-8 text-white/50 hover:text-white bg-black/40 p-3 rounded-full backdrop-blur-md transition-all">✕</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-slate-900 selection:bg-orange-200 overflow-x-hidden font-sans">
      {/* FONDO FIJO BAJA EXPOSICIÓN */}
      <div className="fixed inset-0 z-0 bg-slate-950">
        <img 
          src="Iglesia_de_Tobati.jpg" 
          className="w-full h-full object-cover opacity-25" 
          alt="Iglesia de Tobati" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/95" />
      </div>

      {/* CONTENEDOR CENTRADO MAESTRO */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col min-h-screen px-6">
        
        <header className="pt-10 pb-6 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="p-5 bg-orange-950/50 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
            <MapPin size={32} className="text-orange-300" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-white text-sm font-black tracking-[0.4em] uppercase opacity-70">Misiones Familiares</h1>
            <p className="text-orange-200 text-4xl font-black uppercase tracking-tighter drop-shadow-lg">Tobatí</p>
          </div>
        </header>

        {/* PROGRESO COMUNITARIO */}
        <section className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2.5rem] shadow-2xl mb-8 transform transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-end mb-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-orange-200 uppercase tracking-widest">Aporte Espiritual</span>
              <p className="text-white text-3xl font-black leading-none">{stats.global} <span className="text-sm font-medium opacity-50">/ {COMMUNITY_GOAL}</span></p>
            </div>
            <div className="p-2 bg-orange-500/20 rounded-full animate-pulse">
              <Activity className="text-orange-400" size={20} />
            </div>
          </div>
          <div className="w-full h-3.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 transition-all duration-1000 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]" 
              style={{ width: `${Math.min(100, (stats.global/COMMUNITY_GOAL)*100)}%` }} 
            />
          </div>
        </section>

        {/* NAVEGACIÓN TABS */}
        <nav className="flex bg-white/10 backdrop-blur-lg rounded-2xl p-1.5 mb-8 border border-white/10 shadow-xl">
          <button 
            onClick={() => setView('form')} 
            className={`flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${view === 'form' || view === 'success' ? 'bg-white text-orange-950 shadow-lg scale-[1.02]' : 'text-white/60 hover:text-white'}`}
          >
            Ofrecer
          </button>
          <button 
            onClick={() => setView('progreso')} 
            className={`flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${view === 'progreso' ? 'bg-white text-orange-950 shadow-lg scale-[1.02]' : 'text-white/60 hover:text-white'}`}
          >
            Progreso
          </button>
        </nav>

        <div className="flex-1 pb-28">
          {view === 'form' && (
            <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-2xl space-y-6 animate-in slide-in-from-bottom-8 duration-500">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-[0.2em]">¿Quién ofrece hoy?</label>
                <input 
                  type="text" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Tu nombre o Familia..."
                  className="w-full p-4 bg-slate-100/50 border-2 border-transparent focus:border-orange-500/30 rounded-2xl outline-none text-lg font-bold transition-all placeholder:text-slate-300"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <CounterInput label="Rosarios" value={formData.rosarios} onChange={v => setFormData({...formData, rosarios: v})} icon={<Flame size={16} className="text-rose-500" />} />
                <CounterInput label="Misas" value={formData.misa} onChange={v => setFormData({...formData, misa: v})} icon={<Church size={16} className="text-blue-600" />} />
                <CounterInput label="Adoración" value={formData.adoracion} onChange={v => setFormData({...formData, adoracion: v})} icon={<History size={16} className="text-amber-500" />} />
                <CounterInput label="Entrega" value={formData.entrega} onChange={v => setFormData({...formData, entrega: v})} icon={<Heart size={16} className="text-emerald-500" />} />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting} 
                className={`w-full py-5 bg-gradient-to-br from-orange-500 to-amber-700 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-3`}
              >
                {isSubmitting ? 'GUARDANDO...' : (
                  <>
                    <Sparkles size={20} />
                    <span>ENTREGAR AL CAPITAL</span>
                  </>
                )}
              </button>
            </form>
          )}

          {view === 'success' && (
            <div className="bg-white/95 p-10 rounded-[2.5rem] shadow-2xl text-center space-y-8 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
                <Sparkles size={48} className="animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">¡Ofrecido!</h2>
                <p className="text-slate-500 font-medium">Tu aporte ya está en el tesoro de Tobatí.</p>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={handleShareWhatsApp} 
                  className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg hover:brightness-110 transition-all"
                >
                  <Share2 size={20} /> WhatsApp
                </button>
                <button 
                  onClick={() => setShowStoryCard(true)} 
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg hover:brightness-110 transition-all"
                >
                  <Camera size={20} /> Estampa Digital
                </button>
              </div>
              <button 
                onClick={() => setView('form')} 
                className="flex items-center justify-center gap-1 mx-auto text-orange-600 font-black text-xs uppercase tracking-widest pt-2 hover:gap-3 transition-all"
              >
                Seguir aportando <ChevronRight size={14} />
              </button>
            </div>
          )}

          {view === 'progreso' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
              <div className="grid grid-cols-4 gap-2">
                <StatCard label="Ros" val={stats.rosarios} icon="📿" />
                <StatCard label="Mis" val={stats.misa} icon="⛪" />
                <StatCard label="Ado" val={stats.adoracion} icon="🕯️" />
                <StatCard label="Ent" val={stats.entrega} icon="❤️" />
              </div>

              <div className="bg-white/95 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/50">
                <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="font-black text-slate-700 uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
                    Historial Vivo
                  </h2>
                  <Activity size={16} className="text-orange-500 animate-pulse" />
                </div>
                
                <div className="max-h-[35vh] overflow-y-auto divide-y divide-slate-100 scrollbar-hide">
                  {stats.history.length === 0 ? (
                    <div className="p-16 text-center text-slate-300">
                      <p className="font-bold mb-1 italic">Vaso espiritual esperando...</p>
                      <p className="text-[10px] uppercase">Sé el primero en ofrecer hoy.</p>
                    </div>
                  ) : (
                    stats.history.map((c, i) => (
                      <div key={i} className="p-5 flex items-center justify-between hover:bg-orange-50/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner group-hover:scale-110 transition-transform">
                            <Heart size={20} />
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm uppercase leading-none">{c.nombre}</p>
                            <div className="flex flex-wrap gap-2 mt-2 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                              {c.rosarios > 0 && <span className="bg-slate-100 px-1.5 py-0.5 rounded">📿 {c.rosarios}</span>}
                              {c.misa > 0 && <span className="bg-slate-100 px-1.5 py-0.5 rounded">⛪ {c.misa}</span>}
                              {c.adoracion > 0 && <span className="bg-slate-100 px-1.5 py-0.5 rounded">🕯️ {c.adoracion}</span>}
                              {c.entrega > 0 && <span className="bg-slate-100 px-1.5 py-0.5 rounded">❤️ {c.entrega}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-black text-slate-300 uppercase italic">Hace poco</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER PERSISTENTE */}
        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-black/60 backdrop-blur-xl border-t border-white/10 p-4 flex justify-center items-center z-40">
          <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.5em] text-center">
            Nada sin ti, nada sin nosotros • Tobatí 2026
          </p>
        </footer>
      </div>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const CounterInput = ({ label, icon, value, onChange }) => (
  <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl hover:border-orange-200 transition-colors">
    <div className="flex items-center gap-2 mb-3">
      {icon} <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">{label}</span>
    </div>
    <div className="flex items-center justify-between">
      <button 
        type="button" 
        onClick={() => onChange(Math.max(0, value - 1))} 
        className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 font-black border border-slate-100 active:scale-90 transition-all"
      >
        -
      </button>
      <span className="text-xl font-black text-slate-800">{value}</span>
      <button 
        type="button" 
        onClick={() => onChange(value + 1)} 
        className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 font-black border border-slate-100 active:scale-90 transition-all"
      >
        +
      </button>
    </div>
  </div>
);

const StatCard = ({ label, val, icon }) => (
  <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-3xl text-center shadow-lg transform transition-all hover:-translate-y-1">
    <div className="text-2xl mb-1">{icon}</div>
    <div className="text-lg font-black text-white leading-none mb-1">{val}</div>
    <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{label}</div>
  </div>
);

export default App;
