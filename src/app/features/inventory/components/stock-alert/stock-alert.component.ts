import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Router } from '@angular/router';

interface LowStockProduct {
  id: string;
  name: string;
  weight: number;
  minimumStock: number;
  photo: string;
  state: string;
}

@Component({
  selector: 'app-stock-alert',
  templateUrl: './stock-alert.component.html',
  styleUrls: ['./stock-alert.component.scss']
})
export class StockAlertComponent implements OnInit {
  lowStockProducts: LowStockProduct[] = [];
  loading = false;

  constructor(
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLowStockProducts();
  }

  loadLowStockProducts(): void {
    this.loading = true;
    // Cargar todos los productos y filtrar los que tienen stock bajo
    this.loadAllProducts();
  }

  private loadAllProducts(page: number = 0, accumulated: any[] = []): void {
    this.productService.getProducts(page).subscribe({
      next: (response) => {
        if (!response.error && Array.isArray(response.message)) {
          const products = response.message;
          accumulated = [...accumulated, ...products];

          // Si hay más páginas, seguir cargando
          if (products.length >= 10) {
            this.loadAllProducts(page + 1, accumulated);
          } else {
            // Ya cargamos todo, ahora filtrar productos con stock bajo
            this.filterLowStockProducts(accumulated);
          }
        } else {
          this.filterLowStockProducts(accumulated);
        }
      },
      error: (err) => {
        console.error('❌ [STOCK ALERT] Error:', err);
        this.loading = false;
        this.filterLowStockProducts(accumulated);
      }
    });
  }

  private filterLowStockProducts(products: any[]): void {
    // Filtrar productos donde weight <= minimumStock
    this.lowStockProducts = products
      .filter(p => p.weight <= p.minimumStock && p.state === 'ACTIVE')
      .map(p => ({
        id: p.id,
        name: p.name,
        weight: p.weight,
        minimumStock: p.minimumStock,
        photo: p.photo,
        state: p.state
      }))
      .sort((a, b) => {
        // Ordenar por criticidad: los que tienen menos stock primero
        const ratioA = a.weight / a.minimumStock;
        const ratioB = b.weight / b.minimumStock;
        return ratioA - ratioB;
      });

    this.loading = false;
  }

  viewProduct(product: LowStockProduct): void {
    this.router.navigate(['/admin/inventory/detail', product.id]);
  }

  getStockPercentage(product: LowStockProduct): number {
    return (product.weight / product.minimumStock) * 100;
  }

  getAlertLevel(product: LowStockProduct): 'critical' | 'warning' | 'low' {
    const percentage = this.getStockPercentage(product);
    if (percentage <= 25) return 'critical';
    if (percentage <= 50) return 'warning';
    return 'low';
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
