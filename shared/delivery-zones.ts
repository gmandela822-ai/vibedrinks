export type DeliveryZone = 'S' | 'A' | 'B' | 'C' | 'D';

export interface DeliveryZoneInfo {
  zone: DeliveryZone;
  name: string;
  description: string;
  fee: number;
}

export const DELIVERY_ZONES: Record<DeliveryZone, DeliveryZoneInfo> = {
  S: { zone: 'S', name: 'Super Local', description: 'Vila da Saude e arredores imediatos', fee: 4.00 },
  A: { zone: 'A', name: 'Muito Proximo', description: 'Bairros imediatamente ao redor', fee: 7.00 },
  B: { zone: 'B', name: 'Proximo', description: 'Raio aproximado 2-4 km', fee: 10.00 },
  C: { zone: 'C', name: 'Medio', description: 'Raio aproximado 4-6 km', fee: 15.00 },
  D: { zone: 'D', name: 'Distante', description: 'Regioes de maior alcance', fee: 20.00 },
};

export interface Neighborhood {
  name: string;
  zone: DeliveryZone;
}

export const NEIGHBORHOODS: Neighborhood[] = [
  // GRUPO S - SUPER LOCAL (R$ 4,00)
  { name: 'Vila da Saude', zone: 'S' },

  // GRUPO A - MUITO PROXIMO (R$ 7,00)
  { name: 'Saude', zone: 'A' },
  { name: 'Bosque da Saude', zone: 'A' },
  { name: 'Mirandopolis', zone: 'A' },
  { name: 'Vila Clementino', zone: 'A' },
  { name: 'Chacara Inglesa', zone: 'A' },
  { name: 'Planalto Paulista', zone: 'A' },
  { name: 'Vila Monte Alegre', zone: 'A' },
  { name: 'Vila Guarani', zone: 'A' },
  { name: 'Jardim Oriental', zone: 'A' },
  { name: 'Vila Fachini', zone: 'A' },

  // GRUPO B - PROXIMO (R$ 10,00)
  { name: 'Vila Mariana', zone: 'B' },
  { name: 'Chacara Klabin', zone: 'B' },
  { name: 'Vila Gumercindo', zone: 'B' },
  { name: 'Cursino', zone: 'B' },
  { name: 'Sacoma', zone: 'B' },
  { name: 'Jardim da Gloria', zone: 'B' },
  { name: 'Jardim Previdencia', zone: 'B' },
  { name: 'Vila Moraes', zone: 'B' },
  { name: 'Ipiranga', zone: 'B' },
  { name: 'Alto do Ipiranga', zone: 'B' },

  // GRUPO C - MEDIO (R$ 15,00)
  { name: 'Jabaquara', zone: 'C' },
  { name: 'Cidade Vargas', zone: 'C' },
  { name: 'Americanopolis', zone: 'C' },
  { name: 'Vila Mascote', zone: 'C' },
  { name: 'Campo Belo', zone: 'C' },
  { name: 'Moema', zone: 'C' },
  { name: 'Cambuci', zone: 'C' },
  { name: 'Aclimacao', zone: 'C' },
  { name: 'Liberdade', zone: 'C' },
  { name: 'Vila Prudente', zone: 'C' },

  // GRUPO D - DISTANTE (R$ 20,00)
  { name: 'Brooklin', zone: 'D' },
  { name: 'Santo Amaro', zone: 'D' },
  { name: 'Bela Vista', zone: 'D' },
  { name: 'Centro', zone: 'D' },
  { name: 'Consolacao', zone: 'D' },
  { name: 'Itaim Bibi', zone: 'D' },
  { name: 'Vila Olimpia', zone: 'D' },
  { name: 'Pinheiros', zone: 'D' },
  { name: 'Tatuape', zone: 'D' },
  { name: 'Mooca', zone: 'D' },
];

export function getDeliveryFeeByNeighborhood(neighborhood: string): number | null {
  const found = NEIGHBORHOODS.find(n => 
    n.name.toLowerCase() === neighborhood.toLowerCase()
  );
  if (!found) return null;
  return DELIVERY_ZONES[found.zone].fee;
}

export function getZoneByNeighborhood(neighborhood: string): DeliveryZoneInfo | null {
  const found = NEIGHBORHOODS.find(n => 
    n.name.toLowerCase() === neighborhood.toLowerCase()
  );
  if (!found) return null;
  return DELIVERY_ZONES[found.zone];
}

export function getNeighborhoodsByZone(zone: DeliveryZone): Neighborhood[] {
  return NEIGHBORHOODS.filter(n => n.zone === zone);
}

export function getGroupedNeighborhoods(): Record<DeliveryZone, Neighborhood[]> {
  return {
    S: getNeighborhoodsByZone('S'),
    A: getNeighborhoodsByZone('A'),
    B: getNeighborhoodsByZone('B'),
    C: getNeighborhoodsByZone('C'),
    D: getNeighborhoodsByZone('D'),
  };
}

export const DELIVERY_FEE_WARNING = "A taxa de entrega e calculada automaticamente com base no bairro selecionado.";
