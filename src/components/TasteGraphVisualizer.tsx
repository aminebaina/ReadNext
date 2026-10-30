import React, { useState } from 'react';
import { Network, Gamepad2, Tv, BookOpen, Sparkles, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { RecommendedBook, SelectedEntity } from '../types.ts';

interface TasteGraphVisualizerProps {
  inputEntities: SelectedEntity[];
  recommendedBooks: RecommendedBook[];
}

export const TasteGraphVisualizer: React.FC<TasteGraphVisualizerProps> = ({
  inputEntities,
  recommendedBooks,
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  if (inputEntities.length === 0 || recommendedBooks.length === 0) return null;

  const topBooks = recommendedBooks.slice(0, 4);

  return (
    <div className="bg-slate-900 rounded-2xl border border-indigo-900/60 shadow-xl overflow-hidden text-white">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-5 py-3.5 bg-slate-950/80 border-b border-indigo-950 flex items-center justify-between cursor-pointer hover:bg-slate-950 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Network className="w-4 h-4 animate-pulse" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">
                Interactive Cultural Taste Graph Bridge
              </h3>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                Cross-Domain Vectors
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live visualization of Qloo's multidimensional taste affinity projection from screens to literature.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>
              Hide Graph <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Explore Graph <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Visual Graph Representation */}
          <div className="relative bg-slate-950 rounded-xl p-6 border border-slate-800 overflow-hidden">
            {/* Background constellation effect */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Left Column: Input Seeds (Video Games & TV) */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  Source Media Passions
                </div>
                <div className="space-y-2.5">
                  {inputEntities.map((ent) => {
                    const isTv = ent.types?.some((t) => t.includes('tv'));
                    const isSelected = selectedNode === ent.entity_id;

                    return (
                      <div
                        key={ent.entity_id}
                        onMouseEnter={() => setSelectedNode(ent.entity_id)}
                        onMouseLeave={() => setSelectedNode(null)}
                        className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-400 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                            : 'bg-slate-900/90 border-slate-700/80 hover:border-indigo-500/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isTv
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {isTv ? <Tv className="w-4 h-4" /> : <Gamepad2 className="w-4 h-4" />}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-white truncate block">
                              {ent.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {isTv ? 'TV Series Seed' : 'Video Game Seed'}
                            </span>
                          </div>
                        </div>

                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Middle Column: Qloo Vector Bridge (Thematic DNA Transfer) */}
              <div className="flex flex-col items-center justify-center py-4 px-2 space-y-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-indigo-300/40 animate-pulse">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold font-mono text-indigo-300 block">
                    Qloo Latent Embedding
                  </span>
                  <span className="text-[10px] text-slate-400 block max-w-[200px] leading-tight">
                    Cross-domain taste projection across 10M+ cultural nodes
                  </span>
                </div>

                {/* Animated Signal Badges */}
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono">
                    Survival Agency
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono">
                    World-Building
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">
                    Hero's Journey
                  </span>
                </div>
              </div>

              {/* Right Column: Matched Literature */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Target Book Discoveries
                </div>
                <div className="space-y-2.5">
                  {topBooks.map((book) => {
                    const topScore = Math.max(
                      ...book.primaryInputScores.map((s) => s.score),
                      0.5
                    );
                    const percentage = Math.round(topScore * 100);

                    return (
                      <div
                        key={book.entity_id}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-emerald-500/60 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-white truncate block">
                              {book.title}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {book.author ? `by ${book.author}` : 'Curated Book'}
                            </span>
                          </div>
                        </div>

                        <span className="font-mono text-xs font-bold text-emerald-400 shrink-0 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                          {percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
