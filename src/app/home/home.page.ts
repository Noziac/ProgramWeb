import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AnimationController } from '@ionic/angular';
import { DbService } from '../services/db.service';

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
    private animationCtrl: AnimationController,
    private dbService: DbService
  ) { }

  async ngOnInit() {
    this.activatedRoute.queryParams.subscribe(async () => {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras.state) {
        const state = navigation.extras.state;
        if (state && typeof state['loggedInUser'] === 'string') {
          this.loggedInUser = state['loggedInUser'];
          console.log('Usuario recibido en Home (vía state):', this.loggedInUser);
        }
      }
    });

    // Siempre verifica la sesión con DbService al cargar Home
    const hasActiveSession = await this.dbService.checkActiveSession();
    if (hasActiveSession) {
      this.loggedInUser = await this.dbService.getCurrentUser(); // Obtener el usuario desde DbService
      console.log('Home: Sesión activa confirmada desde DbService para:', this.loggedInUser);
    } else {
      console.log('Home: No hay sesión activa. Redirigiendo a /login.');
      this.router.navigateByUrl('/login', { replaceUrl: true }); // Redirigir si no hay sesión activa
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
  async logout() {
    console.log('HomePage: Iniciando logout a través de DbService.');
    await this.dbService.logout(); // Llama al logout del DbService
    this.loggedInUser = null; // Limpia la variable local después de un logout exitoso
    this.router.navigateByUrl('/login', { replaceUrl: true }); // Redirigir al login
  }
}
