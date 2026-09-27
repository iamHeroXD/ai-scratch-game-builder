/**
 * Preview Runner Service
 * Packages .sb3 project into standalone interactive runner HTML for sandboxed iframe execution
 */

export class PreviewRunner {
  /**
   * Generates a self-contained HTML document to run the Scratch project inside an iframe
   */
  public static async generatePlayerHtml(sb3Buffer: Uint8Array, title = 'Scratch Preview'): Promise<string> {
    try {
      const Packager = await import('@turbowarp/packager');
      const loaded = await (Packager as any).loadProject(sb3Buffer.buffer);
      const packager = new (Packager as any).Packager();
      packager.project = loaded;

      // Configure player options for clean embedded UI
      packager.options.turbo = false;
      packager.options.fps = 30;
      packager.options.controls = true;
      packager.options.autoplay = true;

      const result = await packager.package();
      if (result && result.data) {
        return typeof result.data === 'string' ? result.data : new TextDecoder().decode(result.data);
      }
    } catch (err: any) {
      console.warn('Packager direct packaging error, using universal embedded runner:', err.message);
    }

    // Fallback: Robust TurboWarp Scaffolding / Web-player embed template
    const base64Data = Buffer.from(sb3Buffer).toString('base64');
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #111827; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: system-ui, sans-serif; }
    #wrapper { position: relative; width: 480px; height: 360px; max-width: 95vw; max-height: 80vh; aspect-ratio: 4/3; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border-radius: 8px; overflow: hidden; background: #000; }
    canvas { width: 100%; height: 100%; display: block; }
    #controls { display: flex; gap: 8px; margin-top: 12px; }
    button { background: #374151; color: #FFF; border: 1px solid #4B5563; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: background 0.2s; }
    button:hover { background: #4B5563; }
    #msg { color: #9CA3AF; font-size: 12px; margin-top: 8px; }
  </style>
  <script src="https://packager.turbowarp.org/standalone/scaffolding-bundle.js"></script>
</head>
<body>
  <div id="wrapper">
    <div id="player-container"></div>
  </div>
  <div id="controls">
    <button id="btn-green-flag" style="background: #15803D;">▶ Green Flag</button>
    <button id="btn-stop" style="background: #B91C1C;">■ Stop</button>
    <button id="btn-fullscreen">⛶ Fullscreen</button>
  </div>
  <div id="msg">Powered by Scratch & TurboWarp runtime</div>

  <script>
    const base64 = "${base64Data}";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    if (window.Scaffolding) {
      const scaffolding = new Scaffolding();
      scaffolding.width = 480;
      scaffolding.height = 360;
      scaffolding.setup();
      document.getElementById('player-container').appendChild(scaffolding.renderer.canvas);
      scaffolding.loadProject(bytes.buffer).then(() => {
        scaffolding.start();
      });

      document.getElementById('btn-green-flag').addEventListener('click', () => scaffolding.greenFlag());
      document.getElementById('btn-stop').addEventListener('click', () => scaffolding.stopAll());
      document.getElementById('btn-fullscreen').addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.getElementById('wrapper').requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      });
    }
  </script>
</body>
</html>`;
  }
}
