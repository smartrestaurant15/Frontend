import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MenuPublicationService } from '../../services/menu-publication.service';
import { MenuTemplateService } from '../../services/menu-template.service';
import { NotificationService } from '@core/services/notification.service';
import {
  MenuPublicationSummaryDTO, MenuTemplateDTO,
  MenuStatus, MenuTimeSlot, CreateMenuPublicationRequest
} from '../../models/menu.model';

@Component({
  selector: 'app-daily-menu',
  templateUrl: './daily-menu.component.html',
  styleUrls: ['./daily-menu.component.scss']
})
export class DailyMenuComponent implements OnInit {
  publications: MenuPublicationSummaryDTO[] = [];
  templates: MenuTemplateDTO[] = [];
  loading = false;
  currentPage = 0;
  hasMorePages = true;
  pageSize = 10;
  statusFilter: MenuStatus | 'ALL' = 'ALL';
  isCreateModalOpen = false;
  saving = false;
  createForm!: FormGroup;
  filteredPublications: MenuPublicationSummaryDTO[] = [];

  readonly statusFilters: { label: string; value: MenuStatus | 'ALL' }[] = [
    { label: 'Todos',      value: 'ALL'       },
    { label: 'Borrador',   value: 'DRAFT'     },
    { label: 'Publicados', value: 'PUBLISHED' },
    { label: 'Agotados',   value: 'SOLD_OUT'  },
    { label: 'Cerrados',   value: 'CLOSED'    },
  ];

  constructor(
    private fb: FormBuilder,
    private publicationService: MenuPublicationService,
    private templateService: MenuTemplateService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPublications();
    this.loadTemplates();
    
    // Recargar cuando volvemos a esta ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url.includes('/inventory/daily-menu') && !event.url.includes('/inventory/daily-menu/')) {
        this.loadPublications();
      }
    });
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.createForm = this.fb.group({
      date:          [today,   Validators.required],
      timeSlot:      ['LUNCH', Validators.required],
      basePrice:     [0,       [Validators.required, Validators.min(1)]],
      totalPortions: [20,      [Validators.required, Validators.min(1)]],
      templateId:    [null]
    });
  }

  loadPublications(): void {
    this.loading = true;
    this.publicationService.getAll(this.currentPage).subscribe({
      next: (res) => {
        this.publications = Array.isArray(res.message) ? res.message : [];
        this.hasMorePages = this.publications.length >= this.pageSize;
        this.updateFilteredPublications();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.notificationService.showError('Error al cargar las publicaciones');
      }
    });
  }

  updateFilteredPublications(): void {
    if (this.statusFilter === 'ALL') {
      this.filteredPublications = [...this.publications];
    } else {
      this.filteredPublications = this.publications.filter(p => p.status === this.statusFilter);
    }
  }

  setStatusFilter(status: MenuStatus | 'ALL'): void {
    this.statusFilter = status;
    this.currentPage = 0;  // Resetear a la primera página
    this.loadPublications();
  }

  private loadTemplates(): void {
    this.templateService.getAll().subscribe({
      next: (res) => { this.templates = Array.isArray(res.message) ? res.message : []; }
    });
  }

  openCreateModal(): void { this.initForm(); this.isCreateModalOpen = true; }
  closeCreateModal(): void { this.isCreateModalOpen = false; this.saving = false; }

  submitCreate(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.saving = true;
    const v = this.createForm.value;
    const request: CreateMenuPublicationRequest = {
      date: v.date, timeSlot: v.timeSlot,
      basePrice: v.basePrice, totalPortions: v.totalPortions,
      templateId: v.templateId || undefined
    };
    this.publicationService.create(request).subscribe({
      next: (res) => {
        if (!res.error) {
          this.notificationService.showSuccess('Publicación creada en borrador');
          this.closeCreateModal();
          this.currentPage = 0;
          this.loadPublications();
        } else { this.notificationService.showError(res.message as string); this.saving = false; }
      },
      error: () => { this.notificationService.showError('Error al crear'); this.saving = false; }
    });
  }

  goToDetail(id: string): void { this.router.navigate([id], { relativeTo: this.route }); }
  goToTemplates(): void { this.router.navigate(['../menu-templates'], { relativeTo: this.route }); }

  nextPage(): void { this.currentPage++; this.loadPublications(); }
  previousPage(): void { if (this.currentPage > 0) { this.currentPage--; this.loadPublications(); } }

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

  getTimeSlotIcon(slot: MenuTimeSlot): string {
    return { LUNCH: 'wb_sunny', DINNER: 'nights_stay', ALL_DAY: 'schedule' }[slot];
  }

  portionsPercent(pub: MenuPublicationSummaryDTO): number {
    return pub.totalPortions ? Math.round((pub.availablePortions / pub.totalPortions) * 100) : 0;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }
}
