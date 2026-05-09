export interface ParsedExpense {
  amount: number;
  text: string;
  category: string;
  nudge: string;
  splitBill?: {
    totalAmount: number;
    myShare: number;
    friendNames: string[];
  };
}
