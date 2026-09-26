import { useNavigate } from "react-router-dom";

// Material Symbol Icon component
function Icon({ name, filled = false }: { name: string; filled?: boolean }) {
  return (
    <span 
      className="material-symbols-outlined" 
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
    >
      {name}
    </span>
  );
}

// Animated ECG line
function ECGWave() {
  return (
    <div className="relative h-12 w-48 overflow-hidden">
      <svg viewBox="0 0 200 40" className="w-full h-full">
        <defs>
          <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <path 
          d="M0,20 L30,20 L35,20 L40,5 L45,35 L50,20 L55,20 L70,20 L75,10 L80,30 L85,20 L90,20 L110,20 L115,5 L120,35 L125,20 L130,20 L145,20 L150,8 L155,32 L160,20 L200,20"
          fill="none"
          stroke="url(#ecgGrad)"
          strokeWidth="2"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}

// Glowing heart icon
function HeartBeat() {
  return (
    <div className="relative">
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path 
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="url(#heartGrad)"
        />
        <defs>
          <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Dot matrix pattern background
function MatrixBg() {
  return (
    <div className="absolute inset-0 opacity-30 pointer-events-none">
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(236,72,153,0.5) 1px, transparent 1px)`,
        backgroundSize: '32px 32px'
      }} />
    </div>
  );
}

// Navigation
function Navbar() {
  const navigate = useNavigate();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/10 backdrop-blur-md border-b border-border/40">
      <nav className="flex justify-between items-center w-full px-6 h-14 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center">
            <HeartBeat />
          </div>
          <span className="text-lg font-bold text-foreground">NCD Rx</span>
        </div>
        
        <button 
          onClick={() => navigate("/home")}
          className="px-4 py-1.5 rounded-full bg-card/10 hover:bg-card/20 text-foreground text-sm font-medium transition-colors"
        >
          Launch App
        </button>
      </nav>
    </header>
  );
}

// Main Hero
function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-pink-600/20 to-transparent" />
        <div className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-600/20 to-transparent" />
        <MatrixBg />
      </div>
      
      {/* Animated glow orbs */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-pink-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-cyan-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Center content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <ECGWave />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-cyan-400 bg-clip-text text-transparent">
            NCD Rx
          </span>
        </h1>
        
        <p className="text-xl text-foreground/70 mb-8 max-w-xl mx-auto">
          Comprehensive non-communicable disease management.
          <br />
          Powered by latest clinical guidelines.
        </p>

        {/* Condition badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { name: 'Diabetes', color: 'border-red-500/50 text-destructive' },
            { name: 'Hypertension', color: 'border-rose-500/50 text-destructive' },
            { name: 'Lipids', color: 'border-amber-500/50 text-warning' },
            { name: 'Obesity', color: 'border-emerald-500/50 text-emerald-400' },
            { name: 'COPD', color: 'border-cyan-500/50 text-cyan-400' },
            { name: 'Kidney', color: 'border-violet-500/50 text-violet-400' }
          ].map((c, i) => (
            <span 
              key={i}
              className={`px-4 py-1.5 rounded-full text-sm border ${c.color} bg-black/10`}
            >
              {c.name}
            </span>
          ))}
        </div>

        <button 
          onClick={() => navigate("/home")}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:opacity-90 text-foreground font-semibold transition-all hover:scale-105"
        >
          Get Started →
        </button>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-lg mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">6</div>
            <div className="text-xs text-foreground/50">Conditions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">50+</div>
            <div className="text-xs text-foreground/50">Calculators</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">2026</div>
            <div className="text-xs text-foreground/50">Guidelines</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Simple footer
function Footer() {
  return (
    <footer className="py-8 px-6 bg-card border-t border-border/40">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <HeartBeat />
          <span className="text-foreground font-medium">NCD Rx</span>
        </div>
        <p className="text-xs text-foreground/30">© 2026 Clinician-designed for precision</p>
      </div>
    </footer>
  );
}

// Main 
export default function ModeSelector() {
  return (
    <div className="min-h-screen bg-card text-foreground">
      <Navbar />
      <main className="pt-14">
        <Hero />
      </main>
      <Footer />

      {/* Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap');
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}