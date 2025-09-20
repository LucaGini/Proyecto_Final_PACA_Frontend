import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface EditingComponent {
  componentName: string;
  hasUnsavedChanges: () => boolean;
  handleUnsavedChanges: () => Promise<boolean>; // Retorna true si puede continuar
}

@Injectable({
  providedIn: 'root'
})
export class EditGuardService {
  private editingComponents: EditingComponent[] = [];

  constructor() { }

  // Registrar un componente que puede tener cambios sin guardar
  registerComponent(component: EditingComponent): void {
    // Evitar duplicados
    this.unregisterComponent(component.componentName);
    this.editingComponents.push(component);
  }

  // Desregistrar un componente
  unregisterComponent(componentName: string): void {
    this.editingComponents = this.editingComponents.filter(
      comp => comp.componentName !== componentName
    );
  }

  // Verificar si hay cambios sin guardar en algún componente
  hasUnsavedChanges(): boolean {
    return this.editingComponents.some(comp => comp.hasUnsavedChanges());
  }

  // Manejar cambios sin guardar antes de una acción crítica (como logout)
  async handleUnsavedChanges(): Promise<boolean> {
    const componentsWithChanges = this.editingComponents.filter(comp => comp.hasUnsavedChanges());
    
    if (componentsWithChanges.length === 0) {
      return true; // No hay cambios, puede continuar
    }

    // Si hay cambios, usar el primer componente para manejar la confirmación
    return await componentsWithChanges[0].handleUnsavedChanges();
  }

  // Limpiar todos los componentes registrados
  clearAll(): void {
    this.editingComponents = [];
  }
}