import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

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
import { OrderListComponent } from './orders/order-list/order-list.component';
import { EditListProductsComponent } from './products/edit-list-products/edit-list-products.component';
import { EditListProvincesComponent } from './provinces/edit-list-provinces/edit-list-provinces.component';
import { EditListCategoriesComponent } from './categories/edit-list-categories/edit-list-categories.component';
import { EditListCitiesComponent } from './cities/edit-list-cities/edit-list-cities.component';
import { EditListSuppliersComponent } from './suppliers/edit-list-suppliers/edit-list-suppliers.component';
import { OrdersHistoryComponent } from './orders/orders-history/orders-history.component';
import { AuthGuard } from './guards/auth.guard';
import { ProfileCompleteGuard } from './guards/profile-complete.guard';
import { AboutUsComponent } from './about-us/about-us.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { VrpComponent } from './vrp/vrp.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { VrpListComponent } from './vrp-list/vrp-list.component';
import { AdminDriverComponent } from './driver/admin-driver/admin-driver.component';

const routes: Routes = [
  // === SOLO ADMINISTRADOR ===
  { path: 'AdminProducts', component: AdminProductsComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'AdminProvinces', component: AdminProvincesComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'AdminCategories', component: AdminCategoriesComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'AdminCities', component: AdminCitiesComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'UserList', component: UserListComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'AdminSuppliers', component: AdminSuppliersComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'EditListProducts', component: EditListProductsComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'AdminDrivers', component: AdminDriverComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'EditListProvinces', component: EditListProvincesComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'EditListCategories', component: EditListCategoriesComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'EditListCities', component: EditListCitiesComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'EditListSuppliers', component: EditListSuppliersComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'OrderList', component: OrderListComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'vrp', component: VrpComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },
  { path: 'Dashboard', component: DashboardComponent, canActivate: [AuthGuard], data: { roles: ['administrador'], hideBackButton: true } },

  // === SOLO CLIENTES Y NO LOGUEADOS ===
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard, ProfileCompleteGuard], data: { excludeRoles: ['administrador', 'transportista'], hideBackButton: true } },

  // === SOLO cliente ===
  { path: 'UserInformation', component: UserInformationComponent, canActivate: [AuthGuard], data: { roles: ['cliente'], hideBackButton: false } },
  { path: 'OrdersHistory', component: OrdersHistoryComponent, canActivate: [AuthGuard, ProfileCompleteGuard], data: { roles: ['cliente'], hideBackButton: true } },

  // === SOLO TRANSPORTISTAS ===
  { path: 'vrp-list', component: VrpListComponent, canActivate: [AuthGuard], data: { roles: ['transportista'], hideBackButton: true } },

  // === SOLO NO LOGUEADOS ===
  { path: 'UserRegistration/new-password', component: NewPasswordComponent, canActivate: [AuthGuard], data: { onlyGuest: true, hideBackButton: true } },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [AuthGuard], data: { onlyGuest: true, hideBackButton: true } },
  { path: 'UserRegistration/login', component: LoginComponent, canActivate: [AuthGuard], data: { onlyGuest: true, hideBackButton: true } },
  { path: 'UserRegistration', component: UserRegistrationComponent, canActivate: [AuthGuard], data: { onlyGuest: true, hideBackButton: true } },

  // === TODOS ===
  { path: '', redirectTo: 'about-us', pathMatch: 'full' },
  { path: 'about-us', component: AboutUsComponent, canActivate: [AuthGuard], data: { hideBackButton: true } },
  { path: 'products', component: BodyComponent, data: { hideBackButton: true } },
  { path: 'product/:productId', component: ProductDetailsComponent },
  { path: 'collection/:collection', component: CollectionComponent },
  { path: '**', component: NotFoundComponent, data: { hideHeaderFooter: true } },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
