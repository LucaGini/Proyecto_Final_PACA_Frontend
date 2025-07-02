import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CarouselModule } from 'ngx-bootstrap/carousel'; 
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule, HttpClient} from '@angular/common/http'; // CUIDADO CON EL HTTPCLIENT no lo veo en los exports o imports
import { CommonModule } from '@angular/common';

//component
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { ResetPasswordComponent } from './userRegistration/reset-password/reset-password.component';
import { CarouselComponent } from './carousel/carousel.component';
import { BodyComponent } from './body/body.component';
import { FooterComponent } from './footer/footer.component';
import { CartComponent } from './cart/cart.component';
import { AdminModule } from './admin.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { UserRegistrationComponent } from './userRegistration/user-registration/user-registration.component';
import { SignUpComponent } from './userRegistration/sign-up/sign-up.component';
import { UserListComponent } from './user-list/user-list.component';
import { LoginComponent } from './userRegistration/login/login.component';
import { UserInformationComponent } from './user-information/user-information.component';
import { NewPasswordComponent } from './userRegistration/new-password/new-password.component';
import { CollectionComponent } from './collections/collection.component';
import { OrderListComponent } from './order-list/order-list.component';
import { SurchargelistComponent } from './surchargelist/surchargelist.component';
import { OrdersHistoryComponent } from './orders-history/orders-history.component';


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


import { TokenInterceptorService } from './services/token-interceptor.service';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    BodyComponent,
    LoginComponent,
    CarouselComponent,
    FooterComponent,
    ResetPasswordComponent,
    SignUpComponent,
    CartComponent,
    ProductDetailsComponent,
    UserListComponent,
    UserRegistrationComponent,
    UserInformationComponent,
    CollectionComponent,
    NewPasswordComponent,
    SurchargelistComponent,
    OrderListComponent,
    OrdersHistoryComponent

  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
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
    CommonModule,
    AdminModule
  ],
  exports: [
  
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptorService,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }