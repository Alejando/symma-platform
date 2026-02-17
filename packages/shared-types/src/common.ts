// Common contracts — pagination, errors, and shared utilities

export interface PaginationQuery {
  page?: number;   // 1-indexed, default 1
  limit?: number;  // default 20, max 100
  search?: string; // optional text search filter
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;   // total matching records (not just this page)
  page: number;    // current page (1-indexed)
  limit: number;   // items per page
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
