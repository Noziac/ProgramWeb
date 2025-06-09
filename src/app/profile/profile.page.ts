import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
  animations: [
    // Animación de movimiento de izquierda a derecha para inputs (shake)
    trigger('shakeInput', [
      state('inactive', style({ transform: 'translateX(0)' })), // Estado normal
      state('active', style({ transform: 'translateX(0)' })),   // Estado activo, se reseteará aquí
      transition('inactive => active', [
        animate('0.4s ease-in-out', style({ transform: 'translateX(5px)' })),
        animate('0.4s ease-in-out', style({ transform: 'translateX(-5px)' })),
        animate('0.2s ease-in-out', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})

export class ProfilePage implements OnInit {

  loggedInUser: string | null = null;

  formData = {
    nombre: '',
    apellido: '',
    rango: '',
    fechaNacimiento: ''
  };

  rango: string[] = ['Hierro', 'Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Ascendente', 'Inmortal', 'Radiante'];

  nombreShakeState: string = 'inactive';
  apellidoShakeState: string = 'inactive';

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.loggedInUser = localStorage.getItem('loggedInUser');
  }

  clearFields() {
    this.formData = {
      nombre: '',
      apellido: '',
      rango: '',
      fechaNacimiento: ''
    };

    this.nombreShakeState = 'active';
    this.apellidoShakeState = 'active';

    setTimeout(() => {
      this.nombreShakeState = 'inactive';
      this.apellidoShakeState = 'inactive';
    }, 1000);
  }

  async showInfo() {
    if (!this.formData.nombre && !this.formData.apellido) {
      await this.presentAlert('Información Incompleta', 'Por favor, ingresa al menos el Nombre o el Apellido.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Usuario',
      message: ` Su nombre es ${this.formData.nombre} ${this.formData.apellido}
      `,
      buttons: ['OK']
    });
    await alert.present();
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  // metodo para simular un logout
  logout() {
    localStorage.removeItem('loggedInUser'); // Eliminar el usuario de localStorage
    this.loggedInUser = null;
    this.router.navigateByUrl('/login'); // Redirigir al login
  }
}