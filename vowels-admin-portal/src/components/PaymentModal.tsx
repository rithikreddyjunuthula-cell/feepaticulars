import React, { useState } from "react";
import { X, Printer, CheckCircle2 } from "lucide-react";

interface Student {
  id: number;
  name: string;
  fatherName?: string;
  class: string;
  section: string;
  totalFee: number;
  dueFee: number;
  docId?: string;
}

interface PaymentModalProps {
  student: Student;
  onClose: () => void;
  onSuccess: (updatedStudent: Student) => void;
}

export function PaymentModal({ student, onClose, onSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const numberToWords = (num: number): string => {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    
    if (num === 0) return 'Zero';
    if (num.toString().length > 9) return 'Overflow';
    
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    
    let str = '';
    str += (n[1] != '00') ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (n[2] != '00') ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (n[3] != '00') ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (n[4] != '0') ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
    
    return str.trim() + ' Only';
  };

  const handlePayment = async () => {
    const payAmt = parseInt(amount, 10);
    if (isNaN(payAmt) || payAmt <= 0) return;
    if (payAmt > student.dueFee) return;

    setIsSubmitting(true);
    try {
      const newDueFee = student.dueFee - payAmt;
      
      if (!student.docId) { console.error("No docId"); return; }
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      await updateDoc(doc(db, "students", student.docId), { dueFee: Math.max(0, newDueFee) });

      const updated = { ...student, dueFee: Math.max(0, newDueFee) };
      setReceiptData({
        receiptNo: `REC-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        date: new Date().toLocaleDateString(),
        amount: payAmt,
        method,
        updatedStudent: updated
      });
      onSuccess(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (receiptData) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        {/* On screen preview container */}
        <div className="bg-transparent text-black w-full max-w-[950px] max-h-[90vh] overflow-y-auto relative flex flex-col print:overflow-visible print:w-auto print:h-auto print:block">
          <style>
            {`
              @media print {
                @page { 
                  size: auto;
                  margin: 0; 
                }
                body * {
                  visibility: hidden;
                }
                #print-container, #print-container * {
                  visibility: visible;
                }
                #print-container {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  margin: 0;
                  padding: 0;
                  background: white;
                  box-shadow: none !important;
                  border: none !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}
          </style>

          <div id="print-container" className="bg-white rounded-[20px] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-200 relative shrink-0">
            {/* Top Decorative Bar */}
            <div className="h-[10px] bg-gradient-to-r from-[#4338ca] via-[#f97316] to-[#15803d]"></div>
            
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <img src="/Vowels School Logo.png" alt="" className="w-1/2 object-contain filter grayscale" />
              </div>
              
              {/* Header Section */}
              <div className="px-[50px] py-[30px] flex justify-between items-center bg-white border-b-2 border-slate-100 relative z-10">
                  <div className="flex items-center gap-[20px]">
                      <img src="/Vowels School Logo.png" alt="Vowels School Logo" className="w-[85px] h-[85px] object-contain drop-shadow-sm" />
                      <div className="text-left">
                        <h1 className="m-0 text-[32px] text-[#4338ca] uppercase tracking-[1px] font-bold">Vowels School</h1>
                        <p className="m-0 text-[#64748b] font-medium text-[15px]">Excellence in Every Vowel • Estd. 2018</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-[#f97316] text-white px-[18px] py-[6px] rounded-[50px] font-extrabold text-[14px] inline-block mb-[10px] tracking-wide">FEE RECEIPT</div>
                    <p className="m-0 font-bold text-[#1e293b]">Date: {receiptData.date}</p>
                    <p className="m-0 font-bold text-[#1e293b] text-sm mt-1">Receipt #{receiptData.receiptNo}</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-[50px] py-[40px]">
                <div className="grid grid-cols-4 gap-[30px] mb-[40px] text-left">
                    <div className="border-b-[2px] border-slate-200 pb-[8px]">
                        <label className="block text-[11px] font-bold text-[#4338ca] uppercase mb-[8px]">Student Name</label>
                        <span className="text-[#1e293b] font-semibold text-[15px]">{student.name}</span>
                    </div>
                    <div className="border-b-[2px] border-slate-200 pb-[8px]">
                        <label className="block text-[11px] font-bold text-[#4338ca] uppercase mb-[8px]">Father's Name</label>
                        <span className="text-[#1e293b] font-semibold text-[15px]">{student.fatherName || 'N/A'}</span>
                    </div>
                    <div className="border-b-[2px] border-slate-200 pb-[8px]">
                        <label className="block text-[11px] font-bold text-[#4338ca] uppercase mb-[8px]">Class & Section</label>
                        <span className="text-[#1e293b] font-semibold text-[15px]">{student.class} - {student.section}</span>
                    </div>
                    <div className="border-b-[2px] border-slate-200 pb-[8px]">
                        <label className="block text-[11px] font-bold text-[#4338ca] uppercase mb-[8px]">Payment Method</label>
                        <span className="text-[#1e293b] font-semibold text-[15px]">{receiptData.method}</span>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-[12px] overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="bg-[#4338ca] text-white p-[15px] text-left font-medium border-none">Fee Description</th>
                                <th className="bg-[#4338ca] text-white p-[15px] text-left font-medium border-none w-[250px]">Amount (INR)</th>
                            </tr>
                        </thead>
                        <tbody className="border-t-0">
                            <tr>
                                <td className="p-[18px_15px] border-b border-slate-100 font-medium text-slate-700 text-left">Fee Paid</td>
                                <td className="p-[18px_15px] border-b border-slate-100 text-left font-semibold">₹ {formatINR(receiptData.amount).replace('₹', '').trim()}</td>
                            </tr>
                            <tr className="bg-[#f0fdf4] text-[#15803d]">
                                <td className="p-[18px_15px] text-right font-bold border-b border-slate-100">TOTAL PAID:</td>
                                <td className="p-[18px_15px] text-left font-extrabold border-b border-slate-100">₹ {formatINR(receiptData.amount).replace('₹', '').trim()}</td>
                            </tr>
                            <tr className="bg-[#fff7ed] text-[#f97316]">
                                <td className="p-[18px_15px] text-right font-bold">REMAINING DUE:</td>
                                <td className="p-[18px_15px] text-left font-extrabold">₹ {formatINR(receiptData.updatedStudent.dueFee).replace('₹', '').trim()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-[20px] text-left bg-slate-50 p-[15px] rounded-[10px] border border-slate-100">
                    <p className="text-[11px] text-[#4338ca] font-bold mb-[4px] uppercase tracking-wide">Amount in Words</p>
                    <p className="text-[15px] font-bold text-[#1e293b] italic capitalize">{numberToWords(receiptData.amount)}</p>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-[#f8fafc] px-[50px] py-[30px] flex justify-between items-center text-left">
                <div className="text-[12px] text-[#94a3b8] leading-relaxed">
                    <strong className="text-slate-500 font-bold">Powered by Axon Labs</strong><br />
                    Karimnagar, Telangana
                </div>
                <div className="text-center">
                    <div className="w-[220px] border-t-2 border-[#1e293b] pt-[10px] font-bold text-[#4338ca]">Authorized Signatory</div>
                </div>
            </div>
          </div>

          <div className="p-4 bg-transparent flex justify-end gap-3 no-print mt-2 shrink-0">
            <button
              onClick={onClose}
              className="px-[30px] py-[15px] font-bold text-slate-700 bg-white rounded-[50px] hover:bg-slate-50 transition-colors shadow-sm border border-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={() => window.print()}
              className="px-[30px] py-[15px] font-bold bg-[#4338ca] text-white rounded-[50px] hover:bg-indigo-700 transition-transform flex items-center gap-2 shadow-[0_10px_15px_-3px_rgba(79,70,229,0.4)] hover:-translate-y-1"
            >
              <Printer size={18} />
              PRINT RECEIPT
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-[#151619] border border-[#2A2A2A] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A] bg-[#0A0A0A]/50">
          <div>
            <h2 className="text-xl font-medium text-white">Record Payment</h2>
            <p className="text-[#8E9299] text-sm mt-1">For {student.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8E9299] hover:text-white transition-colors rounded-lg hover:bg-[#2A2A2A]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#8E9299] mb-1">Current Due Fee</label>
            <p className="text-xl text-red-400 font-medium">{formatINR(student.dueFee)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8E9299] mb-1">Payment Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              max={student.dueFee}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all font-medium text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8E9299] mb-1">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {['UPI', 'Cash', 'Card'].map(m => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    method === m 
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' 
                    : 'bg-[#0A0A0A] text-[#8E9299] border-[#2A2A2A] hover:bg-[#1A1A1C]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#2A2A2A] bg-[#0A0A0A]/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#8E9299] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isSubmitting || !amount || parseInt(amount, 10) <= 0 || parseInt(amount, 10) > student.dueFee}
            className="px-4 py-2 text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Record Payment & Generate Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
}
