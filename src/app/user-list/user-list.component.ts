import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../services/user.service';
import { environment} from '../../environments/environment';
import { UtilsService } from 'src/app/services/utils.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { PaginationMetadata } from '../models/pagination.interface';
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent {

  users: any[] = [];
  selectedUserStatus: string = '';
  apiUrl = environment.apiUrl;

  // Pagination properties
  pagination: PaginationMetadata | null = null;
  currentPage = 1;
  pageSize = 20;


  constructor(
    private userService: UserService,
    private route: ActivatedRoute, 
    private utils: UtilsService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
  this.route.queryParams.subscribe((queryParams) => {
    const searchTerm = queryParams['q'];
    this.loadUsers(searchTerm);
  });
}
  
  onUserStatusChange(event: any): void {
    const value = event.target.value;

    if (value === '') {
      this.selectedUserStatus = '';
    } else if (value === 'active') {
      this.selectedUserStatus = 'active';
    } else if (value === 'inactive') {
      this.selectedUserStatus = 'inactive';
    }

    // Recargar usuarios con nuevo filtro
    this.loadUsers(undefined, 1); // Reset to page 1 when filtering
  }

  loadUsers(searchTerm?: string, page: number = 1, limit: number = this.pageSize) {
    let isActive: boolean | null = null;
    console.log('Selected User Status:', this.selectedUserStatus);
    if (this.selectedUserStatus === 'active') {
      isActive = true;
    } else if (this.selectedUserStatus === 'inactive') {
      isActive = false;
    }
    
    this.userService.getUsersPaginated(page, limit).subscribe({
      next: (response) => {
        this.users = response.data;
        this.pagination = response.pagination;
        this.currentPage = page;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        // Fallback to old method if pagination fails
        this.userService.getUsers(isActive, searchTerm).subscribe((data: any) => {
          this.users = data.data || data;
        });
      }
    });
  }

  // Método para verificar si hay filtros activos
  hasActiveFilters(): boolean {
    return this.selectedUserStatus !== '' && this.selectedUserStatus !== null;
  }

  // Método para limpiar todos los filtros
  clearAllFilters(): void {
    // Limpiar la propiedad del componente
    // Con [(ngModel)] el DOM se actualiza automáticamente
    this.selectedUserStatus = '';
    
    // Recargar todos los usuarios
    this.loadUsers();
  }

private handleError(message: string): void {
  console.error(message);
  this.utils.showAlert('error', 'Error', 'Error al deshabilitar la cuenta');
  } 
deleteUser(user: any): void {
  this.utils.showConfirm('¿Estás seguro?', 'Esta acción es permanente').then((result) => {
    if (result.isConfirmed) {
      this.userService.delete(user.id).subscribe({
        next: () => {
          this.utils.showAlert('success', 'Usuario eliminado correctamente');
          this.loadUsers(undefined, this.currentPage); // Stay on current page
        },
        error: () => this.handleError('Error eliminando la cuenta')
      });
    }
  });
}

// Pagination handlers
onPageChange(page: number): void {
  this.loadUsers(undefined, page, this.pageSize);
}

onPageSizeChange(newSize: number): void {
  this.pageSize = newSize;
  this.currentPage = 1; // Reset to first page when changing page size
  this.loadUsers(undefined, 1, newSize);
}
}