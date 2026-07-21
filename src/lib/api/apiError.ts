export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, string[]>;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.error.message);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.error.code;
    this.fields = payload.error.fields;
  }
}
