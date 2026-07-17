export const CAR_BRANDS = [
  'Audi', 'BMW', 'BYD', 'CAOA Chery', 'Chevrolet', 'Citroën', 'Fiat',
  'Ford', 'GWM', 'Honda', 'Hyundai', 'JAC Motors', 'Jaguar', 'Jeep',
  'Kia', 'Land Rover', 'Lexus', 'Mercedes-Benz', 'Mitsubishi', 'Nissan',
  'Peugeot', 'Porsche', 'RAM', 'Renault', 'Subaru', 'Suzuki', 'Toyota',
  'Volkswagen', 'Volvo'
] as const;

export const MOTORCYCLE_BRANDS = [
  'Bajaj', 'BMW Motorrad', 'Dafra', 'Ducati', 'Haojue', 'Harley-Davidson',
  'Honda', 'Kawasaki', 'KTM', 'Royal Enfield', 'Shineray', 'Suzuki',
  'Triumph', 'Yamaha'
] as const;

export const VEHICLE_COLORS = [
  'Amarelo', 'Azul', 'Bege', 'Branco', 'Bronze', 'Cinza', 'Dourado',
  'Grafite', 'Laranja', 'Marrom', 'Prata', 'Preto', 'Rosa', 'Roxo',
  'Verde', 'Vermelho', 'Vinho'
] as const;

export function getBrandsForVehicleType(vehicleTypeName?: string): readonly string[] {
  const type = vehicleTypeName?.toLocaleLowerCase('pt-BR') || '';
  return type.includes('moto') || type.includes('bike') ? MOTORCYCLE_BRANDS : CAR_BRANDS;
}
