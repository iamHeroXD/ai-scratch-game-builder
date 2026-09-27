/**
 * Human-Friendly Diagnostic Formatter
 * Translates technical Scratch validator issues into accessible developer explanations
 */
import { ValidationIssue } from '../engine/types';

export class DiagnosticFormatter {
  public static formatIssue(issue: ValidationIssue): { title: string; explanation: string; solution: string } {
    switch (issue.id) {
      case 'SEMANTIC_UNKNOWN_VARIABLE':
        return {
          title: `Missing Variable "${issue.context?.varName}"`,
          explanation: `The script in sprite "${issue.target}" tries to read or modify a variable named "${issue.context?.varName}", but it doesn't exist in the project.`,
          solution: `Create the variable "${issue.context?.varName}" on the Stage or declare it on "${issue.target}".`,
        };

      case 'SEMANTIC_ORPHAN_BROADCAST':
        return {
          title: `Unhandled Message "${issue.context?.broadcastName}"`,
          explanation: `The project sends the message "${issue.context?.broadcastName}", but no sprite has a "When I receive ${issue.context?.broadcastName}" block.`,
          solution: `Add a "When I receive ${issue.context?.broadcastName}" script to handle this event.`,
        };

      case 'SEMANTIC_UNKNOWN_COSTUME':
        return {
          title: `Missing Costume "${issue.context?.costumeName}"`,
          explanation: `Sprite "${issue.target}" tries to switch to costume "${issue.context?.costumeName}", but this costume hasn't been added.`,
          solution: `Add a costume with this name or update the switch costume block.`,
        };

      case 'GAMEPLAY_NO_START_SCRIPT':
        return {
          title: 'Missing Green Flag Starter',
          explanation: 'There is no "When Green Flag Clicked" block anywhere in the project, so nothing will happen when players start the game.',
          solution: 'Add a "When Green Flag Clicked" script to initialize the game loop.',
        };

      case 'GAMEPLAY_PLAYER_CANNOT_MOVE':
        return {
          title: 'Immobile Player Entity',
          explanation: `Sprite "${issue.target}" is designated as the player, but contains no motion blocks (such as Change X, Change Y, or Move Steps).`,
          solution: 'Add keyboard controls (Arrow keys or WASD) to control the player.',
        };

      default:
        return {
          title: issue.message,
          explanation: issue.explanation,
          solution: issue.suggestedFix || 'Review the project script or run automated repair.',
        };
    }
  }

  public static formatSummary(issues: ValidationIssue[]): string {
    if (issues.length === 0) {
      return 'Project passed all validation checks! No issues detected.';
    }

    const errors = issues.filter((i) => i.severity === 'error');
    const warnings = issues.filter((i) => i.severity === 'warning');
    const info = issues.filter((i) => i.severity === 'info');

    const lines = [
      `Validation Result: ${errors.length} error(s), ${warnings.length} warning(s), ${info.length} suggestion(s).`,
    ];

    if (errors.length > 0) {
      lines.push('\nErrors:');
      for (const e of errors) {
        const fmt = this.formatIssue(e);
        lines.push(` - [${e.target || 'Project'}] ${fmt.title}: ${fmt.explanation}`);
      }
    }

    if (warnings.length > 0) {
      lines.push('\nWarnings:');
      for (const w of warnings) {
        const fmt = this.formatIssue(w);
        lines.push(` - [${w.target || 'Project'}] ${fmt.title}: ${fmt.explanation}`);
      }
    }

    return lines.join('\n');
  }
}
