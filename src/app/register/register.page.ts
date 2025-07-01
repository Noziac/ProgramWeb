import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { DbService } from '../services/db.service';
import { Usuario } from '../models/usuario';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {

  formData = {
    username: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '', 
    rango: '' 
  };

  rango: string[] = ['Hierro', 'Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Ascendente', 'Inmortal', 'Radiante'];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private dbService: DbService
  ) { }

  ngOnInit() {
    console.log('RegisterPage: ngOnInit cargada.');
    // Asegurarse de que la DB esté lista antes de cualquier operación
    this.dbService.dbState().subscribe().unsubscribe();
  }

  async register() {
    // Validaciones básicas
    if (!this.formData.username || !this.formData.password || !this.formData.confirmPassword ||
        !this.formData.nombre || !this.formData.apellido || !this.formData.fechaNacimiento) {
      await this.presentAlert('Campos Incompletos', 'Por favor, rellena todos los campos para crear tu cuenta.');
      return;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      await this.presentAlert('Error de Contraseña', 'Las contraseñas no coinciden.');
      return;
    }

    // Convertir la contraseña a número
    const passwordNum = parseInt(this.formData.password, 10);
    if (isNaN(passwordNum)) {
      await this.presentAlert('Error de Contraseña', 'La contraseña debe ser un número válido.');
      return;
    }

    console.log(`RegisterPage: Intentando registrar usuario: ${this.formData.username}`);

    const success = await this.dbService.register(
      this.formData.username,
      passwordNum,
      this.formData.nombre,
      this.formData.apellido,
      this.formData.fechaNacimiento,
    );

    if (success) {
      await this.presentAlert('Registro Exitoso', '¡Tu cuenta ha sido creada y has iniciado sesión!');
      // Redirigir a home o profile después del registro exitoso
      this.router.navigateByUrl('/home', { replaceUrl: true });
      console.log('RegisterPage: Registro exitoso, redirigiendo a /home.');
    } else {
      console.log('RegisterPage: Registro fallido (usuario ya existe o error interno).');
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}