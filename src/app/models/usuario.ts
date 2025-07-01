export interface Usuario {
  user_name: string;
  password: number; 
  active: number; 
  nombre?: string; 
  apellido?: string; 
  fecha_nacimiento?: string; 
  rango?: string; 
  profile_image_base64?: string; 
  last_latitude?: number;       
  last_longitude?: number; 
}