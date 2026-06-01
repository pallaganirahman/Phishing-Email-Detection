import React, { useState } from 'react';
import { Email, PredictionResult } from '../types';
import { AlertTriangle, ShieldCheck, Sparkles, AlertCircle, Info, Siren, Eye, ArrowRight, CornerDownRight, Loader2, HelpCircle } from 'lucide-react';

interface EmailScannerProps {
  onScanEmail: (email: Omit<Email, 'id'>) => PredictionResult;
  lastScannedResult: PredictionResult | null;
  setLastScannedResult: (res: PredictionResult | null) => void;
  testEmailDraft: { subject: string; sender: string; body: string };
  setTestEmailDraft: React.Dispatch<React.SetStateAction<{ subject: string; sender: string; body: string }>>;
  onAddEmailToDataset: (email: Email) => void;
}

const PRESET_AI_SCENARIOS = [
  { value: 'paypal_phish', label: 'PayPal Security Suspension', type: 'phishing', prompt: 'PayPal account suspension claim with verification links' },
  { value: 'boss_giftcard', label: 'CEO Gift Card request', type: 'phishing', prompt: 'CEO urgent request to buy gift cards for client meeting spearphishing' },
  { value: 'google_signin', label: 'Google Unauthorized Sign-In', type: 'phishing', prompt: 'Google Alert: unrecognized login in China require safety check click' },
  { value: 'invoice_due', label: 'Fake Urgent Invoice #7838', type: 'phishing', prompt: 'A highly urgent unpaid invoice bill for direct bank verification' },
  { value: 'safe_receipt', label: 'Amazon Safe Order Invoice', type: 'safe', prompt: 'Harmless order receipt confirmation notice with no logins required' },
  { value: 'safe_corporate', label: 'Corporate Holiday Update', type: 'safe', prompt: 'A friendly HR note regarding employee insurance and next week holidays' },
  { value: 'safe_casual', label: 'Coworker Lunch Invite', type: 'safe', prompt: 'Informal coworker chat regarding getting hamburgers for lunch today' }
];

