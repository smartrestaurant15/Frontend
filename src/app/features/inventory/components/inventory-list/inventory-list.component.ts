import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SuplierService } from '../../services/suplier.service';
import { ImageService } from '../../services/image.service';
import { ProductListResponse } from '../../models/product.model';
import { SuplierResponse } from '../../models/suplier.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  products: ProductListResponse[] = [];
  suppliers: SuplierResponse[] = [];
  loading = false;
  submitting = false;
  uploadingImage = false;
  currentPage = 1;
  hasMorePages = true;
  pageSize = 10;
  searchTerm = '';
  productForm!: FormGroup;
  imagePreview: string | null = null;
  uploadedImageUrl: string | null = null;

  constructor(
    private productService: ProductService,
    private suplierService: SuplierService,
    private imageService: ImageService,
    private router: Router,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
    this.loadSuppliers();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name:         ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      description:  ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      price:        [null, [Validators.required, Validators.min(0.01)]],
      weight:       [null, [Validators.required, Validators.min(0.01)]],
      minimumStock: [null, [Validators.required, Validators.min(0)]],
      criticalStock:[null, [Validators.required, Validators.min(0)]],
      supplierId:   ['', Validators.required]
    });
  }

  get inactiveCount(): number {
    return this.products.filter(p => p.state !== 'ACTIVE').length;
  }

  get filteredProducts(): ProductListResponse[] {
    if (!this.searchTerm.trim()) return this.products;
    const term = this.searchTerm.toLowerCase();
    return this.products.filter(p => p.name.toLowerCase().includes(term));
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts(this.currentPage - 1).subscribe({
      next: (response) => {
        const data = response.message as any;
        this.products = Array.isArray(data) ? data : [];
        this.hasMorePages = this.products.length >= this.pageSize;
        this.loading = false;
      },
      error: () => {
        this.products = [];
        this.loading = false;
      }
    });
  }

  loadSuppliers(): void {
    this.suplierService.getAllSupliers().subscribe({
      next: (response) => {
        const data = response.message as any;
        this.suppliers = Array.isArray(data) ? data : [];
      },
      error: () => { this.suppliers = []; }
    });
  }

  onSubmitProduct(): void {
    if (this.productForm.invalid || this.submitting) return;
    this.submitting = true;

    const { supplierId, ...rest } = this.productForm.value;
    const photos = this.uploadedImageUrl
      ? [this.uploadedImageUrl]
      : ['https://via.placeholder.com/150'];
    const dto = { ...rest, photos, criticalStock: rest.criticalStock ?? 0 };

    this.productService.createProduct(supplierId, dto).subscribe({
      next: () => {
        this.notificationService.showSuccess('Producto registrado exitosamente');
        this.resetForm();
        this.loadProducts();
        this.submitting = false;
      },
      error: () => { this.submitting = false; }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    // Preview local
    const reader = new FileReader();
    reader.onload = (e) => this.imagePreview = e.target?.result as string;
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    this.uploadingImage = true;
    this.imageService.uploadImage(file).subscribe({
      next: (res: any) => {
        const data = res.message ?? res.data ?? res;
        this.uploadedImageUrl = data?.secure_url ?? data?.url ?? null;
        this.uploadingImage = false;
        if (!this.uploadedImageUrl) {
          this.notificationService.showError('No se pudo obtener la URL de la imagen');
        }
      },
      error: () => {
        this.uploadingImage = false;
        this.imagePreview = null;
        this.notificationService.showError('Error al subir la imagen');
      }
    });
  }

  removeImage(): void {
    this.imagePreview = null;
    this.uploadedImageUrl = null;
  }

  resetForm(): void {
    this.productForm.reset();
    this.imagePreview = null;
    this.uploadedImageUrl = null;
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

  navigateToNew(): void {
    this.router.navigate(['/admin/inventory/new']);
  }

  onRowClick(product: ProductListResponse): void {
    this.router.navigate(['/admin/inventory/detail', product.id]);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
