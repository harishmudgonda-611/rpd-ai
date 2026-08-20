export interface TryOnRequest {
  garmentImageUrl: string;
  modelImageUrl?: string;
  category?: string;
  gender?: 'female' | 'male' | 'unisex';
}

export interface TryOnResult {
  tryOnImageUrl: string;
  provider: string;
  confidence: number;
}

export interface TryOnProvider {
  name: string;
  generateTryOn(request: TryOnRequest): Promise<TryOnResult>;
}

export class DefaultTryOnProvider implements TryOnProvider {
  name = 'default-try-on-adapter';

  async generateTryOn(request: TryOnRequest): Promise<TryOnResult> {
    const imageUrl = request.modelImageUrl || request.garmentImageUrl;
    return {
      tryOnImageUrl: imageUrl,
      provider: this.name,
      confidence: 0.9,
    };
  }
}
