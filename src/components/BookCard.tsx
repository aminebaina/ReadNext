import React, { useState } from 'react';
import { BookOpen, AlertTriangle, ShieldCheck, Sparkles, ExternalLink, Clock, Layers } from 'lucide-react';
import { RecommendedBook } from '../types.ts';

interface BookCardProps {
  book: RecommendedBook;
  index: number;
}

export const BookCard: React.FC<BookCardProps> = ({ book, index }) => {
  const [imageError, setImageError] = useState(false);

  // Strictly enforce HTTPS for images
  const isSafeHttpsImage =
    Boolean(book.image_url) &&
    book.image_url!.startsWith('https://') &&
    !imageError;

  const readingEffortBadge = {
    short: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Quick Read' },
    medium: { bg: 'bg-blue-50 text-blue-800 border-blue-200', label: 'Medium Read' },
    long: { bg: 'bg-purple-50 text-purple-800 border-purple-200', label: 'In-Depth Read' },
  }[book.safety?.reading_effort || 'medium'];

  return (
    <article className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group">
      {/* Top Banner / Number */}
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-500 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-bold">
            {index + 1}
          </span>
          Verified Recommendation
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${readingEffortBadge.bg}`}>
          <Clock className="w-3 h-3 mr-1" />
          {readingEffortBadge.label}
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex gap-4">
          {/* Book Cover or Fallback Artwork */}
          <div className="w-24 h-36 flex-shrink-0 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative shadow-inner flex items-center justify-center text-center p-2">
            {isSafeHttpsImage ? (
              <img
                src={book.image_url}
                alt={book.title}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                <BookOpen className="w-8 h-8 text-indigo-400/80" />
                <span className="text-[10px] leading-tight font-medium text-slate-500 line-clamp-3">
                  {book.title}
                </span>
              </div>
            )}
          </div>

          {/* Book Title, Author & Metadata */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-indigo-900 transition-colors">
              {book.title}
            </h3>
            <p className="text-sm font-medium text-slate-600 mt-0.5 line-clamp-1">
              by {book.author || 'Author not indexed'}
            </p>

            <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-2.5">
              <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                <Layers className="w-3 h-3 text-slate-400" />
                {book.page_count ? `${book.page_count} pages` : 'Length unknown'}
              </span>
              {book.publication_year && (
                <span className="bg-slate-100 px-2 py-0.5 rounded">
                  {book.publication_year}
                </span>
              )}
              {book.publisher && (
                <span className="bg-slate-100 px-2 py-0.5 rounded truncate max-w-[120px]">
                  {book.publisher}
                </span>
              )}
            </div>

            {/* Safety badge */}
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Age-Appropriate</span>
            </div>
          </div>
        </div>

        {/* Explainability Breakdown (Qloo Graph Contribution Bars) */}
        <div className="bg-indigo-50/60 rounded-lg p-3 border border-indigo-100/80 text-xs">
          <div className="flex items-center justify-between text-indigo-950 font-semibold mb-1.5">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Qloo Taste Graph Explainability:
            </span>
          </div>

          <p className="text-slate-700 text-xs mb-2 leading-relaxed">
            {book.whyRecommended}
          </p>

          <div className="space-y-1.5 pt-1 border-t border-indigo-100">
            {book.primaryInputScores.map((scoreItem) => {
              const percentage = Math.round(scoreItem.score * 100);
              return (
                <div key={scoreItem.entity_id} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span className="truncate font-medium">{scoreItem.entity_name}</span>
                    <span className="font-mono font-semibold text-indigo-700">{percentage}% affinity</span>
                  </div>
                  <div className="w-full bg-indigo-100/70 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Teacher / Librarian Note (Gemini Safety Gate Evaluation) */}
        {book.safety?.teacher_note && (
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-3 text-xs">
            <span className="font-semibold text-amber-900 block mb-0.5">
              Teacher & Librarian Insight:
            </span>
            <p className="text-amber-950 leading-relaxed">
              "{book.safety.teacher_note}"
            </p>
          </div>
        )}

        {/* Content Concerns Badge if any flagged */}
        {book.safety?.concerns && book.safety.concerns.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Noted for Classroom Context:</span>
              <span className="text-rose-700">{book.safety.concerns.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Synopsis excerpt */}
        {book.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mt-auto pt-2 border-t border-slate-100">
            {book.description}
          </p>
        )}
      </div>
    </article>
  );
};
