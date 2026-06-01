import { ModelMetrics } from '../types';
import { Target, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface ConfusionMatrixViewProps {
  metrics: ModelMetrics;
  totalEmails: number;
}

export default function ConfusionMatrixView({ metrics, totalEmails }: ConfusionMatrixViewProps) {
  const { accuracy, precision, recall, f1Score, confusionMatrix } = metrics;
  const { truePositive, falsePositive, trueNegative, falseNegative } = confusionMatrix;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl" id="confusion-matrix-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Model Evaluation Metrics</h2>
          <p className="text-xs text-slate-400">Statistical results calculated over trained training sets</p>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-slate-700/50 transition-colors" id="metric-accuracy">
          <span className="text-xs text-slate-400 block mb-1">Accuracy Score</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">{(accuracy * 100).toFixed(1)}%</span>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${accuracy * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-slate-700/50 transition-colors" id="metric-precision">
          <span className="text-xs text-slate-400 block mb-1">Precision Rate</span>
          <span className="text-2xl font-bold font-mono text-indigo-400">{(precision * 100).toFixed(1)}%</span>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: `${precision * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-slate-700/50 transition-colors" id="metric-recall">
          <span className="text-xs text-slate-400 block mb-1">Sensitivity (Recall)</span>
          <span className="text-2xl font-bold font-mono text-cyan-400">{(recall * 100).toFixed(1)}%</span>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${recall * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-slate-700/50 transition-colors" id="metric-f1">
          <span className="text-xs text-slate-400 block mb-1">F1-Score Harmonic</span>
          <span className="text-2xl font-bold font-mono text-amber-400">{(f1Score * 100).toFixed(1)}%</span>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${f1Score * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* Confusion Matrix Table */}
        <div className="flex-1 w-full">
          <span className="text-sm font-semibold text-slate-300 block mb-4">Confusion Matrix Layout</span>
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800 max-w-md mx-auto relative overflow-hidden" id="matrix-grid">
            {/* Corner header */}
            <div className="flex items-center justify-center text-[10px] text-slate-500 font-mono text-center border-b border-r border-slate-900 pb-2 mr-2">
              Actual \ Pred
            </div>
            {/* Column Headers */}
            <div className="text-center pb-2 border-b border-slate-900">
              <span className="text-[10px] uppercase tracking-wider font-mono text-rose-400 font-medium block">Phishing</span>
              <span className="text-[9px] text-slate-500 block">Pred Positive</span>
            </div>
            <div className="text-center pb-2 border-b border-slate-900">
              <span className="text-[10px] uppercase tracking-wider font-mono text-emerald-400 font-medium block">Safe</span>
              <span className="text-[9px] text-slate-500 block">Pred Negative</span>
            </div>

            {/* Row 1: Actual Phishing */}
            <div className="flex items-center justify-start pr-2 border-r border-slate-900 py-3">
              <div className="text-left">
                <span className="text-[10px] uppercase tracking-wider font-mono text-rose-400 font-medium block">Phishing</span>
                <span className="text-[9px] text-slate-500 block">Actual Positive</span>
              </div>
            </div>
            
            {/* True Positive */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 flex flex-col items-center justify-center transition-all hover:bg-emerald-500/20 group cursor-help">
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-lg font-mono">
                {truePositive}
              </div>
              <span className="text-[9px] text-emerald-500 font-mono text-center uppercase tracking-normal">True Pos (TP)</span>
              <div className="absolute hidden group-hover:block bg-slate-900 text-slate-200 text-[10px] p-2 rounded border border-emerald-500/30 shadow-xl max-w-[200px] z-20 pointer-events-none mt-20">
                Number of phishing attacks correctly classified as phishing. (High is good)
              </div>
            </div>

            {/* False Negative */}
            <div className="bg-rose-500/10 border border-rose-500/20 rounded p-3 flex flex-col items-center justify-center transition-all hover:bg-rose-500/20 group cursor-help">
              <div className="flex items-center gap-1 text-rose-400 font-bold text-lg font-mono">
                {falseNegative}
              </div>
              <span className="text-[9px] text-rose-500 font-mono text-center uppercase tracking-normal">False Neg (FN)</span>
              <div className="absolute hidden group-hover:block bg-slate-900 text-slate-200 text-[10px] p-2 rounded border border-rose-500/30 shadow-xl max-w-[200px] z-20 pointer-events-none mt-20">
                Phishing emails that slipped through as safe. This is a critical risk! (Low is good)
              </div>
            </div>

            {/* Row 2: Actual Safe */}
            <div className="flex items-center justify-start pr-2 border-r border-slate-900 py-3">
              <div className="text-left">
                <span className="text-[10px] uppercase tracking-wider font-mono text-emerald-400 font-medium block">Safe</span>
                <span className="text-[9px] text-slate-500 block">Actual Negative</span>
              </div>
            </div>

            {/* False Positive */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 flex flex-col items-center justify-center transition-all hover:bg-amber-500/20 group cursor-help">
              <div className="flex items-center gap-1 text-amber-400 font-bold text-lg font-mono">
                {falsePositive}
              </div>
              <span className="text-[9px] text-amber-500 font-mono text-center uppercase tracking-normal">False Pos (FP)</span>
              <div className="absolute hidden group-hover:block bg-slate-900 text-slate-200 text-[10px] p-2 rounded border border-amber-500/30 shadow-xl max-w-[200px] z-20 pointer-events-none mt-20">
                Safe newsletters or legitimate letters flagged incorrectly. High rate causes spam exhaustion. (Low is good)
              </div>
            </div>

            {/* True Negative */}
            <div className="bg-slate-800/40 border border-slate-800 rounded p-3 flex flex-col items-center justify-center transition-all hover:bg-slate-800 group cursor-help">
              <div className="flex items-center gap-1 text-slate-300 font-bold text-lg font-mono">
                {trueNegative}
              </div>
              <span className="text-[9px] text-slate-400 font-mono text-center uppercase tracking-normal">True Neg (TN)</span>
              <div className="absolute hidden group-hover:block bg-slate-900 text-slate-200 text-[10px] p-2 rounded border border-slate-700 shadow-xl max-w-[200px] z-20 pointer-events-none mt-20">
                Safe emails that were correctly identified as safe. (High is good)
              </div>
            </div>
          </div>
        </div>

        {/* Explain the matrix simply */}
        <div className="flex-1 w-full space-y-4 text-xs text-slate-300">
          <div className="flex gap-2 items-start bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block mb-0.5">Statistical Precision ({ (precision * 100).toFixed(0) }%)</span>
              How often the model is correct when it claims an email is phishing. Highly crucial to prevent blocking benign workplace communications accidentally.
            </div>
          </div>

          <div className="flex gap-2 items-start bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block mb-0.5">Detection sensitivity ({ (recall * 100).toFixed(0) }%)</span>
              Which proportion of all actual phishing messages were successfully caught by the machine. If this is low, threats slip into inbox folders unrecognized.
            </div>
          </div>

          <div className="flex gap-2 items-start bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block mb-0.5">Critical Risk Indicators</span>
              Pay attention to <strong className="text-rose-400">False Negatives ({falseNegative})</strong>. These are dangerous slips which must be suppressed by refining feature extraction.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
