import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CarouselModule } from 'ngx-bootstrap/carousel'; 
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

//component
import { AdminProductsComponent } from './products/admin-products/admin-products.component';
import { AddProductComponent } from './products/add-product/add-product.component';
import { EditListProductsComponent } from './products/edit-list-products/edit-list-products.component';

import { AdminProvincesComponent } from './provinces/admin-provinces/admin-provinces.component';
import { AddProvinceComponent } from './provinces/add-province/add-province.component';
import { EditListProvincesComponent } from './provinces/edit-list-provinces/edit-list-provinces.component';
import { AdminCategoriesComponent } from './categories/admin-categories/admin-categories.component';
import { AddCategoryComponent } from './categories/add-category/add-category.component';
import { EditListCategoriesComponent } from './categories/edit-list-categories/edit-list-categories.component';
import { AdminCitiesComponent } from './cities/admin-cities/admin-cities.component';
import { AddCityComponent } from './cities/add-city/add-city.component';
import { EditListCitiesComponent } from './cities/edit-list-cities/edit-list-cities.component';
import { AdminSuppliersComponent } from './suppliers/admin-suppliers/admin-suppliers.component';
import { AddSupplierComponent } from './suppliers/add-supplier/add-supplier.component';
import { EditListSuppliersComponent } from './suppliers/edit-list-suppliers/edit-list-suppliers.component';

//Angular Manual
import { MatToolbarModule } from '@angular/material/toolbar'; //navbar
import { MatButtonModule } from '@angular/material/button'; //btn
import { MatIconModule } from '@angular/material/icon'; // icon
import { MatGridListModule } from '@angular/material/grid-list';// columnas y filas
import { MatFormFieldModule } from '@angular/material/form-field'; //contraseña
import { MatRadioModule } from '@angular/material/radio';
import { ReactiveFormsModule } from '@angular/forms';// quizá haya que borrarlo
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatTabsModule} from '@angular/material/tabs';


@NgModule({
  declarations: [
    AdminProductsComponent,
   AddProductComponent,
   EditListProductsComponent,
    AdminProvincesComponent,
    AddProvinceComponent,
    EditListProvincesComponent,
    AdminCategoriesComponent,
    AddCategoryComponent,
    EditListCategoriesComponent,
    AdminCitiesComponent,
    AddCityComponent,
    EditListCitiesComponent,
    AdminSuppliersComponent,
    AddSupplierComponent,
    EditListSuppliersComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    CarouselModule,
    FormsModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatTabsModule,
    CommonModule
  ],
  exports: [
  
  ],

})
export class AdminModule { }