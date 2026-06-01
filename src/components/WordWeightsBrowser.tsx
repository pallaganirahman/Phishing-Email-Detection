import { useState, useMemo } from 'react';
import { WordFeatureWeight } from '../types';
import { Search, Info, AlertTriangle, CheckCircle, HelpCircle, ArrowUpDown } from 'lucide-react';

interface WordWeightsBrowserProps {
  weights: WordFeatureWeight[];
}

type SortCriteria = 'threat' | 'frequency' | 'safe';

export default function WordWeightsBrowser({ weights }: WordWeightsBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortCriteria>('threat');

  const filteredAndSortedWeights = useMemo(() => {
    let list = weights.filter(w => w.word.toLowerCase().includes(searchTerm.toLowerCase()));

    if (sortBy === 'threat') {
      // Sort in descending order of phishing likelihood ratio
      list.sort((a, b) => b.ratio - a.ratio);
    } else if (sortBy === 'safe') {
      // Sort in ascending order of phishing likelihood ratio (i.e. safest first)
      list.sort((a, b) => a.ratio - b.ratio);
    } else if (sortBy === 'frequency') {
      // Sort by combined occurrence frequency
      list.sort((a, b) => (b.phishingCount + b.safeCount) - (a.phishingCount + a.safeCount));
    }

    return list;
  }, [weights, searchTerm, sortBy]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl" id="weights-browser-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            Model Vocabulary & Learned Weights
          </h2>
          <p className="text-xs text-slate-400">
            Probability ratios calculated by Naive Bayes using Laplace additive smoothing
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vocabulary..."
              className="bg-slate-950 text-slate-100 text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 w-full md:w-48 placeholder-slate-500 font-mono"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort Selection */}
          <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setSortBy('threat')}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${sortBy === 'threat' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Phishing Tilt
            </button>
            <button
              onClick={() => setSortBy('safe')}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${sortBy === 'safe' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Safe Tilt
            </button>
            <button
              onClick={() => setSortBy('frequency')}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${sortBy === 'frequency' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Frequency
            </button>
          </div>
        </div>
      </div>

      {weights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg bg-slate-950/20">
          <Info className="w-6 h-6 mb-2 text-slate-600" />
          No vocabulary weights found. Train the model to see vocabulary probabilities.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto custom-scrollbar border border-slate-800 rounded-lg bg-slate-950 text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-mono uppercase tracking-wider text-[10px]">
                  <th className="p-3 pl-4 font-semibold">Vocabulary Keyword</th>
                  <th className="p-3 text-center font-semibold">Phish Counts</th>
                  <th className="p-3 text-center font-semibold">Safe Counts</th>
                  <th className="p-3 text-right font-semibold">Bayesian Multiplier</th>
                  <th className="p-3 pl-6 font-semibold">Lean Status indicator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300 font-mono">
                {filteredAndSortedWeights.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      No matching keywords in vocabulary.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedWeights.map(w => {
                    // Maximum visual range factor clamped
                    const displayRatio = w.ratio;
                    
                    return (
                      <tr key={w.word} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-3 pl-4 font-semibold text-slate-100">{w.word}</td>
                        <td className="p-3 text-center text-slate-400">{w.phishingCount}</td>
                        <td className="p-3 text-center text-slate-400">{w.safeCount}</td>
                        <td className="p-3 text-right font-mono font-bold">
                          <span className={w.ratio > 1.2 ? 'text-rose-400' : w.ratio < 0.8 ? 'text-emerald-400' : 'text-slate-400'}>
                            {w.ratio.toFixed(2)}x
                          </span>
                        </td>
                        <td className="p-3 pl-6">
                          <div className="flex items-center gap-2">
                            {w.ratio > 1.3 ? (
                              <div className="flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                                <AlertTriangle className="w-3 h-3" /> Phish ({Math.round(w.ratio * 10)}x)
                              </div>
                            ) : w.ratio < 0.77 ? (
                              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                                <CheckCircle className="w-3 h-3" /> Safe ({Math.round((1/w.ratio) * 10)}x)
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-500 uppercase px-2">
                                Neutral
                              </div>
                            )}

                            {/* Visual Gauge */}
                            <div className="w-24 bg-slate-800 h-1 rounded overflow-hidden relative">
                              <div
                                className={`h-full absolute top-0 ${w.ratio > 1.0 ? 'left-1/2 bg-rose-400' : 'right-1/2 bg-emerald-400'}`}
                                style={{
                                  left: w.ratio > 1.0 ? '50%' : 'auto',
                                  right: w.ratio <= 1.0 ? '50%' : 'auto',
                                  width: w.ratio > 1.0 
                                    ? `${Math.min(50, (w.ratio - 1) * 15)}%` 
                                    : `${Math.min(50, (1 - w.ratio) * 50)}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex gap-2 text-slate-400 text-xs">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Understanding parameters:</strong> The <strong className="text-slate-300">Bayesian Multiplier</strong> represents $P(Word \mid Phishing) / P(Word \mid Safe)$. A value of <strong>2.50x</strong> means a trained word is 2.5 times more likely to show up in phishing emails than in legal emails. The classification engine sums up these logged weights to compute overall probability.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
