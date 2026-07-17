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

const VEHICLE_MODELS_BY_BRAND: Record<string, readonly string[]> = {
  Chevrolet: ['Onix', 'Onix Plus', 'Tracker', 'Spin', 'S10', 'Montana'],
  Fiat: ['Mobi', 'Argo', 'Cronos', 'Pulse', 'Fastback', 'Toro', 'Strada'],
  Ford: ['Ka', 'Ranger', 'Maverick', 'Territory', 'Bronco Sport'],
  Honda: ['Civic', 'City', 'HR-V', 'WR-V', 'CG 160', 'Biz 125', 'PCX 160', 'CB 300F', 'XRE 300'],
  Hyundai: ['HB20', 'HB20S', 'Creta', 'Tucson', 'Santa Fe'],
  Jeep: ['Renegade', 'Compass', 'Commander', 'Gladiator'],
  Kawasaki: ['Ninja 400', 'Ninja 500', 'Z400', 'Z500', 'Versys 650'],
  Nissan: ['Versa', 'Sentra', 'Kicks', 'Frontier'],
  Renault: ['Kwid', 'Stepway', 'Logan', 'Duster', 'Oroch', 'Kardian'],
  'Royal Enfield': ['Hunter 350', 'Classic 350', 'Meteor 350', 'Himalayan 450'],
  Toyota: ['Yaris', 'Corolla', 'Corolla Cross', 'Hilux', 'SW4'],
  Volkswagen: ['Polo', 'Virtus', 'Nivus', 'T-Cross', 'Taos', 'Amarok'],
  Yamaha: ['Factor 150', 'Fazer FZ15', 'Fazer FZ25', 'Lander 250', 'XMAX 250', 'MT-03']
};

export function getBrandsForVehicleType(vehicleTypeName?: string): readonly string[] {
  const type = vehicleTypeName?.toLocaleLowerCase('pt-BR') || '';
  return type.includes('moto') || type.includes('bike') ? MOTORCYCLE_BRANDS : CAR_BRANDS;
}

export function getModelsForBrand(brand?: string): readonly string[] {
  return VEHICLE_MODELS_BY_BRAND[brand || ''] || [];
}
