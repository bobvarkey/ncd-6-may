import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Activity } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden flex flex-col">
      {/* ─── FULL-BLEED HERO ─── */}
      <section className="relative flex-1 flex items-center min-h-[85vh]">
        {/* Background image with overlays */}
        <div className="absolute inset-0">
          <img
            src="/doctor-monitors.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-[#0a0a0f]" />
          <div className="absolute top-1/3 left-1/4 w-[40vw] h-[40vw] rounded-full bg-pink-500/15 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] rounded-full bg-purple-500/15 blur-[100px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-10">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold tracking-wider backdrop-blur">
              <Sparkles className="h-3 w-3" />
              CLINICAL PRESCRIPTION ENGINE
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-center leading-tight mb-4">
            Primary care
            <br />
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              problems
            </span>
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-3">
            Global health · WHO data
          </p>
          <p className="text-lg md:text-xl text-muted-foreground/80 text-center max-w-2xl mx-auto mb-10 leading-relaxed">
            Evidence-based prescription engine for major primary care problems
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => navigate('/home')}
              className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-8 py-6 text-base rounded-xl shadow-lg shadow-pink-500/25"
            >
              Launch Prescription Engine
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="px-6 py-8 text-center border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
              <Activity className="h-3 w-3 text-pink-400" />
            </div>
            <span className="text-sm font-serif font-semibold">NCD Rx</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Based on ADA 2026 · ESC/ESH 2024 · LAI 2023 · ACC/AHA · KDIGO · GINA/GOLD guidelines
          </p>
          <p className="text-xs text-muted-foreground/80">
            For educational and clinical decision support use only. Always consult current guidelines and clinical judgment.
          </p>
        </div>
      </footer>
    </div>
  );
}
