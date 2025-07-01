import { Injectable } from '@angular/core';
import { CanLoad, CanActivate, Router, UrlTree } from '@angular/router';
import { DbService } from '../services/db.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanLoad, CanActivate {

  constructor(private dbService: DbService, private router: Router) {}

  // CanLoad: Para módulos de carga perezosa
  async canLoad(): Promise<boolean | UrlTree> {
    console.log('AuthGuard: canLoad ejecutado.');
    await this.dbService.dbState().subscribe(); // Asegurarse de que la DB esté lista antes de revisar la sesión
    const isAuthenticated = await this.dbService.checkActiveSession();
    if (!isAuthenticated) {
      console.log('AuthGuard: Usuario no autenticado para cargar módulo. Redirigiendo a /login.');
      return this.router.parseUrl('/login'); // Usa parseUrl para devolver un UrlTree
    }
    console.log('AuthGuard: Usuario autenticado. Permitido cargar módulo.');
    return true;
  }

  // CanActivate: Para componentes de carga ansiosa
  async canActivate(): Promise<boolean | UrlTree> {
    console.log('AuthGuard: canActivate ejecutado.');
    await this.dbService.dbState().subscribe(); // Asegurarse de que la DB esté lista
    const isAuthenticated = await this.dbService.checkActiveSession();
    if (!isAuthenticated) {
      console.log('AuthGuard: Usuario no autenticado para activar ruta. Redirigiendo a /login.');
      return this.router.parseUrl('/login'); // Usa parseUrl para devolver un UrlTree
    }
    console.log('AuthGuard: Usuario autenticado. Permitido activar ruta.');
    return true;
  }
}