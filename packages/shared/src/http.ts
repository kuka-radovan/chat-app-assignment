export interface HistoryQuery {
  limit?: number;
  beforeCreatedAt?: string;
  beforeId?: string;
  afterCreatedAt?: string;
  afterId?: string;
}
