import React, { useState } from "react";
import { X } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    class: "",
    section: "",
    totalFee: "",
    dueFee: "",
    studentImage: ""
  });

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, studentImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "students"), {
        id: Date.now(), // Generate a numeric ID to keep schema compatible quickly
        name: formData.name,
        fatherName: formData.fatherName || "",
        class: formData.class,
        section: formData.section,
        totalFee: Number(formData.totalFee),
        dueFee: Number(formData.dueFee),
        studentImage: formData.studentImage || ""
      });
      onSuccess();
      setFormData({ name: "", fatherName: "", class: "", section: "", totalFee: "", dueFee: "", studentImage: "" });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to add student. Ensure you are signed in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#fff30f] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-[#8E9299] hover:text-black transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-medium tracking-tight text-[#000000] mb-6 bg-[#fff30f] ml-[125px]">New Admission</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E9299] mb-1.5">Student Name</label>
              <input 
                required
                type="text"
                className="w-full bg-[#ffffff] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium"
                placeholder="e.g. Jane Doe"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E9299] mb-1.5">Father's Name</label>
              <input 
                required
                type="text"
                className="w-full bg-[#ffffff] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-medium"
                placeholder="e.g. John Doe"
                value={formData.fatherName}
                onChange={(e) => setFormData(prev => ({ ...prev, fatherName: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E9299] mb-1.5">Class</label>
              <input 
                required
                type="text"
                className="w-full bg-[#ffffff] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-mono"
                placeholder="e.g. 10"
                value={formData.class}
                onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E9299] mb-1.5">Section</label>
              <input 
                required
                type="text"
                className="w-full bg-[#ffffff] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-mono"
                placeholder="e.g. A"
                value={formData.section}
                onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E9299] mb-1.5">Total Fee (₹)</label>
              <input 
                required
                type="number"
                min="0"
                className="w-full bg-[#ffffff] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-mono"
                placeholder="e.g. 5000"
                value={formData.totalFee}
                onChange={(e) => setFormData(prev => ({ ...prev, totalFee: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E9299] mb-1.5">Due Fee (₹)</label>
              <input 
                required
                type="number"
                min="0"
                className="w-full bg-[#ffffff] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all font-mono"
                placeholder="e.g. 1500"
                value={formData.dueFee}
                onChange={(e) => setFormData(prev => ({ ...prev, dueFee: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E9299] mb-1.5">Student Image (Optional)</label>
            <input 
              type="file"
              accept="image/*"
              className="w-full bg-[#ffffff] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-[#000000] focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
              onChange={handleImageUpload}
            />
            {formData.studentImage && (
              <img src={formData.studentImage} alt="Preview" className="max-h-20 mt-2 rounded" />
            )}
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? "Adding..." : "Add Admission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
