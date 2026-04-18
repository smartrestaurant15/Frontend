import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DrinkService } from '../../services/drink.service';
import { CategoryService } from '../../services/category.service';
import { ImageService } from '../../services/image.service';
import { NotificationService } from '@core/services/notification.service';
import { DrinkDetailResponse } from '../../models/drink.model';
import { CategoryResponse } from '../../models/category.model';

@Component({
  selector: 'app-drink-form-modal',
  templateUrl: './drink-form-modal.component.html',
  styleUrls: ['./drink-form-modal.component.scss']
})
export class DrinkFormModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() drinkId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() drinkSaved = new EventEmitter<void>();

  drinkForm!: FormGroup;
  categories: CategoryResponse[] = [];
  uploadedPhotos: string[] = [];
  loading = false;
  uploadingImage = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private drinkService: DrinkService,
    private categoryService: CategoryService,
    private imageService: ImageService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['drinkId'] && changes['drinkId'].currentValue) {
      this.isEditMode = true;
      this.loadDrink(changes['drinkId'].currentValue);
    } else if (changes['drinkId'] && !changes['drinkId'].currentValue && changes['drinkId'].previousValue) {
      // Reset cuando se cambia de editar a crear
      this.isEditMode = false;
      this.drinkForm?.reset();
      this.uploadedPhotos = [];
    }
  }

  initForm(): void {
    this.drinkForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      mililiters: [0, [Validators.required, Validators.min(1)]],
      alcohol: [false, [Validators.required]],
      units: [0, [Validators.required, Validators.min(1)]],
      minimumStock: [0, [Validators.required, Validators.min(0)]],
      categoryId: ['', [Validators.required]]
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (response) => {
        if (!response.error) {
          this.categories = response.message as CategoryResponse[];
        }
      },
      error: () => {
        this.notificationService.showError('Error al cargar las categorías');
      }
    });
  }

  loadDrink(id: string): void {
    this.loading = true;
    this.drinkService.getDrinkById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.error) {
          const drink = response.message as any;
          this.drinkForm.patchValue({
            name: drink.name,
            description: drink.description,
            mililiters: drink.mililiters,
            alcohol: drink.alcohol,
            units: drink.units,
            minimumStock: drink.minimumStock,
            categoryId: drink.categoryId || ''
          });
          this.uploadedPhotos = drink.photos || [drink.photo];
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Error al cargar la bebida');
        this.close();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      if (this.uploadedPhotos.length >= 3) {
        this.notificationService.showError('Máximo 3 fotos permitidas');
        return;
      }
      this.uploadImage(input.files[0]);
    }
  }

  uploadImage(file: File): void {
    this.uploadingImage = true;
    this.imageService.uploadImage(file).subscribe({
      next: (response) => {
        this.uploadingImage = false;
        if (!response.error) {
          const imageData = response.message as { url: string };
          this.uploadedPhotos.push(imageData.url);
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

  removePhoto(index: number): void {
    this.uploadedPhotos.splice(index, 1);
  }

  onSubmit(): void {
    if (this.drinkForm.valid && this.uploadedPhotos.length > 0) {
      this.loading = true;
      const formData = {
        ...this.drinkForm.value,
        photos: this.uploadedPhotos
      };

      const categoryId = formData.categoryId;
      delete formData.categoryId;

      if (this.isEditMode && this.drinkId) {
        // Actualizar bebida
        this.drinkService.updateDrink(this.drinkId, formData).subscribe({
          next: (response) => {
            this.loading = false;
            if (!response.error) {
              this.notificationService.showSuccess('Bebida actualizada exitosamente');
              this.drinkSaved.emit();
              this.close();
            } else {
              this.notificationService.showError(response.message as string);
            }
          },
          error: () => {
            this.loading = false;
            this.notificationService.showError('Error al actualizar la bebida');
          }
        });
      } else {
        // Crear bebida
        this.drinkService.createDrink(categoryId, formData).subscribe({
          next: (response) => {
            this.loading = false;
            if (!response.error) {
              this.notificationService.showSuccess('Bebida creada exitosamente');
              this.drinkSaved.emit();
              this.close();
            } else {
              this.notificationService.showError(response.message as string);
            }
          },
          error: () => {
            this.loading = false;
            this.notificationService.showError('Error al crear la bebida');
          }
        });
      }
    } else {
      if (this.uploadedPhotos.length === 0) {
        this.notificationService.showError('Debe subir al menos una foto');
      }
      this.drinkForm.markAllAsTouched();
    }
  }

  close(): void {
    this.drinkForm.reset();
    this.uploadedPhotos = [];
    this.closeModal.emit();
  }

  get name() {
    return this.drinkForm.get('name');
  }

  get description() {
    return this.drinkForm.get('description');
  }

  get mililiters() {
    return this.drinkForm.get('mililiters');
  }

  get units() {
    return this.drinkForm.get('units');
  }

  get minimumStock() {
    return this.drinkForm.get('minimumStock');
  }

  get categoryId() {
    return this.drinkForm.get('categoryId');
  }
}
