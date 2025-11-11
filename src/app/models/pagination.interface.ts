// Pagination interfaces and types
export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  message: string;
  data: T[];
  pagination: PaginationMetadata;
}

// Query parameters for pagination requests
export interface PaginationQuery {
  page?: number;
  limit?: number;
}