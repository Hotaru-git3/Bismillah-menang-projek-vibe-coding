import { Expense } from "../utils/storage";
import { ParsedExpense } from "./geminiServiceTypes";

// If in development mode without proxy, we could point directly to cloud function 
// but assuming /api is proxied or routed via rewrite.
const API_URL = '/api';

async function callApi(action: string, data: any) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, data })
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || `Failed to call API ${action}`);
    }
    return result.result;
}

export async function parseReceiptImage(fileBase64: string, mimeType: string): Promise<string> {
    return callApi('parseReceiptImage', { fileBase64, mimeType });
}

export async function parseExpenseText(text: string): Promise<ParsedExpense> {
    const res = await callApi('parseExpenseText', { text });
    if (!['Makanan', 'Transport', 'Belanja', 'Hiburan', 'Lainnya', 'Kebutuhan', 'Investasi', 'Keinginan'].includes(res.category)) {
        res.category = 'Lainnya'; // fallback
    }
    return res;
}

export async function generateWeeklySummary(expenses: Expense[]): Promise<{ summary: string, topCategories: string[], tip: string }> {
    try {
        const res = await callApi('generateWeeklySummary', { expenses });
        if (!res.summary) return { summary: "Belum ada rangkuman", topCategories: [], tip: "" };
        if (!res.topCategories) res.topCategories = [];
        return res;
    } catch {
        return { summary: "Belum ada rangkuman", topCategories: [], tip: "" };
    }
}

export async function generateSavingsChallenge(expenses: Expense[]): Promise<{ text: string, targetAmount: number }> {
    try {
        const res = await callApi('generateSavingsChallenge', { expenses });
        if (!res.text) return { text: "Gagal membuat challenge", targetAmount: 0 };
        return res;
    } catch {
        return { text: "Gagal membuat challenge", targetAmount: 0 };
    }
}

export async function detectRecurringExpense(expenses: Expense[]): Promise<{ detected: boolean, text: string, projection6Months: number } | null> {
    try {
        const res = await callApi('detectRecurringExpense', { expenses });
        if (res && !res.text) return null;
        return res;
    } catch {
        return null;
    }
}

export async function generateMicroLesson(expenses: Expense[]): Promise<{ title: string, content: string, question: string, correctAnswer: string, options: string[] }> {
    try {
        const res = await callApi('generateMicroLesson', { expenses });
        if (!res.title) return { title: "Gagal memuat materi", content: "", question: "", correctAnswer: "", options: [] };
        if (!res.options) res.options = [];
        return res;
    } catch {
        return { title: "Gagal memuat materi", content: "", question: "", correctAnswer: "", options: [] };
    }
}

export async function generateAuraRoast(expenses: Expense[]): Promise<{ aura: string, characterTitle: string, roast: string }> {
    try {
        const res = await callApi('generateAuraRoast', { expenses });
        if (!res.aura) return { aura: "Abu-abu", characterTitle: "Si Error", roast: "Aduh, AI lagi error nih." };
        return res;
    } catch {
        return { aura: "Abu-abu", characterTitle: "Si Error", roast: "Aduh, AI lagi error nih." };
    }
}

export async function generateProyeksi(expenses: Expense[]): Promise<{
    latteFactor: { items: string[]; yearlyCost: number; equivalentText: string; },
    investmentMachine: { currentMonthly: number; projected1Y: number; projected3Y: number; projected5Y: number; encouragement: string; }
}> {
    try {
        const res = await callApi('generateProyeksi', { expenses });
        if (!res.latteFactor || !res.investmentMachine) {
            return {
                latteFactor: { items: [], yearlyCost: 0, equivalentText: "" },
                investmentMachine: { currentMonthly: 0, projected1Y: 0, projected3Y: 0, projected5Y: 0, encouragement: "" }
            };
        }
        if (!res.latteFactor.items) res.latteFactor.items = [];
        return res;
    } catch {
        return {
            latteFactor: { items: [], yearlyCost: 0, equivalentText: "" },
            investmentMachine: { currentMonthly: 0, projected1Y: 0, projected3Y: 0, projected5Y: 0, encouragement: "" }
        };
    }
}
