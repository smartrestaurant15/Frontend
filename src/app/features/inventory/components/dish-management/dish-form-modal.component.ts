import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DishService } from '../../services/dish.service';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { ImageService } from '../../services/image.service';
import { NotificationService } from '@core/services/notification.service';
import { DishDetailResponse } from '../../models/dish.model';
import { CategoryResponse } from '../../models/category.model';
import { ProductListResponse } from '../../models/product.model';

@Component({
  selector: 'app-dish-form-modal',
  templateUrl: './dish-form-modal.component.html',
  styleUrls: ['./dish-form-modal.component.scss']
})
export class DishFormModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() dishId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() dishSaved = new EventEmitter<void>();

  dishForm!: FormGroup;
  categories: CategoryResponse[] = [];
  products: ProductListResponse[] = [];
  uploadedPhotos: string[] = [];
  loading = false;
  uploadingImage = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private dishService: DishService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private imageService: ImageService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.loadProducts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dishId'] && changes['dishId'].currentValue) {
      this.isEditMode = true;
      this.loadDish(changes['dishId'].currentValue);
    } else if (changes['dishId'] && !changes['dishId'].currentValue && changes['dishId'].previousValue) {
      this.isEditMode = false;
      this.dishForm?.reset();
      this.uploadedPhotos = [];
      this.clearIngredients();
    }
  }

  initForm(): void {
    this.dishForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      categoryId: ['', [Validators.required]],
      ingredients: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
  }

  get ingredients(): FormArray {
    return this.dishForm.get('ingredients') as FormArray;
  }

  createIngredientGroup(): FormGroup {
    return this.fb.group({
      product_id: ['', [Validators.required]],
      quantity: [0, [Validators.required, Validators.min(0.01)]],
      unit: ['g', [Validators.required]]
    });
  }

  addIngredient(): void {
    this.ingredients.push(this.createIngredientGroup());
  }

  removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
  }

  clearIngredients(): void {
    while (this.ingredients.length > 0) {
      this.ingredients.removeAt(0);
    }
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

  loadProducts(): void {
    // Cargar todos los productos disponibles (sin paginación para el selector)
    this.productService.getProducts(0).subscribe({
      next: (response) => {
        if (!response.error) {
          this.products = response.message as ProductListResponse[];
        }
      },
      error: () => {
        this.notificationService.showError('Error al cargar los productos');
      }
    });
  }

  loadDish(id: string): void {
    this.loading = true;
    this.dishService.getDishById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.error) {
          const dish = response.message as any;
          this.dishForm.patchValue({
            name: dish.name,
            description: dish.description,
            price: dish.price,
            categoryId: dish.categoryId || ''
          });
          this.uploadedPhotos = dish.photos || [];
          
          // Cargar ingredientes
          this.clearIngredients();
          if (dish.ingredients && dish.ingredients.length > 0) {
            dish.ingredients.forEach((ingredient: any) => {
              const ingredientGroup = this.createIngredientGroup();
              ingredientGroup.patchValue({
                product_id: ingredient.productId || ingredient.product_id,
                quantity: ingredient.quantity || ingredient.weight,
                unit: ingredient.unit || 'g'
              });
              this.ingredients.push(ingredientGroup);
            });
          }
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Error al cargar el plato');
        this.close();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      if (this.uploadedPhotos.length >= 10) {
        this.notificationService.showError('Máximo 10 fotos permitidas');
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
    if (this.dishForm.valid && this.uploadedPhotos.length > 0 && this.ingredients.length > 0) {
      this.loading = true;
      const formData = {
        name: this.dishForm.value.name,
        description: this.dishForm.value.description,
        price: this.dishForm.value.price,
        photos: this.uploadedPhotos,
        ingredients: this.dishForm.value.ingredients
      };

      const categoryId = this.dishForm.value.categoryId;

      if (this.isEditMode && this.dishId) {
        // Actualizar plato
        this.dishService.updateDish(this.dishId, { ...formData, categoryId }).subscribe({
          next: (response) => {
            this.loading = false;
            if (!response.error) {
              this.notificationService.showSuccess('Plato actualizado exitosamente');
              this.dishSaved.emit();
              this.close();
            } else {
              this.notificationService.showError(response.message as string);
            }
          },
          error: () => {
            this.loading = false;
            this.notificationService.showError('Error al actualizar el plato');
          }
        });
      } else {
        // Crear plato
        this.dishService.createDish(categoryId, formData).subscribe({
          next: (response) => {
            this.loading = false;
            if (!response.error) {
              this.notificationService.showSuccess('Plato creado exitosamente');
              this.dishSaved.emit();
              this.close();
            } else {
              this.notificationService.showError(response.message as string);
            }
          },
          error: () => {
            this.loading = false;
            this.notificationService.showError('Error al crear el plato');
          }
        });
      }
    } else {
      if (this.uploadedPhotos.length === 0) {
        this.notificationService.showError('Debe subir al menos una foto');
      }
      if (this.ingredients.length === 0) {
        this.notificationService.showError('Debe agregar al menos un ingrediente');
      }
      this.dishForm.markAllAsTouched();
    }
  }

  close(): void {
    this.dishForm.reset();
    this.uploadedPhotos = [];
    this.clearIngredients();
    this.closeModal.emit();
  }

  get name() {
    return this.dishForm.get('name');
  }

  get description() {
    return this.dishForm.get('description');
  }

  get price() {
    return this.dishForm.get('price');
  }

  get categoryId() {
    return this.dishForm.get('categoryId');
  }
}
