import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DishService } from '../../services/dish.service';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { ImageService } from '../../services/image.service';
import { NotificationService } from '@core/services/notification.service';
import { DishDetailResponse, DishAvailability } from '../../models/dish.model';
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

  // Estado del selector de ingredientes
  ingredientDropdownOpen = false;
  ingredientSearchQuery = '';
  openUnitDropdowns: { [index: number]: boolean } = {};

  readonly availabilityOptions: { value: DishAvailability; label: string; description: string }[] = [
    { value: 'REGULAR',      label: 'Carta normal',       description: 'Visible siempre en el menú de platos' },
    { value: 'MENU_DEL_DIA', label: 'Solo menú del día',  description: 'Solo aparece al asignarlo a un menú del día' },
    { value: 'BOTH',         label: 'Ambos',              description: 'Visible en carta y disponible para el menú del día' },
  ];

  readonly units = [
    { value: 'g',     label: 'Gramos (g)' },
    { value: 'kg',    label: 'Kilogramos (kg)' },
    { value: 'ml',    label: 'Mililitros (ml)' },
    { value: 'l',     label: 'Litros (l)' },
    { value: 'unidad', label: 'Unidades' },
    { value: 'cda',   label: 'Cucharadas' },
    { value: 'cdta',  label: 'Cucharaditas' },
    { value: 'taza',  label: 'Tazas' },
  ];

  constructor(
    private fb: FormBuilder,
    private dishService: DishService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private imageService: ImageService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
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
      availability: ['REGULAR', [Validators.required]],
      ingredients: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
  }

  get ingredients(): FormArray {
    return this.dishForm.get('ingredients') as FormArray;
  }

  createIngredientGroup(): FormGroup {
    return this.fb.group({
      product_id:   ['', [Validators.required]],
      product_name: [''],   // solo display, no se envía al backend
      quantity:     [0, [Validators.required, Validators.min(0.01)]],
      unit:         ['g', [Validators.required]]
    });
  }

  addIngredient(): void {
    this.ingredients.push(this.createIngredientGroup());
  }

  removeIngredient(index: number): void {
    this.ingredients.removeAt(index);
    // Re-indexar dropdowns de unidad al eliminar una fila
    const newDropdowns: { [index: number]: boolean } = {};
    Object.keys(this.openUnitDropdowns).forEach(key => {
      const k = parseInt(key, 10);
      if (k < index) newDropdowns[k] = this.openUnitDropdowns[k];
      else if (k > index) newDropdowns[k - 1] = this.openUnitDropdowns[k];
    });
    this.openUnitDropdowns = newDropdowns;
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
    this.loadAllProducts(0, []);
  }

  private loadAllProducts(page: number, accumulated: ProductListResponse[]): void {
    this.productService.getProducts(page).subscribe({
      next: (response) => {
        if (!response.error) {
          const items = response.message as ProductListResponse[];
          if (items && items.length > 0) {
            this.loadAllProducts(page + 1, [...accumulated, ...items]);
          } else {
            this.products = accumulated;
          }
        } else {
          this.products = accumulated;
        }
      },
      error: () => {
        if (accumulated.length > 0) {
          this.products = accumulated;
        } else {
          this.notificationService.showError('Error al cargar los productos');
        }
      }
    });
  }

  // ── Selector de ingredientes ──────────────────────────────────────────

  getSelectedProductIds(): string[] {
    return this.ingredients.controls.map(c => c.get('product_id')?.value).filter(Boolean);
  }

  getFilteredAvailableProducts(): ProductListResponse[] {
    const selected = new Set(this.getSelectedProductIds());
    const term = this.ingredientSearchQuery.toLowerCase().trim();
    return this.products.filter(p =>
      !selected.has(p.id) &&
      (!term || p.name.toLowerCase().includes(term))
    );
  }

  toggleIngredientDropdown(event: Event): void {
    event.stopPropagation();
    this.ingredientDropdownOpen = !this.ingredientDropdownOpen;
    if (this.ingredientDropdownOpen) {
      this.ingredientSearchQuery = '';
      this.openUnitDropdowns = {};
    }
  }

  closeIngredientDropdown(): void {
    this.ingredientDropdownOpen = false;
  }

  selectIngredient(product: ProductListResponse): void {
    console.log('=== SELECCIONANDO INGREDIENTE ===');
    console.log('Producto:', product);
    console.log('ID:', product.id);
    console.log('Nombre:', product.name);
    
    const group = this.createIngredientGroup();
    console.log('FormGroup creado:', group.value);
    
    group.setValue({
      product_id: product.id,
      product_name: product.name,
      quantity: 0,
      unit: 'g'
    });
    
    console.log('FormGroup después de setValue:', group.value);
    console.log('product_name control:', group.get('product_name')?.value);
    
    this.ingredients.push(group);
    console.log('Total ingredientes:', this.ingredients.length);
    console.log('Todos los ingredientes:', this.ingredients.value);
    
    // Forzar detección de cambios
    this.cdr.detectChanges();
    
    this.ingredientDropdownOpen = false;
    this.ingredientSearchQuery = '';
  }

  toggleUnitDropdown(index: number, event: Event): void {
    event.stopPropagation();
    const isOpen = this.openUnitDropdowns[index];
    this.openUnitDropdowns = {};
    this.ingredientDropdownOpen = false;
    if (!isOpen) this.openUnitDropdowns[index] = true;
  }

  selectUnit(index: number, unit: string): void {
    this.ingredients.at(index).get('unit')?.setValue(unit);
    this.openUnitDropdowns[index] = false;
  }

  getUnitLabel(value: string): string {
    return this.units.find(u => u.value === value)?.label ?? value;
  }

  getIngredientName(ingredient: any): string {
    const name = ingredient.get('product_name')?.value;
    console.log('getIngredientName llamado, valor:', name);
    return name || 'Sin nombre';
  }

  closeAllDropdowns(): void {
    this.ingredientDropdownOpen = false;
    this.openUnitDropdowns = {};
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
            categoryId: dish.categoryId || '',
            availability: dish.availability || 'REGULAR'
          });
          this.uploadedPhotos = dish.photos || [];
          
          // Cargar ingredientes
          this.clearIngredients();
          if (dish.ingredients && dish.ingredients.length > 0) {
            dish.ingredients.forEach((ingredient: any) => {
              const productId = ingredient.productId || ingredient.product_id;
              const productName =
                ingredient.productName ||
                ingredient.product_name ||
                ingredient.name ||
                this.products.find(p => String(p.id) === String(productId))?.name ||
                productId;
              const ingredientGroup = this.createIngredientGroup();
              ingredientGroup.patchValue({
                product_id:   productId,
                product_name: productName,
                quantity:     ingredient.quantity || ingredient.weight,
                unit:         ingredient.unit || 'g'
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
        ingredients: this.dishForm.value.ingredients.map((ing: any) => ({
          product_id: ing.product_id,
          quantity:   ing.quantity,
          unit:       ing.unit
        })),
        availability: this.dishForm.value.availability as DishAvailability
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
    this.ingredientDropdownOpen = false;
    this.ingredientSearchQuery = '';
    this.openUnitDropdowns = {};
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
