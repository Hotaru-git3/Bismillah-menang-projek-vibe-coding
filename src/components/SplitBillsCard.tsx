import React, { useState } from 'react';
import { Users, Copy, Trash2, X } from 'lucide-react';
import { useFirebase } from './FirebaseProvider';
import { deleteSplitBillFromFirestore } from '../utils/firebaseUtils';

export default function SplitBillsCard() {
  const { splitBills } = useFirebase();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
     try {
       navigator.clipboard.writeText(text);
     } catch (e) {
       console.error("Clipboard failed", e);
     }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSplitBillFromFirestore(id);
      setConfirmDeleteId(null);
    } catch(err) {
      console.error(err);
    }
  };

  if (!splitBills || splitBills.length === 0) return null;

  return (
    <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-rk-brown/5">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-rk-brown/60" />
        <h3 className="font-medium text-rk-brown text-sm">Draft Tagihan (Split Bill)</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {splitBills.map((bill, index) => (
          <div key={index} className="bg-rk-cream/30 p-3 rounded-xl border border-rk-brown/5 relative group">
              {confirmDeleteId === bill.id ? (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 rounded-xl flex flex-col items-center justify-center p-4">
                  <p className="text-sm font-medium text-rk-brown mb-3">Yakin mau hapus draft ini?</p>
                  <div className="flex items-center gap-2 w-full">
                    <button 
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 py-1.5 text-xs font-semibold text-rk-brown/60 hover:bg-rk-brown/5 border border-rk-brown/10 rounded-lg transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={() => handleDelete(bill.id)}
                      className="flex-1 py-1.5 text-xs font-semibold text-white bg-rk-red hover:bg-rk-red/90 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setConfirmDeleteId(bill.id)}
                  className="absolute top-2 right-2 p-1.5 text-rk-brown/30 hover:text-rk-red opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10 bg-white/80 rounded-full"
                  title="Hapus Draft"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              
              <p className="font-medium text-rk-brown text-sm mb-2 pr-6">{bill.text} (Total Rp {bill.originalAmount.toLocaleString('id-ID')})</p>
              <div className="space-y-2">
                {bill.friends.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-rk-brown/5 text-sm">
                      <span className="text-rk-brown/80">{f.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-rk-brown">Rp {f.amount.toLocaleString('id-ID')}</span>
                        <button 
                          onClick={() => copyToClipboard(`Eh, patungan ${bill.text} kemaren lo masih utang Rp ${f.amount.toLocaleString('id-ID')} nih 😄`)}
                          className="cursor-pointer p-1.5 text-rk-brown/40 hover:text-rk-gold-dark hover:bg-rk-gold/10 rounded-md transition-colors"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
                ))}
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}
