import React, { useState } from 'react';
import { Terminal, CheckCircle2, ChevronDown, ChevronUp, Bot, Sparkles, Filter, RefreshCw, ShieldAlert } from 'lucide-react';
import { AgentStepLog } from '../types.ts';

interface AgentStatusTimelineProps {
  logs: AgentStepLog[];
  meta?: {
    toolCallCount: number;
    llmCallCount: number;
    totalCandidatesExamined: number;
    filteredOutByCodeGate: number;
    filteredOutBySafetyGate: number;
    relaxedRetryTriggered: boolean;
    executionTimeMs: number;
  };
}

export const AgentStatusTimeline: React.FC<AgentStatusTimelineProps> = ({ logs, meta }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!logs || logs.length === 0) return null;

  const getStepIcon = (type: AgentStepLog['type']) => {
    switch (type) {
      case 'tool_call':
        return <Terminal className="w-3.5 h-3.5 text-indigo-600" />;
      case 'safety_gate':
        return <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />;
      case 'retry_relaxation':
        return <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />;
      case 'complete':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Bot className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-md overflow-hidden text-xs">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-slate-950/80 hover:bg-slate-950 flex items-center justify-between cursor-pointer transition-colors border-b border-slate-800/80"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono font-semibold text-slate-200">
            Agentic Execution Trace ({logs.length} operations)
          </span>
          {meta && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono ml-2">
              <span className="bg-slate-800 px-2 py-0.5 rounded">
                Tools: {meta.toolCallCount}/6
              </span>
              <span className="bg-slate-800 px-2 py-0.5 rounded">
                LLM: {meta.llmCallCount}/3
              </span>
              <span className="bg-slate-800 px-2 py-0.5 rounded">
                Latency: {meta.executionTimeMs}ms
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono text-[11px]"
        >
          {isExpanded ? (
            <>
              Hide Trace <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              View Trace <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Summary Chips */}
      {meta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-900/90 border-b border-slate-800 font-mono text-[11px]">
          <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
            <span className="text-slate-400 block text-[10px]">Candidates Examined</span>
            <span className="text-white font-bold text-sm">{meta.totalCandidatesExamined}</span>
          </div>
          <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
            <span className="text-slate-400 block text-[10px]">Code Gate Filtered</span>
            <span className="text-amber-300 font-bold text-sm">{meta.filteredOutByCodeGate}</span>
          </div>
          <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
            <span className="text-slate-400 block text-[10px]">Safety Gate Screened</span>
            <span className="text-emerald-300 font-bold text-sm">{meta.filteredOutBySafetyGate}</span>
          </div>
          <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50">
            <span className="text-slate-400 block text-[10px]">Relaxation Retried</span>
            <span className={`font-bold text-sm ${meta.relaxedRetryTriggered ? 'text-amber-400' : 'text-slate-400'}`}>
              {meta.relaxedRetryTriggered ? 'YES (1x)' : 'NO (Sufficient)'}
            </span>
          </div>
        </div>
      )}

      {/* Expanded Logs */}
      {isExpanded && (
        <div className="p-4 space-y-2.5 max-h-64 overflow-y-auto font-mono text-[11px] bg-slate-950/40">
          {logs.map((log) => (
            <div key={log.step} className="flex items-start gap-2.5 group">
              <span className="text-slate-500 font-bold w-4 text-right shrink-0">
                {log.step}.
              </span>
              <div className="mt-0.5 shrink-0">{getStepIcon(log.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-slate-200">
                  {log.toolName && (
                    <span className="text-indigo-400 font-semibold mr-1.5">
                      [{log.toolName}]
                    </span>
                  )}
                  {log.description}
                </div>
                {log.details && (
                  <pre className="text-[10px] text-slate-400 mt-1 p-2 bg-slate-900 rounded border border-slate-800 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
