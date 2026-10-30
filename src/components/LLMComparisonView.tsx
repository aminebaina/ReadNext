import React from 'react';
import { Sparkles, Bot, Layers, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { RecommendedBook, LLMOnlyBook } from '../types.ts';
import { BookCard } from './BookCard.tsx';

interface LLMComparisonViewProps {
  qlooBooks: RecommendedBook[];
  llmBooks: LLMOnlyBook[];
  critique?: {
    summary: string;
    qlooAdvantage: string;
  };
  loadingLLM: boolean;
}

export const LLMComparisonView: React.FC<LLMComparisonViewProps> = ({
  qlooBooks,
  llmBooks,
  critique,
  loadingLLM,
}) => {
  return (
    <div className="space-y-6">
      {/* Critique Banner */}
      {critique && (
        <div className="bg-gradient-to-r from-indigo-900 to-purple-950 text-white p-5 rounded-2xl shadow-lg border border-indigo-700/50">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-2 text-xs">
              <h3 className="text-sm font-bold text-white">
                Why Qloo Beats Generic LLM-Only Recommendations
              </h3>
              <p className="text-indigo-200 leading-relaxed">
                <span className="font-semibold text-white">The Flaw in Generic LLMs: </span>
                {critique.summary}
              </p>
              <p className="text-emerald-300 leading-relaxed">
                <span className="font-semibold text-white">The Qloo Advantage: </span>
                {critique.qlooAdvantage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-side columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Qloo Taste Graph + Agent */}
        <div className="space-y-4">
          <div className="bg-indigo-900 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <h3 className="font-bold text-sm">
                Qloo Taste Graph + Agent
              </h3>
            </div>
            <span className="text-xs bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded-full font-medium">
              Empirical Cross-Domain Signals
            </span>
          </div>

          <div className="space-y-4">
            {qlooBooks.map((book, idx) => (
              <BookCard key={book.entity_id} book={book} index={idx} />
            ))}
          </div>
        </div>

        {/* Right Column: Generic LLM Baseline */}
        <div className="space-y-4">
          <div className="bg-slate-800 text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-slate-300" />
              <h3 className="font-bold text-sm">
                Generic LLM Only (Baseline)
              </h3>
            </div>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-medium">
              Keyword & Popularity Heuristics
            </span>
          </div>

          {loadingLLM ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Generating baseline LLM comparison recommendations...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {llmBooks.map((b, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        Baseline #{idx + 1}
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{b.title}</h4>
                      <p className="text-xs text-slate-600">by {b.author}</p>
                    </div>
                    {b.page_count && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {b.page_count} pages
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 border border-slate-100">
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      Generic LLM Justification:
                    </span>
                    <p>{b.whyRecommended}</p>
                  </div>

                  <div className="text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded border border-amber-200/50 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>Often relies on literal brand names or franchise spin-off novels.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
