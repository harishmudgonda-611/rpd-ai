export interface QualityReport {
  url: string;
  isAcceptable: boolean;
  aspectRatio?: number;
  width?: number;
  height?: number;
  score: number;
  reasons: string[];
}

export function inspectAssetQuality(url: string, width?: number, height?: number): QualityReport {
  const reasons: string[] = [];
  let score = 0.9;

  if (width && height) {
    const aspectRatio = width / height;
    if (aspectRatio < 0.3 || aspectRatio > 2.5) {
      score -= 0.4;
      reasons.push('extreme-aspect-ratio');
    }
    if (width < 300 || height < 300) {
      score -= 0.3;
      reasons.push('low-resolution');
    }
  }

  const isAcceptable = score >= 0.5;
  if (!isAcceptable) {
    reasons.push('quality-below-threshold');
  }

  return {
    url,
    isAcceptable,
    width,
    height,
    aspectRatio: width && height ? width / height : undefined,
    score,
    reasons,
  };
}
