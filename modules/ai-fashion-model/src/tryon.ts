import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { TryOnProvider, TryOnRequest, TryOnResult } from './types.js';

export class LocalCommandTryOnProvider implements TryOnProvider {
  readonly id = 'local-command';
  readonly capabilities = ['virtual-try-on','garment-transfer','local-inference'];
  constructor(private readonly command = process.env.RPD_TRYON_COMMAND) {}
  async isAvailable() { return Boolean(this.command); }
  async generate(request: TryOnRequest): Promise<TryOnResult> {
    const requestId = randomUUID();
    if (!this.command) return { status:'unsupported', provider:this.id, requestId, warnings:['RPD_TRYON_COMMAND is not configured. No fake image is generated.'], metadata:{reason:'no-local-provider'} };
    return new Promise((resolve) => {
      const child = spawn(this.command, { shell:true, stdio:['pipe','pipe','pipe'], env:process.env });
      let stdout=''; let stderr='';
      child.stdout.on('data', d => stdout += d.toString());
      child.stderr.on('data', d => stderr += d.toString());
      child.on('error', err => resolve({status:'failed',provider:this.id,requestId,warnings:[err.message],metadata:{stderr}}));
      child.on('close', code => {
        if (code !== 0) return resolve({status:'failed',provider:this.id,requestId,warnings:[`Local provider exited with code ${code}`,stderr.slice(-1000)],metadata:{code}});
        try {
          const output = JSON.parse(stdout);
          resolve({status: output.status ?? 'completed', provider:this.id, requestId, outputPath:output.outputPath ?? request.outputPath, warnings:Array.isArray(output.warnings)?output.warnings:[], metadata:{...output.metadata, command:this.command}});
        } catch {
          resolve({status:'failed',provider:this.id,requestId,warnings:['Local provider returned invalid JSON',stdout.slice(-500)],metadata:{}});
        }
      });
      child.stdin.end(JSON.stringify({...request, requestId}));
    });
  }
}

export class TryOnEngine {
  constructor(private readonly providers: TryOnProvider[]) {}
  async status() { return Promise.all(this.providers.map(async p => ({id:p.id,available:await p.isAvailable(),capabilities:p.capabilities}))); }
  async generate(request: TryOnRequest): Promise<TryOnResult> {
    for (const provider of this.providers) if (await provider.isAvailable()) return provider.generate(request);
    return { status:'unsupported', provider:'none', requestId:randomUUID(), warnings:['No compatible try-on inference provider is installed/configured.'], metadata:{providers:this.providers.map(p=>p.id)} };
  }
}
