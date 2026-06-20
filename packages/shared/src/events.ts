export type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

