import React from 'react';
import { Sparkles, Backpack, GraduationCap, School } from 'lucide-react';
import { AgeBandKey } from '../types.ts';

interface AgeBandSelectorProps {
  selectedBand: AgeBandKey;
  onSelect: (band: AgeBandKey) => void;
  disabled?: boolean;
}

const AGE_BAND_OPTIONS: {
  id: AgeBandKey;
  label: string;
  ageRange: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'primary',
    label: 'Primary / Elementary',
    ageRange: 'Ages 6–10',
    subtext: 'Early chapter books, illustrated reads, adventure',
    icon: Backpack,
  },
  {
    id: 'middle_grade',
    label: 'Middle School',
    ageRange: 'Ages 11–14',
    subtext: 'Middle grade fantasy, mystery, coming-of-age',
    icon: School,
  },
  {
    id: 'teens',
    label: 'Young Adult / Teens',
    ageRange: 'Ages 14–18',
    subtext: 'Rich YA fiction, speculative world-building, realism',
    icon: GraduationCap,
  },
];

export const AgeBandSelector: React.FC<AgeBandSelectorProps> = ({
  selectedBand,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        1. Select Student Age Band
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {AGE_BAND_OPTIONS.map((option) => {
          const isSelected = selectedBand === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(option.id)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between relative cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/60 shadow-sm ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="font-bold text-sm text-slate-900">
                    {option.label}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-indigo-200/70 text-indigo-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {option.ageRange}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-9">
                {option.subtext}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
