import { Component, OnInit, AfterViewInit, QueryList, ViewChildren, ElementRef, OnDestroy } from '@angular/core';
import { AnimationController } from '@ionic/angular';
import { ValorantApiService } from '../services/valorant-api.service';
import { AgentData } from '../interfaces/valorant-api.interface';
import { LocalAgentModel } from '../interfaces/local-agent-model.interface';
import { Subscription } from 'rxjs';
import { translations } from '../translations/es';

@Component({
  selector: 'app-agents',
  templateUrl: './agents.page.html',
  styleUrls: ['./agents.page.scss'],
  standalone: false
})
export class AgentsPage implements OnInit, AfterViewInit, OnDestroy {

  agentes: LocalAgentModel[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  private agentsSubscription: Subscription | undefined;

  @ViewChildren('cardElement', { read: ElementRef }) cardElements!: QueryList<ElementRef>;

  constructor(
    private animationCtrl: AnimationController,
    private valorantApiService: ValorantApiService
  ) { }

  ngOnInit() {
    this.loadAgents();
  }

  loadAgents() {
    this.isLoading = true;
    this.errorMessage = null;

    this.agentsSubscription = this.valorantApiService.getAgents().subscribe({
      next: (apiAgents: AgentData[]) => {
        this.agentes = apiAgents.map(agent => {
          const translatedDescription = translations[agent.description] || agent.description;

          // Mapear y traducir las habilidades
          const translatedAbilities = agent.abilities.map(ability => ({
            slot: ability.slot,
            displayName: translations[ability.displayName] || ability.displayName,
            description: translations[ability.description] || ability.description,
            displayIcon: ability.displayIcon
          }));

          return {
            id: agent.uuid,
            alias: agent.displayName,
            rol: agent.role?.displayName || 'Desconocido',
            imagen: agent.fullPortrait || agent.bustPortrait || agent.displayIcon,
            abilities: translatedAbilities // Asignamos las habilidades mapeadas y traducidas
          };
        });
        this.isLoading = false;
        console.log('Agentes cargados y mapeados con habilidades y traducciones:', this.agentes);

        setTimeout(() => {
          if (this.cardElements && this.cardElements.length > 0) {
            this.cardElements.forEach((elementRef: ElementRef, index: number) => {
              this.animateCardFadeIn(elementRef.nativeElement, index * 80);
            });
          }
        }, 0);
      },
      error: (err) => {
        this.errorMessage = 'No se pudieron cargar los agentes. ' + err.message;
        this.isLoading = false;
        console.error('Error al cargar agentes:', err);
      }
    });
  }

  ngAfterViewInit() { }

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

  ngOnDestroy() {
    if (this.agentsSubscription) {
      this.agentsSubscription.unsubscribe();
    }
  }

  handleRefresh(event: any) {
    this.loadAgents();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}