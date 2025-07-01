// Interfaz para una habilidad individual de un agente
export interface Ability {
  slot: string; // Ej: "Ability1", "Ultimate", "Grenade", "Passive"
  displayName: string; // Nombre de la habilidad (ej: "Wingman")
  description: string; // Descripción de la habilidad
  displayIcon: string | null; // URL del icono de la habilidad (puede ser null para algunas pasivas)
}

// Interfaz para el rol de un agente
export interface Role {
  uuid: string;
  displayName: string; // Nombre del rol (ej: "Initiator", "Duelist")
  description: string; // Descripción del rol
  displayIcon: string; // URL del icono del rol
  assetPath: string;
}

// Interfaz principal para los datos de un agente
export interface AgentData {
  uuid: string;
  displayName: string; // Nombre del agente (ej: "Gekko")
  description: string; // Descripción general del agente
  developerName: string; // Nombre de desarrollo interno (ej: "EA_Gekko")
  displayIcon: string; // URL del icono pequeño del agente
  displayIconSmall: string; // URL del icono aún más pequeño
  bustPortrait: string | null; // URL del retrato de busto
  fullPortrait: string | null; // URL del retrato completo
  fullPortraitV2: string | null; // URL de una versión alternativa del retrato completo
  killfeedPortrait: string | null; // URL del retrato en el killfeed
  background: string | null; // URL del fondo del agente
  backgroundGradientColors: string[]; // Colores del gradiente del fondo
  assetPath: string;
  isFullPortraitRightFacing: boolean; // Indica si el retrato mira a la derecha
  isPlayableCharacter: boolean; // Indica si es un personaje jugable (IMPORTANTE para filtrar)
  isAvailableForTest: boolean;
  isBaseContent: boolean;
  role: Role | null; // Objeto que contiene la información del rol del agente
  abilities: Ability[]; // Array de habilidades del agente
  voiceLine: any; // Puedes detallar esto si lo necesitas (ej. url de la línea de voz)
  recruitmentData: any; // Puedes detallar esto si lo necesitas
}

// Interfaz para la respuesta completa de la API cuando se solicitan agentes
export interface ValorantApiResponseAgents {
  status: number;
  data: AgentData[]; // Un array de objetos AgentData
}

// --- Interfaces para Mapas ---
export interface MapData {
  uuid: string;
  displayName: string; // Nombre del mapa (ej: "Ascent")
  narrativeDescription: string | null; // Descripción narrativa del mapa
  listViewIcon: string; // URL del icono para listas de mapas
  splash: string; // URL de la imagen de splash del mapa
  premierBackgroundColor: string | null; // Color de fondo si es un mapa Premier
  premierColor: string | null; // Color del mapa si es Premier
  xMultiplier: number; // Multiplicador de coordenadas X
  yMultiplier: number; // Multiplicador de coordenadas Y
  xScalarBounds: number[]; // Límites escalares X
  yScalarBounds: number[]; // Límites escalares Y
  displayIcon: string | null; // Otro icono, a veces es el mismo que listViewIcon
}

// Interfaz para la respuesta completa de la API cuando se solicitan mapas
export interface ValorantApiResponseMaps {
  status: number;
  data: MapData[]; // Un array de objetos MapData
}

// --- Interfaces para Armas ---
export interface WeaponShopData {
  cost: number;
  category: string; // Ej: "Heavy", "Rifle"
  shopOrder: number;
  newImage: string | null;
  newImage2: string | null;
  assetPath: string;
}

export interface WeaponStats {
  fireRate: number;
  magazineSize: number;
  runSpeedMultiplier: number;
  equipTimeSeconds: number;
  reloadTimeSeconds: number;
  firstBulletAccuracy: number;
  shotgunPelletCount: number;
  altFireType: string | null; // Tipo de disparo alternativo
  adsStats: any; // Estadísticas de apuntar con la mira (ads)
  altShotgunStats: any; // Estadísticas de escopeta alternativa
  airBurstStats: any; // Estadísticas de ráfaga de aire
  damageRanges: any[]; // Rangos de daño
}

export interface WeaponData {
  uuid: string;
  displayName: string; // Nombre del arma (ej: "Vandal")
  category: string; // Categoría general (ej: "EEquippableCategory::Rifle")
  defaultSkinUuid: string;
  displayIcon: string; // URL del icono del arma
  killStreamIcon: string;
  assetPath: string;
  weaponStats: WeaponStats | null; // Estadísticas detalladas del arma
  shopData: WeaponShopData | null; // Datos de la tienda (costo, categoría, etc.)
  skins: any[]; // Puedes definir una interfaz Skin si planeas mostrar skins
}

// Interfaz para la respuesta completa de la API cuando se solicitan armas
export interface ValorantApiResponseWeapons {
  status: number;
  data: WeaponData[]; // Un array de objetos WeaponData
}