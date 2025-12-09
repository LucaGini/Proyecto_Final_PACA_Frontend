import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProvinceService } from 'src/app/services/province.service';
import { UserService } from 'src/app/services/user.service';
import { environment} from 'src/environments/environment';
import { UtilsService } from 'src/app/services/utils.service';
import { AuthService } from  'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-list-driver',
  templateUrl: './edit-list-driver.component.html',
  styleUrls: ['./edit-list-driver.component.scss']
})
export class EditListDriverComponent {
  users: any[] = [];
  selectedUserStatus: string = '';
  apiUrl = environment.apiUrl;
  driverData: any = null;
  isEditMode: boolean = false;
  selectedProvince: string = '';
  provinces: any[] = [];



  constructor(
    private userService: UserService,
    private route: ActivatedRoute, 
    private utils: UtilsService,
    private authService: AuthService,
    private router: Router,
    private provinceService: ProvinceService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((queryParams) => {
      const searchTerm = queryParams['q'];
      this.loadUsers(searchTerm);
    });

    this.userService.usersUpdated$.subscribe(() => {
      this.loadUsers();
      this.loadProvinces();
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
    this.loadUsers();
  }

  loadUsers(searchTerm?: string) {
    let isActive: boolean | null = null;
    console.log('Selected User Status:', this.selectedUserStatus);
    if (this.selectedUserStatus === 'active') {
      isActive = true;
    } else if (this.selectedUserStatus === 'inactive') {
      isActive = false;
    }
    this.userService.getUsers('transportista', isActive, searchTerm).subscribe((data: any) => {
      this.users = data.data || data;
      console.log('Loaded Users:', this.users);
    });
  }

  loadProvinces(): void {
  this.provinceService.findAll().subscribe({
    next: (resp) => {
      this.provinces = Array.isArray(resp) ? resp : [];
    },
    error: () => {
      console.error('Error al cargar provincias');
    },
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
          this.loadUsers();
          this.userService.notifyUsersUpdated(); 
        },
        error: () => this.handleError('Error eliminando la cuenta')
      });
    }
  });
}

edit(driver: any) {
  driver.editing = true;
  driver.editProvince = driver.province?.name || '';
}

cancelEdit(driver: any) {
  driver.editing = false;
  driver.editProvince = '';
}

save(driver: any) {
  const updated = {
    ...driver,
    province: { id: driver.editProvince }
  };

  this.userService.update(updated).subscribe({
    next: () => {
      this.utils.showAlert('success', 'Provincia actualizada');
      driver.editing = false;
      this.userService.notifyUsersUpdated();
      this.loadUsers();
    },
    error: (err) => {
      this.utils.showAlert('error', 'Error', err.message);
    }
  });
}

}
