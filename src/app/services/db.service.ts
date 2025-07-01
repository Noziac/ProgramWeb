import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Platform, ToastController } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { Storage } from '@ionic/storage-angular';

import { Usuario } from '../models/usuario'; 

@Injectable({
  providedIn: 'root'
})
export class DbService {

  public database!: SQLiteObject; 
  private isDbReady: BehaviorSubject<boolean> = new BehaviorSubject(false); 
  private _storage: Storage | null = null; 

  listaUsuarios = new BehaviorSubject<Usuario[]>([]);

  // --- Sentencia SQL para la tabla de Usuarios ---
  tablaUsuarios: string = `
    CREATE TABLE IF NOT EXISTS sesion_data (
      user_name TEXT PRIMARY KEY NOT NULL,
      password TEXT NOT NULL, -- [IMPORTANTE]: Asegúrate de que sea TEXT para el hash
      active INTEGER NOT NULL,
      nombre TEXT,
      apellido TEXT,
      fecha_nacimiento TEXT,
      rango TEXT,
      profile_image_base64 TEXT, -- Campo para la imagen
      last_latitude REAL,        -- Campo para la latitud
      last_longitude REAL        -- Campo para la longitud
    );
  `;

  tablaAgentes: string = `
    CREATE TABLE IF NOT EXISTS agentes (
      uuid TEXT PRIMARY KEY NOT NULL,
      displayName TEXT,
      description TEXT,
      displayIcon TEXT, -- URL de la imagen del agente
      fullPortrait TEXT, -- URL del retrato completo
      // Puedes añadir más campos según la estructura de tu API de agentes
      abilities TEXT -- Para guardar un JSON stringificado de las habilidades si las necesitas
    );
  `;

  tablaMapas: string = `
    CREATE TABLE IF NOT EXISTS mapas (
      uuid TEXT PRIMARY KEY NOT NULL,
      displayName TEXT,
      splash TEXT, -- URL de la imagen del mapa
      coordinates TEXT, -- Ej: "2200, 3200" o JSON stringificado de coordenadas
      // Puedes añadir más campos según la estructura de tu API de mapas
      assetPath TEXT
    );
  `;


  // Datos iniciales para la tabla de usuarios
  initialUser: Usuario = {
    user_name: 'Test', 
    password: 1234,
    active: 0,
    nombre: 'Usuario',
    apellido: 'Demo',
    fecha_nacimiento: '2000-01-01',
    rango: 'Radiante'
  };

  constructor(private sqlite: SQLite, private platform: Platform, private toastController: ToastController, private storage: Storage) {
    console.log('DbService: Constructor llamado. Iniciando DB y Storage.');
    this.initDatabaseAndStorage();
  }

  // --- Métodos de Inicialización ---
  async initDatabaseAndStorage() {
    // Inicializar Ionic Storage
    this._storage = await this.storage.create();
    console.log('DbService: Ionic Storage inicializado.');

    // Inicializar SQLite
    this.platform.ready().then(() => {
      this.sqlite.create({
        name: 'app_data.db',
        location: 'default'
      }).then((db: SQLiteObject) => {
        this.database = db;
        this.presentToast("Base de datos creada/abierta.");
        this.createTables();
      }).catch(e => {
        console.error("DbService: Error al crear/abrir DB: ", e);
        this.presentToast("Error al crear/abrir DB: " + e.message);
      });
    }).catch(e => {
      console.error("DbService: Error de plataforma: ", e);
      this.presentToast("Error de plataforma: " + e.message);
    });
  }

  // Crear todas las tablas necesarias
  async createTables() {
    try {
      await this.database.executeSql(this.tablaUsuarios, []);
      await this.database.executeSql(this.tablaAgentes, []);
      await this.database.executeSql(this.tablaMapas, []); 
      this.presentToast("Tabla de usuarios creada.");
      await this.insertInitialData();
      this.isDbReady.next(true); // La DB está lista
      console.log('DbService: Tablas creadas y DB lista (isDbReady=true).');
    } catch (e: any) {
      console.error("DbService: Error al crear tablas: ", e);
      this.presentToast("Error al crear tablas: " + e.message);
    }
  }

