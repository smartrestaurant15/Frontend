import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MenuPublicationService } from '../../services/menu-publication.service';
import { DishService } from '../../services/dish.service';
import { DrinkService } from '../../services/drink.service';
import { AdditionService } from '../../services/addition.service';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '@core/services/notification.service';
import {
  MenuPublicationDTO, MenuStatus, MenuTimeSlot, MenuItemType,
  CatalogItem, AddPublicationSectionRequest, AddSectionOptionRequest, AdjustPortionsRequest
} from '../../models/menu.model';
import { CategoryResponse } from '../../models/category.model';

@Component({
  selector: 'app-menu-publication-detail',
  templateUrl: './menu-publication-detail.component.html',
  styleUrls: ['./menu-publication-detail.component.scss']
})
export class MenuPublicationDetailComponent implements OnInit {
  publication: MenuPublicationDTO | null = null;
  loading = false;
  saving = false;

  // ── Section modal ───────────────────────────────────────────────────────────
  isAddSectionOpen = false;
  sectionForm!: FormGroup;

  // ── Option modal ────────────────────────────────────────────────────────────
  isAddOptionOpen = false;
  activeSectionId: string | null = null;
  optionForm!: FormGroup;
  catalogItems: CatalogItem[] = [];
  loadingCatalog = false;
  catalogSearch = '';
  selectedItem: CatalogItem | null = null;
  categories: CategoryResponse[] = [];
  selectedCategoryId: string | null = null;

