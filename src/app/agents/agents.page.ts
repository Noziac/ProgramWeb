import { Component, OnInit } from '@angular/core';
import { listaAgentes } from '../agentes';

@Component({
  selector: 'app-agents',
  templateUrl: './agents.page.html',
  styleUrls: ['./agents.page.scss'],
  standalone: false
})
export class AgentsPage implements OnInit {

  agentes: any[] = [];

  constructor() { }

  ngOnInit() {
    this.agentes = listaAgentes;
  }

}
