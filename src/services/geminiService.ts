import { Expense } from "../utils/storage";
import { ParsedExpense } from "./geminiServiceTypes";

async function callGeminiApi(action: string, payload: any) {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Gagal menghubungi server");
  }
  return data.result;
}

export async function parseReceiptImage(fileBase64: string, mimeType: string): Promise<string> {
    return callGeminiApi("parseReceiptImage", { fileBase64, mimeType });
}

export async function parseExpenseText(rawText: string): Promise<ParsedExpense> {
    return callGeminiApi("parseExpenseText", { rawText });
}

export async function generateWeeklySummary(expenses: Expense[]): Promise<{ summary: string, topCategories: string[], tip: string }> {
    return callGeminiApi("generateWeeklySummary", { expenses });
}

export async function generateSavingsChallenge(expenses: Expense[]): Promise<{ text: string, targetAmount: number }> {
    return callGeminiApi("generateSavingsChallenge", { expenses });
}

export async function detectRecurringExpense(expenses: Expense[]): Promise<{ detected: boolean, text: string, projection6Months: number } | null> {
    return callGeminiApi("detectRecurringExpense", { expenses });
}

export async function generateMicroLesson(expenses: Expense[]): Promise<{ title: string, content: string, question: string, correctAnswer: string, options: string[] }> {
    return callGeminiApi("generateMicroLesson", { expenses });
}

export async function generateAuraRoast(expenses: Expense[]): Promise<{ aura: string, characterTitle: string, roast: string }> {
    return callGeminiApi("generateAuraRoast", { expenses });
}

export async function generateProyeksi(expenses: Expense[]): Promise<{
    latteFactor: { items: string[]; yearlyCost: number; equivalentText: string; },
    investmentMachine: { currentMonthly: number; projected1Y: number; projected3Y: number; projected5Y: number; encouragement: string; }
}> {
    return callGeminiApi("generateProyeksi", { expenses });
}
