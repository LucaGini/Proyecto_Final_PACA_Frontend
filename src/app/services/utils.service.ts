import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { AbstractControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }
  capitalize(text: string): string { /// mayusculas
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  isValid(text: string): boolean { // no vacios
    return !!text && text.trim().length > 0;
  }
  areValidFields(fields: any[]): boolean {
  return fields.every(field => {
    if (typeof field === 'string') {
      return field.trim() !== '';
    }
    return field !== null && field !== undefined;
  });
}


  hasObjectChanged(original: any, updated: any): boolean {  // revisa aver si cambio algo
    for (const key of Object.keys(updated)) {
      if (original[key] !== updated[key]) {
        return true;
      }
    }
    return false;
  }
  copyProperties(destination: any, source: any, transforms: { [key: string]: (value: any) => any } = {}): void { // para los updates actualiza los datos para despues mandarlos al back y q se guarde
  for (const key of Object.keys(source)) {
    destination[key] = transforms[key] ? transforms[key](source[key]) : source[key];
  }
}
  // VALIDACIONES //

  validateCuit(cuit: string): boolean {
    return /^[0-9]{11}$/.test(cuit);
  }
  
  validatePassword(password: string): boolean {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*._-])[A-Za-z\d!@#$%^&*._-]{8,}$/;
    return regex.test(password);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidStock(total: number, minimum: number): boolean {
    return minimum <= total;
  }

  markAllControlsAsTouched(formGroup: { [key: string]: AbstractControl }) {
    Object.values(formGroup).forEach(control => control.markAsTouched());
  }

  // ALERTAS//
  showAlert(icon: 'success' | 'error' | 'info' | 'warning', title: string, text = ''): void {
    Swal.fire({ icon, title, text });
  }

  showConfirm(title: string, text: string): Promise<any> {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e7c633',
      cancelButtonColor: '#f76666',
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
    });
  }
}