  // ── Portions modal ──────────────────────────────────────────────────────────
  isAdjustPortionsOpen = false;
  portionsForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private publicationService: MenuPublicationService,
    private dishService: DishService,
    private drinkService: DrinkService,
    private additionService: AdditionService,
    private categoryService: CategoryService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadPublication(id);
  }

  loadPublication(id: string): void {
    this.loading = true;
    this.publicationService.getById(id).subscribe({
      next: (res) => { this.publication = res.message as MenuPublicationDTO; this.loading = false; },
      error: () => { this.loading = false; this.notificationService.showError('Error al cargar'); this.goBack(); }
    });
  }

  goBack(): void { this.router.navigate(['..'], { relativeTo: this.route }); }

  // ── Ciclo de vida ───────────────────────────────────────────────────────────

  publish(): void {
    if (!this.publication || !confirm('¿Publicar el menú? Quedará disponible para pedidos.')) return;
    this.saving = true;
    this.publicationService.publish(this.publication.id).subscribe({
      next: (res) => {
        if (!res.error) { this.notificationService.showSuccess('Menú publicado'); this.reload(); }
        else { this.notificationService.showError(res.message as string); }
        this.saving = false;
      },
      error: () => { this.notificationService.showError('Error al publicar'); this.saving = false; }
    });
  }

  closeMenu(): void {
    if (!this.publication || !confirm('¿Cerrar el menú? No se aceptarán nuevos pedidos.')) return;
    this.saving = true;
    this.publicationService.close(this.publication.id).subscribe({
      next: (res) => {
        if (!res.error) { this.notificationService.showSuccess('Menú cerrado'); this.reload(); }
        else { this.notificationService.showError(res.message as string); }
        this.saving = false;
      },
      error: () => { this.notificationService.showError('Error al cerrar'); this.saving = false; }
    });
  }

  deletePublication(): void {
    if (!this.publication || !confirm('¿Eliminar este borrador? Esta acción no se puede deshacer.')) return;
    this.publicationService.delete(this.publication.id).subscribe({
      next: (res) => {
        if (!res.error) { this.notificationService.showSuccess('Publicación eliminada'); this.goBack(); }
        else { this.notificationService.showError(res.message as string); }
      },
      error: () => this.notificationService.showError('Error al eliminar')
    });
  }

  // ── Porciones ───────────────────────────────────────────────────────────────

  openAdjustPortions(): void {
    this.portionsForm = this.fb.group({
      totalPortions: [this.publication?.totalPortions, [Validators.required, Validators.min(1)]]
    });
    this.isAdjustPortionsOpen = true;
  }

  submitAdjustPortions(): void {
    if (!this.publication || this.portionsForm.invalid) return;
    this.saving = true;
    const req: AdjustPortionsRequest = { totalPortions: this.portionsForm.value.totalPortions };
    this.publicationService.adjustPortions(this.publication.id, req).subscribe({
      next: (res) => {
        if (!res.error) {
          this.notificationService.showSuccess('Porciones ajustadas');
          this.isAdjustPortionsOpen = false; this.reload();
        } else { this.notificationService.showError(res.message as string); }
        this.saving = false;
      },
      error: () => { this.notificationService.showError('Error al ajustar'); this.saving = false; }
    });
  }

  // ── Secciones ───────────────────────────────────────────────────────────────

  openAddSection(): void {
    this.sectionForm = this.fb.group({
      name:               ['',   [Validators.required, Validators.maxLength(100)]],
      description:        ['',   Validators.maxLength(300)],
      required:           [true],
      maxSelections:      [1,    [Validators.required, Validators.min(1)]],
      includedInBasePrice:[true],
      displayOrder:       [this.publication?.sections.length ?? 0]
    });
    this.isAddSectionOpen = true;
  }

  submitAddSection(): void {
    if (!this.publication || this.sectionForm.invalid) { this.sectionForm.markAllAsTouched(); return; }
    this.saving = true;
    const req: AddPublicationSectionRequest = this.sectionForm.value;
    this.publicationService.addSection(this.publication.id, req).subscribe({
      next: (res) => {
        if (!res.error) {
          this.notificationService.showSuccess('Sección agregada');
          this.isAddSectionOpen = false; this.reload();
        } else { this.notificationService.showError(res.message as string); }
        this.saving = false;
      },
      error: () => { this.notificationService.showError('Error al agregar sección'); this.saving = false; }
    });
  }

  deleteSection(sectionId: string): void {
    if (!this.publication || !confirm('¿Eliminar esta sección y todas sus opciones?')) return;
    this.publicationService.deleteSection(this.publication.id, sectionId).subscribe({
      next: (res) => {
        if (!res.error) { this.notificationService.showSuccess('Sección eliminada'); this.reload(); }
        else { this.notificationService.showError(res.message as string); }
      },
      error: () => this.notificationService.showError('Error al eliminar sección')
    });
  }

  // ── Opciones ────────────────────────────────────────────────────────────────

  openAddOption(sectionId: string): void {
    this.activeSectionId = sectionId;
    this.selectedItem = null;
    this.catalogSearch = '';
    this.selectedCategoryId = null;
    this.optionForm = this.fb.group({
      itemType:      ['DISH', Validators.required],
      maxPortions:   [null],
      additionalCost:[0, [Validators.required, Validators.min(0)]]
    });
    this.categoryService.getAllCategories().subscribe({
      next: (res: any) => { this.categories = Array.isArray(res.message) ? res.message : []; },
      error: () => { this.categories = []; }
    });
    this.loadCatalog('DISH');
    this.isAddOptionOpen = true;
  }

  onItemTypeChange(): void {
    this.selectedItem = null;
    this.catalogSearch = '';
    this.selectedCategoryId = null;
    this.loadCatalog(this.optionForm.value.itemType as MenuItemType);
  }

  onCategoryChange(): void {
    this.selectedItem = null;
    this.catalogSearch = '';
    this.loadCatalog(this.optionForm.value.itemType as MenuItemType);
  }

  loadCatalog(itemType: MenuItemType): void {
    this.loadingCatalog = true;
    this.catalogItems = [];

    if (itemType === 'DISH') {
      this.dishService.getDishes(0, this.selectedCategoryId ?? undefined, true).subscribe({
        next: (res: any) => {
          const raw = Array.isArray(res.message) ? res.message : [];
          this.catalogItems = raw.map((d: any) => ({
            id: d.id, name: d.name,
            photo: d.photo || null,
            price: parseFloat(d.salePrice ?? d.price) || 0,
            itemType
          }));
          this.loadingCatalog = false;
        },
        error: () => { this.loadingCatalog = false; }
      });
    } else if (itemType === 'DRINK') {
      this.drinkService.getDrinks(0).subscribe({
        next: (res: any) => {
          const raw = Array.isArray(res.message) ? res.message : [];
          this.catalogItems = raw.map((d: any) => ({
            id: d.id, name: d.name,
            photo: d.photo || null,
            price: parseFloat(d.salePrice ?? d.price) || 0,
            itemType
          }));
          this.loadingCatalog = false;
        },
        error: () => { this.loadingCatalog = false; }
      });
    } else {
      this.additionService.getAdditions(0).subscribe({
        next: (res: any) => {
          const raw = Array.isArray(res.message) ? res.message : [];
          this.catalogItems = raw.map((d: any) => ({
            id: d.id, name: d.name,
            photo: d.photo || null,
            price: parseFloat(d.salePrice ?? d.price) || 0,
            itemType
          }));
          this.loadingCatalog = false;
        },
        error: () => { this.loadingCatalog = false; }
      });
    }
  }

  get filteredCatalog(): CatalogItem[] {
    if (!this.catalogSearch.trim()) return this.catalogItems;
    const q = this.catalogSearch.toLowerCase();
    return this.catalogItems.filter(c => c.name.toLowerCase().includes(q));
  }

  selectItem(item: CatalogItem): void { this.selectedItem = item; }

  submitAddOption(): void {
    if (!this.publication || !this.activeSectionId || !this.selectedItem || this.optionForm.invalid) return;
    this.saving = true;
    const v = this.optionForm.value;
    const req: AddSectionOptionRequest = {
      itemType:      v.itemType,
      itemId:        this.selectedItem.id,
      maxPortions:   v.maxPortions ? Number(v.maxPortions) : null,
      additionalCost:v.additionalCost
    };
    this.publicationService.addOption(this.publication.id, this.activeSectionId, req).subscribe({
      next: (res) => {
        if (!res.error) {
          this.notificationService.showSuccess('Opción agregada');
          this.isAddOptionOpen = false; this.reload();
        } else { this.notificationService.showError(res.message as string); }
        this.saving = false;
      },
      error: () => { this.notificationService.showError('Error al agregar opción'); this.saving = false; }
    });
  }

  deleteOption(sectionId: string, optionId: string): void {
    if (!this.publication || !confirm('¿Eliminar esta opción?')) return;
    this.publicationService.deleteOption(this.publication.id, sectionId, optionId).subscribe({
      next: (res) => {
        if (!res.error) { this.notificationService.showSuccess('Opción eliminada'); this.reload(); }
        else { this.notificationService.showError(res.message as string); }
      },
      error: () => this.notificationService.showError('Error al eliminar opción')
    });
  }

  toggleOption(sectionId: string, optionId: string): void {
    if (!this.publication) return;
    this.publicationService.toggleOption(this.publication.id, sectionId, optionId).subscribe({
      next: (res) => {
        if (!res.error) this.reload();
        else this.notificationService.showError(res.message as string);
      },
      error: () => this.notificationService.showError('Error al actualizar opción')
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private reload(): void { if (this.publication) this.loadPublication(this.publication.id); }

  canPublish():         boolean { return this.publication?.status === 'DRAFT'; }
  canClose():           boolean { return this.publication?.status === 'PUBLISHED' || this.publication?.status === 'SOLD_OUT'; }
  canAdjustPortions():  boolean { return this.publication?.status === 'PUBLISHED' || this.publication?.status === 'SOLD_OUT'; }
  canModifyStructure(): boolean { return this.publication?.status === 'DRAFT'; }
  canAddOptions():      boolean { return this.publication?.status !== 'CLOSED'; }

  getStatusLabel(status: MenuStatus): string {
    return { DRAFT: 'Borrador', PUBLISHED: 'Publicado', SOLD_OUT: 'Agotado', CLOSED: 'Cerrado' }[status];
  }

  getStatusClass(status: MenuStatus): string {
    return {
      DRAFT:     'bg-[#998f81]/10 text-[#998f81] border border-[#998f81]/20',
      PUBLISHED: 'bg-green-900/20 text-green-400 border border-green-900/30',
      SOLD_OUT:  'bg-red-900/20 text-red-400 border border-red-900/30',
      CLOSED:    'bg-[#2a2a2a] text-[#4d463a] border border-[#4d463a]/20'
    }[status];
  }

  getTimeSlotLabel(slot: MenuTimeSlot): string {
    return { LUNCH: 'Almuerzo', DINNER: 'Cena', ALL_DAY: 'Todo el día' }[slot];
  }

  getItemTypeLabel(type: MenuItemType): string {
    return { DISH: 'Plato', DRINK: 'Bebida', ADDITION: 'Adición' }[type];
  }

  getItemTypeClass(type: MenuItemType): string {
    return {
      DISH:     'bg-amber-900/20 text-amber-400',
      DRINK:    'bg-blue-900/20 text-blue-400',
      ADDITION: 'bg-purple-900/20 text-purple-400'
    }[type];
  }

  portionsPercent(): number {
    if (!this.publication || !this.publication.totalPortions) return 0;
    return Math.round((this.publication.availablePortions / this.publication.totalPortions) * 100);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}
