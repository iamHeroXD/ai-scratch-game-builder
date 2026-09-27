/**
 * Project Memory & Version History Manager
 */
import { GameProject } from '../engine/project';
import { ProjectPatch } from '../engine/types';
import { Sb3Serializer } from '../engine/serializer';

export interface VersionSnapshot {
  version: number;
  timestamp: string;
  name: string;
  description: string;
  patchApplied?: ProjectPatch;
  jsonSnapshot: string;
}

export class ProjectMemory {
  private history: VersionSnapshot[] = [];
  private currentVersionIndex: number = -1;

  constructor(initialProject?: GameProject) {
    if (initialProject) {
      this.recordSnapshot(initialProject, 'Initial Generation');
    }
  }

  public recordSnapshot(project: GameProject, description: string, patch?: ProjectPatch): VersionSnapshot {
    const { jsonString } = Sb3Serializer.getProjectJson(project);
    const version = this.history.length + 1;

    const snapshot: VersionSnapshot = {
      version,
      timestamp: new Date().toISOString(),
      name: project.name,
      description,
      patchApplied: patch,
      jsonSnapshot: jsonString,
    };

    // If we've undone and now record new snapshot, prune future history
    if (this.currentVersionIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentVersionIndex + 1);
    }

    this.history.push(snapshot);
    this.currentVersionIndex = this.history.length - 1;
    return snapshot;
  }

  public get currentVersion(): number {
    return this.currentVersionIndex >= 0 ? this.history[this.currentVersionIndex].version : 0;
  }

  public get allSnapshots(): VersionSnapshot[] {
    return [...this.history];
  }

  public canUndo(): boolean {
    return this.currentVersionIndex > 0;
  }

  public canRedo(): boolean {
    return this.currentVersionIndex < this.history.length - 1;
  }
}
