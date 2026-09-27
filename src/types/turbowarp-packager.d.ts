declare module '@turbowarp/packager' {
  export const loadProject: (data: ArrayBuffer | Uint8Array, progress?: (...args: any[]) => void) => Promise<any>;
  export class Packager {
    project: any;
    options: Record<string, any>;
    package(): Promise<{ data: string | Uint8Array; type: string }>;
  }
}
