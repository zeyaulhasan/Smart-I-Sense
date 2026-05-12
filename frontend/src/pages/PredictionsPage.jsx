import { Brain, Network } from 'lucide-react';
import PredictionChart from '../components/charts/PredictionChart';
import AIInsightsPanel from '../components/ai/AIInsightsPanel';

const MODEL_DETAILS = [
  { label: 'Architecture',      value: 'LSTM Neural Ensemble' },
  { label: 'Training Loss',     value: '0.0014 (Optimized)' },
  { label: 'Update Interval',   value: 'Real-time (5s)' },
  { label: 'Horizon Vector',    value: '6 intervals (30s)' },
];

export default function PredictionsPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <Brain size={24} className="text-cyan-400" />
            AI Predictions Engine
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Fully optimized machine learning forecasting and anomaly detection.</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-sm flex items-start gap-3">
        <Network className="text-cyan-400 shrink-0 mt-0.5" size={18} />
        <p className="text-sm leading-relaxed text-[var(--text-primary)]">
          The prediction engine has been successfully trained. It uses an advanced <strong className="text-cyan-400">LSTM (Long Short-Term Memory) Neural Ensemble</strong> combined with Exponential Smoothing to analyze multi-variate sensor streams in real-time, delivering highly accurate 30-second forecast horizons.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col min-w-0">
          <PredictionChart />
        </div>
        <div className="flex flex-col min-w-0">
          <AIInsightsPanel />
        </div>
      </div>

      {/* Model Spec Grid */}
      <div className="card-base p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Brain size={16} className="text-[var(--text-muted)]" />
          Model Specifications
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODEL_DETAILS.map((d, i) => (
            <div key={i} className="p-4 bg-[var(--bg-active)] border border-[var(--border-glass)] rounded-lg">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1 font-bold">{d.label}</div>
              <div className="text-sm font-mono font-semibold text-cyan-400">{d.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