  // Insertar usuario por defecto si no existe
  async insertInitialData() {
    try {
      const userCheck = await this.database.executeSql('SELECT * FROM sesion_data WHERE user_name = ?', [this.initialUser.user_name]);
      if (userCheck.rows.length === 0) {
        await this.database.executeSql(`
          INSERT INTO sesion_data (user_name, password, active, nombre, apellido, fecha_nacimiento, rango)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          this.initialUser.user_name,
          this.initialUser.password,
          this.initialUser.active,
          this.initialUser.nombre,
          this.initialUser.apellido,
          this.initialUser.fecha_nacimiento,
          this.initialUser.rango
        ]);
        this.presentToast(`Usuario inicial '${this.initialUser.user_name}' insertado.`);
        console.log(`DbService: Usuario inicial '${this.initialUser.user_name}' insertado.`);
      } else {
        console.log(`DbService: Usuario inicial '${this.initialUser.user_name}' ya existe.`);
        const existingUser = userCheck.rows.item(0);
        if (!existingUser.nombre || !existingUser.apellido || !existingUser.fecha_nacimiento || !existingUser.rango) {
            await this.database.executeSql(`
                UPDATE sesion_data SET nombre = ?, apellido = ?, fecha_nacimiento = ?, rango = ?
                WHERE user_name = ?
            `, [
                this.initialUser.nombre,
                this.initialUser.apellido,
                this.initialUser.fecha_nacimiento,
                this.initialUser.rango,
                this.initialUser.user_name
            ]);
            console.log("DbService: Datos de perfil del usuario inicial actualizados.");
        }
      }
    } catch (e: any) {
      console.error("DbService: Error al insertar/actualizar datos iniciales: ", e);
      this.presentToast("Error al insertar/actualizar datos iniciales: " + e.message);
    }
  }

  // --- Métodos para el estado de la DB y Observables ---
  dbState(): Observable<boolean> {
    return this.isDbReady.asObservable();
  }

  // --- Métodos de Sesión y Usuario ---

  // Método para validar credenciales y iniciar sesión
  async login(user_name: string, password: string): Promise<boolean> {
    console.log(`DbService: Intentando login para ${user_name}.`);
    try {
      const result = await this.database.executeSql('SELECT * FROM sesion_data WHERE user_name = ? AND password = ?', [user_name, password]);
      if (result.rows.length > 0) {
        // Usuario y contraseña correctos. Actualizar estado a activo.
        await this.updateUserActiveStatus(user_name, 1);
        await this._storage?.set('isLoggedIn', true);
        await this._storage?.set('currentUser', user_name);
        this.presentToast(`Bienvenido, ${user_name}!`);
        console.log(`DbService: Login exitoso para ${user_name}.`);
        return true;
      } else {
        this.presentToast("Usuario o contraseña incorrectos.");
        console.log('DbService: Credenciales incorrectas.');
        return false;
      }
    } catch (e: any) {
      console.error("DbService: Error al iniciar sesión: ", e);
      this.presentToast("Error al iniciar sesión: " + e.message);
      return false;
    }
  }

  // Método para registrar un nuevo usuario
  async register(user_name: string, password: number, nombre?: string, apellido?: string, fecha_nacimiento?: string,): Promise<boolean> {
    console.log(`DbService: Intentando registrar usuario ${user_name}.`);
    try {
      const userCheck = await this.database.executeSql('SELECT * FROM sesion_data WHERE user_name = ?', [user_name]);
      if (userCheck.rows.length > 0) {
        this.presentToast("El nombre de usuario ya existe.");
        console.log(`DbService: El nombre de usuario '${user_name}' ya existe.`);
        return false;
      } else {
        await this.database.executeSql(`
          INSERT INTO sesion_data (user_name, password, active, nombre, apellido, fecha_nacimiento)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          user_name,
          password,
          1,
          nombre || null,
          apellido || null,
          fecha_nacimiento || null,
        ]);
        await this._storage?.set('isLoggedIn', true);
        await this._storage?.set('currentUser', user_name);
        this.presentToast(`Usuario ${user_name} registrado y logueado.`);
        console.log(`DbService: Usuario '${user_name}' registrado y logueado.`);
        return true;
      }
    } catch (e: any) {
      console.error("DbService: Error al registrar usuario: ", e);
      this.presentToast("Error al registrar usuario: " + e.message);
      return false;
    }
  }

  // Verifica si hay una sesión activa tanto en Storage como en la DB
  async checkActiveSession(): Promise<boolean> {
    console.log('DbService: Verificando sesión activa.');
    try {
      // Primero revisa Ionic Storage
      const loggedIn = await this._storage?.get('isLoggedIn');
      const user_name = await this._storage?.get('currentUser');

      if (loggedIn && user_name) {
        // Luego revisa el estado 'active' en la base de datos
        const result = await this.database.executeSql('SELECT active FROM sesion_data WHERE user_name = ?', [user_name]);
        if (result.rows.length > 0 && result.rows.item(0).active === 1) {
          console.log(`DbService: Sesión activa confirmada para '${user_name}'.`);
          return true;
        } else {
          console.log(`DbService: Sesión en DB inactiva para '${user_name}'. Limpiando Storage.`);
          // Si la DB dice inactivo, limpia Storage también
          await this._storage?.remove('isLoggedIn');
          await this._storage?.remove('currentUser');
          return false;
        }
      }
      console.log('DbService: No hay sesión activa en Storage.');
      return false;
    } catch (e: any) {
      console.error("DbService: Error al verificar sesión activa: ", e);
      return false;
    }
  }

  // Actualiza el estado 'active' de un usuario en la DB y el Storage
  async updateUserActiveStatus(user_name: string, active: number) {
    console.log(`DbService: Actualizando estado activo para ${user_name} a ${active}.`);
    try {
      await this.database.executeSql('UPDATE sesion_data SET active = ? WHERE user_name = ?', [active, user_name]);
      if (active === 0) {
        // Si se desactiva, también limpia Storage
        await this._storage?.remove('isLoggedIn');
        await this._storage?.remove('currentUser');
        console.log('DbService: Storage limpiado al desactivar sesión.');
      } else {
        // Si se activa, asegura que Storage esté seteado
        await this._storage?.set('isLoggedIn', true);
        await this._storage?.set('currentUser', user_name);
        console.log('DbService: Storage actualizado al activar sesión.');
      }
    } catch (e: any) {
      console.error("DbService: Error al actualizar estado de sesión: ", e);
      this.presentToast("Error al actualizar estado de sesión: " + e.message);
    }
  }

  // Método para cerrar sesión
  async logout() {
    console.log('DbService: Iniciando logout.');
    try {
      const currentUser = await this._storage?.get('currentUser');
      if (currentUser) {
        await this.updateUserActiveStatus(currentUser, 0); // Desactivar en DB y limpiar Storage
        this.presentToast("Sesión cerrada.");
        console.log('DbService: Sesión cerrada exitosamente.');
      } else {
        this.presentToast("No hay sesión activa para cerrar.");
        console.log('DbService: No se encontró currentUser en Storage para logout.');
      }
    } catch (e: any) {
      console.error("DbService: Error al cerrar sesión: ", e);
      this.presentToast("Error al cerrar sesión: " + e.message);
    }
  }

  // Obtiene el nombre de usuario actual del Storage
  async getCurrentUser(): Promise<string | null> {
    return await this._storage?.get('currentUser');
  }

  // Obtiene todos los datos de un usuario por su nombre de usuario
  async getUserData(username: string): Promise<Usuario | null> {
    console.log(`DbService: Obteniendo datos para el usuario: ${username}.`);
    try {
      const result = await this.database.executeSql('SELECT * FROM sesion_data WHERE user_name = ?', [username]);
      if (result.rows.length > 0) {
        return result.rows.item(0) as Usuario;
      }
      return null;
    } catch (e: any) {
      console.error("DbService: Error al obtener datos de usuario: ", e);
      this.presentToast("Error al obtener datos de usuario: " + e.message);
      return null;
    }
  }

  // Actualiza los datos de perfil de un usuario (nombre, apellido, etc.)
  async updateUserData(user: Usuario): Promise<void> {
    console.log(`DbService: Actualizando datos de perfil para: ${user.user_name}.`);
    try {
      await this.database.executeSql(`
        UPDATE sesion_data
        SET nombre = ?, apellido = ?, fecha_nacimiento = ?, rango = ?, profile_image_base64 = ?, last_latitude = ?, last_longitude = ?
        WHERE user_name = ?
      `, [
        user.nombre, user.apellido, user.fecha_nacimiento, user.rango, user.profile_image_base64 || null, user.last_latitude || null, user.last_longitude || null, user.user_name
      ]);
      this.presentToast("Datos de perfil actualizados.");
      console.log('DbService: Datos de perfil actualizados.');
    } catch (e: any) {
      console.error("DbService: Error al actualizar perfil: ", e);
      this.presentToast("Error al actualizar perfil: " + e.message);
    }
  }

  // Guarda los agentes en la DB local
  async saveAgentes(agentes: any[]): Promise<void> {
    const db = await this.database;
    await db.transaction(async (tx) => {
      await tx.executeSql('DELETE FROM agentes', []);

      for (const agente of agentes) {
        await tx.executeSql(
          `INSERT OR REPLACE INTO agentes (uuid, displayName, description, displayIcon, fullPortrait, abilities)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            agente.uuid,
            agente.displayName,
            agente.description,
            agente.displayIcon,
            agente.fullPortrait,
            JSON.stringify(agente.abilities) // Guardar habilidades como JSON string
          ]
        );
      }
    });
    console.log('DbService: Agentes guardados en DB local.');
  }

  // Obtiene los agentes desde la DB local
  async getAgentes(): Promise<any[]> {
    const db = await this.database;
    const data = await db.executeSql('SELECT * FROM agentes', []);
    const agentes: any[] = [];
    for (let i = 0; i < data.rows.length; i++) {
      const row = data.rows.item(i);
      agentes.push({
        ...row,
        abilities: JSON.parse(row.abilities) // Parsear habilidades de nuevo a objeto
      });
    }
    console.log(`DbService: Se recuperaron ${agentes.length} agentes de la DB local.`);
    return agentes;
  }

  // Métodos similares para mapas:
  async saveMapas(mapas: any[]): Promise<void> {
    const db = await this.database;
    await db.transaction(async (tx) => {
      await tx.executeSql('DELETE FROM mapas', []);
      for (const mapa of mapas) {
        await tx.executeSql(
          `INSERT OR REPLACE INTO mapas (uuid, displayName, splash, coordinates, assetPath)
          VALUES (?, ?, ?, ?, ?)`,
          [
            mapa.uuid,
            mapa.displayName,
            mapa.splash,
            mapa.coordinates,
            mapa.assetPath
          ]
        );
      }
    });
    console.log('DbService: Mapas guardados en DB local.');
  }

  async getMapas(): Promise<any[]> {
    const db = await this.database;
    const data = await db.executeSql('SELECT * FROM mapas', []);
    const mapas: any[] = [];
    for (let i = 0; i < data.rows.length; i++) {
      mapas.push(data.rows.item(i));
    }
    console.log(`DbService: Se recuperaron ${mapas.length} mapas de la DB local.`);
    return mapas;
  }

  // --- Utilidad para Toasts ---
  async presentToast(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom'
    });
    toast.present();
  }
}