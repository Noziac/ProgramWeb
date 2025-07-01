import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { DbService } from './services/db.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private dbService: DbService, // Inyecta DbService directamente
    private router: Router
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      console.log('AppComponent: Plataforma lista. Inicializando DbService.');

      // Suscribirse al estado de la DB.
      // Una vez que la DB esté lista, se puede hacer una verificación inicial de sesión.
      this.dbService.dbState().subscribe(async (isReady) => {
        if (isReady) {
          console.log('AppComponent: DbService listo para operar.');
          const isAuthenticated = await this.dbService.checkActiveSession();
          if (!isAuthenticated && this.router.url !== '/login' && this.router.url !== '/register') {
            console.log('AppComponent: No autenticado al inicio. Redirigiendo a /login.');
            this.router.navigateByUrl('/login', { replaceUrl: true });
          } else if (isAuthenticated && (this.router.url === '/login' || this.router.url === '/register' || this.router.url === '/')) {
            console.log('AppComponent: Autenticado al inicio y en página de auth. Redirigiendo a /home.');
            this.router.navigateByUrl('/home', { replaceUrl: true });
          }
        }
      });
    });
  }
}