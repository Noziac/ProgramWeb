import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, Platform, ToastController } from '@ionic/angular'; 
import { DbService } from '../services/db.service';
import { Usuario } from '../models/usuario';

// Importaciones de Capacitor para Cámara y Geolocalización
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
  animations: [
    trigger('shakeInput', [
      state('inactive', style({ transform: 'translateX(0)' })),
      state('active', style({ transform: 'translateX(0)' })),
      transition('inactive => active', [
        animate('0.4s ease-in-out', style({ transform: 'translateX(5px)' })),
        animate('0.4s ease-in-out', style({ transform: 'translateX(-5px)' })),
        animate('0.2s ease-in-out', style({ transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class ProfilePage implements OnInit {

  currentUserData: Usuario | null = null; // Almacenará todos los datos del usuario logueado

  // Variables para la foto de perfil y geolocalización
  profileImage: string = 'assets/icon/user-placeholder.png';
  currentLocation: { lat: number, lng: number } | null = null;
  locationAddress: string | null = null;
  isLocationLoading: boolean = false;

  // formData para edición temporal, se mapeará a currentUserData
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
    private alertController: AlertController,
    private dbService: DbService,
    private platform: Platform, // Inyectar Platform
    private toastController: ToastController // Inyectar ToastController
  ) { }

  async ngOnInit() {
    console.log('ProfilePage: ngOnInit cargando datos de perfil.');
    await this.dbService.dbState().subscribe().unsubscribe(); // Asegura que la DB esté lista

    const username = await this.dbService.getCurrentUser();
    if (username) {
      this.currentUserData = await this.dbService.getUserData(username);
      if (this.currentUserData) {
        // Mapear los datos de la DB a formData para mostrarlos en los inputs
        this.formData.nombre = this.currentUserData.nombre || '';
        this.formData.apellido = this.currentUserData.apellido || '';
        this.formData.rango = this.currentUserData.rango || '';
        this.formData.fechaNacimiento = this.currentUserData.fecha_nacimiento || '';
        console.log('ProfilePage: Datos de perfil cargados:', this.currentUserData);

        // Obtener la ubicación al cargar la página
        this.getGeolocation();

      } else {
        console.log('ProfilePage: No se encontraron datos de perfil para el usuario logueado.');
      }
    } else {
      console.log('ProfilePage: No hay usuario logueado.');
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }

  // Cargar datos del usuario desde la DB y actualizarlos en el formulario
  async loadUserProfile() {
    const username = await this.dbService.getCurrentUser();
    if (username) {
      this.currentUserData = await this.dbService.getUserData(username);
      if (this.currentUserData) {
        this.formData.nombre = this.currentUserData.nombre || '';
        this.formData.apellido = this.currentUserData.apellido || '';
        this.formData.rango = this.currentUserData.rango || '';
        this.formData.fechaNacimiento = this.currentUserData.fecha_nacimiento || '';
      }
    }
  }

  async saveChanges() {
    if (!this.currentUserData) {
      await this.presentAlert('Error', 'No hay usuario logueado para guardar los cambios.');
      return;
    }

    // Validaciones básicas antes de guardar
    if (!this.formData.nombre || !this.formData.apellido || !this.formData.rango || !this.formData.fechaNacimiento) {
      await this.presentAlert('Información Incompleta', 'Por favor, completa todos los campos.');
      if (!this.formData.nombre) this.triggerShake('nombre');
      if (!this.formData.apellido) this.triggerShake('apellido');
      return;
    }

    // Actualizar el objeto currentUserData con los datos del formulario
    this.currentUserData.nombre = this.formData.nombre;
    this.currentUserData.apellido = this.formData.apellido;
    this.currentUserData.rango = this.formData.rango;
    this.currentUserData.fecha_nacimiento = this.formData.fechaNacimiento;

    try {
      await this.dbService.updateUserData(this.currentUserData);
      await this.presentAlert('Éxito', '¡Perfil actualizado con éxito!');
      console.log('ProfilePage: Perfil actualizado y guardado en DB.');
    } catch (error: any) {
      console.error('ProfilePage: Error al guardar cambios:', error);
      await this.presentAlert('Error', 'Hubo un problema al actualizar el perfil.');
    }
  }

  // Método para disparar la animación de shake en un input específico
  triggerShake(field: 'nombre' | 'apellido') {
    if (field === 'nombre') {
      this.nombreShakeState = 'active';
      setTimeout(() => this.nombreShakeState = 'inactive', 1000); // Reset después de la animación
    } else if (field === 'apellido') {
      this.apellidoShakeState = 'active';
      setTimeout(() => this.apellidoShakeState = 'inactive', 1000);
    }
  }

  // --- Métodos para la Cámara ---
  async selectImage() {
    if (!this.platform.is('hybrid')) {
        console.warn('La cámara solo funciona en dispositivos iOS/Android o web con permisos.');
        return;
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl, // DataUrl es un string Base64, fácil de mostrar
        source: CameraSource.Prompt // Permite al usuario elegir entre cámara o galería
      });

      if (image.dataUrl) {
        this.profileImage = image.dataUrl;
        this.presentToast('Foto de perfil actualizada!');
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      // alert(JSON.stringify(error)); // Para depuración
      this.presentAlert('Error de Cámara', 'No se pudo seleccionar la imagen. Asegúrate de haber dado los permisos necesarios.');
    }
  }

  // --- Métodos para Geolocalización ---
  async getGeolocation() {
    this.isLocationLoading = true;
    try {
      // Solicitar permisos de ubicación antes de intentar obtener la posición
      const permissionStatus = await Geolocation.requestPermissions();

      if (permissionStatus.location === 'granted') {
        const position = await Geolocation.getCurrentPosition();
        this.currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('Ubicación obtenida:', this.currentLocation);
      } else {
        this.presentAlert('Permiso de ubicación denegado', 'No podemos obtener tu ubicación sin permiso.');
      }
    } catch (error: any) {
      console.error('Error al obtener la ubicación:', error);
      if (error.message.includes("User denied geolocation permission")) {
        this.presentAlert('Ubicación', 'Permiso de ubicación denegado por el usuario.');
      } else if (error.message.includes("Location services not enabled")) {
        this.presentAlert('Ubicación', 'Los servicios de ubicación no están activados en tu dispositivo. Por favor, actívalos.');
      } else {
        this.presentAlert('Error de Ubicación', 'No se pudo obtener la ubicación: ' + error.message);
      }
    } finally {
      this.isLocationLoading = false;
    }
  }

  async showInfo() {
    if (!this.currentUserData) {
      await this.presentAlert('Error', 'No hay datos de usuario para mostrar.');
      return;
    }
    let message = `
      <p><strong>Usuario:</strong> ${this.currentUserData.user_name}</p>
      <p><strong>Nombre:</strong> ${this.currentUserData.nombre || 'No especificado'}</p>
      <p><strong>Apellido:</strong> ${this.currentUserData.apellido || 'No especificado'}</p>
      <p><strong>Rango:</strong> ${this.currentUserData.rango || 'No especificado'}</p>
      <p><strong>Fecha Nacimiento:</strong> ${this.currentUserData.fecha_nacimiento || 'No especificado'}</p>
    `;

    if (this.currentLocation) {
        message += `<p><strong>Ubicación:</strong> Lat: ${this.currentLocation.lat.toFixed(4)}, Lng: ${this.currentLocation.lng.toFixed(4)}</p>`;
        if (this.locationAddress) {
            message += `<p><strong>Dirección:</strong> ${this.locationAddress}</p>`;
        }
    } else if (this.isLocationLoading) {
        message += `<p><strong>Ubicación:</strong> Obteniendo...</p>`;
    } else {
        message += `<p><strong>Ubicación:</strong> No disponible</p>`;
    }

    const alert = await this.alertController.create({
      header: 'Información del Usuario',
      message: message,
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

  async presentToast(message: string) {
    const toast = await this.toastController.create({
        message: message,
        duration: 2000,
        position: 'bottom'
    });
    await toast.present();
  }

  async logout() {
    console.log('ProfilePage: Iniciando proceso de logout.');
    await this.dbService.logout(); // Llama a la función de logout en DbService
    this.router.navigateByUrl('/login', { replaceUrl: true }); // Redirige al login
    console.log('ProfilePage: Redirigido a /login después del logout.');
  }
}