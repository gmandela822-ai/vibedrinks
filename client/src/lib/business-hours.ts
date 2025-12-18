export const BUSINESS_HOURS = {
  OPEN_HOUR: 14, // 14:00 (2 PM)
  CLOSE_HOUR: 6,  // 06:00 (6 AM)
  WHATSAPP: '11-94771-4676',
  WHATSAPP_LINK: 'https://wa.me/5511947714676'
};

export function isBusinessHoursOpen(): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Aberto de 14h às 6h da manhã
  if (currentHour >= BUSINESS_HOURS.OPEN_HOUR) {
    return true; // Entre 14h e 23h59
  }
  if (currentHour < BUSINESS_HOURS.CLOSE_HOUR) {
    return true; // Entre 00h e 05h59
  }
  
  return false; // Fechado entre 06h e 13h59
}

export function getNextOpeningTime(): string {
  const now = new Date();
  const currentHour = now.getHours();
  
  if (currentHour >= BUSINESS_HOURS.OPEN_HOUR || currentHour < BUSINESS_HOURS.CLOSE_HOUR) {
    return 'Aberto agora';
  }
  
  return `Abrindo às ${String(BUSINESS_HOURS.OPEN_HOUR).padStart(2, '0')}:00`;
}

export function getBusinessStatusMessage(): string {
  if (isBusinessHoursOpen()) {
    return `Atendimento ativo: 14h - 6h | WhatsApp: ${BUSINESS_HOURS.WHATSAPP}`;
  }
  return `Fechado. Reabrimos às 14h. WhatsApp: ${BUSINESS_HOURS.WHATSAPP}`;
}
