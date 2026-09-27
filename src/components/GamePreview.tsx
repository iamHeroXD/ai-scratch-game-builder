'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Maximize2,
  Code,
  Image as ImageIcon,
  FileJson,
  Gamepad2,
  Copy,
  Check,
} from 'lucide-react';
import { Sb3Project, Sb3Target } from '@/engine/types';

interface GamePreviewProps {
  projectJson: Sb3Project | null;
  selectedSpriteName: string | null;
  previewHtml: string | null;
  isLoadingPreview: boolean;
  onRefreshPreview: () => void;
}

export function GamePreview({
  projectJson,
  selectedSpriteName,
  previewHtml,
  isLoadingPreview,
  onRefreshPreview,
}: GamePreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'blocks' | 'costumes' | 'json'>('preview');
  const [copiedJson, setCopiedJson] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selectedTarget = projectJson?.targets.find((t) =>
    selectedSpriteName === 'Stage' ? t.isStage : t.name === selectedSpriteName
  ) || projectJson?.targets[1] || projectJson?.targets[0];

  const handleCopyJson = () => {
    if (projectJson) {
      navigator.clipboard.writeText(JSON.stringify(projectJson, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const handleRestart = () => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = previewHtml || '';
    }
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (!document.fullscreenElement) {
        iframeRef.current.requestFullscreen().catch((err) => console.warn(err));
      } else {
        document.exitFullscreen().catch((err) => console.warn(err));
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Tab Navigation Header */}
      <div className="h-10 border-b border-slate-800 bg-slate-900/60 px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              activeTab === 'preview'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Game Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('blocks')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              activeTab === 'blocks'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Block Scripts</span>
          </button>

          <button
            onClick={() => setActiveTab('costumes')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              activeTab === 'costumes'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Costumes</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors ${
              activeTab === 'json'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>project.json</span>
          </button>
        </div>

        {/* Preview Quick Action Controls */}
        {activeTab === 'preview' && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleRestart}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Restart Game"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFullscreen}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {activeTab === 'json' && (
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 transition-colors"
          >
            {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
          </button>
        )}
      </div>

      {/* Main View Area */}
      <div className="flex-1 relative overflow-auto bg-slate-950 flex flex-col items-center justify-center p-4">
        {/* TAB 1: Standalone Runner Preview */}
        {activeTab === 'preview' && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {isLoadingPreview ? (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Packaging project for preview...</span>
              </div>
            ) : previewHtml ? (
              <iframe
                ref={iframeRef}
                srcDoc={previewHtml}
                className="w-full h-full max-w-[640px] max-h-[480px] rounded-lg border border-slate-800 shadow-2xl bg-black"
                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
                title="Scratch Game Preview"
              />
            ) : (
              <div className="text-center p-8 max-w-sm text-slate-500">
                <Gamepad2 className="w-12 h-12 mx-auto mb-3 stroke-[1.2] text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-300 mb-1">No Active Game Preview</h3>
                <p className="text-xs">
                  Generate a game using the AI prompt on the right to play it live in this window.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Block Scripts Inspector */}
        {activeTab === 'blocks' && (
          <div className="w-full h-full overflow-y-auto p-4 text-xs font-mono">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-bold text-sky-400">
                Scripts for: <span className="text-white">{selectedTarget?.name || 'None'}</span>
              </span>
              <span className="text-slate-500">
                {selectedTarget ? Object.keys(selectedTarget.blocks).length : 0} total blocks
              </span>
            </div>

            {selectedTarget && Object.keys(selectedTarget.blocks).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(selectedTarget.blocks)
                  .filter(([, b]) => !Array.isArray(b) && b.topLevel)
                  .map(([hatId, hatBlock]: [string, any]) => (
                    <div key={hatId} className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1.5 shadow-sm">
                      {/* Render block stack starting from hat */}
                      {renderBlockStack(hatId, selectedTarget.blocks)}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-slate-500 italic py-8 text-center">
                No scripts attached to this sprite.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Costumes & Assets Inspector */}
        {activeTab === 'costumes' && (
          <div className="w-full h-full overflow-y-auto p-4">
            <div className="mb-4 border-b border-slate-800 pb-2">
              <span className="text-sm font-bold text-purple-400">
                Costumes for: <span className="text-white">{selectedTarget?.name || 'None'}</span>
              </span>
            </div>

            {selectedTarget && selectedTarget.costumes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedTarget.costumes.map((c, idx) => (
                  <div
                    key={c.assetId || idx}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col items-center text-center hover:border-purple-500/50 transition-colors"
                  >
                    <div className="w-20 h-20 bg-slate-950/60 rounded flex items-center justify-center p-2 mb-2 border border-slate-800/80">
                      <ImageIcon className="w-8 h-8 text-purple-400/60" />
                    </div>
                    <span className="text-xs font-bold text-slate-200 truncate w-full">{c.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{c.dataFormat.toUpperCase()}</span>
                    <span className="text-[9px] text-slate-600 font-mono truncate w-full mt-1">{c.assetId}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 italic py-8 text-center">No costumes found for this target.</div>
            )}
          </div>
        )}

        {/* TAB 4: Raw JSON Inspector */}
        {activeTab === 'json' && (
          <div className="w-full h-full overflow-auto">
            <pre className="text-[11px] font-mono text-emerald-400/90 leading-relaxed p-4">
              {projectJson ? JSON.stringify(projectJson, null, 2) : 'No project data'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// Visual block stack rendering helper
function renderBlockStack(startId: string, blocksMap: Record<string, any>): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let currId: string | null = startId;
  let safety = 0;

  while (currId && safety < 50) {
    safety++;
    const b: any = (blocksMap as Record<string, any>)[currId];
    if (!b || Array.isArray(b)) break;

    const opcode = b.opcode as string;
    let blockClass = 'scratch-control';

    if (opcode.startsWith('event_')) blockClass = 'scratch-event';
    else if (opcode.startsWith('motion_')) blockClass = 'scratch-motion';
    else if (opcode.startsWith('looks_')) blockClass = 'scratch-looks';
    else if (opcode.startsWith('sound_')) blockClass = 'scratch-sound';
    else if (opcode.startsWith('sensing_')) blockClass = 'scratch-sensing';
    else if (opcode.startsWith('operator_')) blockClass = 'scratch-operator';
    else if (opcode.startsWith('data_')) blockClass = 'scratch-variable';

    const cleanName = opcode.replace(/^[a-z]+_/, '').replace(/([A-Z])/g, ' $1').toLowerCase();

    nodes.push(
      <div key={currId} className="flex items-center gap-2">
        <div className={`scratch-block ${blockClass}`}>
          <span>{cleanName}</span>
          {Object.entries(b.fields || {}).map(([fKey, fVal]: [string, any]) => (
            <span key={fKey} className="bg-black/30 px-1.5 py-0.5 rounded text-[10px]">
              {Array.isArray(fVal) ? fVal[0] : fVal}
            </span>
          ))}
        </div>
      </div>
    );

    currId = b.next;
  }

  return nodes;
}
