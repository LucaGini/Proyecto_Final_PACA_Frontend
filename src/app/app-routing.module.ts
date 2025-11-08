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
import { AboutUsComponent } from './about-us/about-us.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { VrpComponent } from './vrp/vrp.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { VrpListComponent } from './vrp-list/vrp-list.component';

const routes: Routes = [
  // Administración
  { path: 'AdminProducts', component: AdminProductsComponent },
  { path: 'AdminProvinces', component: AdminProvincesComponent },
  { path: 'AdminCategories', component: AdminCategoriesComponent },
  { path: 'AdminCities', component: AdminCitiesComponent },
  { path: 'UserList', component: UserListComponent },
  { path: 'AdminSuppliers', component: AdminSuppliersComponent },
  { path: 'EditListProducts', component: EditListProductsComponent },
  { path: 'EditListProvinces', component: EditListProvincesComponent },
  { path: 'EditListCategories', component: EditListCategoriesComponent },
  { path: 'EditListCities', component: EditListCitiesComponent },
  { path: 'EditListSuppliers', component: EditListSuppliersComponent },
  { path: 'OrderList', component: OrderListComponent },
  { path: 'vrp', component: VrpComponent },
  { path: 'Dashboard', component: DashboardComponent },

  // Clientes
  { path: 'cart', component: CartComponent },
  { path: 'UserInformation', component: UserInformationComponent },
  { path: 'OrdersHistory', component: OrdersHistoryComponent },

  // Transportistas
  { path: 'vrp-list', component: VrpListComponent },

  // Usuarios no logueados
  { path: 'UserRegistration/new-password', component: NewPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'UserRegistration/login', component: LoginComponent },
  { path: 'UserRegistration', component: UserRegistrationComponent },

  // Públicos
  { path: '', redirectTo: 'about-us', pathMatch: 'full' },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'products', component: BodyComponent },
  { path: 'product/:productId', component: ProductDetailsComponent },
  { path: 'collection/:collection', component: CollectionComponent },

  // Página no encontrada
  { path: '**', component: NotFoundComponent, data: { hideHeaderFooter: true } },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
