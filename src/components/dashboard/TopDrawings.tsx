import React from 'react';
import Link from 'next/link';
import { Trophy, Star, ArrowRight } from 'lucide-react';

interface TopDrawingItem {
  id: string;
  drawing_number: string;
  student_name: string;
  drawing_title: string | null;
  category: string | null;
  image_path: string;
  avg_score: number;
  evaluation_count: number;
}

interface TopDrawingsProps {
  drawings: TopDrawingItem[];
}

export const TopDrawings: React.FC<TopDrawingsProps> = ({ drawings }) => {
  if (!drawings || drawings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-slate-700">No evaluations submitted yet</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Top-rated drawings will appear here as soon as directors start scoring submissions.
        </p>
      </div>
    );
  }

  const medals = [
    { badge: '🥇 1st Place', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { badge: '🥈 2nd Place', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { badge: '🥉 3rd Place', color: 'bg-orange-50 text-orange-800 border-orange-200' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-800">Top-Rated Submissions</h3>
        </div>
        <Link
          href="/admin/results"
          className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
        >
          View Full Rankings <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {drawings.map((item, index) => {
          const medal = medals[index];
          return (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img
                    src={item.image_path}
                    alt={item.drawing_title || item.drawing_number}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900">
                      {item.drawing_number}
                    </span>
                    {medal && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${medal.color}`}>
                        {medal.badge}
                      </span>
                    )}
                    {item.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mt-0.5">
                    {item.drawing_title || 'Untitled'}
                  </h4>
                  <p className="text-xs text-slate-500">Student: {item.student_name}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-extrabold text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {item.avg_score.toFixed(2)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {item.evaluation_count} evaluation{item.evaluation_count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

