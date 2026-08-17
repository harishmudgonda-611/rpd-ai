export type ExtractionErrorCode =
  | 'INVALID_URL'
  | 'UPSTREAM_HTTP_ERROR'
  | 'UPSTREAM_ACCESS_BLOCKED'
  | 'PRODUCT_DATA_NOT_FOUND';

export class ProductExtractionError extends Error {
  readonly code: ExtractionErrorCode;
  readonly status?: number;
  readonly platform?: string;

  constructor(
    code: ExtractionErrorCode,
    message: string,
    options?: {
      status?: number;
      platform?: string;
    },
  ) {
    super(message);
    this.name = 'ProductExtractionError';
    this.code = code;
    this.status = options?.status;
    this.platform = options?.platform;
  }
}
