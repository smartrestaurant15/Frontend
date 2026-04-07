import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { ProductListResponse } from '../../models/product.model';
import { NotificationService } from '@core/services/notification.service';

interface PaginatedContent {
  content: ProductListResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  products: ProductListResponse[] = [];
  loading = false;
  currentPage = 1;
  hasMorePages = true; // Para controlar si hay más páginas
  pageSize = 10; // Tamaño de página del backend
  columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Nombre' },
    { key: 'price', label: 'Precio' },
    { key: 'weight', label: 'Peso' },
    { key: 'minimumStock', label: 'Stock Mínimo' },
    { key: 'state', label: 'Estado' }
  ];

  constructor(
    private productService: ProductService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts(this.currentPage - 1).subscribe({
      next: (response) => {
        if (!response.error) {
          const message = response.message as any;
          if (Array.isArray(message)) {
            this.products = message;
            this.hasMorePages = message.length >= this.pageSize;
          } else {
            this.products = [];
            this.hasMorePages = false;
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const status = err?.status;
        if (status !== 404 && status !== 204) {
          this.notificationService.showError('Error al cargar los productos');
        } else {
          this.products = [];
          this.hasMorePages = false;
        }
      }
    });
  }

  nextPage(): void {
    this.currentPage++;
    this.loadProducts();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();
    }
  }

  onRowClick(product: ProductListResponse): void {
    this.router.navigate(['/inventory/detail', product.id]);
  }

  // Manejar error de imagen
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Evitar loop infinito: solo cambiar si no es ya el placeholder
    if (!img.src.includes('placeholder')) {
      img.src = 'https://via.placeholder.com/150?text=Sin+Imagen';
    }
  }

  navigateToNew(): void {
    this.router.navigate(['/inventory/new']);
  }
}
