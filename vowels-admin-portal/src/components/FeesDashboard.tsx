import { useState, useEffect, useMemo } from "react";
import { Edit2, Check } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

interface Student {
  id: number;
  name: string;
  class: string;
  section: string;
  totalFee: number;
  dueFee: number;
}

export function FeesDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Local state for administrative overrides of due fees per term
  const [manualDues, setManualDues] = useState<{ [key: number]: string }>({});
  const [editingTerm, setEditingTerm] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "students"), (snapshot) => {
      const data: Student[] = [];
      snapshot.forEach(doc => {
        data.push(doc.data() as Student);
      });
      setStudents(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error: ", error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const termData = useMemo(() => {
    let t1Total = 0, t2Total = 0, t3Total = 0;
    let totalDue = 0;

    // 1. Calculate the expected term totals by summing total fees of all students
    students.forEach((s) => {
      totalDue += s.dueFee;
      const termTotal = s.totalFee / 3;
      t1Total += termTotal;
      t2Total += termTotal;
      t3Total += termTotal;
    });

    const terms = [
      { id: 1, name: "Term 1", total: t1Total, due: 0, collected: 0, overridden: false },
      { id: 2, name: "Term 2", total: t2Total, due: 0, collected: 0, overridden: false },
      { id: 3, name: "Term 3", total: t3Total, due: 0, collected: 0, overridden: false },
    ];

    let poolDue = totalDue;

    // 2. Apply admin overrides first
    terms.forEach(term => {
      if (manualDues[term.id] !== undefined && manualDues[term.id] !== "") {
        let val = Number(manualDues[term.id]);
        val = Math.max(0, Math.min(val, term.total)); // clamp between 0 and total
        term.due = val;
        term.overridden = true;
        poolDue -= val;
      }
    });

    // 3. Distribute remaining due fee evenly among non-overridden terms
    let activeTerms = terms.filter(t => !t.overridden);
    let safety = 10;
    while (activeTerms.length > 0 && poolDue > 0 && safety-- > 0) {
      let splitAmt = poolDue / activeTerms.length;
      let distributed = false;

      // Sort primarily by capacity to safely fill smaller buckets first
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

    return terms;
  }, [students, manualDues]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-[#8E9299]">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#2A2A2A]"></div>
          <div className="w-4 h-4 rounded-full bg-[#2A2A2A] animation-delay-200"></div>
          <div className="w-4 h-4 rounded-full bg-[#2A2A2A] animation-delay-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 p-8 space-y-6 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {termData.map((term) => (
          <div key={term.id} className="bg-[#151619] border border-[#2A2A2A] rounded-2xl overflow-hidden flex flex-col group">
            <div className="p-4 border-b border-[#2A2A2A] bg-[#9664c8] flex justify-between items-center">
              <h2 className="text-lg font-medium text-white tracking-tight ml-[60px]">{term.name}</h2>
              {editingTerm !== term.id ? (
                <button
                  onClick={() => {
                    setEditingTerm(term.id);
                    setManualDues(prev => ({ ...prev, [term.id]: term.due.toString() }));
                  }}
                  className="text-[#8E9299] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  title={`Edit Due Fee for ${term.name}`}
                >
                  <Edit2 size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setEditingTerm(null)}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Done Editing"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
            <div className="p-6 space-y-6 flex-1 flex flex-col justify-center bg-[#ffffff]">
              <div>
                <p className="text-[#8E9299] text-xs font-semibold uppercase tracking-wider mb-1 ml-[20px]">Total Fee Expected</p>
                <p className="text-2xl font-light text-[#000000] tracking-tight mx-[45px]">{formatINR(term.total)}</p>
              </div>
              
              <div className="relative">
                <p className="text-[#8E9299] text-xs font-semibold uppercase tracking-wider mb-1 mx-[50px]">Fee Due</p>
                {editingTerm === term.id ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9299]">₹</span>
                    <input
                      type="number"
                      autoFocus
                      className="w-full bg-[#0A0A0A] border border-orange-500/50 rounded-lg pl-8 pr-4 py-2 text-2xl font-light text-red-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                      value={manualDues[term.id] ?? term.due}
                      onChange={(e) => setManualDues(prev => ({ ...prev, [term.id]: e.target.value }))}
                      onBlur={() => setEditingTerm(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingTerm(null)}
                    />
                  </div>
                ) : (
                  <p className="text-2xl font-light text-red-400 tracking-tight cursor-pointer mx-[50px]"
                     onClick={() => {
                       setEditingTerm(term.id);
                       setManualDues(prev => ({ ...prev, [term.id]: term.due.toString() }));
                     }}>
                    {formatINR(term.due)}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[#8E9299] text-xs font-semibold uppercase tracking-wider mb-1 flex justify-between items-end mx-[30px]">
                  Fee Collected
                  <span className="text-[10px] text-emerald-500/70 lowercase opacity-80">(auto-adjusts)</span>
                </p>
                <p className="text-2xl font-light text-emerald-400 tracking-tight mx-[45px]">{formatINR(term.collected)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
