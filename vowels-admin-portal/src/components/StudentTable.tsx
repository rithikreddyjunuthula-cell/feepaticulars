import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Filter, AlertCircle, CheckCircle2, UserPlus, Trash2, Eye } from "lucide-react";
import { cn } from "../lib/utils";
import { AddStudentModal } from "./AddStudentModal";
import { StudentDetailsModal } from "./StudentDetailsModal";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";

interface Student {
  id: number;
  name: string;
  fatherName?: string;
  class: string;
  section: string;
  totalFee: number;
  dueFee: number;
  studentImage?: string;
  docId?: string; // Add firestore document ID
}

export function StudentTable() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "students"), (snapshot) => {
      const data: Student[] = [];
      snapshot.forEach(doc => {
        data.push({ ...doc.data() as Student, docId: doc.id });
      });
      setStudents(data);
      setLoading(false);
    }, (error) => {
       console.error("Firestore Error: ", error);
       setLoading(false);
       alert("Permission denied or error reading database. Please log in with a verified email.");
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id: number) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId === null) return;
    const student = students.find(s => s.id === confirmDeleteId);
    setConfirmDeleteId(null);
    if (!student || !student.docId) return;
    setDeletingId(student.id);
    try {
      await deleteDoc(doc(db, "students", student.docId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete student");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesClass = classFilter === "All" || s.class === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, search, classFilter]);

  const classes = useMemo(() => {
    const unique = Array.from(new Set(students.map((s) => s.class)));
    return ["All", ...unique.sort((a, b) => Number(a) - Number(b))];
  }, [students]);

  // Format currency
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && students.length === 0) {
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
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#ffffff] p-2 pr-4 rounded-xl border border-[#2A2A2A]">
        <div className="relative flex-1 w-full sm:max-w-md ml-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9299]" size={18} />
          <input
            type="text"
            placeholder="Search students by name..."
            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-[#5A5D63] pl-10 py-2.5 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9299] pointer-events-none" size={16} />
            <select
              className="appearance-none bg-[#ffffff] border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors text-[#0000ff] rounded-lg pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              {classes.map((c) => (
                <option key={c} value={c}>Class: {c}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-black font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <UserPlus size={16} />
            <span>New Admission</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#151619] rounded-2xl border border-[#2A2A2A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Table content already exists above */}
            <thead>
              <tr className="border-b border-[#2A2A2A] bg-[#0A0A0A]/50">
                <th className="px-6 py-4 bg-[#9664c8] text-[#ffffff] font-medium text-xs uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 bg-[#9664c8] text-[#ffffff] font-medium text-xs uppercase tracking-wider">Class & Sec</th>
                <th className="px-6 py-4 bg-[#9664c8] text-[#ffffff] font-medium text-xs uppercase tracking-wider">Total Fee</th>
                <th className="px-6 py-4 bg-[#9664c8] text-[#ffffff] font-medium text-xs uppercase tracking-wider text-right">Outstanding Due</th>
                <th className="px-6 py-4 bg-[#9664c8] text-[#ffffff] font-medium text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-[#f3f4f6] transition-colors group cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <td className="px-6 py-4 font-medium text-[#000000] bg-[#ffffff] transition-colors">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 bg-[#ffffff]">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-[#ffffff] border-0 text-[16px] font-mono text-[#000000]">
                        {student.class} - {student.section}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#000000] font-mono text-[18px] bg-[#ffffff]">
                      {formatINR(student.totalFee)}
                    </td>
                    <td className="px-6 py-4 text-right bg-[#ffffff]">
                      <div className="inline-flex items-center justify-end gap-2">
                        <span className={cn(
                          "font-mono text-[18px] text-center font-medium",
                          student.dueFee > 0 ? "text-red-400" : "text-emerald-400"
                        )}>
                          {formatINR(student.dueFee)}
                        </span>
                        {student.dueFee > 0 ? (
                          <AlertCircle size={16} className="text-red-400/80" />
                        ) : (
                          <CheckCircle2 size={16} className="text-emerald-400/80" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right bg-[#ffffff]">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(student.id);
                          }}
                          disabled={deletingId === student.id}
                          className="p-2 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Admission"
                        >
                          <Trash2 size={16} className="text-[#0000ff] bg-[#ffffff]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#5A5D63] text-sm">
                    No students found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddStudentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {/* automatically updated by snapshot */}}
      />

      <StudentDetailsModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onUpdate={(updatedStudent) => {
          setSelectedStudent(updatedStudent);
        }}
      />

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151619] border border-[#2A2A2A] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-medium text-white mb-2">Delete Admission</h3>
              <p className="text-[#8E9299]">Are you sure you want to delete this admission? This action cannot be undone.</p>
            </div>
            <div className="p-4 border-t border-[#2A2A2A] bg-[#0A0A0A]/50 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-[#8E9299] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
