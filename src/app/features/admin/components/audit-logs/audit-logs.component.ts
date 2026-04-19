import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuditService, PageResponse } from '../../services/audit.service';
import { AuditLogResponse } from '../../models/audit-log.model';
import { AuditEventType } from '../../models/audit-event-type.enum';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLogResponse[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  
  viewType: 'all' | 'failed' | 'critical' | 'byEventType' | 'byDateRange' = 'all';
  selectedEventType: AuditEventType | null = null;
  startDate: string = '';
  endDate: string = '';

  eventTypes = [
    { value: AuditEventType.LOGIN_SUCCESS, label: 'Login Exitoso' },
    { value: AuditEventType.LOGIN_FAILED, label: 'Login Fallido' },
    { value: AuditEventType.LOGOUT, label: 'Logout' },
    { value: AuditEventType.USER_REGISTERED, label: 'Usuario Registrado' },
    { value: AuditEventType.EMPLOYEE_REGISTERED, label: 'Empleado Registrado' },
    { value: AuditEventType.EMAIL_VERIFIED, label: 'Email Verificado' },
    { value: AuditEventType.TWO_FA_SUCCESS, label: '2FA Exitoso' },
    { value: AuditEventType.TWO_FA_FAILED, label: '2FA Fallido' },
    { value: AuditEventType.PASSWORD_CHANGED, label: 'Contraseña Cambiada' },
    { value: AuditEventType.PASSWORD_RESET_REQUESTED, label: 'Recuperación Solicitada' },
    { value: AuditEventType.PASSWORD_RESET_COMPLETED, label: 'Recuperación Completada' },
    { value: AuditEventType.ACCOUNT_LOCKED, label: 'Cuenta Bloqueada' },
    { value: AuditEventType.ACCOUNT_UNLOCKED, label: 'Cuenta Desbloqueada' },
    { value: AuditEventType.USER_UPDATED, label: 'Usuario Actualizado' },
    { value: AuditEventType.TOKEN_REFRESHED, label: 'Token Renovado' },
    { value: AuditEventType.TOKEN_INVALIDATED, label: 'Token Invalidado' }
  ];

  constructor(
    private auditService: AuditService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;

    let request;
    switch (this.viewType) {
      case 'failed':
        request = this.auditService.getFailedLogs(this.currentPage, this.pageSize);
        break;
      case 'critical':
        request = this.auditService.getCriticalLogs(this.currentPage, this.pageSize);
        break;
      case 'byEventType':
        if (this.selectedEventType) {
          request = this.auditService.getLogsByEventType(this.selectedEventType, this.currentPage, this.pageSize);
        } else {
          this.loading = false;
          return;
        }
        break;
      case 'byDateRange':
        if (this.startDate && this.endDate) {
          request = this.auditService.getLogsByDateRange(this.startDate, this.endDate, this.currentPage, this.pageSize);
        } else {
          this.loading = false;
          this.notificationService.showError('Debe seleccionar ambas fechas');
          return;
        }
        break;
      default:
        request = this.auditService.getAllLogs(this.currentPage, this.pageSize);
    }

    request.subscribe({
      next: (pageResponse: PageResponse<AuditLogResponse>) => {
        console.log('✅ Logs cargados:', pageResponse);
        // PageResponse de Spring tiene la estructura: { content: [], totalPages, totalElements, ... }
        this.logs = pageResponse.content;
        this.totalPages = pageResponse.totalPages;
        this.totalElements = pageResponse.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar logs:', err);
        this.loading = false;
        // El error ya es manejado por el interceptor
      }
    });
  }

  onViewTypeChange(): void {
    this.currentPage = 0;
    this.selectedEventType = null;
    this.startDate = '';
    this.endDate = '';
    this.loadLogs();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadLogs();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadLogs();
    }
  }

  hasNextPage(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 0;
  }

  getEventBadgeClass(eventType: AuditEventType): string {
    const successEvents = [
      AuditEventType.LOGIN_SUCCESS,
      AuditEventType.TWO_FA_SUCCESS,
      AuditEventType.EMAIL_VERIFIED,
      AuditEventType.PASSWORD_CHANGED,
      AuditEventType.ACCOUNT_UNLOCKED
    ];

    const failedEvents = [
      AuditEventType.LOGIN_FAILED,
      AuditEventType.TWO_FA_FAILED,
      AuditEventType.ACCOUNT_LOCKED
    ];

    if (successEvents.includes(eventType)) {
      return 'badge-success';
    } else if (failedEvents.includes(eventType)) {
      return 'badge-danger';
    } else {
      return 'badge-info';
    }
  }

  navigateToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  get failedCount(): number {
    return this.logs.filter(l => !l.success).length;
  }

  get criticalCount(): number {
    return this.logs.filter(l => l.critical).length;
  }
}
