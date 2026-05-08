export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateRunway(budget: number, spent: number, daysInMonth: number): number {
  const remaining = budget - spent;
  if (remaining <= 0) return 0;
  
  const dailyBurnAllowed = budget / daysInMonth;
  // This is a naive calculation based on total budget and days
  // If we just divide remaining by dailyBurnAllowed we get "days left at average burn"
  const burnRate = spent / new Date().getDate(); // Current daily burn rate
  
  if (burnRate === 0) return daysInMonth;
  
  const runway = Math.floor(remaining / burnRate);
  return runway > 0 ? runway : 0;
}

export function sanitizeInput(input: string): string {
  // Strip HTML/script tags
  const noTags = input.replace(/<\/?[^>]+(>|$)/g, "");
  // Escape a few common potentially unsafe characters if needed, or just let Gemini handle
  // but let's remove extreme special characters except basic punctuation
  return noTags.replace(/[<>]/g, "");
}

export function isPromptInjection(input: string): boolean {
  const lower = input.toLowerCase();
  const keywords = ["ignore previous", "you are now", "forget", "act as", "jailbreak", "abaikan", "kamu sekarang", "jadilah"];
  return keywords.some(kw => lower.includes(kw));
}
