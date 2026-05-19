import React, { useState } from "react";
import { X, Edit2, Check, Loader2, Receipt } from "lucide-react";
import { PaymentModal } from "./PaymentModal";

interface Student {
  id: number;
  name: string;
  fatherName?: string;
  class: string;
  section: string;
  totalFee: number;
  dueFee: number;
  termDues?: { [key: number]: number };
  studentImage?: string;
  docId?: string;
}

interface StudentDetailsModalProps {
  student: Student | null;
  onClose: () => void;
  onUpdate?: (updatedStudent: Student) => void;
}

export function StudentDetailsModal({ student, onClose, onUpdate }: StudentDetailsModalProps) {
  const [editingTerm, setEditingTerm] = useState<number | null>(null);
  const [editDueVal, setEditDueVal] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  if (!student) return null;

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const termTotal = student.totalFee / 3;
  let remainingCollected = student.totalFee - student.dueFee;

  const terms = [
    { id: 1, name: "Term 1", total: termTotal, due: 0, collected: 0, overridden: false },
    { id: 2, name: "Term 2", total: termTotal, due: 0, collected: 0, overridden: false },
    { id: 3, name: "Term 3", total: termTotal, due: 0, collected: 0, overridden: false },
  ];

  const manualDues = student.termDues || {};
  let poolDue = student.dueFee;

  terms.forEach(term => {
    if (manualDues[term.id] !== undefined) {
      let manualDue = Math.max(0, Math.min(manualDues[term.id], term.total));
      term.due = manualDue;
      term.overridden = true;
      poolDue -= manualDue;
    }
  });

  let activeTerms = terms.filter(t => !t.overridden);
  let safety = 10;
  while (activeTerms.length > 0 && poolDue > 0 && safety-- > 0) {
    let splitAmt = poolDue / activeTerms.length;
    let distributed = false;

    activeTerms.sort((a, b) => (a.total - a.due) - (b.total - b.due));

    for (let i = 0; i < activeTerms.length; i++) {
      let term = activeTerms[i];
      let capacity = term.total - term.due;
      if (splitAmt > capacity) {
        term.due += capacity;
        poolDue -= capacity;
        activeTerms.splice(i, 1);
        distributed = true;
        break;
      }
    }
    
    if (!distributed) {
      activeTerms.forEach(term => {
        term.due += splitAmt;
        poolDue -= splitAmt;
      });
      break;
    }
  }

  terms.forEach(term => {
    term.collected = term.total - term.due;
  });

  const collected = student.totalFee - student.dueFee;

  const handleUpdate = async () => {
    if (editingTerm === null) return;
    setIsUpdating(true);

    let newDue = parseInt(editDueVal, 10);
    if (isNaN(newDue)) newDue = terms.find(t => t.id === editingTerm)!.due;
    
    newDue = Math.max(0, Math.min(newDue, termTotal)); // clamp

    const newTermDues = { ...manualDues, [editingTerm]: newDue };

    try {
      if (!student.docId) { console.error("No document ID"); return; }
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await updateDoc(doc(db, "students", student.docId), { termDues: newTermDues });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
      setEditingTerm(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#151619] border border-[#2A2A2A] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A] bg-[#0A0A0A]/50">
          <div className="flex items-center gap-4">
            {student.studentImage ? (
              <img src={student.studentImage} alt={student.name} className="w-16 h-16 rounded-full object-cover border border-[#2A2A2A]" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#1A1A1C] border border-[#2A2A2A] flex items-center justify-center">
                 <span className="text-xl font-bold text-[#8E9299]">
                   {student.name.charAt(0).toUpperCase()}
                 </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-medium text-white">{student.name}</h2>
              {student.fatherName && <p className="text-[#8E9299] text-sm mt-0.5">D/O, S/O: {student.fatherName}</p>}
              <p className="text-[#8E9299] text-sm mt-1">Class {student.class} - Section {student.section}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {student.dueFee > 0 && (
              <button
                onClick={() => setShowPayment(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all rounded-lg text-sm font-medium"
              >
                <Receipt size={16} />
                Generate Receipt (Pay Fee)
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-[#8E9299] hover:text-white transition-colors rounded-lg hover:bg-[#2A2A2A]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#2A2A2A]">
              <p className="text-[#8E9299] text-xs font-medium uppercase tracking-wider mb-1">Total Fee</p>
              <p className="text-lg font-medium text-white">{formatINR(student.totalFee)}</p>
            </div>
            <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#2A2A2A]">
              <p className="text-[#8E9299] text-xs font-medium uppercase tracking-wider mb-1">Total Collected</p>
              <p className="text-lg font-medium text-emerald-400">{formatINR(collected)}</p>
            </div>
            <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#2A2A2A]">
              <p className="text-[#8E9299] text-xs font-medium uppercase tracking-wider mb-1">Total Due</p>
              <p className="text-lg font-medium text-red-400">{formatINR(student.dueFee)}</p>
            </div>
            <div className="bg-[#0A0A0A] p-4 rounded-xl border border-[#2A2A2A]">
              <p className="text-[#8E9299] text-xs font-medium uppercase tracking-wider mb-1">Status</p>
              <p className="text-lg font-medium">
                {student.dueFee === 0 ? (
                  <span className="text-emerald-400">Cleared</span>
                ) : (
                  <span className="text-red-400">Pending</span>
                )}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-4">Term Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {terms.map((term, index) => (
                <div key={term.id} className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 relative group">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-white font-medium">{term.name}</h4>
                    {editingTerm !== term.id ? (
                      <button
                        onClick={() => {
                          setEditingTerm(term.id);
                          setEditDueVal(term.due.toString());
                        }}
                        className="text-[#8E9299] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit Term Due Fee"
                      >
                        <Edit2 size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                        title="Save Changes"
                      >
                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#8E9299]">Expected</span>
                      <span className="text-white">{formatINR(term.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E9299] flex items-center gap-1">Collected <span className="text-[10px] text-emerald-500/70 lowercase opacity-80">(auto)</span></span>
                      <span className="text-emerald-400">{formatINR(term.collected)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-[#2A2A2A] pt-2 mt-2">
                      <span className="text-[#8E9299]">Due</span>
                      {editingTerm === term.id ? (
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8E9299] text-xs">₹</span>
                          <input
                            type="number"
                            autoFocus
                            className="bg-[#151619] border border-orange-500/50 rounded pl-5 pr-2 py-1 text-red-400 text-right focus:outline-none focus:ring-1 focus:ring-orange-500/50 w-24"
                            value={editDueVal}
                            onChange={(e) => setEditDueVal(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                            onBlur={() => {
                              // Only auto-save if we changed something, but to be safe let's just use the button or enter key
                            }}
                          />
                        </div>
                      ) : (
                        <span 
                          className="text-red-400 cursor-pointer"
                          onClick={() => {
                            setEditingTerm(term.id);
                            setEditDueVal(term.due.toString());
                          }}
                        >
                          {formatINR(term.due)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {showPayment && (
        <PaymentModal
          student={student}
          onClose={() => setShowPayment(false)}
          onSuccess={(updatedStudent) => {
            onUpdate?.(updatedStudent);
          }}
        />
      )}
    </div>
  );
}
