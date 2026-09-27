'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Wrench, Download } from 'lucide-react';
import { ValidationResult } from '@/engine/types';

interface StatusBarProps {
  validation: ValidationResult | null;
  onAutoRepair: () => void;
  onExport: () => void;
  isRepairing: boolean;
  version: number;
}

export function StatusBar({
  validation,
  onAutoRepair,
  onExport,
  isRepairing,
  version,
}: StatusBarProps) {
  const hasErrors = validation?.issues.some((i) => i.severity === 'error');
  const hasWarnings = validation?.issues.some((i) => i.severity === 'warning');

  return (
    <footer className="h-8 border-t border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between text-xs select-none">
      {/* Left: Validation Status */}
      <div className="flex items-center gap-3">
        {validation ? (
          validation.valid ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Project Valid (Ready for Scratch/TurboWarp)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {hasErrors ? (
                <div className="flex items-center gap-1 text-red-400 font-semibold text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Validation Errors Detected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{validation.issues.length} Warning(s)</span>
                </div>
              )}

              {/* Auto Repair Trigger */}
              <button
                onClick={onAutoRepair}
                disabled={isRepairing}
                className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold transition-colors disabled:opacity-50"
              >
                <Wrench className="w-3 h-3" />
                <span>{isRepairing ? 'Repairing...' : 'Auto Repair'}</span>
              </button>
            </div>
          )
        ) : (
          <div className="text-slate-500 text-[11px]">Idle</div>
        )}
      </div>

      {/* Right: Version & Quick Actions */}
      <div className="flex items-center gap-4 text-slate-400 text-[11px]">
        <span>Version: v{version}</span>
        <button
          onClick={onExport}
          className="hover:text-amber-400 transition-colors flex items-center gap-1 font-semibold"
        >
          <Download className="w-3 h-3" />
          <span>Export</span>
        </button>
      </div>
    </footer>
  );
}
