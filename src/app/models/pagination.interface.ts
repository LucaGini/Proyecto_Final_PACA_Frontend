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

// Product-specific filters
export interface ProductFilters {
  search?: string;
  supplier?: string;
  category?: string;
  status?: string | boolean;
  minPrice?: number;
  maxPrice?: number;
}

// Order-specific filters
export interface OrderFilters {
  search?: string;
  orderStatus?: string;
  userEmail?: string;
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
}