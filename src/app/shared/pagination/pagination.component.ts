import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PaginationMetadata } from '../../models/pagination.interface';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent {
  @Input() pagination: PaginationMetadata | null = null;
  @Input() currentPage: number = 1;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  onPageChange(page: number): void {
    if (page !== this.currentPage && page >= 1 && this.pagination && page <= this.pagination.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = parseInt(target.value, 10);
    this.pageSizeChange.emit(newSize);
  }

  getPageNumbers(): number[] {
    if (!this.pagination) return [];
    
    const pages: number[] = [];
    const totalPages = this.pagination.totalPages;
    const current = this.currentPage;
    
    // Show max 7 pages: ... [prev] [current-1] [current] [current+1] [next] ...
    let start = Math.max(1, current - 2);
    let end = Math.min(totalPages, current + 2);
    
    // Adjust if we're near the beginning or end
    if (current <= 3) {
      end = Math.min(totalPages, 5);
    }
    if (current >= totalPages - 2) {
      start = Math.max(1, totalPages - 4);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  shouldShowFirstPage(): boolean {
    return this.pagination !== null && this.getPageNumbers()[0] > 1;
  }

  shouldShowLastPage(): boolean {
    if (!this.pagination) return false;
    const pages = this.getPageNumbers();
    return pages[pages.length - 1] < this.pagination.totalPages;
  }

  // Helper for template
  get Math() {
    return Math;
  }
}