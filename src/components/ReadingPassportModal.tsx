import React, { useState } from 'react';
import { Printer, X, BookOpen, Star, CheckSquare, Award, Sparkles, User, Calendar } from 'lucide-react';
import { RecommendedBook, SelectedEntity } from '../types.ts';

interface ReadingPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentSeeds: SelectedEntity[];
  books: RecommendedBook[];
  ageBandLabel: string;
}

export const ReadingPassportModal: React.FC<ReadingPassportModalProps> = ({
  isOpen,
  onClose,
  studentSeeds,
  books,
  ageBandLabel,
}) => {
  const [studentName, setStudentName] = useState('Alex M.');
  const [readingGoal, setReadingGoal] = useState('Complete 2 books this month');

  if (!isOpen) return null;

  const topBooks = books.slice(0, 4);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-300 overflow-hidden my-8 flex flex-col max-h-[95vh]">
        {/* Modal Controls (Hidden in print) */}
        <div className="print:hidden px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base text-white">Classroom Reading Passport</h3>
              <p className="text-xs text-slate-400">Ready to print for students, parent-teacher meetings, or library reading challenges.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customizable Fields Bar (Hidden in print) */}
        <div className="print:hidden bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Student Name (or Class ID):
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Maya Chen"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Reading Challenge Goal:
            </label>
            <input
              type="text"
              value={readingGoal}
              onChange={(e) => setReadingGoal(e.target.value)}
              placeholder="e.g. Complete 2 books by Friday"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Printable Sheet (Stylized for both screen preview and @media print) */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-900 bg-white print:p-0 print:space-y-4">
          {/* Passport Header */}
          <div className="border-4 border-indigo-900 rounded-2xl p-6 bg-gradient-to-r from-indigo-50 via-white to-amber-50 relative overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-900 uppercase block mb-1">
                  OFFICIAL SCHOOL LIBRARY CERTIFICATE
                </span>
                <h1 className="text-2xl font-black text-indigo-950 tracking-tight flex items-center gap-2">
                  <Award className="w-7 h-7 text-amber-500" />
                  READNEXT ADVENTURE PASSPORT
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Custom reading pathway powered by cultural taste connections.
                </p>
              </div>

              {/* Passport Stamp Box */}
              <div className="border-2 border-dashed border-indigo-300 rounded-xl p-3 text-center bg-white/80 min-w-[130px]">
                <span className="text-[10px] font-bold text-indigo-600 block uppercase">Level</span>
                <span className="text-xs font-black text-indigo-950 block">{ageBandLabel}</span>
                <span className="text-[9px] text-slate-400 block mt-1">Librarian Verified ✓</span>
              </div>
            </div>

            {/* Student & Seeds Details */}
            <div className="mt-5 pt-4 border-t border-indigo-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Student:</span>
                <span className="font-bold text-indigo-950 text-sm">{studentName || 'Explorer'}</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Favorite Passions:</span>
                <span className="font-bold text-indigo-950 truncate block">
                  {studentSeeds.map((s) => s.name).join(', ')}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Goal:</span>
                <span className="font-bold text-indigo-950 truncate block">{readingGoal}</span>
              </div>
            </div>
          </div>

          {/* Book Cards for Passport */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Selected Book Missions (Cross-Domain Matches)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topBooks.map((book, idx) => (
                <div
                  key={book.entity_id}
                  className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between space-y-3"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-24 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {book.image_url && book.image_url.startsWith('https://') ? (
                        <img src={book.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-indigo-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold font-mono text-indigo-600 uppercase">
                        Book Mission #{idx + 1}
                      </span>
                      <h5 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                        {book.title}
                      </h5>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">
                        by {book.author || 'Author not indexed'}
                      </p>
                      {book.page_count && (
                        <span className="text-[10px] font-medium text-slate-500 block mt-1">
                          {book.page_count} pages • {book.safety.reading_effort} read
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Why it connects */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-700">
                    <span className="font-bold text-indigo-950 block text-[10px]">Why you'll love it:</span>
                    <p className="line-clamp-2">{book.whyRecommended}</p>
                  </div>

                  {/* Student Checklist and Rating */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                      <span className="font-bold text-slate-700 text-[11px]">Completed!</span>
                    </label>

                    <div className="flex items-center gap-0.5 text-slate-300">
                      <Star className="w-3.5 h-3.5 hover:text-amber-400 cursor-pointer" />
                      <Star className="w-3.5 h-3.5 hover:text-amber-400 cursor-pointer" />
                      <Star className="w-3.5 h-3.5 hover:text-amber-400 cursor-pointer" />
                      <Star className="w-3.5 h-3.5 hover:text-amber-400 cursor-pointer" />
                      <Star className="w-3.5 h-3.5 hover:text-amber-400 cursor-pointer" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Stamp & Signature Line */}
          <div className="pt-4 border-t-2 border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-4">
            <div>
              <span className="block font-semibold">Teacher / Librarian Signature:</span>
              <div className="w-48 h-6 border-b-2 border-dotted border-slate-400 mt-1" />
            </div>
            <div>
              <span className="block font-semibold">Date Completed:</span>
              <div className="w-36 h-6 border-b-2 border-dotted border-slate-400 mt-1" />
            </div>
            <div className="text-right text-[10px] text-slate-400">
              ReadNext • Powered by Qloo Taste Graph & Gemini
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