export default function EmailScanner({
  onScanEmail,
  lastScannedResult,
  setLastScannedResult,
  testEmailDraft,
  setTestEmailDraft,
  onAddEmailToDataset
}: EmailScannerProps) {
  const [selectedScenario, setSelectedScenario] = useState('paypal_phish');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  
  // Storage for Gemini Explanations
  const [aiAuditText, setAiAuditText] = useState('');
  const [apiError, setApiError] = useState('');

  const handleScan = () => {
    const result = onScanEmail({
      subject: testEmailDraft.subject,
      sender: testEmailDraft.sender,
      body: testEmailDraft.body,
      label: 'safe' // Temporary placeholder label
    });
    setLastScannedResult(result);
    // Clear out active audits when new scans occur
    setAiAuditText('');
    setApiError('');
  };

  // Generate synthetic email using server-side Gemini route
  const handleGenerateAIScenario = async () => {
    setIsGenerating(true);
    setApiError('');
    setLastScannedResult(null);
    setAiAuditText('');

    const targetScenario = PRESET_AI_SCENARIOS.find(s => s.value === selectedScenario);
    const label = targetScenario?.type || 'phishing';
    const scenario = targetScenario?.prompt || '';

    try {
      const response = await fetch('/api/generate-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, scenario })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Could not query Gemini on Express server.');
      }

      const generated = resData.data;
      setTestEmailDraft({
        subject: generated.subject,
        sender: generated.sender,
        body: generated.body
      });

      // Show toast / info
      setIsGenerating(false);

      // Perform auto-scan directly on loaded email
      const result = onScanEmail({
        subject: generated.subject,
        sender: generated.sender,
        body: generated.body,
        label: generated.label
      });
      setLastScannedResult(result);
      
      if (generated.explanation) {
        setAiAuditText(`### AI Scenario Note\n*Generated Scenerio Type: **${generated.scenarioType || 'Simulation'}***\n\n${generated.explanation}`);
      }

    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Gemini Server could not process request. Ensure API keys are set.');
      setIsGenerating(false);
    }
  };

  // Request interactive Deep Audit via Gemini based on model findings
  const handleRequestDeepAudit = async () => {
    if (!lastScannedResult) return;
    setIsAuditing(true);
    setApiError('');

    try {
      const response = await fetch('/api/explain-model-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmailDraft,
          prediction: lastScannedResult,
          triggeredKeywords: lastScannedResult.features.triggeredKeywords
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to explain decision from server.');
      }

      setAiAuditText(resData.explanation);
      setIsAuditing(false);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Could not fetch deep audit. Check terminal logs.');
      setIsAuditing(false);
    }
  };

  const addTestEmailToCorpus = (label: 'phishing' | 'safe') => {
    const newEmail: Email = {
      id: `custom-${Date.now()}`,
      subject: testEmailDraft.subject,
      sender: testEmailDraft.sender,
      body: testEmailDraft.body,
      label: label,
      isCustom: true
    };
    onAddEmailToDataset(newEmail);
    alert(`Successfully appended current test email into training dataset labeled as: ${label.toUpperCase()}! Model has been re-trained.`);
  };

  return (
    <div className="space-y-6" id="email-scanner-module">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              Bayesian Predictor & Testing Lab
            </h2>
            <p className="text-xs text-slate-400">
              Input custom emails to inspect extraction triggers and test probability ratings
            </p>
          </div>

          {/* AI Generator controls */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 pr-1 pl-2">
              AI Scenarios:
            </span>
            <select
              className="bg-slate-900 text-slate-100 border border-slate-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 font-sans"
              value={selectedScenario}
              onChange={e => setSelectedScenario(e.target.value)}
              disabled={isGenerating}
            >
              {PRESET_AI_SCENARIOS.map(s => (
                <option key={s.value} value={s.value}>
                  [{s.type === 'phishing' ? 'PHISH' : 'SAFE'}] {s.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerateAIScenario}
              disabled={isGenerating}
              className="p-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-all disabled:opacity-55 shadow-md shadow-indigo-600/10"
              title="Query Gemini on the Express backend to make a realistic simulation"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {apiError && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-lg mb-4 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Gemini Service Notification</span>
              {apiError}
              <span className="block text-[10px] text-slate-500 mt-1">
                You can still test custom email templates manually below; the Naive Bayes ML operates 100% offline in TypeScript browser-side.
              </span>
            </div>
          </div>
        )}

        {/* Input Text fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase tracking-wider">
                Sender Email Address
              </label>
              <input
                type="text"
                placeholder="billing-renewals@netflix-secure.net"
                className="bg-slate-950 text-slate-100 text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 w-full font-mono placeholder-slate-600"
                value={testEmailDraft.sender}
                onChange={e => setTestEmailDraft({ ...testEmailDraft, sender: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase tracking-wider">
                Subject Line
              </label>
              <input
                type="text"
                placeholder="URGENT: Billing suspended - update credit card credentials"
                className="bg-slate-950 text-slate-100 text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 w-full placeholder-slate-600"
                value={testEmailDraft.subject}
                onChange={e => setTestEmailDraft({ ...testEmailDraft, subject: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase tracking-wider">
              Email Content Body
            </label>
            <textarea
              placeholder="Paste email contents here to test details... E.g., Dear Customer, Suspicious activity was detected on your account routing number. Please reset secure password keys."
              className="bg-slate-950 text-slate-100 text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 w-full h-36 font-sans leading-relaxed resize-none placeholder-slate-600"
              value={testEmailDraft.body}
              onChange={e => setTestEmailDraft({ ...testEmailDraft, body: e.target.value })}
            ></textarea>
          </div>

          <div className="flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => addTestEmailToCorpus('phishing')}
                disabled={!testEmailDraft.body.trim()}
                className="px-3 py-1.5 border border-rose-500/30 hover:border-rose-500 text-rose-400/80 hover:text-rose-400 text-xs rounded transition-colors disabled:opacity-50"
                title="Add current text to training dataset labeled as Phishing"
              >
                + Add as Phishing Case
              </button>
              <button
                onClick={() => addTestEmailToCorpus('safe')}
                disabled={!testEmailDraft.body.trim()}
                className="px-3 py-1.5 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400/80 hover:text-emerald-400 text-xs rounded transition-colors disabled:opacity-50"
                title="Add current text to training dataset labeled as Safe"
              >
                + Add as Safe Case
              </button>
            </div>

            <button
              onClick={handleScan}
              disabled={!testEmailDraft.body.trim()}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg hover:shadow-indigo-600/10 flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              Scan & Analyze Threat
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {lastScannedResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="analysis-results-pane">
          {/* Main classification block */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block mb-1 font-mono uppercase tracking-wider">
                Threat Classification
              </span>
              
              <div className="flex items-center gap-3 mt-2 mb-4">
                {lastScannedResult.isPhishing ? (
                  <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center shrink-0">
                    <Siren className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className={`text-xl font-bold tracking-tight ${lastScannedResult.isPhishing ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {lastScannedResult.isPhishing ? 'Phishing Email' : 'Safe / Legitimate'}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Classification Result
                  </span>
                </div>
              </div>

              {/* Progress bar scale */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mt-4 mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Phishing Probability</span>
                  <span className={`font-mono font-bold ${lastScannedResult.probability > 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {(lastScannedResult.probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${lastScannedResult.probability > 0.5 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${lastScannedResult.probability * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 mb-1 font-mono">
                  <span>0% (Safe)</span>
                  <span>50% (Lock)</span>
                  <span>100% (Phish)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Model Explanation
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lastScannedResult.isPhishing 
                  ? 'Based on custom Naive Bayes token ratios combined with URL, sender spoof, and billing urgency heuristics, this email shows high risk.'
                  : 'Tokens matching friendly conversation or standard system confirmations coupled with legitimate indicators suggest safe delivery.'}
              </p>
              
              <button
                onClick={handleRequestDeepAudit}
                disabled={isAuditing}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/10 disabled:opacity-50 mt-2"
              >
                {isAuditing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    CISO Auditing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                    Request Deep AI Security Audit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Heuristic and Token Weights details */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Rules triggered list */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-2 font-mono uppercase tracking-wider">
                  Cybersecurity Heuristic Cues
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${lastScannedResult.features.hasSuspiciousUrls ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${lastScannedResult.features.hasSuspiciousUrls ? 'text-rose-400' : 'text-slate-600'}`} />
                    <div>
                      <span className={`font-semibold block mb-0.5 ${lastScannedResult.features.hasSuspiciousUrls ? 'text-rose-300' : 'text-slate-400'}`}>Suspicious URLs / Domains</span>
                      {lastScannedResult.features.hasSuspiciousUrls 
                        ? 'Detected raw IP, suspicious dashes, or generic phishing/weird TLDs.' 
                        : 'No suspicious website redirects found.'}
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${lastScannedResult.features.hasMismatchedSender ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${lastScannedResult.features.hasMismatchedSender ? 'text-rose-400' : 'text-slate-600'}`} />
                    <div>
                      <span className={`font-semibold block mb-0.5 ${lastScannedResult.features.hasMismatchedSender ? 'text-rose-300' : 'text-slate-400'}`}>Sender Domain Spoofing</span>
                      {lastScannedResult.features.hasMismatchedSender 
                        ? 'Sender claiming trusted name but domains do not match.' 
                        : 'Sender domain matches textual headers.'}
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${lastScannedResult.features.hasUrgencyKeywords ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${lastScannedResult.features.hasUrgencyKeywords ? 'text-rose-400' : 'text-slate-600'}`} />
                    <div>
                      <span className={`font-semibold block mb-0.5 ${lastScannedResult.features.hasUrgencyKeywords ? 'text-rose-300' : 'text-slate-400'}`}>Urgent / Block Threat Alerts</span>
                      {lastScannedResult.features.hasUrgencyKeywords 
                        ? 'Contains active suspension pressure tactics or deadline locks.' 
                        : 'No strong urgent pressure keywords flagged.'}
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${lastScannedResult.features.hasFormInputs ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${lastScannedResult.features.hasFormInputs ? 'text-rose-400' : 'text-slate-600'}`} />
                    <div>
                      <span className={`font-semibold block mb-0.5 ${lastScannedResult.features.hasFormInputs ? 'text-rose-300' : 'text-slate-400'}`}>Credential Harvesting</span>
                      {lastScannedResult.features.hasFormInputs 
                        ? 'Requests credentials, password resets, or bank routing inputs.' 
                        : 'No direct data harvesting terms matching forms.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tokens list contributing */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-2 font-mono uppercase tracking-wider">
                  Top Token Bayesian Drivers Detected (ML Influence)
                </span>
                
                {lastScannedResult.wordContributions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No meaningful trained vocabulary tokens found in body message.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {lastScannedResult.wordContributions.map(item => (
                      <div
                        key={item.word}
                        className={`px-2 py-1 text-xs rounded border flex items-center gap-1 font-mono hover:scale-105 transition-transform ${item.type === 'phishing' ? 'bg-rose-950/20 border-rose-500/20 text-rose-300' : item.type === 'safe' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' : 'bg-slate-950/50 border-slate-800 text-slate-400'}`}
                        title={`Bayes log-ratio contribution multiplier: ${item.contribution.toFixed(2)}`}
                      >
                        <span>{item.word}</span>
                        <span className={`text-[9px] px-1 rounded font-bold ${item.type === 'phishing' ? 'bg-rose-500/20 text-rose-400' : item.type === 'safe' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          {item.contribution > 0 ? '+' : ''}{item.contribution.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between font-mono">
              <span>Extracted Word Count: {lastScannedResult.features.textLength} chars</span>
              <span>Rule Impact Core: {(lastScannedResult.features.phishingHeuristicScore * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Deep Audit Output Markdown Block */}
      {aiAuditText && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-6 shadow-xl space-y-4" id="ciso-deep-audit-panel">
          <div className="flex items-center gap-3 border-b border-indigo-500/20 pb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-md font-semibold text-slate-100 flex items-center gap-2">
                Chief Information Security Officer & AI Audit
              </h3>
              <p className="text-[11px] text-slate-400">Advanced cybersecurity social engineering & protection briefing</p>
            </div>
          </div>

          <div className="text-xs text-slate-200 leading-relaxed font-sans space-y-3 prose prose-invert max-w-none prose-xs">
            {/* Custom Simple Markdown parsing */}
            {aiAuditText.split('\n').map((line, idx) => {
              if (line.startsWith('###')) {
                return <h4 key={idx} className="text-sm font-semibold text-indigo-300 mt-3 mb-1 first:mt-0 font-mono flex items-center gap-1.5"><CornerDownRight className="w-3.5 h-3.5 shrink-0" /> {line.replace('###', '').trim()}</h4>;
              }
              if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
                return (
                  <div key={idx} className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-300 font-sans my-2">
                    <span className="font-bold text-indigo-400 mr-1.5 tracking-wider font-mono">{line.substring(0, 2)}</span>
                    {line.substring(2).trim()}
                  </div>
                );
              }
              if (line.trim().startsWith('-')) {
                return <li key={idx} className="ml-4 list-disc pl-1 text-slate-300 my-1">{line.replace('-', '').trim()}</li>;
              }
              if (line.trim() === '') {
                return <div key={idx} className="h-1" />;
              }
              // Bold parsing basic helper
              const parts = line.split('**');
              if (parts.length > 2) {
                return (
                  <p key={idx} className="my-1.5 text-slate-300 leading-relaxed font-sans">
                    {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-bold bg-slate-950 py-0.5 px-1 rounded border border-slate-800">{p}</strong> : p)}
                  </p>
                );
              }
              return <p key={idx} className="my-1 text-slate-300 leading-relaxed font-sans">{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
