import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from './pagination/pagination.component';
import { BackButtonComponent } from './back-button/back-button.component';

@NgModule({
  declarations: [
    BackButtonComponent,
    PaginationComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule
  ],
  exports: [
    BackButtonComponent,
    PaginationComponent,
    CommonModule,
    MatIconModule,
    FormsModule
  ]
})
export class SharedModule {}
