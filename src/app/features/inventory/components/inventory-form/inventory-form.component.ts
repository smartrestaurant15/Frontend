import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { ImageService } from '../../services/image.service';
import { SuplierService } from '../../services/suplier.service';
import { CategoryService } from '../../services/category.service';
import { SuplierResponse } from '../../models/suplier.model';
import { CategoryResponse } from '../../models/category.model';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-inventory-form',
  templateUrl: './inventory-form.component.html',
  styleUrls: ['./inventory-form.component.scss']
})
export class InventoryFormComponent implements OnInit {
  productForm!: FormGroup;
  supliers: SuplierResponse[] = [];
  categories: CategoryResponse[] = [];
  loading = false;
  isEditMode = false;
  productId: string | null = null;
  uploadedPhotos: string[] = [];
  uploadingImage = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private imageService: ImageService,
    private suplierService: SuplierService,
    private categoryService: CategoryService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSupliers();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.productId = id;
      this.loadProduct(id);
    }
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      weight: [0, [Validators.required, Validators.min(0.01)]],
      photos: [[], [Validators.required, Validators.minLength(1)]],
      minimumStock: [0, [Validators.required, Validators.min(0)]],
      criticalStock: [0, [Validators.required, Validators.min(0)]],
      suplierId: ['', [Validators.required]]
    });
  }

  loadSupliers(): void {
    this.suplierService.getAllSupliers().subscribe({
      next: (response) => {
        if (!response.error) {
          this.supliers = response.message as SuplierResponse[];
        }
      },
      error: () => {
        this.notificationService.showError('Error al cargar los proveedores');
      }
    });
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.error) {
          const product = response.message as any;
          this.productForm.patchValue({
            name: product.name,
            description: product.description,
            price: product.price,
            weight: product.weight,
            photos: product.photos,
            minimumStock: product.minimumStock,
            criticalStock: product.criticalStock ?? 0,
            suplierId: product.suplier?.id || ''
          });
          this.uploadedPhotos = product.photos || [];
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Error al cargar el producto');
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      this.loading = true;
      const formData = this.productForm.value;

      // Usar las fotos subidas como lista de URLs
      const photos = this.uploadedPhotos;

      if (this.isEditMode && this.productId) {
        // Actualizar producto
        this.productService.updateProduct(this.productId, {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          weight: formData.weight,
          photos: photos,
          minimumStock: formData.minimumStock,
          criticalStock: formData.criticalStock,
          suplier_id: formData.suplierId
        }).subscribe({
          next: (response) => {
            this.loading = false;
            if (!response.error) {
              this.notificationService.showSuccess('Producto actualizado exitosamente');
              this.router.navigate(['/admin/inventory/list']);
            } else {
              this.notificationService.showError(response.message as string);
            }
          },
          error: () => {
            this.loading = false;
            this.notificationService.showError('Error al actualizar el producto');
          }
        });
      } else {
        // Crear producto
        this.productService.createProduct(formData.suplierId, {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          weight: formData.weight,
          photos: photos,
          minimumStock: formData.minimumStock,
          criticalStock: formData.criticalStock
        }).subscribe({
          next: (response) => {
            this.loading = false;
            if (!response.error) {
              this.notificationService.showSuccess('Producto creado exitosamente');
              this.router.navigate(['/admin/inventory/list']);
            } else {
              this.notificationService.showError(response.message as string);
            }
          },
          error: () => {
            this.loading = false;
            this.notificationService.showError('Error al crear el producto');
          }
        });
      }
    }
  }

  // Manejar selección de archivo para subir imagen
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.uploadImage(input.files[0]);
    }
  }

  // Subir imagen a Cloudinary
  uploadImage(file: File): void {
    if (this.uploadedPhotos.length >= 10) {
      this.notificationService.showError('Máximo 10 fotos permitidas');
      return;
    }

    this.uploadingImage = true;
    this.imageService.uploadImage(file).subscribe({
      next: (response) => {
        this.uploadingImage = false;
        if (!response.error) {
          const imageData = response.message as { url: string };
          const imageUrl = imageData.url;
          this.uploadedPhotos.push(imageUrl);
          this.productForm.patchValue({ photos: this.uploadedPhotos });
          this.notificationService.showSuccess('Imagen subida exitosamente');
        } else {
          this.notificationService.showError('Error al subir la imagen');
        }
      },
      error: () => {
        this.uploadingImage = false;
        this.notificationService.showError('Error al subir la imagen');
      }
    });
  }

  // Eliminar una foto de la lista
  removePhoto(index: number): void {
    this.uploadedPhotos.splice(index, 1);
    this.productForm.patchValue({ photos: this.uploadedPhotos });
  }

  cancel(): void {
    this.router.navigate(['/admin/inventory/list']);
  }
}
