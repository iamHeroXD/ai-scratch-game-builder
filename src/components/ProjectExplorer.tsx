'use client';

import React from 'react';
import {
  Layers,
  Image as ImageIcon,
  Variable,
  Radio,
  Music,
  Box,
  Hash,
  Eye,
  Activity,
} from 'lucide-react';
import { ProjectAnalysis } from '@/engine/importer';

interface ProjectExplorerProps {
  analysis: ProjectAnalysis | null;
  selectedSpriteName: string | null;
  onSelectSprite: (name: string) => void;
}

export function ProjectExplorer({
  analysis,
  selectedSpriteName,
  onSelectSprite,
}: ProjectExplorerProps) {
  if (!analysis) {
    return (
      <div className="p-4 text-xs text-slate-500 italic">
        No project loaded. Describe a game or import an .sb3 file.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none overflow-y-auto">
      {/* Metrics Summary Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
          <Activity className="w-3.5 h-3.5 text-amber-500" />
          <span>PROJECT METRICS</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-800/60 p-1.5 rounded border border-slate-700/40">
            <div className="text-[10px] text-slate-400 font-medium">Sprites</div>
            <div className="text-sm font-bold text-amber-400">{analysis.spriteCount}</div>
          </div>
          <div className="bg-slate-800/60 p-1.5 rounded border border-slate-700/40">
            <div className="text-[10px] text-slate-400 font-medium">Costumes</div>
            <div className="text-sm font-bold text-sky-400">{analysis.costumeCount}</div>
          </div>
          <div className="bg-slate-800/60 p-1.5 rounded border border-slate-700/40">
            <div className="text-[10px] text-slate-400 font-medium">Scripts</div>
            <div className="text-sm font-bold text-emerald-400">{analysis.scriptCount}</div>
          </div>
        </div>
      </div>

      {/* Sprites & Stage Section */}
      <div className="p-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Targets & Sprites ({analysis.sprites.length + 1})
          </span>
        </div>

        <div className="space-y-1">
          {/* Stage Item */}
          <div
            onClick={() => onSelectSprite('Stage')}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors ${
              selectedSpriteName === 'Stage'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Box className="w-3.5 h-3.5 text-amber-400/80" />
              <span className="truncate">Stage</span>
            </div>
            <span className="text-[10px] text-slate-500">Backdrop</span>
          </div>

          {/* Sprite Items */}
          {analysis.sprites.map((s) => (
            <div
              key={s.name}
              onClick={() => onSelectSprite(s.name)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                selectedSpriteName === s.name
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                  : 'text-slate-300 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Box className="w-3.5 h-3.5 text-sky-400/80" />
                <span className="truncate">{s.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span>{s.costumeCount} cost.</span>
                <span>•</span>
                <span>{s.scriptCount} scr.</span>
              </div>
            </div>
          ))}
        </div>

        {/* Global Variables */}
        <div className="mt-5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Variable className="w-3.5 h-3.5 text-orange-400" />
            Variables ({analysis.globalVariables.length})
          </div>
          <div className="space-y-1">
            {analysis.globalVariables.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic px-2">No variables</div>
            ) : (
              analysis.globalVariables.map((v) => (
                <div
                  key={v}
                  className="flex items-center justify-between px-2 py-1 rounded bg-slate-800/30 text-[11px] text-slate-300 border border-slate-700/20"
                >
                  <span className="font-mono text-orange-300 truncate">{v}</span>
                  <span className="text-[9px] bg-orange-950/60 text-orange-400 px-1 rounded">global</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Broadcast Messages */}
        <div className="mt-5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 text-yellow-400" />
            Broadcasts ({analysis.broadcasts.length})
          </div>
          <div className="space-y-1">
            {analysis.broadcasts.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic px-2">No broadcast messages</div>
            ) : (
              analysis.broadcasts.map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 px-2 py-1 rounded bg-slate-800/30 text-[11px] text-yellow-200 border border-slate-700/20"
                >
                  <span className="font-mono truncate">{b}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
