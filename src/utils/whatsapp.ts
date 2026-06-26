// ─── WhatsApp Utility Functions ─────────────────────────────────

/**
 * Format an Iraqi phone number to international format (964...)
 */
export function formatIraqiPhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits (including Arabic numerals → convert first)
  const latinized = phone.replace(/[٠-٩]/g, (d) => {
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    return String(arabicDigits.indexOf(d));
  });
  const digits = latinized.replace(/\D/g, '');
  // Add country code
  if (digits.startsWith('964')) return digits;
  if (digits.startsWith('0')) return '964' + digits.slice(1);
  return '964' + digits;
}

/**
 * Open WhatsApp with a pre-filled message
 */
export function openWhatsApp(phone: string, message: string) {
  const formattedPhone = formatIraqiPhone(phone);
  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

/**
 * Build a completed service invoice message
 */
export function buildInvoiceMessage(params: {
  customerName: string;
  carBrand: string;
  carName: string;
  plateNumber: string;
  total: number;
  invoiceNumber?: string;
  centerName?: string;
}): string {
  const { customerName, carBrand, carName, plateNumber, total, invoiceNumber, centerName } = params;
  return `عزيزي ${customerName}، نود إعلامك بانتهاء صيانة سيارتك ${carBrand} ${carName} لوحة (${plateNumber}) بنجاح.\n\n` +
    `${invoiceNumber ? `رقم الفاتورة: ${invoiceNumber}\n` : ''}` +
    `المجموع الكلي: ${total.toLocaleString('ar-IQ')} د.ع\n\n` +
    `يرجى التفضل باستلامها.\n` +
    `${centerName ? `— ${centerName}` : ''}`;
}

/**
 * Build a debt reminder message
 */
export function buildDebtReminderMessage(params: {
  customerName: string;
  carBrand?: string;
  carName?: string;
  remainingAmount: number;
  dueDate?: string;
  centerName?: string;
}): string {
  const { customerName, carBrand, carName, remainingAmount, dueDate, centerName } = params;
  let msg = `أهلاً زبوننا الكريم ${customerName}، يرجى العلم بوجود دفعة معلقة`;
  if (carBrand && carName) {
    msg += ` لصيانة سيارتك ${carBrand} ${carName}`;
  }
  msg += ` بقيمة ${remainingAmount.toLocaleString('ar-IQ')} د.ع`;
  if (dueDate) {
    msg += ` والمستحقة بتاريخ ${dueDate}`;
  }
  msg += `. شكراً لكم.`;
  if (centerName) {
    msg += `\n— ${centerName}`;
  }
  return msg;
}

/**
 * Build a welcome / reception message
 */
export function buildWelcomeMessage(params: {
  customerName: string;
  carBrand: string;
  carName: string;
  plateNumber: string;
  visitId: string;
  centerName?: string;
}): string {
  const { customerName, carBrand, carName, plateNumber, visitId, centerName } = params;
  return `أهلاً زبوننا الكريم ${customerName}، تم استقبال سيارتكم ${carBrand} ${carName} لوحة (${plateNumber}) في ${centerName || 'مركز الخدمة'}.\n` +
    `رقم الكرت: ${visitId.substring(0, 8)}\n` +
    `سنتواصل معكم قريباً.`;
}

/**
 * Build an oil / service reminder message
 */
export function buildServiceReminderMessage(params: {
  customerName: string;
  carBrand: string;
  carName: string;
  serviceName: string;
  nextDate?: string;
  nextOdometer?: number;
  centerName?: string;
}): string {
  const { customerName, carBrand, carName, serviceName, nextDate, nextOdometer, centerName } = params;
  let msg = `عزيزي ${customerName}، نذكركم بموعد ${serviceName} لسيارتكم ${carBrand} ${carName}`;
  if (nextDate) {
    msg += ` بتاريخ ${nextDate}`;
  }
  if (nextOdometer) {
    msg += ` أو عند بلوغ العداد ${nextOdometer.toLocaleString('ar-IQ')} كم`;
  }
  msg += `. يسعدنا خدمتكم.`;
  if (centerName) {
    msg += `\n— ${centerName}`;
  }
  return msg;
}
