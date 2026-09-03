import { Menu } from 'lucide-react';
import type { PageId } from './Sidebar';

const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Welcome back to your AI-powered workspace' },
  email: { title: 'Smart Email Generator', subtitle: 'Create professional emails in seconds' },
  meeting: { title: 'Meeting Notes Summarizer', subtitle: 'Turn lengthy notes into clear, structured summaries' },
  planner: { title: 'AI Task Planner', subtitle: 'Organize tasks by urgency, importance, and deadlines' },
  assistant: { title: 'AI Workplace Assistant', subtitle: 'Ask questions and get practical workplace advice' },
  about: { title: 'About WorkMate AI', subtitle: 'Learn about the platform and its features' },
  responsible: { title: 'Responsible AI', subtitle: 'Guidelines for safe and ethical AI usage' },
};

interface TopBarProps {
  currentPage: PageId;
  onOpenMobile: () => void;
}

export function TopBar({ currentPage, onOpenMobile }: TopBarProps) {
  const { title, subtitle } = pageTitles[currentPage];

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="flex items-center gap-4 px-6 py-4 lg:px-8">
        <button
          onClick={onOpenMobile}
          className="lg:hidden text-gray-600 hover:text-gray-900 p-1"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}
