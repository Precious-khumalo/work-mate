import { Home, Mail, FileText, CalendarCheck, MessageSquare, Info, ShieldCheck, X } from 'lucide-react';

export type PageId = 'dashboard' | 'email' | 'meeting' | 'planner' | 'assistant' | 'about' | 'responsible';

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'email', label: 'Email Generator', icon: Mail },
  { id: 'meeting', label: 'Meeting Summarizer', icon: FileText },
  { id: 'planner', label: 'Task Planner', icon: CalendarCheck },
  { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
  { id: 'about', label: 'About', icon: Info },
  { id: 'responsible', label: 'Responsible AI', icon: ShieldCheck },
];

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ currentPage, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-none">WorkMate AI</h1>
              <p className="text-xs text-gray-400 mt-1">Productivity Assistant</p>
            </div>
          </div>
          <button onClick={onCloseMobile} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Menu</p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                    {item.label}
                    {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-primary-500" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="rounded-xl bg-gradient-to-br from-success-50 to-primary-50 p-4">
            <p className="text-xs font-semibold text-success-700">AI Mode Active</p>
            <p className="text-xs text-gray-500 mt-1">
              Powered by real AI. Responses are generated securely via server-side API calls.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
