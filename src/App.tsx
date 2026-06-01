import { useState, useEffect, useRef } from 'react';
import DatasetManager from './components/DatasetManager';
import ConfusionMatrixView from './components/ConfusionMatrixView';
import WordWeightsBrowser from './components/WordWeightsBrowser';
import EmailScanner from './components/EmailScanner';
import { INITIAL_EMAILS, NaiveBayesClassifier } from './lib/ml';
import { Email, ModelMetrics, WordFeatureWeight, PredictionResult } from './types';
import { Shield, Brain, Terminal, Info, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  // Main Dataset state
  const [emails, setEmails] = useState<Email[]>(() => {
    const saved = localStorage.getItem('phishing_tracker_emails');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_EMAILS;
  });

  // Test Email input state
  const [testEmailDraft, setTestEmailDraft] = useState({
    sender: 'security@paypal-verification.com',
    subject: 'Action Required: Suspend notification!',
    body: 'Dear PayPal Customer, We detected unauthorized action transactions on your account numbers. To secure your data, verify your login credentials immediately: http://paypal-secure-check-verification.cc/webscr. Failure to pay overdue billing fees within 12 hours forces account locks.'
  });

  // Model parameters calculated on the fly
  const [metrics, setMetrics] = useState<ModelMetrics>({
    accuracy: 1.0,
    precision: 1.0,
    recall: 1.0,
    f1Score: 1.0,
    confusionMatrix: { truePositive: 8, falsePositive: 0, trueNegative: 8, falseNegative: 0 }
  });
  const [weights, setWeights] = useState<WordFeatureWeight[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastScannedResult, setLastScannedResult] = useState<PredictionResult | null>(null);
  
  // Tab/Panel selector for layout modularity
  const [activeTab, setActiveTab] = useState<'metrics' | 'vocabulary'>('metrics');

  const logEndRef = useRef<HTMLDivElement>(null);

  // Save changes to localStorage on email corpus change
  useEffect(() => {
    localStorage.setItem('phishing_tracker_emails', JSON.stringify(emails));
  }, [emails]);

  // Reactive On-The-Fly Model Re-Training
  useEffect(() => {
    const model = new NaiveBayesClassifier();
    
    // Train Model
    model.train(emails);
    
    // Evaluate Model parameters
    const evaluation = model.evaluate(emails);
    const vocabWeights = model.getVocabWeights();
    
    // Update React bounds
    setMetrics(evaluation);
    setWeights(vocabWeights);
    setLogs(model.trainingLogs);

    // Re-evaluate current scanner draft automatically under newly trained priors/conditionals
    if (testEmailDraft.body.trim()) {
      const predResult = model.predict({
        id: 'runtime-test',
        subject: testEmailDraft.subject,
        sender: testEmailDraft.sender,
        body: testEmailDraft.body,
        label: 'safe'
      });
      setLastScannedResult(predResult);
    }
  }, [emails]);

  // Scroll logic for logs console
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Handler to perform standard prediction manually
  const handleScanEmail = (draft: Omit<Email, 'id'>): PredictionResult => {
    const model = new NaiveBayesClassifier();
    model.train(emails);
    return model.predict({
      id: 'scanner-run',
      ...draft
    });
  };

  const handleResetEmails = () => {
    setEmails(INITIAL_EMAILS);
    setLastScannedResult(null);
  };

  const handleAddEmailToDataset = (newEmail: Email) => {
    setEmails(prev => [...prev, newEmail]);
  };

  const handleLoadEmailToScanner = (selectedEmail: Email) => {
    setTestEmailDraft({
      sender: selectedEmail.sender,
      subject: selectedEmail.subject,
      body: selectedEmail.body
    });
    
    // Trigger instant prediction update
    const model = new NaiveBayesClassifier();
    model.train(emails);
    const res = model.predict(selectedEmail);
    setLastScannedResult(res);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Visual Workspace Hero Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-md md:text-lg font-bold text-slate-100 tracking-tight">Phishing Shield AI</h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                  Model Trained
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Machine Learning & Supervised Bayesian Email Classification Model Simulator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span>Vocab: <strong className="text-indigo-400">{weights.length}</strong> words</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Local Accuracy: <strong className="text-emerald-400">{(metrics.accuracy * 100).toFixed(0)}%</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Core Layout */}
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full space-y-8" id="main-content">
        
        {/* Short info/how-it-works card */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex flex-col sm:flex-row items-start gap-3 text-slate-300 text-xs">
          <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
            <Info className="w-4 h-4" />
          </span>
          <div className="space-y-1">
            <strong className="text-slate-200">How this simulator trains your model:</strong>
            <p className="leading-relaxed">
              We've implemented a robust <strong>Naive Bayes classifier with additive Laplace smoothing</strong> from scratch in TypeScript/React. The model tokenizes your email text, extracts vocabulary parameters, computes class probability distributions, and evaluates statistical precision/recall on-the-fly. This runs offline on your browser, with server-side <strong>Gemini 3.5 LLMs</strong> integrated to simulate realistic cyber scenario templates and provide security audits on scanned results.
            </p>
          </div>
        </div>

        {/* Core Double Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Block: Corpus Dataset Manager & Training log Console */}
          <div className="space-y-8 h-full flex flex-col">
            
            {/* The corpus binder */}
            <DatasetManager
              emails={emails}
              onChangeEmails={setEmails}
              onResetEmails={handleResetEmails}
              onSelectEmailToTest={handleLoadEmailToScanner}
            />

            {/* Interactive Mathematics and Execution Logs Terminal */}
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 shadow-2xl flex flex-col flex-1 min-h-[220px]" id="logs-terminal">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] font-bold font-mono text-slate-400 uppercase tracking-widest">
                    Model Training Pipeline Logs
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Bayesian logs
                </span>
              </div>

              {/* Logs Stream */}
              <div className="flex-1 overflow-y-auto max-h-[160px] space-y-1.5 font-mono text-[10px] text-zinc-400 custom-scrollbar pr-2">
                {logs.map((log, index) => (
                  <div key={index} className="leading-relaxed whitespace-pre-wrap">
                    <span className="text-indigo-500/90 font-semibold mr-1">❯</span>
                    {log}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>

          {/* Right Block: Statistics & Vocabulary Coefficients */}
          <div className="space-y-6">
            
            {/* Panel Selector Tab System */}
            <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`flex-1 py-2 rounded-md transition-all font-semibold flex items-center justify-center gap-1.5 ${activeTab === 'metrics' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Model Confusion Matrix & Metrics
              </button>
              <button
                onClick={() => setActiveTab('vocabulary')}
                className={`flex-1 py-2 rounded-md transition-all font-semibold flex items-center justify-center gap-1.5 ${activeTab === 'vocabulary' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Inspect Learned Word Weights
              </button>
            </div>

            {/* Tab Render panel */}
            <div className="transition-all duration-300">
              {activeTab === 'metrics' ? (
                <ConfusionMatrixView metrics={metrics} totalEmails={emails.length} />
              ) : (
                <WordWeightsBrowser weights={weights} />
              )}
            </div>

          </div>
        </div>

        {/* Full-Width Section: Sandbox Scanner Lab & CISO Advisor */}
        <div className="border-t border-slate-900 pt-8">
          <EmailScanner
            onScanEmail={handleScanEmail}
            lastScannedResult={lastScannedResult}
            setLastScannedResult={setLastScannedResult}
            testEmailDraft={testEmailDraft}
            setTestEmailDraft={setTestEmailDraft}
            onAddEmailToDataset={handleAddEmailToDataset}
          />
        </div>
      </main>

      {/* Humble Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 px-6 py-6 text-center text-[10px] text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>
            Designed and compiled offline in browser & server-side Node.js containers.
          </span>
          <span>
            API Grounding: Gemini-3.5-Flash
          </span>
        </div>
      </footer>
    </div>
  );
}
