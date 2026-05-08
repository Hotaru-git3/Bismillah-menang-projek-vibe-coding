export interface ParsedExpense {
  amount: number;
  text: string;
  category: 'Makanan' | 'Transport' | 'Belanja' | 'Hiburan' | 'Lainnya' | 'Kebutuhan' | 'Investasi' | 'Keinginan';
  nudge: string;
  splitBill?: {
    totalAmount: number;
    myShare: number;
    friendNames: string[];
  };
}
