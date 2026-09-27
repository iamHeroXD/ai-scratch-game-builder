'use client';

import React, { useRef } from 'react';
import {
  Sparkles,
  FolderOpen,
  Download,
  Settings as SettingsIcon,
  Play,
  RotateCcw,
  ExternalLink,
  Code2,
} from 'lucide-react';

interface NavbarProps {
  projectTitle: string;
  onTitleChange: (newTitle: string) => void;
  generationMode: 'quick' | 'standard' | 'pro' | 'expert';
  onModeChange: (mode: 'quick' | 'standard' | 'pro' | 'expert') => void;
  onNewProject: () => void;
  onImportFile: (file: File) => void;
  onExportSb3: () => void;
  onOpenTurboWarp: () => void;
  onOpenSettings: () => void;
  isGenerating: boolean;
}

export function Navbar({
  projectTitle,
  onTitleChange,
  generationMode,
  onModeChange,
  onNewProject,
  onImportFile,
  onExportSb3,
  onOpenTurboWarp,
  onOpenSettings,
  isGenerating,
}: NavbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
    }
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between z-20 select-none">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-2.5 py-1 rounded-lg shadow-sm">
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span className="text-xs uppercase tracking-wider font-extrabold">AI Scratch</span>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        <input
          type="text"
          value={projectTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 px-2 py-1 rounded text-sm font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-colors w-48 sm:w-64 truncate"
          title="Click to rename project"
        />
      </div>

      {/* Center: Generation Mode Selector */}
      <div className="hidden md:flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
        {(['quick', 'standard', 'pro', 'expert'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
              generationMode === mode
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".sb3"
          className="hidden"
        />

        <button
          onClick={onNewProject}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
          title="Create New Project"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
          title="Import .sb3 project"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Import</span>
        </button>

        <button
          onClick={onOpenTurboWarp}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors border border-red-800/40"
          title="Open in TurboWarp"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden md:inline">TurboWarp</span>
        </button>

        <button
          onClick={onExportSb3}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-sm transition-all"
          title="Export .sb3 archive"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Export .sb3</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
          title="Settings & API Key"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
