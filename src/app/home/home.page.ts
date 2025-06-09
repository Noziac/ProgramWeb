import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AnimationController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  // Esta variable es solo para uso interno de la página Home.
  // El foco es guardarlo en localStorage para el Profile.
  loggedInUser: string | null = null;

  // Referencias a los elementos HTML de las tarjetas
  @ViewChild('agentesCard', { read: ElementRef }) agentesCard!: ElementRef;
  @ViewChild('mapasCard', { read: ElementRef }) mapasCard!: ElementRef;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute, // Para acceder al 'state' de la navegación
    private animationCtrl: AnimationController
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(() => {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras.state) { // Verificar si navigation y navigation.extras.state existen
        const state = navigation.extras.state;
        if (state && typeof state['loggedInUser'] === 'string') { // Asegurarse de que loggedInUser es un string
          this.loggedInUser = state['loggedInUser'];
          localStorage.setItem('loggedInUser', this.loggedInUser);
          console.log('Usuario recibido en Home y guardado:', this.loggedInUser);
        }
      }
    });

    // Al cargar Home, verificar si ya hay un usuario en localStorage
    // Esto es útil si el usuario navega a Home directamente o recarga la página.
    if (!this.loggedInUser) { // Si no lo recibimos por state.
      this.loggedInUser = localStorage.getItem('loggedInUser');
    }

    // Redirigir al login si no existe usuario.
    if (!this.loggedInUser) {
      this.router.navigateByUrl('/login');
    }
  }

  async animateCardHover(element: ElementRef, isHovered: boolean) {
    if (!element || !element.nativeElement) return;

    const animation = this.animationCtrl.create()
      .addElement(element.nativeElement)
      .duration(300) // Duración de la animación en ms
      .easing('ease-out');

    if (isHovered) {
      animation
        .fromTo('transform', 'translateY(0px) scale(1)', 'translateY(-5px) scale(1.02)')
        .fromTo('box-shadow', '0 4px 8px rgba(0, 0, 0, 0.4)', '0 8px 16px rgba(0, 0, 0, 0.6)');
    } else {
      // Revertir a estado original
      animation
        .fromTo('transform', 'translateY(-5px) scale(1.02)', 'translateY(0px) scale(1)')
        .fromTo('box-shadow', '0 8px 16px rgba(0, 0, 0, 0.6)', '0 4px 8px rgba(0, 0, 0, 0.4)');
    }

    await animation.play();
  }

  onMouseEnter(card: string) {
    if (card === 'agentes' && this.agentesCard) {
      this.animateCardHover(this.agentesCard, true);
    } else if (card === 'mapas' && this.mapasCard) {
      this.animateCardHover(this.mapasCard, true);
    }
  }

  onMouseLeave(card: string) {
    if (card === 'agentes' && this.agentesCard) {
      this.animateCardHover(this.agentesCard, false);
    } else if (card === 'mapas' && this.mapasCard) {
      this.animateCardHover(this.mapasCard, false);
    }
  }


  // metodo para simular un logout
  logout() {
    localStorage.removeItem('loggedInUser'); // Eliminar el usuario de localStorage
    this.loggedInUser = null;
    this.router.navigateByUrl('/login'); // Redirigir al login
  }
}
