export const CAR_BRANDS = [
  'Audi', 'BMW', 'BYD', 'CAOA Chery', 'Chevrolet', 'Citroën', 'Fiat', 'Ford',
  'Geely', 'GWM', 'Honda', 'Hyundai', 'JAC Motors', 'Jaguar', 'Jeep', 'Kia',
  'Land Rover', 'Leapmotor', 'Lexus', 'Mercedes-Benz', 'Mitsubishi', 'Nissan',
  'Omoda Jaecoo', 'Peugeot', 'Porsche', 'RAM', 'Renault', 'Seres', 'Subaru',
  'Suzuki', 'Toyota', 'Volkswagen', 'Volvo'
] as const;

export const MOTORCYCLE_BRANDS = [
  'Avelloz', 'Bajaj', 'BMW Motorrad', 'Dafra', 'Ducati', 'Haojue',
  'Harley-Davidson', 'Honda', 'Kawasaki', 'KTM', 'Mottu', 'Royal Enfield',
  'Shineray', 'Suzuki', 'Triumph', 'TVS', 'Yamaha', 'Zontes'
] as const;

export const VEHICLE_COLORS = [
  'Amarelo', 'Azul', 'Bege', 'Branco', 'Bronze', 'Cinza', 'Dourado',
  'Grafite', 'Laranja', 'Marrom', 'Prata', 'Preto', 'Rosa', 'Roxo',
  'Verde', 'Vermelho', 'Vinho'
] as const;

