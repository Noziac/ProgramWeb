import { Component, OnInit, AfterViewInit, QueryList, ViewChildren, ElementRef, OnDestroy } from '@angular/core';
import { AnimationController } from '@ionic/angular';
import { ValorantApiService } from '../services/valorant-api.service'; 
import { MapData } from '../interfaces/valorant-api.interface'; 
import { LocalMapModel } from '../interfaces/local-map-model.interface'; 
import { Subscription } from 'rxjs'; 

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false
})
export class MapsPage implements OnInit, AfterViewInit, OnDestroy {

  mapas: LocalMapModel[] = []; 
  isLoading: boolean = false; 
  errorMessage: string | null = null; 
  private mapsSubscription: Subscription | undefined; 

  @ViewChildren('cardElement', { read: ElementRef }) cardElements!: QueryList<ElementRef>;

  constructor(
    private animationCtrl: AnimationController,
    private valorantApiService: ValorantApiService 
  ) { }

  ngOnInit() {
    this.loadMaps(); // Llamamos a cargar los mapas al inicio
  }

  // Método para cargar los mapas desde el servicio de la API
  loadMaps() {
    this.isLoading = true; // Iniciamos la carga
    this.errorMessage = null; // Limpiamos cualquier error previo

    // Nos suscribimos al Observable que devuelve nuestro servicio
    this.mapsSubscription = this.valorantApiService.getMaps().subscribe({
      next: (apiMaps: MapData[]) => {
        // Mapea los datos recibidos de la API (MapData[])
        // a la estructura que el componente local (LocalMapModel[]) espera.
        this.mapas = apiMaps.map(map => ({
          uuid: map.uuid,
          imagen: map.displayIcon || null, // La imagen del mapa
          nombreMapa: map.displayName, // El nombre del mapa
          descripcion: map.narrativeDescription || 'Sin descripción disponible.'
        }));
        this.isLoading = false; // Finaliza la carga
        console.log('Mapas cargados y mapeados (simplificado):', this.mapas);

        // Dispara las animaciones de las tarjetas después de que los datos se han cargado
        setTimeout(() => {
          if (this.cardElements && this.cardElements.length > 0) {
            this.cardElements.forEach((elementRef: ElementRef, index: number) => {
              this.animateCardFadeIn(elementRef.nativeElement, index * 80);
            });
          }
        }, 0); 
      },
      error: (err) => {
        this.errorMessage = 'No se pudieron cargar los mapas. ' + err.message;
        this.isLoading = false; // Finaliza la carga con error
        console.error('Error al cargar mapas:', err);
      }
    });
  }

  // Se ejecuta después de que la vista ha sido completamente renderizada
  ngAfterViewInit() {
    // La animación ahora se dispara principalmente desde loadMaps() después de la carga asíncrona.
  }

  // Método asíncrono para animar la aparición
  async animateCardFadeIn(element: HTMLElement, delay: number = 0) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';

    const animation = this.animationCtrl.create()
      .addElement(element)
      .duration(500)
      .delay(delay)
      .easing('ease-out')
      .fromTo('opacity', '0', '1')
      .fromTo('transform', 'translateY(20px)', 'translateY(0px)');

    await animation.play();
  }

  // Importante: Desuscribirse para evitar fugas de memoria cuando el componente se destruye
  ngOnDestroy() {
    if (this.mapsSubscription) {
      this.mapsSubscription.unsubscribe();
    }
  }

  // Función para "pull-to-refresh"
  handleRefresh(event: any) {
    this.loadMaps(); // Vuelve a cargar los mapas
    // Simula un retardo para la animación de carga, luego completa el evento
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}