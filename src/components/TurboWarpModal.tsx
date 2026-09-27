'use client';

import React from 'react';
import { X, ExternalLink, Download, CheckCircle } from 'lucide-react';

interface TurboWarpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
}

export function TurboWarpModal({ isOpen, onClose, onExport }: TurboWarpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-red-400">
            <ExternalLink className="w-4 h-4" />
            <span>Open in TurboWarp</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          TurboWarp is a high-performance Scratch mod with a custom compiler, 60 FPS support, and enhanced debugging.
          Here is how to run your generated project in TurboWarp:
        </p>

        <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold shrink-0">
              1
            </span>
            <div className="flex-1">
              <span className="font-semibold text-slate-200">Export your .sb3 file:</span>
              <div className="mt-1">
                <button
                  onClick={onExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sb3 Now</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold shrink-0">
              2
            </span>
            <div>
              <span className="font-semibold text-slate-200">Open the TurboWarp Editor:</span>
              <div className="mt-1">
                <a
                  href="https://turbowarp.org/editor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 underline font-medium"
                >
                  <span>turbowarp.org/editor</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[11px] font-bold shrink-0">
              3
            </span>
            <div>
              <span className="font-semibold text-slate-200">Load the file:</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                In TurboWarp, click <strong className="text-slate-200">File → Load from your computer</strong> and select your downloaded <code className="text-amber-300">.sb3</code> file.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
