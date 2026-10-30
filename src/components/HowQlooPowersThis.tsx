import React, { useState } from 'react';
import { HelpCircle, Network, Cpu, ShieldCheck, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

export const HowQlooPowersThis: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-5 md:p-6 shadow-xl border border-indigo-800/40">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              How Qloo's Taste Graph Powers ReadNext
            </h2>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Bridging student entertainment passions to literature across disjoint cultural domains.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800/60 border border-indigo-700/50 flex items-center gap-1.5 text-indigo-200 transition-colors"
        >
          {isOpen ? (
            <>
              Less <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Architecture Details <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 pt-5 border-t border-indigo-800/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          {/* Pillar 1 */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-indigo-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-300 text-sm">
              <Network className="w-4 h-4 text-indigo-400" />
              1. Cross-Domain Cultural Graph
            </div>
            <p className="text-slate-300">
              Unlike keyword search or title lookups, Qloo maps empirical cultural affinity across media boundaries. A student's passion for <em>Minecraft</em> isn't just "blocks"; it represents high-agency crafting, survival, and wilderness mystery—mapping directly into titles like <em>Hatchet</em> and <em>The Wild Robot</em>.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-indigo-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-300 text-sm">
              <Cpu className="w-4 h-4 text-indigo-400" />
              2. Grounded Mathematical Explainability
            </div>
            <p className="text-slate-300">
              Every candidate book includes an empirical vector weight (<code>query.explainability["signal.interests.entities"]</code>). The LLM agent receives these exact percentages (e.g. 84% signal strength from Zelda, 16% from Pokémon) to formulate precise, truthful justifications rather than inventing hallucinations.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-indigo-900/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-300 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              3. Dual Deterministic & LLM Safety Gates
            </div>
            <p className="text-slate-300">
              Zero tolerance for inappropriate school content: code pre-filters forbidden Qloo genre tags and page count caps. Gemini Flash acts as a strict classroom librarian reviewing descriptions and potential trigger themes before any book reaches the screen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
