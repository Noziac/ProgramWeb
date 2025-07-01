export interface LocalAgentModel {
  id: string;
  alias: string;
  rol: string;
  imagen: string | null;
  abilities: { // Array de habilidades
    slot: string;
    displayName: string;
    description: string;
    displayIcon: string | null;
  }[];
}