import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class CartService {
  private URL = `${environment.apiUrl}api`; 
  public itemsChanged$ = new Subject<any[]>();
  items: any[] = [];
  private hasFinishedOrder: boolean = false;
  totalAmount: number = 0;

  constructor(private http: HttpClient, private router: Router) {
    this.getItems();
  }

  private initializeCart() { // traigo el carrito y si no hay nada lo muestro vacio o si tiene, con las cosas que dejó el cliente comprando 
    const lsCart = localStorage.getItem('CART');
    if (!lsCart) {
      const emptyCart = { items: [], total: 0 };
      localStorage.setItem('CART', JSON.stringify(emptyCart));
      return emptyCart;
    }
    return JSON.parse(lsCart);
  }

  addToCart(product: any) {
    const lsCart = localStorage.getItem('CART');
    const CURRENT_CART = JSON.parse(lsCart as any) || { items: [] };
  
    const haveThisProduct = CURRENT_CART.items.find((x: any) => x.id === product.id);
    
    if (!haveThisProduct) { // CUANDO AGREGO EL PRODUCTO AL CARRITO
      CURRENT_CART.items.push({
        ...product,
        quantity: 1,
      });
  
      const NEW_CART = { total: 0, items: CURRENT_CART.items }; 
      localStorage.setItem('CART', JSON.stringify(NEW_CART)); // ACA ES COMO QUE TENGO EL CARRITO Y LO ACTUALIZO, ONDA LE AGREGO LOS PRODUCTOS SELECCIONADOS
      Swal.fire({
        title: 'Su producto se ha agregado al carrito',
        icon: 'success',})
  
      // NOTIFICAMOS CADA VEZ QUE SE AGREGA O YA ESTABA AGREGDO AL CARRITO
      this.items.splice(0, this.items.length, ...CURRENT_CART.items);
      this.notifyItemsChanged();
    } else {
      Swal.fire({
        title: 'Este producto ya está en tu carrito',
        icon: 'error',
      })
      return;
    }
  }
  

  getItems() {
    const CURRENT_CART = this.initializeCart();
    this.items = CURRENT_CART.items;
    return this.items;
  }

  clearCart() {
    this.items = [];
    localStorage.setItem('CART', JSON.stringify({ items: [], total: 0 }));
    this.notifyItemsChanged();
    return this.items;
  }

  removeFromCart(product: any) {
    const index = this.items.findIndex((item) => item.id === product.id);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.updateLocalStorage();
      this.notifyItemsChanged();
    }
  }
//ACA SE CALCULA EL TOTAL, Misma lógica, antes estaba en el cart.component.ts
  private calculateItemsTotal(): number {
    return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  calculateTotal(cityCharge: number): number {
    this.totalAmount = this.calculateItemsTotal();
    if (cityCharge !== 0) {
      this.totalAmount += this.totalAmount * (cityCharge / 100);
    }
    this.totalAmount = parseFloat(this.totalAmount.toFixed(2));
    this.updateLocalStorage();
    return this.totalAmount;
  }

  updateLocalStorage() {
    const cartData = { items: this.items, total: this.totalAmount };
    localStorage.setItem('CART', JSON.stringify(cartData));
  }

  notifyItemsChanged() {
    this.itemsChanged$.next(this.items);
  }  

  setOrderFinished(value: boolean) {
    this.hasFinishedOrder = value;
  }

  isOrderFinished(): boolean {
    return this.hasFinishedOrder;
  }

  getItemsOrder(): any[] {
    return this.items.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      unitPrice: item.price,
    }));
  }  
}