// Modelos de carros, utilitários, caminhonetes e vans encontrados no mercado brasileiro.
const VEHICLE_MODELS_BY_BRAND: Record<string, readonly string[]> = {
  Audi: ['A3', 'A4', 'A5', 'Q3', 'Q5', 'Q7', 'Q8'],
  BMW: ['Série 1', 'Série 3', 'Série 5', 'X1', 'X3', 'X5', 'iX1'],
  BYD: ['Dolphin', 'Dolphin Mini', 'King', 'Seal', 'Shark', 'Song Plus', 'Song Pro', 'Yuan Plus'],
  'CAOA Chery': ['Arrizo 6', 'Tiggo 5X', 'Tiggo 7', 'Tiggo 8', 'Tiggo 8 Pro'],
  Chevrolet: ['Onix', 'Onix Plus', 'Tracker', 'Spin', 'S10', 'Montana', 'Trailblazer', 'Silverado'],
  'Citroën': ['C3', 'C3 Aircross', 'Basalt', 'C4 Cactus', 'Jumpy', 'Jumper'],
  Fiat: ['Mobi', 'Argo', 'Cronos', 'Pulse', 'Fastback', 'Strada', 'Toro', 'Titano', 'Fiorino', 'Ducato', 'Scudo'],
  Ford: ['Ka', 'Territory', 'Ranger', 'Maverick', 'Bronco Sport', 'F-150', 'Transit'],
  Geely: ['EX2', 'EX5'],
  GWM: ['Haval H6', 'Haval H6 GT', 'Haval H9', 'Ora 03', 'Poer'],
  Honda: ['Civic', 'City', 'City Hatch', 'HR-V', 'WR-V', 'ZR-V', 'CR-V', 'Accord', 'CG 160', 'Biz 125', 'Pop 110i', 'NXR 160 Bros', 'PCX 160', 'ADV 160', 'CB 300F', 'XRE 190', 'XRE 300', 'NX 500', 'NC 750X'],
  Hyundai: ['HB20', 'HB20S', 'Creta', 'Tucson', 'Santa Fe', 'Kona'],
  'JAC Motors': ['T40', 'T50', 'T60', 'E-JS1', 'E-JS4', 'Hunter'],
  Jaguar: ['E-Pace', 'F-Pace', 'I-Pace'],
  Jeep: ['Renegade', 'Compass', 'Commander', 'Gladiator'],
  Kia: ['Sportage', 'Sorento', 'Carnival', 'K2500'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Evoque'],
  Leapmotor: ['T03', 'C10'],
  Lexus: ['ES 300h', 'NX 350h', 'RX 450h'],
  'Mercedes-Benz': ['A 200', 'C 200', 'GLA 200', 'GLB 200', 'Sprinter'],
  Mitsubishi: ['L200', 'Triton', 'Eclipse Cross', 'Outlander', 'Pajero Sport'],
  Nissan: ['Versa', 'Sentra', 'Kicks', 'Frontier', 'Leaf'],
  'Omoda Jaecoo': ['Omoda 5', 'Jaecoo 7'],
  Peugeot: ['208', '2008', '3008', 'Partner', 'Expert', 'Boxer'],
  Porsche: ['911', 'Macan', 'Cayenne', 'Panamera'],
  RAM: ['Rampage', '1500', '2500', '3500'],
  Renault: ['Kwid', 'Stepway', 'Logan', 'Duster', 'Oroch', 'Kardian', 'Boreal', 'Master', 'Kangoo'],
  Seres: ['3', '5', '7'],
  Subaru: ['Impreza', 'Forester', 'XV'],
  Suzuki: ['Jimny', 'Jimny Sierra', 'Vitara', 'Intruder 125', 'V-Strom 650', 'GSX-S750', 'Hayabusa'],
  Toyota: ['Yaris', 'Yaris Sedan', 'Corolla', 'Corolla Cross', 'Hilux', 'SW4', 'RAV4'],
  Volkswagen: ['Polo', 'Virtus', 'Nivus', 'T-Cross', 'Tera', 'Taos', 'Amarok', 'Saveiro', 'ID.4'],
  Volvo: ['EX30', 'XC40', 'XC60', 'XC90'],

  Avelloz: ['AZ1', 'AZ160'],
  Bajaj: ['Dominar 160', 'Dominar 200', 'Dominar 250', 'Dominar 400', 'Pulsar N160', 'Pulsar NS200'],
  'BMW Motorrad': ['G 310 GS', 'G 310 R', 'F 900 GS', 'R 1300 GS'],
  Dafra: ['NH 190', 'Citycom 300i', 'Cruisym 150', 'Apache RTR 200'],
  Ducati: ['Monster', 'Scrambler Icon', 'Multistrada V2', 'Panigale V2'],
  Haojue: ['DK 160', 'DR 160', 'NK 150', 'Master Ride 150', 'Lindy 125'],
  'Harley-Davidson': ['Iron 883', 'Sportster S', 'Fat Bob', 'Street Bob'],
  Kawasaki: ['Ninja 400', 'Ninja 500', 'Ninja 650', 'Z400', 'Z500', 'Z900', 'Versys 650', 'Eliminator 500', 'Vulcan S'],
  KTM: ['Duke 200', 'Duke 390', '390 Adventure'],
  Mottu: ['Sport 110i'],
  'Royal Enfield': ['Hunter 350', 'Classic 350', 'Meteor 350', 'Himalayan 450', 'Super Meteor 650', 'Shotgun 650', 'Interceptor 650', 'Continental GT 650'],
  Shineray: ['XY 50', 'XY 125', 'XY 150', 'SHI 150', 'SHI 175', 'Jet 50', 'Urban 150'],
  Triumph: ['Scrambler 400', 'Speed 400', 'Trident 660', 'Tiger 900', 'Tiger 1200', 'Street Triple'],
  TVS: ['Apache RTR 160', 'Apache RTR 200'],
  Yamaha: ['YBR 150', 'Factor 150', 'Fazer FZ15', 'Fazer FZ25', 'Lander 250', 'Crosser 150', 'XTZ 250', 'NMAX 160', 'XMAX 250', 'MT-03', 'R15', 'R3', 'Neo 125', 'Fluo 125'],
  Zontes: ['S350', 'T350', 'R310', 'GK350']
};

const MOTORCYCLE_MODELS_BY_BRAND: Record<string, readonly string[]> = {
  Avelloz: VEHICLE_MODELS_BY_BRAND.Avelloz,
  Bajaj: VEHICLE_MODELS_BY_BRAND.Bajaj,
  'BMW Motorrad': VEHICLE_MODELS_BY_BRAND['BMW Motorrad'],
  Dafra: VEHICLE_MODELS_BY_BRAND.Dafra,
  Ducati: VEHICLE_MODELS_BY_BRAND.Ducati,
  Haojue: VEHICLE_MODELS_BY_BRAND.Haojue,
  'Harley-Davidson': VEHICLE_MODELS_BY_BRAND['Harley-Davidson'],
  Honda: ['CG 160', 'Biz 125', 'Pop 110i', 'NXR 160 Bros', 'PCX 160', 'ADV 160', 'CB 300F', 'XRE 190', 'XRE 300', 'NX 500', 'NC 750X'],
  Kawasaki: VEHICLE_MODELS_BY_BRAND.Kawasaki,
  KTM: VEHICLE_MODELS_BY_BRAND.KTM,
  Mottu: VEHICLE_MODELS_BY_BRAND.Mottu,
  'Royal Enfield': VEHICLE_MODELS_BY_BRAND['Royal Enfield'],
  Shineray: VEHICLE_MODELS_BY_BRAND.Shineray,
  Suzuki: ['Intruder 125', 'V-Strom 650', 'GSX-S750', 'Hayabusa'],
  Triumph: VEHICLE_MODELS_BY_BRAND.Triumph,
  TVS: VEHICLE_MODELS_BY_BRAND.TVS,
  Yamaha: VEHICLE_MODELS_BY_BRAND.Yamaha,
  Zontes: VEHICLE_MODELS_BY_BRAND.Zontes
};

function isMotorcycleType(vehicleTypeName?: string): boolean {
  const type = vehicleTypeName?.toLocaleLowerCase('pt-BR') || '';
  return type.includes('moto') || type.includes('bike');
}

export function getBrandsForVehicleType(vehicleTypeName?: string): readonly string[] {
  return isMotorcycleType(vehicleTypeName) ? MOTORCYCLE_BRANDS : CAR_BRANDS;
}

export function getModelsForBrand(brand?: string, vehicleTypeName?: string): readonly string[] {
  const models = VEHICLE_MODELS_BY_BRAND[brand || ''] || [];
  if (isMotorcycleType(vehicleTypeName)) return MOTORCYCLE_MODELS_BY_BRAND[brand || ''] || [];

  const motorcycleModels = new Set(MOTORCYCLE_MODELS_BY_BRAND[brand || ''] || []);
  return models.filter(model => !motorcycleModels.has(model));
}
