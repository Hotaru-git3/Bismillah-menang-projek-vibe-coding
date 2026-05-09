export class SecurityUtils {
  static sanitizeInput(text: string): string {
    if (!text || typeof text !== 'string') return '';

    // 1. Hapus HTML/XSS
    let sanitized = text.replace(/<[^>]*>?/gm, '');

    // 2. Hapus null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // 3. Hapus control characters (kecuali newline)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    // 4. Limit length
    sanitized = sanitized.substring(0, 500);

    // 5. Cek prompt injection
    const lower = sanitized.toLowerCase();
    const forbiddenPatterns = [
      /ignore\s+(previous|all)\s+(instructions?|prompts?)/i,
      /you\s+are\s+now/i,
      /forget\s+everything/i,
      /act\s+as\s+(a|an)/i,
      /jailbreak/i,
      /system\s*prompt/i,
      /override/i,
      /disregard/i,
      /new\s+instructions?/i,
      /\[system\]/i,
      /<\|system\|>/i
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(lower)) {
        throw new Error('INVALID_INPUT');
      }
    }

    return sanitized;
  }

  static validateAmount(amount: number): boolean {
    return typeof amount === 'number' && 
           !isNaN(amount) && 
           amount >= 0 && 
           amount <= 1_000_000_000; // Max 1 miliar
  }

  static validateCategory(category: string): boolean {
    const validCategories = [
      'Makanan & Minuman',
      'Transportasi',
      'Hiburan',
      'Belanja & Fashion',
      'Olahraga & Kebugaran',
      'Kesehatan & Kebutuhan Pokok',
      'Keuangan & Investasi',
      'Pendidikan',
      'Pulsa, Tagihan & Topup Digital',
      'Lainnya'
    ];
    return validCategories.includes(category);
  }

  static maskAPIKey(key: string): string {
    if (!key || key.length < 8) return '***';
    return key.substring(0, 4) + '...' + key.substring(key.length - 4);
  }
}
