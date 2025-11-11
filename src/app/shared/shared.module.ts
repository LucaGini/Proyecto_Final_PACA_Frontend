import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { FormErrorComponent } from './form-error.component';
import { PaginationComponent } from './pagination/pagination.component';

@NgModule({
  declarations: [
    FormErrorComponent,
    PaginationComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule
  ],
  exports: [
    FormErrorComponent,
    PaginationComponent,
    CommonModule,
    MatIconModule,
    FormsModule
  ]
})
export class SharedModule {}
