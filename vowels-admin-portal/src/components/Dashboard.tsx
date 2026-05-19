import { useState, useEffect, useMemo } from "react";
import { db, auth } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

interface Student {
  id: number;
  name: string;
  class: string;
  section: string;
  totalFee: number;
  dueFee: number;
}

export function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

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

  const totalRevenue = useMemo(() => students.reduce((sum, s) => sum + s.totalFee, 0), [students]);
  const totalDues = useMemo(() => students.reduce((sum, s) => sum + s.dueFee, 0), [students]);

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
      <div>
        <h1 className="text-3xl font-light text-black tracking-tight">Welcome <span className="font-semibold">{auth.currentUser?.displayName || 'Thirupathi Reddy Junuthula'}</span></h1>
        <p className="text-[#1A1A1C] mt-1">Here is a quick overview of Vowels School.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col justify-between items-start">
          <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total School Revenue</h2>
          <div className="text-4xl font-light text-black tracking-tight">
            {formatINR(totalRevenue)}
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col justify-between items-start">
          <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Outstanding Dues</h2>
          <div className="text-4xl font-light text-red-500 tracking-tight">
            {formatINR(totalDues)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col justify-between items-start">
          <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Students Enrolled</h2>
          <div className="text-4xl font-light text-black tracking-tight">
            {students.length}
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col justify-between items-start">
          <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Teachers</h2>
          <div className="text-4xl font-light text-black tracking-tight">
            14
          </div>
        </div>
      </div>
    </div>
  );
}
