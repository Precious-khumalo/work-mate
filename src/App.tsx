import { useState } from 'react';
import { Sidebar, type PageId } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ToastContainer, useToast } from '@/components/Toast';
import { Dashboard } from '@/pages/Dashboard';
import { EmailGenerator } from '@/pages/EmailGenerator';
import { MeetingSummarizer } from '@/pages/MeetingSummarizer';
import { TaskPlanner } from '@/pages/TaskPlanner';
import { AIAssistant } from '@/pages/AIAssistant';
import { About } from '@/pages/About';
import { ResponsibleAI } from '@/pages/ResponsibleAI';

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { toasts, removeToast } = useToast();

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'email':
        return <EmailGenerator />;
      case 'meeting':
        return <MeetingSummarizer />;
      case 'planner':
        return <TaskPlanner />;
      case 'assistant':
        return <AIAssistant />;
      case 'about':
        return <About onNavigate={handleNavigate} />;
      case 'responsible':
        return <ResponsibleAI />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar currentPage={currentPage} onOpenMobile={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-6 py-6 lg:px-8 lg:py-8">
          <div className="animate-fade-in">{renderPage()}</div>
        </main>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
