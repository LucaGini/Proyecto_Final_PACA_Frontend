import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent {

  users: any[] = [];
  selectedUserStatus: string | null = null;


  constructor(
    private userService: UserService,
    private route: ActivatedRoute, 
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
      this.selectedUserStatus = null;
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
    this.userService.getUsers(isActive, searchTerm).subscribe((data: any) => {
      this.users = data.data || data;
    });
  }
}

