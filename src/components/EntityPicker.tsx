import React, { useState, useEffect, useRef } from 'react';
import { Search, Gamepad2, Tv, X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { SelectedEntity } from '../types.ts';

interface EntityPickerProps {
  selectedEntities: SelectedEntity[];
  onChange: (entities: SelectedEntity[]) => void;
  disabled?: boolean;
}

export const EntityPicker: React.FC<EntityPickerProps> = ({
  selectedEntities,
  onChange,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(Array.isArray(data.results) ? data.results : []);
        setIsOpen(true);
      } catch (err) {
        console.error('Autocomplete search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (entity: any) => {
    if (selectedEntities.length >= 4) return;
    if (selectedEntities.some((e) => e.entity_id === entity.entity_id)) return;

    const newEntities: SelectedEntity[] = [
      ...selectedEntities,
      {
        entity_id: entity.entity_id,
        name: entity.name,
        types: entity.types || [],
      },
    ];

    onChange(newEntities);
    setQuery('');
    setIsOpen(false);
  };

  const handleRemove = (entityId: string) => {
    onChange(selectedEntities.filter((e) => e.entity_id !== entityId));
  };

  const isMaxReached = selectedEntities.length >= 4;

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          2. Add 1–4 Favorite Video Games or TV Shows
        </label>
        <span className="text-xs text-slate-500 font-medium">
          {selectedEntities.length} of 4 selected
        </span>
      </div>

      {/* Selected Entity Chips */}
      {selectedEntities.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedEntities.map((entity) => {
            const isTv = entity.types?.some((t) => t.includes('tv'));
            const Icon = isTv ? Tv : Gamepad2;
            const badgeBg = isTv
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-indigo-50 text-indigo-900 border-indigo-200';

            return (
              <div
                key={entity.entity_id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium shadow-sm transition-all ${badgeBg}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span className="truncate max-w-[200px] font-semibold">{entity.name}</span>
                <span className="text-[10px] uppercase font-bold opacity-75 px-1 py-0.2 bg-white/70 rounded">
                  {isTv ? 'TV Show' : 'Video Game'}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(entity.entity_id)}
                    className="ml-1 p-0.5 hover:bg-black/10 rounded-full transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Search Input Box */}
      {!isMaxReached && (
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              disabled={disabled}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true);
              }}
              placeholder="Search by title (e.g., Minecraft, Avatar, Pokémon, Zelda, Stranger Things)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
            />
            {loading && (
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && results.length > 0 && (
            <div className="absolute z-30 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
              <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Qloo Entity Suggestions</span>
                <span>Select to add seed</span>
              </div>
              {results.map((item) => {
                const isTv = item.types?.some((t: string) => t.includes('tv'));
                const isAlreadySelected = selectedEntities.some((e) => e.entity_id === item.entity_id);

                return (
                  <button
                    key={item.entity_id}
                    type="button"
                    disabled={isAlreadySelected}
                    onClick={() => handleSelect(item)}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isAlreadySelected
                        ? 'bg-slate-50 opacity-50 cursor-not-allowed'
                        : 'hover:bg-indigo-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                        {isTv ? <Tv className="w-4 h-4 text-amber-600" /> : <Gamepad2 className="w-4 h-4 text-indigo-600" />}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <span className="font-medium text-slate-600">
                            {isTv ? 'Television Series' : 'Video Game'}
                          </span>
                          {item.popularity && (
                            <>
                              <span>•</span>
                              <span>Popularity {Math.round(item.popularity * 100)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      Add
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {isOpen && !loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="absolute z-30 mt-1.5 w-full bg-white rounded-xl shadow-lg border border-slate-200 p-4 text-center text-xs text-slate-500">
              No matching video games or TV shows found for "{query}". Try checking the spelling.
            </div>
          )}
        </div>
      )}

      {isMaxReached && (
        <p className="text-xs text-slate-500 italic flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          Maximum 4 seed interests reached. Remove one if you wish to swap it.
        </p>
      )}
    </div>
  );
};
