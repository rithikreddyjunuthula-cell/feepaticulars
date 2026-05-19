import { Home, Users, CreditCard, Settings, GraduationCap } from "lucide-react";
import { cn } from "../lib/utils";

const navItems = [
  { name: "Dashboard", icon: Home, id: "dashboard" },
  { name: "Students", icon: Users, id: "students" },
  { name: "Fees", icon: CreditCard, id: "fees" },
  { name: "Academics", icon: GraduationCap, id: "academics" },
  { name: "Settings", icon: Settings, id: "settings" },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user?: any;
  onSignOut?: () => void;
}

export function Sidebar({ activeTab, onTabChange, user, onSignOut }: SidebarProps) {
  return (
    <aside className="w-64 h-screen border-r-[3px] border-[#0000ff] bg-[#f8f8f8] flex flex-col p-4 flex-shrink-0">
      <div className="flex items-center justify-center px-2 py-4 mb-6">
        <img 
          src="/Vowels School Logo.png" 
          alt="Vowels School" 
          className="h-16 object-contain bg-white rounded-lg p-2" 
          onError={(e) => { 
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextElementSibling) {
              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
            }
          }} 
        />
        <div className="hidden text-xl font-medium tracking-tight text-white font-sans">Vowels</div>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.name}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium w-full text-left",
                isActive
                  ? "bg-[#0000ff] text-white"
                  : "text-[#8E9299] hover:bg-[#1A1A1C] hover:text-white"
              )}
            >
              <Icon size={18} className="opacity-80" />
              {item.name}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-2 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#1A1A1C] border border-[#2A2A2A] flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
            {user?.displayName?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-medium text-white truncate">{user?.displayName || 'Admin User'}</span>
            <span className="text-[10px] text-[#8E9299] truncate">{user?.email || 'admin@school'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
