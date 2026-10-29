import { SAMPLE_ASSETS } from './sampleAssets';
import { saveAssetMeta, saveAssetBlob, listAssets } from '../storage/db';
import type { AssetItem } from '../schemas/project';

export async function seedSampleAssetsIfEmpty(): Promise<AssetItem[]> {
  const existing = await listAssets();
  if (existing.length > 0) return existing;
  return forceSeedSampleAssets();
}

export async function forceSeedSampleAssets(): Promise<AssetItem[]> {
  const seeded: AssetItem[] = [];
  for (const sample of SAMPLE_ASSETS) {
    const blob = new Blob([sample.svgContent], { type: 'image/svg+xml' });
    const meta: AssetItem = {
      id: sample.id,
      name: sample.name,
      category: sample.category,
      mimeType: 'image/svg+xml',
      width: sample.width,
      height: sample.height,
      fileSize: blob.size,
      createdAt: new Date().toISOString(),
    };
    await saveAssetMeta(meta);
    await saveAssetBlob(meta.id, blob);
    seeded.push(meta);
  }
  return seeded;
}
