import { NEIGHBORHOODS, DELIVERY_ZONES, type DeliveryZone } from '@shared/delivery-zones';

export interface DeliveryFeeResult {
  fee: number;
  zoneName: string | null;
  zoneCode: string | null;
  isUnlisted: boolean;
}

export function calculateDeliveryFee(neighborhoodName: string, fallbackFee: number = 20.00): DeliveryFeeResult {
  if (!neighborhoodName || neighborhoodName.trim() === '') {
    return {
      fee: fallbackFee,
      zoneName: null,
      zoneCode: null,
      isUnlisted: true
    };
  }
  
  const normalizedName = neighborhoodName.toLowerCase().trim();
  
  const match = NEIGHBORHOODS.find(
    n => n.name.toLowerCase() === normalizedName
  );
  
  if (match) {
    const zoneInfo = DELIVERY_ZONES[match.zone];
    return {
      fee: zoneInfo.fee,
      zoneName: zoneInfo.name,
      zoneCode: match.zone,
      isUnlisted: false
    };
  }
  
  return {
    fee: fallbackFee,
    zoneName: null,
    zoneCode: null,
    isUnlisted: true
  };
}

export function getGroupedNeighborhoods() {
  const zones: DeliveryZone[] = ['S', 'A', 'B', 'C', 'D'];
  return zones.map(zone => ({
    zone,
    zoneInfo: DELIVERY_ZONES[zone],
    neighborhoods: NEIGHBORHOODS.filter(n => n.zone === zone)
  }));
}
