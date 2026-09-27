'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { ProjectExplorer } from '@/components/ProjectExplorer';
import { GamePreview } from '@/components/GamePreview';
import { AIChat, ChatMessage, GenerationStage } from '@/components/AIChat';
import { StatusBar } from '@/components/StatusBar';
import { SettingsModal } from '@/components/SettingsModal';
import { TurboWarpModal } from '@/components/TurboWarpModal';
import { Sb3Project, ValidationResult } from '@/engine/types';
import { ProjectAnalysis } from '@/engine/importer';

export default function Home() {
  const [projectTitle, setProjectTitle] = useState('Super Scratch Quest');
  const [projectJson, setProjectJson] = useState<Sb3Project | null>(null);
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [selectedSpriteName, setSelectedSpriteName] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [generationMode, setGenerationMode] = useState<'quick' | 'standard' | 'pro' | 'expert'>('standard');
  const [version, setVersion] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stages, setStages] = useState<GenerationStage[]>([]);

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTurboWarpOpen, setIsTurboWarpOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3.8-flash');

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('scratch_gemini_api_key');
      const savedModel = localStorage.getItem('scratch_gemini_model');
      if (savedKey) setApiKey(savedKey);
      if (savedModel) setModel(savedModel);
    } catch {
      // LocalStorage not available
    }
  }, []);

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    try {
      localStorage.setItem('scratch_gemini_api_key', newKey);
    } catch {}
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    try {
      localStorage.setItem('scratch_gemini_model', newModel);
    } catch {}
  };

  // Generate Preview HTML for current project
  const refreshPreview = useCallback(async (currentJson: Sb3Project, title: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentProjectJson: currentJson, title }),
      });
      const data = await res.json();
      if (data.html) {
        setPreviewHtml(data.html);
      }
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  // Handler: Generate Game from User Prompt
  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    setStages([
      { stage: 'Understanding request', timestamp: new Date().toISOString(), completed: false },
      { stage: 'Designing game architecture', timestamp: new Date().toISOString(), completed: false },
      { stage: 'Compiling Scratch AST & scripts', timestamp: new Date().toISOString(), completed: false },
      { stage: 'Validating project integrity', timestamp: new Date().toISOString(), completed: false },
      { stage: 'Packaging project', timestamp: new Date().toISOString(), completed: false },
    ]);

    const userMsgId = 'msg_' + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-key': apiKey } : {}),
        },
        body: JSON.stringify({
          prompt,
          mode: generationMode,
          apiKey: apiKey || undefined,
          model,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate game');
      }

      setProjectTitle(data.title || 'Untitled Game');
      setProjectJson(data.projectJson);
      setAnalysis(data.analysis);
      setValidation(data.validation);
      setVersion((v) => v + 1);

      if (data.analysis?.sprites?.[0]) {
        setSelectedSpriteName(data.analysis.sprites[0].name);
      }

      // Mark all stages completed
      setStages((prev) => prev.map((s) => ({ ...s, completed: true })));

      // Add AI response message
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai_' + Date.now(),
          role: 'assistant',
          content: `I have created "${data.title}"! It is a ${data.genre} featuring ${data.analysis.spriteCount} sprites, ${data.analysis.scriptCount} scripts, and ${data.analysis.costumeCount} vector costumes. You can play it right now in the Game Preview tab or export the .sb3 file.`,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Refresh Preview
      await refreshPreview(data.projectJson, data.title);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: `Error generating game: ${err.message}. Please check your prompt or settings and try again.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Modify existing project via AI Chat
  const handleModify = async (instruction: string) => {
    if (!projectJson) return;

    setIsGenerating(true);
    setMessages((prev) => [
      ...prev,
      {
        id: 'msg_' + Date.now(),
        role: 'user',
        content: instruction,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch('/api/modify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-key': apiKey } : {}),
        },
        body: JSON.stringify({
          currentProjectJson: projectJson,
          instruction,
          apiKey: apiKey || undefined,
          model,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Modification failed');

      setProjectJson(data.updatedProjectJson);
      setAnalysis(data.analysis);
      setValidation(data.validation);
      setVersion((v) => v + 1);

      setMessages((prev) => [
        ...prev,
        {
          id: 'ai_' + Date.now(),
          role: 'assistant',
          content: `Applied modifications: ${data.patch?.operations?.map((o: any) => o.description).join(', ')}. Project has been updated and re-validated.`,
          timestamp: new Date().toISOString(),
          patchApplied: {
            instruction,
            operationsCount: data.patch?.operations?.length || 1,
            repairs: data.repairsApplied,
          },
        },
      ]);

      await refreshPreview(data.updatedProjectJson, projectTitle);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: `Failed to apply modification: ${err.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Import .sb3 File
  const handleImportFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setProjectTitle(data.title || file.name.replace(/\.sb3$/i, ''));
      setProjectJson(data.projectJson);
      setAnalysis(data.analysis);
      setVersion(1);

      if (data.analysis?.sprites?.[0]) {
        setSelectedSpriteName(data.analysis.sprites[0].name);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'import_' + Date.now(),
          role: 'assistant',
          content: `Successfully imported "${file.name}"! It contains ${data.analysis.spriteCount} sprites, ${data.analysis.costumeCount} costumes, and ${data.analysis.scriptCount} scripts. You can now test it or ask me to modify it.`,
          timestamp: new Date().toISOString(),
        },
      ]);

      await refreshPreview(data.projectJson, data.title);
    } catch (err: any) {
      alert('Import error: ' + err.message);
    }
  };

  // Handler: Export .sb3 Download
  const handleExportSb3 = async () => {
    if (!projectJson) {
      alert('Please generate or import a game first.');
      return;
    }

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentProjectJson: projectJson, title: projectTitle }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectTitle.replace(/\s+/g, '_')}.sb3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Failed to export .sb3: ' + err.message);
    }
  };

  // Handler: Auto-Repair
  const handleAutoRepair = async () => {
    if (!projectJson) return;

    setIsRepairing(true);
    try {
      const res = await fetch('/api/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentProjectJson: projectJson }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Repair failed');

      setProjectJson(data.repairedProjectJson);
      setValidation(data.validation);
      setAnalysis(data.analysis);

      alert(`Repair complete! Applied: \n- ${data.repairsApplied.join('\n- ')}`);
      await refreshPreview(data.repairedProjectJson, projectTitle);
    } catch (err: any) {
      alert('Repair failed: ' + err.message);
    } finally {
      setIsRepairing(false);
    }
  };

  // Handler: New Project
  const handleNewProject = () => {
    if (confirm('Start a new project? Any unsaved changes in current project will be replaced.')) {
      setProjectTitle('New Scratch Project');
      setProjectJson(null);
      setAnalysis(null);
      setValidation(null);
      setPreviewHtml(null);
      setMessages([]);
      setStages([]);
      setVersion(1);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation */}
      <Navbar
        projectTitle={projectTitle}
        onTitleChange={setProjectTitle}
        generationMode={generationMode}
        onModeChange={setGenerationMode}
        onNewProject={handleNewProject}
        onImportFile={handleImportFile}
        onExportSb3={handleExportSb3}
        onOpenTurboWarp={() => setIsTurboWarpOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isGenerating={isGenerating}
      />

      {/* 3-Column Core Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Project Explorer (20% - 240px min) */}
        <div className="w-64 shrink-0 hidden md:block">
          <ProjectExplorer
            analysis={analysis}
            selectedSpriteName={selectedSpriteName}
            onSelectSprite={setSelectedSpriteName}
          />
        </div>

        {/* Center Column: Game Preview & Inspector (55%) */}
        <div className="flex-1 min-w-0">
          <GamePreview
            projectJson={projectJson}
            selectedSpriteName={selectedSpriteName}
            previewHtml={previewHtml}
            isLoadingPreview={isLoadingPreview}
            onRefreshPreview={() => projectJson && refreshPreview(projectJson, projectTitle)}
          />
        </div>

        {/* Right Column: AI Assistant & Generation (25% - 320px min) */}
        <div className="w-80 lg:w-96 shrink-0">
          <AIChat
            messages={messages}
            isGenerating={isGenerating}
            stages={stages}
            onGenerate={handleGenerate}
            onModify={handleModify}
            hasProject={projectJson !== null}
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        validation={validation}
        onAutoRepair={handleAutoRepair}
        onExport={handleExportSb3}
        isRepairing={isRepairing}
        version={version}
      />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        model={model}
        onModelChange={handleModelChange}
      />

      <TurboWarpModal
        isOpen={isTurboWarpOpen}
        onClose={() => setIsTurboWarpOpen(false)}
        onExport={handleExportSb3}
      />
    </div>
  );
}
