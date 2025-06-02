import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {

  // Objeto para almacenar los datos de usuario y contraseña desde el formulario
  datos = {
    user: '',    // Vinculado a [(ngModel)]="datos.user"
    pwd: ''      // Vinculado a [(ngModel)]="datos.pwd"
  };

  constructor(
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    // Opcional: limpiar los campos al cargar la página de login
    this.datos = { user: '', pwd: '' };
  }

  // Método que se ejecuta al hacer clic en el botón "Ingresar"
  async login() {
    // --- VALIDACIONES DE REQUERIMIENTOS ---
    // Usuario: alfanumérico, 3 a 8 caracteres
    const usernameRegex = /^[a-zA-Z0-9]{3,8}$/;
    // Contraseña: numérica, 4 dígitos
    const passwordRegex = /^[0-9]{4}$/;

    if (!usernameRegex.test(this.datos.user)) {
      await this.presentAlert('Error de Usuario', 'El usuario debe ser alfanumérico y tener entre 3 y 8 caracteres.');
      return; // Detiene la ejecución si la validación falla
    }

    if (!passwordRegex.test(this.datos.pwd)) {
      await this.presentAlert('Error de Contraseña', 'La contraseña debe ser numérica y de 4 dígitos.');
      return; // Detiene la ejecución si la validación falla
    }

    // Si las validaciones pasan, preparamos los datos para enviar a la página Home
    let navigationExtras: NavigationExtras = {
      state: {
        loggedInUser: this.datos.user // Enviamos solo el nombre de usuario
      }
    };

    // Navegar a la página Home. El `router.navigate` por defecto "cierra" la página actual.
    this.router.navigate(['/home'], navigationExtras);
  }

  // Función de utilidad para mostrar alertas al usuario
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
