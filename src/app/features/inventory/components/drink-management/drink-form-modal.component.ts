import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl
} from '@angular/forms';
import { DrinkService } from '../../services/drink.service';
import { CategoryService } from '../../services/category.service';
import { ImageService } from '../../services/image.service';
import { ProductService } from '../../services/product.service';
import { NotificationService } from '@core/services/notification.service';
import { DrinkDetailResponse, DrinkType } from '../../models/drink.model';
import { CategoryResponse } from '../../models/category.model';
import { ProductListResponse } from '../../models/product.model';

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
  products: ProductListResponse[] = [];
  uploadedPhotos: string[] = [];
  loading = false;
  uploadingImage = false;
  isEditMode = false;

  readonly UNITS_OPTIONS = ['g', 'ml', 'oz', 'kg', 'L', 'unidad'];

  constructor(
    private fb: FormBuilder,
    private drinkService: DrinkService,
    private categoryService: CategoryService,
    private imageService: ImageService,
    private productService: ProductService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.loadProducts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['drinkId'] && changes['drinkId'].currentValue) {
      this.isEditMode = true;
      this.loadDrink(changes['drinkId'].currentValue);
    } else if (changes['drinkId'] && !changes['drinkId'].currentValue && changes['drinkId'].previousValue) {
      this.isEditMode = false;
      this.resetForm();
    }
  }

  get isPrepared(): boolean {
    return this.drinkForm?.get('drinkType')?.value === 'PREPARED';
  }

  get recipes(): FormArray {
    return this.drinkForm.get('recipes') as FormArray;
  }

  initForm(): void {
    this.drinkForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      mililiters: [0, [Validators.required, Validators.min(1)]],
      drinkType: ['SIMPLE', [Validators.required]],
      purchasePrice: [0, [Validators.required, Validators.min(0.01)]],
      salePrice: [0, [Validators.required, Validators.min(0.01)]],
      alcohol: [false],
      units: [0, [Validators.required, Validators.min(1)]],
      minimumStock: [0, [Validators.required, Validators.min(0)]],
      categoryId: ['', [Validators.required]],
      recipes: this.fb.array([])
    });

    // Actualizar validadores al cambiar el tipo
    this.drinkForm.get('drinkType')?.valueChanges.subscribe((type: DrinkType) => {
      this.syncValidatorsByType(type);
    });
  }

  private syncValidatorsByType(type: DrinkType): void {
    const purchasePrice = this.drinkForm.get('purchasePrice')!;
    const units = this.drinkForm.get('units')!;
    const minimumStock = this.drinkForm.get('minimumStock')!;

    if (type === 'SIMPLE') {
      purchasePrice.setValidators([Validators.required, Validators.min(0.01)]);
      units.setValidators([Validators.required, Validators.min(1)]);
      minimumStock.setValidators([Validators.required, Validators.min(0)]);
    } else {
      purchasePrice.clearValidators();
      units.clearValidators();
      minimumStock.clearValidators();
    }

    purchasePrice.updateValueAndValidity();
    units.updateValueAndValidity();
    minimumStock.updateValueAndValidity();
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (response) => {
        if (!response.error) {
          this.categories = response.message as CategoryResponse[];
        }
      },
      error: () => this.notificationService.showError('Error al cargar las categorías')
    });
  }

  loadProducts(): void {
    this.productService.getProducts(0).subscribe({
      next: (response) => {
        if (!response.error) {
          this.products = (response.message as ProductListResponse[])
            .filter(p => p.state === 'ACTIVE');
        }
      },
      error: () => this.notificationService.showError('Error al cargar los ingredientes')
    });
  }

  loadDrink(id: string): void {
    this.loading = true;
    this.drinkService.getDrinkById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.error) {
          const drink = response.message as DrinkDetailResponse;
          this.drinkForm.patchValue({
            name: drink.name,
            description: drink.description,
            mililiters: drink.mililiters,
            drinkType: drink.drinkType,
            purchasePrice: drink.purchasePrice ?? 0,
            salePrice: drink.salePrice,
            alcohol: drink.alcohol,
            units: drink.units,
            minimumStock: drink.minimumStock,
            categoryId: drink.categoryId || ''
          });

          this.uploadedPhotos = drink.photo ? [drink.photo] : [];

          // Cargar recetas si es bebida preparada
          if (drink.drinkType === 'PREPARED' && drink.recipes?.length) {
            drink.recipes.forEach(r => {
              this.recipes.push(this.createRecipeGroup(r.productId, r.weight, r.unit));
            });
          }

          this.syncValidatorsByType(drink.drinkType);
        }
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Error al cargar la bebida');
        this.close();
      }
    });
  }

  // ——— Gestión de recetas ———

  createRecipeGroup(productId = '', weight = 0, unit = 'g'): FormGroup {
    return this.fb.group({
      productId: [productId, Validators.required],
      weight: [weight, [Validators.required, Validators.min(0.01)]],
      unit: [unit, Validators.required]
    });
  }

  addRecipe(): void {
    this.recipes.push(this.createRecipeGroup());
  }

  removeRecipe(index: number): void {
    this.recipes.removeAt(index);
  }

  getRecipeControl(index: number, field: string): AbstractControl {
    return this.recipes.at(index).get(field)!;
  }

  getProductName(productId: string): string {
    return this.products.find(p => p.id === productId)?.name ?? productId;
  }

  // ——— Gestión de fotos ———

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

  // ——— Envío ———

  onSubmit(): void {
    if (this.isPrepared && this.recipes.length === 0) {
      this.notificationService.showError('Las bebidas preparadas requieren al menos un ingrediente');
      return;
    }

    if (this.drinkForm.valid && this.uploadedPhotos.length > 0) {
      this.loading = true;
      this.save();
    } else {
      if (this.uploadedPhotos.length === 0) {
        this.notificationService.showError('Debe subir al menos una foto');
      }
      this.drinkForm.markAllAsTouched();
    }
  }

  private save(): void {
    const formValue = this.drinkForm.value;
    const categoryId: string = formValue.categoryId;

    if (this.isEditMode && this.drinkId) {
      const updateDTO = {
        name: formValue.name,
        description: formValue.description,
        mililiters: formValue.mililiters,
        salePrice: formValue.salePrice,
        alcohol: formValue.alcohol,
        photos: this.uploadedPhotos,
        ...(this.isPrepared
          ? { recipes: formValue.recipes }
          : {
              units: formValue.units,
              minimumStock: formValue.minimumStock
            })
      };

      this.drinkService.updateDrink(this.drinkId, updateDTO).subscribe({
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
      const createDTO = {
        name: formValue.name,
        description: formValue.description,
        mililiters: formValue.mililiters,
        drinkType: formValue.drinkType,
        salePrice: formValue.salePrice,
        alcohol: formValue.alcohol,
        photos: this.uploadedPhotos,
        ...(this.isPrepared
          ? { recipes: formValue.recipes }
          : {
              purchasePrice: formValue.purchasePrice,
              units: formValue.units,
              minimumStock: formValue.minimumStock
            })
      };

      this.drinkService.createDrink(categoryId, createDTO).subscribe({
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
  }

  close(): void {
    this.resetForm();
    this.closeModal.emit();
  }

  private resetForm(): void {
    this.drinkForm?.reset({ drinkType: 'SIMPLE', alcohol: false });
    this.recipes?.clear();
    this.uploadedPhotos = [];
    this.isEditMode = false;
  }

  // ——— Getters para validación en template ———

  get name() { return this.drinkForm.get('name'); }
  get description() { return this.drinkForm.get('description'); }
  get mililiters() { return this.drinkForm.get('mililiters'); }
  get salePrice() { return this.drinkForm.get('salePrice'); }
  get purchasePrice() { return this.drinkForm.get('purchasePrice'); }
  get units() { return this.drinkForm.get('units'); }
  get minimumStock() { return this.drinkForm.get('minimumStock'); }
  get categoryId() { return this.drinkForm.get('categoryId'); }
}
