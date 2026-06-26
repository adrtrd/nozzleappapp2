const units = [
  '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
  'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'
];
const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function convertUnderThousand(num: number): string {
  if (num === 0) return '';
  const parts: string[] = [];

  if (num >= 100) {
    const h = Math.floor(num / 100);
    parts.push(hundreds[h]);
    num %= 100;
  }

  if (num >= 20) {
    const t = Math.floor(num / 10);
    const u = num % 10;
    if (u > 0) parts.push(units[u]);
    parts.push(tens[t]);
  } else if (num > 0) {
    parts.push(units[num]);
  }

  return parts.filter(Boolean).join(' و');
}

export function convertNumberToArabicWords(num: number): string {
  if (num === 0) return 'صفر';
  const parts: string[] = [];

  // Millions
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    num %= 1000000;
    if (millions === 1) parts.push('مليون');
    else if (millions === 2) parts.push('مليونان');
    else if (millions >= 3 && millions <= 10) parts.push(convertUnderThousand(millions) + ' ملايين');
    else parts.push(convertUnderThousand(millions) + ' مليون');
  }

  // Thousands
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    num %= 1000;
    if (thousands === 1) parts.push('ألف');
    else if (thousands === 2) parts.push('ألفان');
    else if (thousands >= 3 && thousands <= 10) parts.push(convertUnderThousand(thousands) + ' آلاف');
    else parts.push(convertUnderThousand(thousands) + ' ألف');
  }

  // Under Thousand
  if (num > 0) {
    parts.push(convertUnderThousand(num));
  }

  return parts.filter(Boolean).join(' و');
}

export function convertNumberToInvoiceArabicWords(num: number): string {
  const words = convertNumberToArabicWords(num);
  return `${words} دينار عراقي لا غير`;
}
