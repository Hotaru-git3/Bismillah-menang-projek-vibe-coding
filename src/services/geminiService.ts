import { GoogleGenAI, Type } from "@google/genai";
import { Expense } from "../utils/storage";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Adding rate limiting: max 10 requests per minute
let requestTimestamps: number[] = [];

function checkRateLimit() {
  const now = Date.now();
  // Filter out timestamps older than 60 seconds
  requestTimestamps = requestTimestamps.filter(t => now - t < 60000);
  if (requestTimestamps.length >= 10) {
    throw new Error("Rate limit exceeded. Please try again in a minute.");
  }
  requestTimestamps.push(now);
}

export interface ParsedExpense {
  amount: number;
  text: string;
  category: 'Kebutuhan' | 'Investasi' | 'Keinginan';
  nudge: string;
  splitBill?: {
    totalAmount: number;
    myShare: number;
    friendNames: string[];
  };
}

export async function parseExpenseText(text: string): Promise<ParsedExpense> {
  checkRateLimit();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash", // Upgrading to 2.0 flash based on prompt
    contents: `Parse this expense input from an Indonesian college student: "${text}". 
    Extract the amount (in Rupiah), the item name, categorize it strictly as "Kebutuhan" (Need), "Investasi" (Investment/Saving), or "Keinginan" (Want).
    Also generate a short, friendly, non-judgmental Bahasa Indonesia slang nudge (max 10 words) about this expense. 
    Notes: abbreviations like "rb", "k" mean ribu (1000). 15rb = 15000.
    If the user mentions "bagi" or splitting the bill with friends, include a "splitBill" object with the 'totalAmount', 'myShare' (user's personal portion), and an array of 'friendNames' (if mentioned, otherwise [ "Teman 1", "Teman 2" ] etc based on count). For the main 'amount' field, use the user's personal 'myShare' amount.
    Output JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.NUMBER, description: "The numeric amount in Rupiah (user's share only, e.g. 15000)" },
          text: { type: Type.STRING, description: "The normalized, short name of the item or expense" },
          category: { type: Type.STRING, description: "Strictly one of: Kebutuhan, Investasi, Keinginan" },
          nudge: { type: Type.STRING, description: "Short, friendly Bahasa Indonesia slang nudge" },
          splitBill: { 
             type: Type.OBJECT, 
             description: "Include ONLY if this is a split bill with friends.",
             properties: {
                totalAmount: { type: Type.NUMBER },
                myShare: { type: Type.NUMBER },
                friendNames: { type: Type.ARRAY, items: { type: Type.STRING } }
             }
          }
        },
        required: ["amount", "text", "category", "nudge"]
      }
    }
  });

  const jsonStr = response.text?.trim() || "";
  if (!jsonStr) throw new Error("Failed to parse expense");

  const parsed = JSON.parse(jsonStr) as ParsedExpense;
  
  if (!['Kebutuhan', 'Investasi', 'Keinginan'].includes(parsed.category)) {
      parsed.category = 'Kebutuhan'; // fallback
  }

  return parsed;
}

export async function generateWeeklySummary(expenses: Expense[]): Promise<{ summary: string, topCategories: string[], tip: string }> {
    checkRateLimit();
    const recentExpenses = expenses.slice(0, 30); // max 30 to save tokens
    const jsonExpenses = JSON.stringify(recentExpenses.map(e => ({ item: e.text, amount: e.amount, category: e.category, date: e.date })));
    
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Analyze these expenses from the past 7 days of an Indonesian college student: ${jsonExpenses}.
        Generate a weekly summary that looks like a handwritten ledger note:
        1. A friendly, conversational short paragraph in Bahasa Indonesia slang summarizing their past 7 days spending. Keep it direct and impactful.
        2. Top 3 spending categories (as an array of strings).
        3. One personalized, actionable tip.
        Output as JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    topCategories: { type: Type.ARRAY, items: { type: Type.STRING } },
                    tip: { type: Type.STRING }
                },
                required: ["summary", "topCategories", "tip"]
            }
        }
    });

    return JSON.parse(response.text?.trim() || "{}");
}

export async function generateSavingsChallenge(expenses: Expense[]): Promise<{ text: string, targetAmount: number }> {
    checkRateLimit();
    const recentExpenses = expenses.slice(0, 30);
    const jsonExpenses = JSON.stringify(recentExpenses.map(e => ({ item: e.text, amount: e.amount, category: e.category })));
    
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Analyze these recent expenses of an Indonesian college student: ${jsonExpenses}.
        Suggest ONE achievable weekly savings challenge. Wait, the response should be in Bahasa Indonesia slang, friendly.
        e.g., "Minggu ini coba kurangin jajan online 20%. Kalau berhasil, lo hemat sekitar Rp50.000."
        Return the challenge text and the estimated target/saved amount in Rupiah.
        Output JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    targetAmount: { type: Type.NUMBER }
                },
                required: ["text", "targetAmount"]
            }
        }
    });

    return JSON.parse(response.text?.trim() || "{}");
}

export async function detectRecurringExpense(expenses: Expense[]): Promise<{ detected: boolean, text: string, projection6Months: number } | null> {
    checkRateLimit();
    const recentExpenses = expenses.slice(0, 50);
    const jsonExpenses = JSON.stringify(recentExpenses.map(e => ({ item: e.text, amount: e.amount, date: e.date })));
    
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Analyze these expenses: ${jsonExpenses}.
        Is there a recurring expense pattern? (e.g., coffee every morning, or grab/gojek every weekday).
        If yes, generating a friendly message in Bahasa Indonesia slang pointing it out, and the projected cost for 6 months (number).
        If no clear pattern, set detected to false.
        Output JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    detected: { type: Type.BOOLEAN },
                    text: { type: Type.STRING },
                    projection6Months: { type: Type.NUMBER }
                },
                required: ["detected", "text", "projection6Months"]
            }
        }
    });

    return JSON.parse(response.text?.trim() || "null");
}

export async function generateMicroLesson(expenses: Expense[]): Promise<{ title: string, content: string, question: string, correctAnswer: string, options: string[] }> {
    checkRateLimit();
    const recentExpenses = expenses.slice(0, 30);
    const jsonExpenses = JSON.stringify(recentExpenses.map(e => ({ item: e.text, amount: e.amount, category: e.category })));
    
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Analyze these expenses: ${jsonExpenses}.
        Generate a short (2-3 paragraphs) financial literacy micro-lesson relevant to their spending pattern for an Indonesian college student, in casual Bahasa Indonesia.
        Then, generate a 1-question multiple-choice quiz based on the lesson to test their understanding.
        Output JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    question: { type: Type.STRING },
                    correctAnswer: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "content", "question", "correctAnswer", "options"]
            }
        }
    });

    return JSON.parse(response.text?.trim() || "{}");
}

export async function generateProyeksi(expenses: Expense[]): Promise<{
    latteFactor: {
        items: string[];
        yearlyCost: number;
        equivalentText: string;
    },
    investmentMachine: {
        currentMonthly: number;
        projected1Y: number;
        projected3Y: number;
        projected5Y: number;
        encouragement: string;
    }
}> {
    checkRateLimit();
    const jsonExpenses = JSON.stringify(expenses.map(e => ({ item: e.text, amount: e.amount, category: e.category, date: e.date })));
    
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Analyze these expenses of an Indonesian college student: ${jsonExpenses}.
        Generate a projection with two parts:
        1. 'latteFactor': Identify up to 3 most frequent small/recurring "Keinginan" (wants) expenses (like coffee, snacks). Estimate their total cost over 1 year. Provide an 'equivalentText' explaining what this yearly cost is equivalent to (e.g., X grams of gold or Y bulan uang kos, assuming gold is Rp 1.400.000/g and rent is Rp 1.500.000/month). Give a short Bahasa Indonesia slang text.
        2. 'investmentMachine': Sum all 'Investasi' (investment) expenses to estimate current total or monthly investment (in IDR). Project its future value over 1, 3, and 5 years assuming a 10% annual return. Provide an encouraging sentence (slang Bahasa Indonesia) 'encouragement'. If no investment is found, use 0 and encourage them to start.
        Output as JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    latteFactor: {
                        type: Type.OBJECT,
                        properties: {
                            items: { type: Type.ARRAY, items: { type: Type.STRING } },
                            yearlyCost: { type: Type.NUMBER },
                            equivalentText: { type: Type.STRING }
                        },
                        required: ["items", "yearlyCost", "equivalentText"]
                    },
                    investmentMachine: {
                        type: Type.OBJECT,
                        properties: {
                            currentMonthly: { type: Type.NUMBER },
                            projected1Y: { type: Type.NUMBER },
                            projected3Y: { type: Type.NUMBER },
                            projected5Y: { type: Type.NUMBER },
                            encouragement: { type: Type.STRING }
                        },
                        required: ["currentMonthly", "projected1Y", "projected3Y", "projected5Y", "encouragement"]
                    }
                },
                required: ["latteFactor", "investmentMachine"]
            }
        }
    });

    return JSON.parse(response.text?.trim() || "{}");
}
