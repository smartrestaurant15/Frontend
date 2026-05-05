import { Component, OnInit, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RestaurantInfoService, RestaurantInfo } from '@core/services/restaurant-info.service';
import { MenuPublicationService } from '@features/inventory/services/menu-publication.service';
import { ActiveMenuDTO } from '@features/inventory/models/menu.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  mobileMenuOpen = false;
  navScrolled = false;
  activeMenu: ActiveMenuDTO | null = null;
  loadingMenu = true;
  restaurantInfo: RestaurantInfo | null = null;

  readonly mapUrl: SafeResourceUrl;

  constructor(
    private router: Router,
    private restaurantInfoService: RestaurantInfoService,
    private menuPublicationService: MenuPublicationService,
    private sanitizer: DomSanitizer
  ) {
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15909.073230098636!2d-75.67810998880795!3d4.545661167154525!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e38f4e470ab417b%3A0x9b5b2f23e502d58b!2sUniversidad%20Del%20Quind%C3%ADo!5e0!3m2!1ses!2sco!4v1776240354607!5m2!1ses!2sco'
    );
  }

  ngOnInit(): void {
    this.loadActiveMenu();
    this.loadRestaurantInfo();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.navScrolled = window.scrollY > 50;
  }

  loadActiveMenu(): void {
    this.loadingMenu = true;
    this.menuPublicationService.getActive()
      .pipe(catchError(() => of({ message: null, error: true })))
      .subscribe(res => {
        this.activeMenu = res.message;
        this.loadingMenu = false;
      });
  }

  loadRestaurantInfo(): void {
    this.restaurantInfoService.get()
      .pipe(catchError(() => of(null)))
      .subscribe(info => this.restaurantInfo = info);
  }

  formatTime(time: string): string {
    return this.restaurantInfoService.formatTime(time);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    this.mobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}
