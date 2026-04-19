import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { StorageService } from '@core/services/storage.service';
import { AuthService } from '@features/auth/services/auth.service';
import { RestaurantInfoService, RestaurantInfo } from '@core/services/restaurant-info.service';
import { DishService } from '@features/inventory/services/dish.service';
import { DrinkService } from '@features/inventory/services/drink.service';
import { CartService } from '../../services/cart.service';
import { DishResponse } from '@features/inventory/models/dish.model';
import { DrinkResponse } from '@features/inventory/models/drink.model';

@Component({
  selector: 'app-customer-home',
  templateUrl: './customer-home.component.html',
  styleUrls: ['./customer-home.component.scss']
})
export class CustomerHomeComponent implements OnInit, OnDestroy {

  userName = '';
  restaurantInfo: RestaurantInfo | null = null;
  featuredDishes: DishResponse[] = [];
  featuredDrinks: DrinkResponse[] = [];
  cartCount = 0;
  isOpen = false;
  currentYear = new Date().getFullYear();

  private cartSub?: Subscription;

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private router: Router,
    public restaurantService: RestaurantInfoService,
    private dishService: DishService,
    private drinkService: DrinkService,
    public cartService: CartService
  ) {}

  ngOnInit(): void {
    const user = this.storageService.getUser();
    this.userName = user?.firstName ? `${user.firstName}` : 'Cliente';

    this.restaurantService.get().subscribe({ next: info => this.restaurantInfo = info });
    this.restaurantService.isOpen().subscribe({ next: open => this.isOpen = open });

    this.dishService.getDishes(0).subscribe({
      next: res => { this.featuredDishes = (Array.isArray(res.message) ? res.message : []).slice(0, 4); }
    });
    this.drinkService.getDrinks(0).subscribe({
      next: res => { this.featuredDrinks = (Array.isArray(res.message) ? res.message : []).slice(0, 3); }
    });

    this.cartSub = this.cartService.items$.subscribe(() => {
      this.cartCount = this.cartService.count;
    });
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
  }

  addDishToCart(dish: DishResponse): void {
    this.cartService.add({
      productId:   dish.id,
      productName: dish.name,
      productType: 'DISH',
      unitPrice:   parseFloat(dish.price) || 0,
      photo:       dish.photo
    });
  }

  addDrinkToCart(drink: DrinkResponse): void {
    this.cartService.add({
      productId:   drink.id,
      productName: drink.name,
      productType: 'DRINK',
      unitPrice:   0,
      photo:       drink.photo
    });
  }

  goToMenu(): void    { this.router.navigate(['/customer/menu']); }
  goToOrders(): void  { this.router.navigate(['/customer/my-orders']); }
  goToCart(): void    { this.router.navigate(['/customer/menu'], { fragment: 'cart' }); }
  goToProfile(): void { this.router.navigate(['/auth/profile']); }

  logout(): void {
    this.authService.logout().subscribe({
      next:  () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login'])
    });
  }
}
