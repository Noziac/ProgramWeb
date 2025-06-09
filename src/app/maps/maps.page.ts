import { Component, OnInit, AfterViewInit, QueryList, ViewChildren, ElementRef } from '@angular/core';
import { AnimationController } from '@ionic/angular';
import { listaMapas } from '../mapas';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false
})
export class MapsPage implements OnInit, AfterViewInit {

  mapas: any[] = [];

  // Decorador para obtener referencias a múltiples elementos
  // QueryList permite iterar sobre todos los elementos <ion-card> con la referencia 'cardElement'
  @ViewChildren('cardElement', { read: ElementRef }) cardElements!: QueryList<ElementRef>;

  constructor(
    private animationCtrl: AnimationController
  ) { }

  ngOnInit() {
    this.mapas = listaMapas;
  }

  // Se ejecuta después de que la vista ha sido completamente renderizada
  ngAfterViewInit() {
    // Verificar si se han encontrado elementos de tarjeta
    if (this.cardElements && this.cardElements.length > 0) {
      // Iterar sobre cada tarjeta encontrada para aplicar una animación individual
      this.cardElements.forEach((elementRef: ElementRef, index: number) => {
        // Llamar a la función de animación para cada tarjeta, con un retraso escalonado
        this.animateCardFadeIn(elementRef.nativeElement, index * 80); // 80ms de retraso entre cada tarjeta
      });
    }
  }

  // Método asíncrono para animar la aparición
  async animateCardFadeIn(element: HTMLElement, delay: number = 0) {
    // Establecer el estado inicial del elemento antes de la animación (invisible y ligeramente desplazado hacia abajo)
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';

    // Crear una nueva animación utilizando el AnimationController de Ionic
    const animation = this.animationCtrl.create()
      .addElement(element)
      .duration(500)
      .delay(delay)
      .easing('ease-out')
      .fromTo('opacity', '0', '1')
      .fromTo('transform', 'translateY(20px)', 'translateY(0px)');

    // Reproducir la animación
    await animation.play();
  }
}
