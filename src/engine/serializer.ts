/**
 * Scratch 3.0 .sb3 Project Serializer
 * Packages project.json and all MD5 assets into a compliant .sb3 ZIP archive
 */
import JSZip from 'jszip';
import { GameProject } from './project';
import { Sb3Project } from './types';

export class Sb3Serializer {
  /**
   * Generates formatted project.json string
   */
  public static getProjectJson(project: GameProject): { projectJson: Sb3Project; jsonString: string } {
    const projectJson = project.toSb3Json();
    const jsonString = JSON.stringify(projectJson, null, 2);
    return { projectJson, jsonString };
  }

  /**
   * Builds the .sb3 ZIP archive containing project.json and all asset files
   */
  public static async buildZip(project: GameProject): Promise<JSZip> {
    const zip = new JSZip();
    const { jsonString } = this.getProjectJson(project);

    // 1. Add project.json
    zip.file('project.json', jsonString);

    // 2. Add all assets (SVGs and binary sounds)
    for (const [fileName, asset] of project.assets.entries()) {
      zip.file(fileName, asset.content);
    }

    return zip;
  }

  /**
   * Export to Uint8Array (suitable for Node.js Buffer, fetch responses, or browser download)
   */
  public static async exportToUint8Array(project: GameProject): Promise<Uint8Array> {
    const zip = await this.buildZip(project);
    return await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  }

  /**
   * Generate a sanitized, filesystem-safe filename
   */
  public static getSafeFilename(title: string): string {
    const clean = title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
    return (clean || 'scratch_game') + '.sb3';
  }
}
