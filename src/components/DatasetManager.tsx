import React, { useState } from 'react';
import { Email } from '../types';
import { Trash2, Plus, Edit, ShieldCheck, Siren, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';

interface DatasetManagerProps {
  emails: Email[];
  onChangeEmails: (newEmails: Email[]) => void;
  onResetEmails: () => void;
  onSelectEmailToTest: (email: Email) => void;
}

export default function DatasetManager({ emails, onChangeEmails, onResetEmails, onSelectEmailToTest }: DatasetManagerProps) {
  const [filter, setFilter] = useState<'all' | 'phishing' | 'safe'>('all');
  const [editingEmail, setEditingEmail] = useState<Email | null>(null);
  
  // Custom draft state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newSender, setNewSender] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newLabel, setNewLabel] = useState<'phishing' | 'safe'>('phishing');
  const [errorMsg, setErrorMsg] = useState('');

  const filteredEmails = emails.filter(email => {
    if (filter === 'all') return true;
    return email.label === filter;
  });

  const handleDelete = (id: string) => {
    onChangeEmails(emails.filter(e => e.id !== id));
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newSender.trim() || !newBody.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (!newSender.includes('@')) {
      setErrorMsg('A valid email address is required.');
      return;
    }

    const newEmail: Email = {
      id: `custom-${Date.now()}`,
      subject: newSubject.trim(),
      sender: newSender.trim(),
      body: newBody.trim(),
      label: newLabel,
      isCustom: true
    };

    onChangeEmails([...emails, newEmail]);
    
    // Reset inputs
    setNewSubject('');
    setNewSender('');
    setNewBody('');
    setIsAddingNew(false);
    setErrorMsg('');
  };

  const startEdit = (email: Email) => {
    setEditingEmail({ ...email });
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmail) return;

    onChangeEmails(emails.map(item => item.id === editingEmail.id ? editingEmail : item));
    setEditingEmail(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-full" id="dataset-manager-card">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            Training Dataset Corpus
          </h2>
          <p className="text-xs text-slate-400">
            Current size: <span className="text-indigo-400 font-bold font-mono">{emails.length} emails</span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onResetEmails}
            className="p-1 px-3 text-slate-400 hover:text-slate-100 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Reset dataset to original curated training set"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="p-1 px-3 text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/10"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Samples
          </button>
        </div>
      </div>

      {/* Adding Custom Form Panel overlay */}
      {isAddingNew && (
        <form onSubmit={handleAddNew} className="bg-slate-950 p-4 border border-indigo-500/30 rounded-lg mb-4 space-y-3 relative" id="add-email-form">
          <span className="text-xs font-semibold text-indigo-400 block mb-1">Inject Custom Training Email</span>
          {errorMsg && (
            <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">Sender Email Address</label>
              <input
                type="text"
                placeholder="customer-support@paypal-secure.com"
                className="bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-2 w-full focus:outline-none focus:border-indigo-500"
                value={newSender}
                onChange={e => setNewSender(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">Model Category Label</label>
              <select
                className="bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-2 w-full focus:outline-none focus:border-indigo-500"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value as 'phishing' | 'safe')}
              >
                <option value="phishing">Phishing Email (Threat)</option>
                <option value="safe">Legitimate Email (Safe)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">Subject Line</label>
            <input
              type="text"
              placeholder="Immediate Action Required: Suspend notification..."
              className="bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-2 w-full focus:outline-none focus:border-indigo-500"
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">Email Message Body Text</label>
            <textarea
              placeholder="Provide email contents here. If phishing, use urgent words, threat claims, and suspicious link references."
              className="bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-2 w-full h-20 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed resize-none"
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
            ></textarea>
          </div>
          <div className="flex justify-end gap-2 text-xs pt-1">
            <button
              type="button"
              className="px-3 py-1.5 text-slate-400 hover:text-slate-100 transition-colors"
              onClick={() => setIsAddingNew(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold transition-colors"
            >
              Add to Training Dataset
            </button>
          </div>
        </form>
      )}

      {/* Editing Modal/Form overlay inline */}
      {editingEmail && (
        <form onSubmit={saveEdit} className="bg-slate-950 p-4 border border-amber-500/30 rounded-lg mb-4 space-y-3 relative" id="edit-email-form">
          <span className="text-xs font-semibold text-amber-400 block mb-1">Edit Training Sample</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">Sender Address</label>
              <input
                type="text"
                className="bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-2 w-full focus:outline-none focus:border-amber-500"
                value={editingEmail.sender}
                onChange={e => setEditingEmail({ ...editingEmail, sender: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">Actual Class Label</label>
              <select
                className="bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-2 w-full focus:outline-none focus:border-amber-500"
                value={editingEmail.label}
                onChange={e => setEditingEmail({ ...editingEmail, label: e.target.value as 'phishing' | 'safe' })}
              >
                <option value="phishing">Phishing (Malicious)</option>
                <option value="safe">Safe (Legitimate)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">Subject Line</label>
            <input
              type="text"
              className="bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-2 w-full focus:outline-none focus:border-amber-500"
              value={editingEmail.subject}
              onChange={e => setEditingEmail({ ...editingEmail, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">Email Body Markdown/Raw Code</label>
            <textarea
              className="bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-lg p-2 w-full h-20 focus:outline-none focus:border-amber-500 resize-none font-sans leading-relaxed"
              value={editingEmail.body}
              onChange={e => setEditingEmail({ ...editingEmail, body: e.target.value })}
            ></textarea>
          </div>
          <div className="flex justify-end gap-2 text-xs pt-1">
            <button
              type="button"
              className="px-3 py-1.5 text-slate-400 hover:text-slate-100 transition-colors"
              onClick={() => setEditingEmail(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold transition-colors"
            >
              Apply Edit Changes
            </button>
          </div>
        </form>
      )}

      {/* Corpus Filters tabs */}
      <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs mb-3">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 rounded-md transition-all font-medium ${filter === 'all' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
        >
          All ({emails.length})
        </button>
        <button
          onClick={() => setFilter('phishing')}
          className={`flex-1 py-1.5 rounded-md transition-all font-medium ${filter === 'phishing' ? 'bg-rose-950/40 text-rose-400 border border-rose-500/10' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Phishing ({emails.filter(e => e.label === 'phishing').length})
        </button>
        <button
          onClick={() => setFilter('safe')}
          className={`flex-1 py-1.5 rounded-md transition-all font-medium ${filter === 'safe' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Safe ({emails.filter(e => e.label === 'safe').length})
        </button>
      </div>

      {/* Dataset Lists Scrollable window */}
      <div className="flex-1 overflow-y-auto max-h-[400px] border border-slate-800/80 rounded-lg bg-slate-950/40 divide-y divide-slate-800/60 custom-scrollbar pr-1">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            No emails in this segment.
          </div>
        ) : (
          filteredEmails.map(email => (
            <div key={email.id} className="p-3 text-xs flex gap-3 hover:bg-slate-950/60 group transition-all">
              {/* Type tag icon left side */}
              <div className="shrink-0 flex items-center justify-center">
                {email.label === 'phishing' ? (
                  <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20" title="Phishing tag">
                    <Siren className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20" title="Safe tag">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Subject detail column */}
              <div className="flex-1 min-w-0" id={`email-record-${email.id}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-200 block truncate leading-tight">
                    {email.subject}
                  </span>
                  {email.isCustom && (
                    <span className="bg-indigo-600/20 border border-indigo-400/20 text-indigo-400 font-mono text-[9px] px-1 rounded">
                      custom
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate mb-1">
                  Sender: {email.sender}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 italic font-sans leading-relaxed">
                  "{email.body}"
                </p>
              </div>

              {/* Action Operations elements */}
              <div className="shrink-0 flex items-center gap-1.5 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onSelectEmailToTest(email)}
                  className="px-2 py-1 select-none border border-slate-800 hover:border-indigo-500/40 text-indigo-400 hover:bg-slate-900 rounded font-medium transition-colors"
                  title="Load email direct into Live Testing predictor box"
                >
                  Load
                </button>
                <button
                  onClick={() => startEdit(email)}
                  className="p-1 border border-slate-800 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-900 transition-colors"
                  title="Modify email parameters"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(email.id)}
                  className="p-1 border border-slate-800 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-900 transition-colors"
                  title="Remove email from training list"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 text-[10px] text-slate-500 bg-slate-950 p-2.5 rounded border border-slate-800/40 text-center font-mono">
        💡 Hover over emails or click <strong>Load</strong> to instantly paste email text into the predictor box below for live risk auditing scans.
      </div>
    </div>
  );
}
