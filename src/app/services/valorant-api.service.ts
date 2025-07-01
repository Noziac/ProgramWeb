import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs'; 
import { map, catchError } from 'rxjs/operators'; 

import { ValorantApiResponseAgents, AgentData, ValorantApiResponseMaps, MapData, ValorantApiResponseWeapons, WeaponData } from '../interfaces/valorant-api.interface';

import { translations } from '../translations/es';


@Injectable({
  providedIn: 'root'
})
export class ValorantApiService {
  private apiUrl = 'https://valorant-api.com/v1/';

  constructor(private http: HttpClient) {
  }

  getAgents(): Observable<AgentData[]> {
    return this.http.get<ValorantApiResponseAgents>(`${this.apiUrl}agents?isPlayableCharacter=true`).pipe(
      map(response => {
        return response.data.map(agent => {
          // Traducir el displayName del rol
          if (agent.role && translations[agent.role.displayName]) {
            agent.role.displayName = translations[agent.role.displayName];
          }

          // Traducir el displayName de cada habilidad
          agent.abilities.forEach(ability => {
            if (translations[ability.displayName]) {
              ability.displayName = translations[ability.displayName];
            }
            if (translations[ability.description]) { // Traducir descripción de habilidad
                ability.description = translations[ability.description];
            }
          });
          return agent;
        });
      }),
      // catchError ahora solo re-lanza el error, SIN intentar cargar desde caché local
      catchError((error: HttpErrorResponse) => {
        console.error('Error al cargar agentes desde la API:', error);
        // Aquí no intentamos cargar desde caché. Simplemente lanzamos el error.
        return throwError(() => new Error(`Error en la API de Valorant: ${error.message || 'Error de conexión'}`));
      })
    );
  }

  getMaps(): Observable<MapData[]> {
    return this.http.get<ValorantApiResponseMaps>(`${this.apiUrl}maps`).pipe(
      map(response => response.data),
      // catchError ahora solo re-lanza el error, SIN intentar cargar desde caché local
      catchError((error: HttpErrorResponse) => {
        console.error('Error al cargar mapas desde la API:', error);
        return throwError(() => new Error(`Error en la API de Valorant: ${error.message || 'Error de conexión'}`));
      })
    );
  }

  getWeapons(): Observable<WeaponData[]> {
    return this.http.get<ValorantApiResponseWeapons>(`${this.apiUrl}weapons`).pipe(
      map(response => {
        return response.data.map(weapon => {
          // Traducir la categoría del arma
          if (translations[weapon.category]) {
            weapon.category = translations[weapon.category];
          }
          return weapon;
        });
      }),
      // catchError ahora solo re-lanza el error, SIN intentar cargar desde caché local
      catchError((error: HttpErrorResponse) => {
        console.error('Error al cargar armas desde la API:', error);
        return throwError(() => new Error(`Error en la API de Valorant: ${error.message || 'Error de conexión'}`));
      })
    );
  }
}