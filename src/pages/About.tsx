import { Mail, FileText, CalendarCheck, MessageSquare, Sparkles, Target, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import type { PageId } from '@/components/Sidebar';

interface AboutProps {
  onNavigate: (page: PageId) => void;
}

const features = [
  {
    icon: Mail,
    title: 'Smart Email Generator',
    benefit: 'Saves 15–30 minutes per email by generating professional, context-aware emails instantly. No more staring at a blank screen or struggling with tone.',
    color: 'bg-primary-50 text-primary-600',
  },
  {
    icon: FileText,
    title: 'Meeting Notes Summarizer',
    benefit: 'Reduces review time from 30+ minutes to seconds. Extracts key points, decisions, and action items automatically, so nothing falls through the cracks.',
    color: 'bg-accent-50 text-accent-600',
  },
  {
    icon: CalendarCheck,
    title: 'AI Task Planner',
    benefit: 'Eliminates the mental overhead of task prioritization. The AI sorts tasks by urgency, importance, and deadlines to create an optimal daily schedule.',
    color: 'bg-success-50 text-success-600',
  },
  {
    icon: MessageSquare,
    title: 'AI Workplace Assistant',
    benefit: 'Provides instant answers to workplace questions — from communication tips to productivity strategies — without searching through manuals or waiting for colleagues.',
    color: 'bg-warning-50 text-warning-600',
  },
];

export function About({ onNavigate }: AboutProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-primary-600 to-primary-900 px-8 py-12 lg:px-12 lg:py-14 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/10 mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">About WorkMate AI</h1>
        <p className="mt-4 text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
          WorkMate AI was created to demonstrate how AI can automate repetitive workplace tasks
          and improve productivity.
        </p>
      </section>

      {/* Mission */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900">Our Mission</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Modern professionals spend a significant portion of their day on repetitive tasks — writing
          emails, reading meeting notes, organizing tasks, and searching for information. WorkMate AI
          demonstrates how Artificial Intelligence can streamline these activities, freeing up time for
          higher-value work that requires creativity, critical thinking, and human judgment.
        </p>
        <p className="text-gray-600 leading-relaxed mt-4">
          This platform brings together four AI-powered tools into a single, cohesive workspace. Rather
          than switching between separate applications, professionals can generate emails, summarize
          meetings, plan their day, and ask questions — all in one place.
        </p>
      </section>

      {/* Features */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Zap className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900">Features & Productivity Benefits</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.benefit}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Impact */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900">Productivity Impact</h2>
        </div>
        <p className="text-gray-600 leading-relaxed mb-6">
          By automating repetitive workplace tasks, WorkMate AI helps professionals reclaim hours each
          week. Here is a summary of the before-and-after impact:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-5">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Before WorkMate AI</h4>
            <ul className="space-y-2">
              {['Manually writing emails from scratch', 'Reading through long meeting notes', 'Manually organizing and prioritizing tasks', 'Searching for workplace information'].map((item) => (
                <li key={item} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-primary-50 border border-primary-200 p-5">
            <h4 className="text-sm font-bold text-primary-700 uppercase tracking-wide mb-3">After WorkMate AI</h4>
            <ul className="space-y-2">
              {['Generate professional emails in seconds', 'Quickly summarize meetings with key points', 'Automatically prioritize tasks with AI', 'Ask an AI workplace assistant for help'].map((item) => (
                <li key={item} className="text-sm text-gray-700 flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-gray-200 bg-gradient-to-br from-primary-50 to-accent-50 p-6 lg:p-8 text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Ready to boost your productivity?</h2>
        <p className="text-sm text-gray-600 mb-5 max-w-md mx-auto">
          Explore each AI tool and see how much time you can save on everyday workplace tasks.
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-all shadow-md"
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  );
}
