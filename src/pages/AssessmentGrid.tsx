import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface Tool {
  id: number;
  name: string;
  description: string;
  category: string;
  emoji: string;
  gradient: string;
  route: string;
}

const TOOLS: Tool[] = [
  { id: 1, name: 'Med Optimizer', description: 'AI-powered medication recommendations', category: 'Medications', emoji: '💊', gradient: 'from-purple-600 to-pink-600', route: '/medications' },
  { id: 2, name: 'Insulin Titration', description: 'Smart insulin dosing calculator', category: 'Dosing', emoji: '💉', gradient: 'from-blue-600 to-cyan-600', route: '/insulin-titration' },
  { id: 3, name: 'HbA1c Tracker', description: 'Track glucose control trends', category: 'Monitoring', emoji: '📊', gradient: 'from-pink-600 to-red-600', route: '/progress' },
  { id: 4, name: 'GLP-1 Admin', description: 'GLP-1 agonist dosing guide', category: 'Dosing', emoji: '💧', gradient: 'from-green-600 to-teal-600', route: '/glp1-administration' },
  { id: 5, name: 'Plate Method', description: 'Visual meal planning tool', category: 'Nutrition', emoji: '🍽️', gradient: 'from-orange-600 to-yellow-600', route: '/plate' },
  { id: 6, name: 'Diet Plan', description: '7-day personalized meal plans', category: 'Diet', emoji: '🥗', gradient: 'from-violet-600 to-purple-600', route: '/diet-plan' },
  { id: 7, name: 'Hypo Risk Score', description: 'Hypoglycemia risk assessment', category: 'Safety', emoji: '⚠️', gradient: 'from-red-600 to-orange-600', route: '/hypo-risk' },
  { id: 8, name: 'Sliding Scale', description: 'Inpatient glycemic management', category: 'Dosing', emoji: '📈', gradient: 'from-yellow-600 to-amber-600', route: '/sliding-scale' },
  { id: 9, name: 'Food Database', description: '1000+ foods with nutrition data', category: 'Nutrition', emoji: '🍎', gradient: 'from-pink-600 to-rose-600', route: '/foods' },
  { id: 10, name: 'Renal Dosing', description: 'Kidney function-based dosing', category: 'Safety', emoji: '🫘', gradient: 'from-cyan-600 to-blue-600', route: '/renal-dosing' },
  { id: 11, name: 'Prediabetes', description: 'Prevention and management guide', category: 'Education', emoji: '🎯', gradient: 'from-pink-600 to-fuchsia-600', route: '/prediabetes' },
  { id: 12, name: 'CKD Guidelines', description: 'Chronic kidney disease protocols', category: 'Comorbidity', emoji: '🧬', gradient: 'from-lime-600 to-green-600', route: '/ckd-guideline' },
  { id: 13, name: 'Patient Summary', description: 'Comprehensive patient overview', category: 'Dashboard', emoji: '📋', gradient: 'from-orange-600 to-red-600', route: '/summary' },
  { id: 14, name: 'Patient Input', description: 'Enter patient demographics', category: 'Data Entry', emoji: '✍️', gradient: 'from-violet-600 to-indigo-600', route: '/patient' },
  { id: 15, name: 'Dashboard', category: 'Dashboard', description: 'Real-time patient metrics', emoji: '📊', gradient: 'from-red-600 to-pink-600', route: '/dashboard' },
  { id: 16, name: 'Daily Management', description: 'Evidence-based education pearls', category: 'Education', emoji: '📖', gradient: 'from-amber-600 to-yellow-600', route: '/daily-management' },
  { id: 17, name: 'Type 1 DM', description: 'Basal-bolus insulin management', category: 'Dosing', emoji: '💉', gradient: 'from-indigo-600 to-purple-600', route: '/type1-management' },
  { id: 18, name: 'Insulin Therapy', description: 'Core insulin protocols for T1D & T2D', category: 'Dosing', emoji: '🩸', gradient: 'from-blue-600 to-indigo-600', route: '/insulin-therapy' },
  { id: 19, name: 'T1D Pitfalls', description: '7 common insulin prescribing errors', category: 'Safety', emoji: '⚠️', gradient: 'from-red-600 to-orange-600', route: '/type1-pitfalls' },
  { id: 20, name: 'T2D Transition', description: 'Orals to basal insulin guide', category: 'Dosing', emoji: '🔄', gradient: 'from-teal-600 to-cyan-600', route: '/type2-transition' },
  { id: 21, name: 'Feedback & Tips', description: 'Share bugs, tips, and suggestions', category: 'Community', emoji: '💬', gradient: 'from-violet-600 to-purple-600', route: '/feedback' },
];

export default function AssessmentGrid() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card text-foreground overflow-hidden">
      {/* Hero Section */}
      <div className="relative w-full bg-gradient-to-b from-card to-background overflow-hidden pt-8 pb-12">
        {/* Background gradient elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-lg mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold font-heading mb-4 leading-tight">
              Get access to all our<br />
              <span className="text-secondary">clinical tools</span>
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              ✅ Hospital-grade medication optimizer with AI recommendations<br/>
              ✅ Real-time glucose management and inpatient protocols<br/>
              ✅ Evidence-based education and clinical decision support
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-lg px-4 py-8">
          {/* Tools Grid - 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => navigate(tool.route)}
                className="group relative h-48 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-90 group-hover:opacity-100 transition-opacity`}></div>

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-4">
                  <div>
                    <div className="text-4xl mb-2">{tool.emoji}</div>
                    <h3 className="text-lg font-bold text-foreground mb-1 text-left">{tool.name}</h3>
                    <p className="text-xs text-foreground/80 text-left line-clamp-2">{tool.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground/70">{tool.category}</span>
                    <ChevronRight className="w-4 h-4 text-foreground/60 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Feature Highlights */}
          <div className="mt-12 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl">
            <h3 className="font-bold text-foreground mb-4 text-center">Why choose our platform?</h3>
            <div className="space-y-3">
              <div className="flex gap-3 text-sm">
                <span className="text-secondary font-bold flex-shrink-0">✓</span>
                <span className="text-foreground">Hospital-grade algorithms trusted by clinicians</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-secondary font-bold flex-shrink-0">✓</span>
                <span className="text-foreground">Evidence-based with clinical trial citations</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-secondary font-bold flex-shrink-0">✓</span>
                <span className="text-foreground">All {TOOLS.length} tools accessible immediately</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/patient')}
            className="w-full mt-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-foreground font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/50"
          >
            Start with Patient Input →
          </button>
        </div>
      </div>
    </div>
  );
}
