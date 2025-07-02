import { NgModule } from '@angular/core';
import { RouterModule, Routes } from "@angular/router";
import { LoginComponent } from './userRegistration/login/login.component';
import { BodyComponent } from './body/body.component';
import { ResetPasswordComponent } from './userRegistration/reset-password/reset-password.component';
import { AdminProductsComponent } from './products/admin-products/admin-products.component';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { CartComponent } from './cart/cart.component';
import { AdminProvincesComponent } from './provinces/admin-provinces/admin-provinces.component';
import { AdminCategoriesComponent } from './categories/admin-categories/admin-categories.component';
import { AdminCitiesComponent } from './cities/admin-cities/admin-cities.component';
import { AdminSuppliersComponent } from './suppliers/admin-suppliers/admin-suppliers.component';
import { UserListComponent } from './user-list/user-list.component';
import { UserRegistrationComponent } from './userRegistration/user-registration/user-registration.component';
import { UserInformationComponent } from './user-information/user-information.component';
import { CollectionComponent } from './collections/collection.component';
import { NewPasswordComponent } from './userRegistration/new-password/new-password.component';
import { OrderListComponent } from './order-list/order-list.component';
import { EditListProductsComponent } from './products/edit-list-products/edit-list-products.component';
import { EditListProvincesComponent } from './provinces/edit-list-provinces/edit-list-provinces.component';
import { EditListCategoriesComponent } from './categories/edit-list-categories/edit-list-categories.component';
import { EditListCitiesComponent } from './cities/edit-list-cities/edit-list-cities.component';
import { EditListSuppliersComponent } from './suppliers/edit-list-suppliers/edit-list-suppliers.component';
import { OrdersHistoryComponent } from './orders-history/orders-history.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', component: BodyComponent },
  { path: 'UserRegistration', component: UserRegistrationComponent },
  { path: 'AdminProducts', component: AdminProductsComponent, canActivate: [AuthGuard], data: { roles: ['administrador'] }},
  { path: 'AdminProvinces', component: AdminProvincesComponent, canActivate: [AuthGuard], data: { roles: ['administrador'] }},
  { path: 'AdminCategories', component: AdminCategoriesComponent, canActivate: [AuthGuard], data: { roles: ['administrador'] }},
  { path: 'AdminCities', component: AdminCitiesComponent, canActivate: [AuthGuard], data: { roles: ['administrador'] }},
  { path: 'UserList', component: UserListComponent , canActivate: [AuthGuard], data: { roles: ['administrador'] }},
  { path: 'AdminSuppliers', component: AdminSuppliersComponent, canActivate: [AuthGuard], data: { roles: ['administrador'] }},
  { path: 'UserInformation', component: UserInformationComponent, canActivate: [AuthGuard], data: { roles: ['cliente'] }},
  { path: 'reset-password', component: ResetPasswordComponent},
  { path: 'product/:productId', component: ProductDetailsComponent },
  { path: 'cart', component: CartComponent},
  { path: 'collection/:collection', component: CollectionComponent },
  { path: 'UserRegistration/new-password', component: NewPasswordComponent },
  { path: 'UserRegistration/login', component: LoginComponent },
  { path: 'OrderList', component: OrderListComponent, canActivate: [AuthGuard], data: { roles: ['administrador'] }},
  { path: 'EditListProducts', component: EditListProductsComponent, canActivate: [AuthGuard], data: { roles: ['administrador'] }},
  { path: 'EditListProvinces', component: EditListProvincesComponent, canActivate: [AuthGuard], data: { roles: ['administrador'] }},
  { path: 'EditListCategories', component: EditListCategoriesComponent, canActivate: [AuthGuard], data: { roles: ['administrador'] }},
  { path: 'EditListCities', component: EditListCitiesComponent, canActivate: [AuthGuard], data: { roles: ['administrador'] }},
  { path: 'EditListSuppliers', component: EditListSuppliersComponent, canActivate: [AuthGuard], data: { roles: ['administrador'] }},
  { path: 'OrdersHistory', component: OrdersHistoryComponent, canActivate: [AuthGuard], data: { roles: ['cliente'] }},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
