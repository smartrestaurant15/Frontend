import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from '@core/services/http-client.service';
import { AuditLogResponse } from '../models/audit-log.model';
import { AuditEventType } from '../models/audit-event-type.enum';

// Interfaz para respuestas paginadas de Spring
export interface PageResponse<T> {
  content: T[];
  pageable: any;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  constructor(private http: HttpClientService) {}

  // Obtener todos los logs con paginación
  getAllLogs(page: number = 0, size: number = 20): Observable<PageResponse<AuditLogResponse>> {
    return this.http.get<PageResponse<AuditLogResponse>>(`/admin/audit-logs?page=${page}&size=${size}`);
  }

  // Logs por usuario
  getLogsByUser(userId: number, page: number = 0, size: number = 20): Observable<PageResponse<AuditLogResponse>> {
    return this.http.get<PageResponse<AuditLogResponse>>(`/admin/audit-logs/by-user?userId=${userId}&page=${page}&size=${size}`);
  }

  // Logs por tipo de evento
  getLogsByEventType(eventType: AuditEventType, page: number = 0, size: number = 20): Observable<PageResponse<AuditLogResponse>> {
    return this.http.get<PageResponse<AuditLogResponse>>(`/admin/audit-logs/by-event-type?eventType=${eventType}&page=${page}&size=${size}`);
  }

  // Logs por rango de fechas
  getLogsByDateRange(startDate: string, endDate: string, page: number = 0, size: number = 20): Observable<PageResponse<AuditLogResponse>> {
    const start = `${startDate}T00:00:00`;
    const end   = `${endDate}T23:59:59`;
    return this.http.get<PageResponse<AuditLogResponse>>(`/admin/audit-logs/by-date-range?startDate=${start}&endDate=${end}&page=${page}&size=${size}`);
  }

  // Logs fallidos
  getFailedLogs(page: number = 0, size: number = 20): Observable<PageResponse<AuditLogResponse>> {
    return this.http.get<PageResponse<AuditLogResponse>>(`/admin/audit-logs/failed?page=${page}&size=${size}`);
  }

  // Logs críticos
  getCriticalLogs(page: number = 0, size: number = 20): Observable<PageResponse<AuditLogResponse>> {
    return this.http.get<PageResponse<AuditLogResponse>>(`/admin/audit-logs/critical?page=${page}&size=${size}`);
  }

  // Últimos logs de usuario
  getRecentLogsByUser(userId: number): Observable<AuditLogResponse[]> {
    return this.http.get<AuditLogResponse[]>(`/admin/audit-logs/recent-by-user?userId=${userId}`);
  }

  // Logs por IP
  getLogsByIp(ipAddress: string, page: number = 0, size: number = 20): Observable<PageResponse<AuditLogResponse>> {
    return this.http.get<PageResponse<AuditLogResponse>>(`/admin/audit-logs/by-ip?ipAddress=${ipAddress}&page=${page}&size=${size}`);
  }
}
