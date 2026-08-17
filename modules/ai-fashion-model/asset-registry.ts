import { scanModelAssets, type ScannedAsset } from './asset-scanner.js';
import { analyzeModelAsset } from './asset-analyzer.js';
import { selectBestModelAsset } from './asset-selector.js';
import type {
  AssetSelectionRequest,
  AssetSelectionResult,
  ModelAsset,
} from './types.js';

export class ModelAssetRegistry {
  private readonly assets = new Map<string, ModelAsset>();

  add(asset: ModelAsset): void {
    this.assets.set(asset.id, asset);
  }

  addMany(assets: ModelAsset[]): void {
    for (const asset of assets) this.add(asset);
  }

  remove(id: string): boolean {
    return this.assets.delete(id);
  }

  get(id: string): ModelAsset | null {
    return this.assets.get(id) ?? null;
  }

  list(): ModelAsset[] {
    return [...this.assets.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  get size(): number {
    return this.assets.size;
  }

  select(request: AssetSelectionRequest): AssetSelectionResult {
    return selectBestModelAsset(this.list(), request);
  }

  async index(scannedAssets: ScannedAsset[]): Promise<ModelAsset[]> {
    const analyzed: ModelAsset[] = [];

    for (const scanned of scannedAssets) {
      const asset = await analyzeModelAsset(scanned);
      this.add(asset);
      analyzed.push(asset);
    }

    return analyzed;
  }

  async indexDirectory(root: string): Promise<ModelAsset[]> {
    const scanned = await scanModelAssets(root);
    return this.index(scanned);
  }

  clear(): void {
    this.assets.clear();
  }
}
