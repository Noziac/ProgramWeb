import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DbService } from '../services/db.service'; 
import { AlertController, LoadingController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs'; 
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  username: string = '';
  password: string = '';

  isLoading: boolean = false;

  constructor(private router: Router, private dbService: DbService, private alertController: AlertController, private loadingController: LoadingController) {}

  async ngOnInit() {
    console.log('LoginPage: ngOnInit.');

    // Esperar a que la base de datos esté lista
    console.log('LoginPage: Esperando a que DbService esté listo...');
    // Usamos firstValueFrom para esperar a que isDbReady emita true la primera vez
    await firstValueFrom(this.dbService.dbState().pipe(
      // Filtrar hasta que isDbReady sea true
      // Si ya es true cuando se suscribe, emitirá inmediatamente.
      filter(isReady => isReady)
    ));
    console.log('LoginPage: DbService está listo. Verificando sesión activa.');

    const isAuthenticated = await this.dbService.checkActiveSession();
    if (isAuthenticated) {
      const currentUser = await this.dbService.getCurrentUser();
      console.log(`LoginPage: Sesión activa detectada al cargar. Redirigiendo a /home. Usuario: ${currentUser}`);
      this.router.navigateByUrl('/home', { replaceUrl: true, state: { loggedInUser: currentUser } });
    } else {
      console.log('LoginPage: No hay sesión activa al cargar.');
    }
  }

  async login() {
    console.log(`LoginPage: Intentando login para ${this.username}.`);

    // 1. Muestra la pantalla de carga (LoadingController)
    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...', // Mensaje a mostrar al usuario
      spinner: 'crescent' // Más tipos de spinner: 'crescent', 'dots', 'bubbles', 'circles', 'lines'
    });
    await loading.present();

    try {
      // 2. Intenta hacer login a través de tu DbService
      const success = await this.dbService.login(this.username, this.password);

      if (success) {
        // 3. Si el login es exitoso
        const currentUser = await this.dbService.getCurrentUser();
        console.log('LoginPage: Login exitoso. Redirigiendo a /home.');
        // Ocultar el loading ANTES de la redirección,
        await loading.dismiss();
        this.router.navigateByUrl('/home', { replaceUrl: true, state: { loggedInUser: currentUser } });
      } else {
        // 4. Si el login falla
        await loading.dismiss(); // Oculta el loading si las credenciales son incorrectas
        this.presentAlert('Error de Login', 'Usuario o contraseña incorrectos.');
        console.log('LoginPage: Login fallido.');
      }
    } catch (error) {
      // 5. Manejo de cualquier error inesperado durante el proceso de login
      await loading.dismiss(); // Oculta el loading si hay un error en la promesa
      console.error('Error durante el login:', error);
      this.presentAlert('Error', 'Ha ocurrido un error inesperado al intentar iniciar sesión.');
    }
  }

  goToRegister() {
    this.router.navigateByUrl('/register');
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}