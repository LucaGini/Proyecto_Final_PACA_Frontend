import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { NgChartsModule } from 'ng2-charts';
// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
// ng-chartjs

// Components
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

import { DashboardComponent } from './dashboard/dashboard.component';

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
    EditListSuppliersComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CarouselModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatMenuModule,
    MatTabsModule,
    NgChartsModule,
    MatExpansionModule
  ],
})
export class AdminModule { }
