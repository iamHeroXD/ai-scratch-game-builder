'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  Circle,
  Loader2,
  Wand2,
  Bot,
  User,
  ArrowRight,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  patchApplied?: {
    instruction: string;
    operationsCount: number;
    repairs?: string[];
  };
}

export interface GenerationStage {
  stage: string;
  timestamp: string;
  details?: string;
  completed?: boolean;
}

interface AIChatProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  stages: GenerationStage[];
  onGenerate: (prompt: string) => void;
  onModify: (instruction: string) => void;
  hasProject: boolean;
}

const PRESET_PROMPTS = [
  'Create a polished platformer with a player, double jump, coins, enemies, checkpoints, three levels, health, score, a game-over screen and a final boss.',
  'Create a top-down space shooter with player movement, enemies, bullets, score, health, waves and a boss.',
  'Create a clicker tycoon game with a big gold coin, passive CPS auto-miners, double click upgrades, and victory goal.',
  'Create a dungeon escape adventure with player movement, obstacle walls, a key item, locked exit door, and enemy guard.',
];

const MODIFICATION_SUGGESTIONS = [
  'Make the player jump higher',
  'Make the player move faster',
  'Add 5 more enemies',
  'Add a bonus coin',
  'Add a 2x score multiplier',
];

export function AIChat({
  messages,
  isGenerating,
  stages,
  onGenerate,
  onModify,
  hasProject,
}: AIChatProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const text = input.trim();
    setInput('');

    if (hasProject) {
      onModify(text);
    } else {
      onGenerate(text);
    }
  };

  const handleChipClick = (promptText: string) => {
    if (isGenerating) return;
    if (hasProject) {
      onModify(promptText);
    } else {
      onGenerate(promptText);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800">
      {/* Header */}
      <div className="h-10 border-b border-slate-800 bg-slate-950/40 px-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
          <Bot className="w-3.5 h-3.5" />
          <span>AI GAME ARCHITECT</span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Gemini 2.5 Structured Gen</span>
      </div>

      {/* Stage Progress Tracker (Section 30) */}
      {isGenerating && stages.length > 0 && (
        <div className="p-3 bg-slate-950/80 border-b border-slate-800">
          <div className="text-[11px] font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Generation Pipeline Active</span>
          </div>
          <div className="space-y-1.5">
            {stages.map((st, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {st.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                )}
                <span className={st.completed ? 'text-slate-300 font-medium' : 'text-amber-300 font-semibold'}>
                  {st.stage}
                </span>
                {st.details && <span className="text-[10px] text-slate-500 truncate">({st.details})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="py-6 px-2 text-center">
            <Wand2 className="w-10 h-10 mx-auto text-amber-500/60 mb-3" />
            <h4 className="text-xs font-bold text-slate-200 mb-1">What game do you want to build?</h4>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Describe any genre, mechanics, levels, characters, and rules. The AI will design, compile, validate, and export a complete .sb3 Scratch project.
            </p>

            {/* Starter Prompt Chips */}
            <div className="space-y-1.5 text-left">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-1">Example Prompts</div>
              {PRESET_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleChipClick(prompt)}
                  className="w-full text-left p-2 rounded bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 text-[11px] text-slate-300 transition-colors group flex items-start justify-between gap-2"
                >
                  <span className="line-clamp-2">{prompt}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2 text-xs ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg p-2.5 ${
                  m.role === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium'
                    : 'bg-slate-800/80 text-slate-200 border border-slate-700/60'
                }`}
              >
                <div className="leading-relaxed whitespace-pre-wrap">{m.content}</div>
                {m.patchApplied && (
                  <div className="mt-2 pt-2 border-t border-slate-700 text-[11px] text-amber-300 font-mono">
                    ✓ Applied: {m.patchApplied.instruction} ({m.patchApplied.operationsCount} op)
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Modification Chips (when project active) */}
      {hasProject && !isGenerating && (
        <div className="px-3 py-2 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-slate-500 font-semibold shrink-0">Modify:</span>
          {MODIFICATION_SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleChipClick(sug)}
              className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 whitespace-nowrap transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={
              hasProject
                ? 'Ask AI to modify your game (e.g. "Add a double jump", "Make enemies faster")...'
                : 'Describe the Scratch game you want to build...'
            }
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 pr-10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-2 bottom-2.5 p-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 transition-colors"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </form>
    </div>
  );
}
