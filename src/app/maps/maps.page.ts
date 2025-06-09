import { Component, OnInit } from '@angular/core';
import { listaMapas } from '../mapas';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false
})
export class MapsPage implements OnInit {

  mapas: any[] = [];

  constructor() { }

  ngOnInit() {
    this.mapas = listaMapas;
  }

}
