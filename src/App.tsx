import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Split,
  Shield,
  Zap,
} from 'lucide-react';
import { AgeBandKey, SelectedEntity, RecommendationResponse, LLMComparisonResponse } from './types.ts';
import { AgeBandSelector } from './components/AgeBandSelector.tsx';
import { EntityPicker } from './components/EntityPicker.tsx';
import { BookCard } from './components/BookCard.tsx';
import { AgentStatusTimeline } from './components/AgentStatusTimeline.tsx';
import { HowQlooPowersThis } from './components/HowQlooPowersThis.tsx';
import { LLMComparisonView } from './components/LLMComparisonView.tsx';
import { SecurityChecklistModal } from './components/SecurityChecklistModal.tsx';

export default function App() {
  const [selectedAgeBand, setSelectedAgeBand] = useState<AgeBandKey>('primary');
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntity[]>([
    {
      entity_id: 'CDBDE254-71F0-4640-8D04-5373BEAE5278',
      name: 'Minecraft',
      types: ['urn:entity:videogame'],
    },
  ]);
  const [shortReadsOnly, setShortReadsOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recommendation Results
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResponse | null>(null);

  // Comparison toggle & LLM baseline results
  const [showComparison, setShowComparison] = useState(false);
  const [llmComparisonData, setLLMComparisonData] = useState<LLMComparisonResponse | null>(null);
  const [loadingLLM, setLoadingLLM] = useState(false);

  // Security checklist modal
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Presets from server
  const [presets, setPresets] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/presets')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.presets)) {
          setPresets(data.presets);
        }
      })
      .catch(() => {});
  }, []);

  const handleApplyPreset = (preset: any) => {
    setSelectedAgeBand(preset.ageBand);
    setSelectedEntities(preset.entities);
    setShortReadsOnly(preset.shortReads);
    setError(null);
  };

  const handleRunAgent = async () => {
    if (selectedEntities.length === 0) {
      setError('Please add at least 1 favorite video game or TV show to generate recommendations.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entities: selectedEntities,
          ageBand: selectedAgeBand,
          shortReadsOnly,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to generate recommendations.');
      }

      setRecommendationResult(data);

      // If comparison mode is currently open, fetch fresh comparison
      if (showComparison) {
        fetchLLMComparison();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while communicating with the agent.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLLMComparison = async () => {
    setLoadingLLM(true);
    try {
      const res = await fetch('/api/compare-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entities: selectedEntities,
          ageBand: selectedAgeBand,
          shortReadsOnly,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLLMComparisonData(data);
      }
    } catch (err) {
      console.error('LLM comparison error:', err);
    } finally {
      setLoadingLLM(false);
    }
  };

  const handleToggleComparison = () => {
    const nextVal = !showComparison;
    setShowComparison(nextVal);
    if (nextVal && !llmComparisonData && !loadingLLM) {
      fetchLLMComparison();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Notification Banner */}
      <div className="bg-indigo-950 text-indigo-200 px-4 py-2 text-xs border-b border-indigo-900/60">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-white">Qloo Agentic Hackathon Demo</span>
            <span className="text-indigo-300 hidden sm:inline">• Live Taste Graph Integration (English-language K-12 books)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSecurityModal(true)}
            className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            Security & Safety Checklist
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-5 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">ReadNext</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Agentic Recommender
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Turning student video game & TV passions into safe, captivating book matches.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSecurityModal(true)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Safety & Quota Guard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:px-6 space-y-8">
        {/* Architecture Spotlight Panel */}
        <HowQlooPowersThis />

        {/* Input & Selection Console */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Quick Presets for Judges */}
          {presets.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  One-Click Judge Presets (Fast Evaluation in &lt; 30s)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleApplyPreset(preset)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-xs font-semibold text-slate-700 hover:text-indigo-900 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>{preset.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({preset.ageBand})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 1. Age Band Selector */}
          <AgeBandSelector
            selectedBand={selectedAgeBand}
            onSelect={setSelectedAgeBand}
            disabled={loading}
          />

          {/* 2. Entity Picker (Games / TV) */}
          <EntityPicker
            selectedEntities={selectedEntities}
            onChange={setSelectedEntities}
            disabled={loading}
          />

          {/* 3. Short Reads Toggle & Settings */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  disabled={loading}
                  checked={shortReadsOnly}
                  onChange={(e) => setShortReadsOnly(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 transition-colors">
                  "Short Reads" filter (≤ 250 pages)
                </span>
                <p className="text-[11px] text-slate-500">
                  Ideal for reluctant readers; keeps books under 250 pages (unknown lengths labeled).
                </p>
              </div>
            </label>

            <span className="text-xs text-slate-400 italic">
              Notice: Recommends English-language literature only.
            </span>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Recommendation Agent Notice:</span>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={loading || selectedEntities.length === 0}
              onClick={handleRunAgent}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                loading || selectedEntities.length === 0
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-indigo-600/25'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Agent: Exploring Taste Graph & Safety Gate...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Discover Safe Books with Qloo Taste Graph
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </section>

        {/* Results Section */}
        {recommendationResult && (
          <section className="space-y-6">
            {/* Top Results Control Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    Curated Reading List
                  </h2>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {recommendationResult.books.length} Verified Books
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Targeted for {recommendationResult.meta.ageBandLabel}
                  {recommendationResult.meta.shortReadsOnly && ' (Short reads filter active)'}
                </p>
              </div>

              {/* Compare with LLM-Only Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleComparison}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                  showComparison
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                <Split className="w-4 h-4" />
                {showComparison ? 'Exit Side-by-Side View' : 'Compare with LLM-only'}
              </button>
            </div>

            {/* Agentic Trace Timeline */}
            <AgentStatusTimeline
              logs={recommendationResult.agentLogs}
              meta={recommendationResult.meta}
            />

            {/* Results: Either Side-by-Side or Full Cards Grid */}
            {showComparison ? (
              <LLMComparisonView
                qlooBooks={recommendationResult.books}
                llmBooks={llmComparisonData?.books || []}
                critique={llmComparisonData?.critique}
                loadingLLM={loadingLLM}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendationResult.books.map((book, idx) => (
                  <BookCard key={book.entity_id} book={book} index={idx} />
                ))}
              </div>
            )}

            {/* Fallback note if fewer than 3 books survived */}
            {recommendationResult.books.length < 3 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Strict Safety Integrity:</span>
                  <p>
                    Only {recommendationResult.books.length} book(s) survived the strict dual safety gate for this criteria. ReadNext never invents fake books or pads lists with unverified titles.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">ReadNext</span>
            <span>•</span>
            <span>Qloo Agentic Hackathon Entry (Oct 2026)</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <button
              type="button"
              onClick={() => setShowSecurityModal(true)}
              className="hover:text-indigo-600 underline cursor-pointer"
            >
              Security Checklist
            </button>
            <span>•</span>
            <span>MIT Licensed</span>
            <span>•</span>
            <span>No User Tracking</span>
          </div>
        </div>
      </footer>

      {/* Security Checklist Modal */}
      <SecurityChecklistModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />
    </div>
  );
}
