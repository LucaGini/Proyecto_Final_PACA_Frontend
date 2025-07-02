import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import Swal from 'sweetalert2';
import { Router } from "@angular/router";
import { NgForm, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.scss']
})
export class NewPasswordComponent implements OnInit {
  userEmail: string = ''; 
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  resetPasswordForm = this.formbuilder.group({
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*._-])[A-Za-z\d!@#$%^&*._-]{8,}$/)]],
    password2: ['', [Validators.required]]
  });

  constructor(
    private userService: UserService,
    private router: Router,
    private formbuilder: FormBuilder
  ) { }

  get password() { return this.resetPasswordForm.controls.password; }
  get password2() { return this.resetPasswordForm.controls.password2; }

  ngOnInit(): void {
    const storedEmail = localStorage.getItem('userEmail');
    this.userEmail = storedEmail !== null ? storedEmail : ''; // si o si tuve que poner en el caso de que sea nulo pq si no tira error
    localStorage.removeItem('userEmail'); 
  }

  togglePasswordVisibility(){
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(){
    this.showConfirmPassword = !this.showConfirmPassword;
  }


  validatePassword(password: string): boolean {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*._-])[A-Za-z\d!@#$%^&*._-]{8,}$/;
    return regex.test(password);
  }

 ResetPassword() {
  if (this.resetPasswordForm.valid) {
    const password = this.resetPasswordForm.get('password')?.value;
    const password2 = this.resetPasswordForm.get('password2')?.value;

    if (password !== password2) {
      Swal.fire({
        icon: 'error',
        title: 'Error en la verificación',
        text: 'Por favor ingrese la misma contraseña dos veces.',
      });
      return;
    }

    if (!password || !this.validatePassword(password)) {
      Swal.fire({
        icon: 'error',
        title: 'Contraseña inválida',
        text: 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial.',
      });
      return;
    }

    this.userService.updatePassword(this.userEmail, password).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Contraseña actualizada',
          text: 'Su contraseña ha sido actualizada correctamente.',
        }).then(() => {
          this.router.navigate(['/UserRegistration']);
        });
      },
      error: (error: any) => {
        console.error('Error al actualizar contraseña:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al actualizar contraseña',
          text: 'No se pudo actualizar la contraseña. Intente nuevamente.',
        });
      }
    });
  } else {
    this.resetPasswordForm.markAllAsTouched();
  }
}
}

