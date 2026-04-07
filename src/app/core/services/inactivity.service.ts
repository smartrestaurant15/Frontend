import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, merge, Observable, Subscription, timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class InactivityService {
    private inactivityTimer$: Observable<any>;
    private eventSubscription: Subscription | null = null;
    private readonly INACTIVITY_TIME = 2 * 60 * 1000; // 2 minutos en milisegundos

    constructor(
        private authService: AuthService,
        private router: Router,
        private ngZone: NgZone
    ) {
        // Configurar el observable que reinicia el temporizador con cada evento
        this.inactivityTimer$ = merge(
            fromEvent(document, 'mousemove'),
            fromEvent(document, 'mousedown'),
            fromEvent(document, 'keypress'),
            fromEvent(document, 'wheel'),
            fromEvent(document, 'touchstart')
        ).pipe(
            switchMap(() => timer(this.INACTIVITY_TIME))
        );
    }

    /**
     * Inicia el monitoreo de actividad
     */
    startMonitoring(): void {
        this.stopMonitoring();

        // Ejecutamos fuera de Angular Zone para evitar ciclos de deteccion de cambios innecesarios
        this.ngZone.runOutsideAngular(() => {
            this.eventSubscription = this.inactivityTimer$.subscribe(() => {
                this.ngZone.run(() => {
                    this.handleTimeout();
                });
            });
        });
    }

    /**
     * Detiene el monitoreo
     */
    stopMonitoring(): void {
        if (this.eventSubscription) {
            this.eventSubscription.unsubscribe();
            this.eventSubscription = null;
        }
    }

    /**
     * Maneja la expiracion del tiempo
     */
    private handleTimeout(): void {
        if (this.authService.isAuthenticated()) {
            console.log('Sesion expirada por inactividad');
            this.authService.logout().subscribe({
                next: () => {
                    this.router.navigate(['/auth/login'], {
                        queryParams: { reason: 'inactivity' }
                    });
                },
                error: () => {
                    // Si falla la peticion, igual redirigimos
                    this.router.navigate(['/auth/login']);
                }
            });
        }
    }
}
