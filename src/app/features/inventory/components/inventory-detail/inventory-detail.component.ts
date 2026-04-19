import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-inventory-detail',
  templateUrl: './inventory-detail.component.html',
  styleUrls: ['./inventory-detail.component.scss']
})
export class InventoryDetailComponent implements OnInit {
  product: Product | null = null;
  loading = false;
  selectedPhotoIndex = 0;
  stockForm!: FormGroup;
  processingStock = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private productService: ProductService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initStockForm();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    }
  }

  initStockForm(): void {
    this.stockForm = this.fb.group({
      weight: [1, [Validators.required, Validators.min(1)]]
    });
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.error) {
          this.product = response.message as Product;
        } else {
          this.notificationService.showError('Producto no encontrado');
          this.router.navigate(['/inventory/list']);
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Error al cargar el producto');
        this.router.navigate(['/admin/inventory/list']);
      }
    });
  }

  editProduct(): void {
    if (this.product) {
      this.router.navigate(['/admin/inventory/edit', this.product.id]);
    }
  }

  deleteProduct(): void {
    if (this.product && confirm('¿Está seguro de eliminar este producto?')) {
      this.productService.deleteProduct(this.product.id).subscribe({
        next: (response) => {
          if (!response.error) {
            this.notificationService.showSuccess('Producto eliminado exitosamente');
            this.router.navigate(['/admin/inventory/list']);
          } else {
            this.notificationService.showError(response.message as string);
          }
        },
        error: () => {
          this.notificationService.showError('Error al eliminar el producto');
        }
      });
    }
  }

  addStock(): void {
    if (this.stockForm.valid && this.product) {
      this.processingStock = true;
      const weight = this.stockForm.get('weight')?.value;

      this.productService.addStock(this.product.id, { weight }).subscribe({
        next: (response) => {
          this.processingStock = false;
          if (!response.error) {
            this.notificationService.showSuccess('Stock agregado exitosamente');
            this.loadProduct(this.product!.id);
            this.stockForm.reset({ weight: 1 });
          } else {
            this.notificationService.showError(response.message as string);
          }
        },
        error: () => {
          this.processingStock = false;
          this.notificationService.showError('Error al agregar stock');
        }
      });
    }
  }

  discountStock(): void {
    if (this.stockForm.valid && this.product) {
      this.processingStock = true;
      const weight = this.stockForm.get('weight')?.value;

      this.productService.discountStock(this.product.id, { weight }).subscribe({
        next: (response) => {
          this.processingStock = false;
          if (!response.error) {
            this.notificationService.showSuccess('Stock descontado exitosamente');
            this.loadProduct(this.product!.id);
            this.stockForm.reset({ weight: 1 });
          } else {
            this.notificationService.showError(response.message as string);
          }
        },
        error: () => {
          this.processingStock = false;
          this.notificationService.showError('Error al descontar stock');
        }
      });
    }
  }

  selectPhoto(index: number): void {
    this.selectedPhotoIndex = index;
  }

  goBack(): void {
    this.router.navigate(['/admin/inventory/list']);
  }

  // Manejar error de imagen
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/no-image.png';
  }
}
