import { Mail, FileText, CalendarCheck, MessageSquare, ArrowRight, Clock, CheckCircle2, MailOpen, FileCheck, TrendingUp, Zap, Sparkles } from 'lucide-react';
import type { PageId } from '@/components/Sidebar';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
}

const features = [
  {
    id: 'email' as PageId,
    icon: Mail,
    title: 'Smart Email Generator',
    description: 'Generate professional emails based on context, audience and tone.',
    color: 'bg-primary-500',
    bgColor: 'bg-primary-50',
    iconColor: 'text-primary-600',
  },
  {
    id: 'meeting' as PageId,
    icon: FileText,
    title: 'Meeting Notes Summarizer',
    description: 'Turn lengthy meeting notes into concise summaries, decisions and action items.',
    color: 'bg-accent-500',
    bgColor: 'bg-accent-50',
    iconColor: 'text-accent-600',
  },
  {
    id: 'planner' as PageId,
    icon: CalendarCheck,
    title: 'AI Task Planner',
    description: 'Organize tasks according to urgency and importance and create a structured schedule.',
    color: 'bg-success-500',
    bgColor: 'bg-success-50',
    iconColor: 'text-success-600',
  },
  {
    id: 'assistant' as PageId,
    icon: MessageSquare,
    title: 'AI Workplace Assistant',
    description: 'Ask questions and receive helpful workplace-related responses.',
    color: 'bg-warning-500',
    bgColor: 'bg-warning-50',
    iconColor: 'text-warning-600',
  },
];

const stats = [
  { icon: Clock, label: 'Time Saved', value: '42 hrs', color: 'text-primary-600', bgColor: 'bg-primary-50' },
  { icon: CheckCircle2, label: 'Tasks Organized', value: '156', color: 'text-success-600', bgColor: 'bg-success-50' },
  { icon: MailOpen, label: 'Emails Generated', value: '89', color: 'text-accent-600', bgColor: 'bg-accent-50' },
  { icon: FileCheck, label: 'Meetings Summarized', value: '34', color: 'text-warning-600', bgColor: 'bg-warning-50' },
];

const beforeAfter = [
  { before: 'Manually writing emails from scratch', after: 'Generate professional emails in seconds', icon: Mail },
  { before: 'Reading through long meeting notes', after: 'Quickly summarize meetings with key points', icon: FileText },
  { before: 'Manually organizing and prioritizing tasks', after: 'Automatically prioritize tasks with AI', icon: CalendarCheck },
  { before: 'Searching for workplace information', after: 'Ask an AI workplace assistant for help', icon: MessageSquare },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 px-8 py-12 lg:px-12 lg:py-16 animate-fade-in">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-accent-400/20 blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/90 mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">AI-Powered Productivity Platform</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight max-w-2xl">
            Your AI-powered workplace productivity assistant
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl leading-relaxed">
            WorkMate AI helps professionals save time by generating emails, summarizing meetings,
            organizing tasks and answering workplace questions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('email')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 hover:bg-white/90 transition-all shadow-lg"
            >
              Start with Email Generator
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('assistant')}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-all border border-white/20"
            >
              Ask AI Assistant
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Productivity Stats */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-bold text-gray-900">Productivity Impact</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow animate-slide-up"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bgColor} mb-3`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Cards */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Zap className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-bold text-gray-900">AI Tools</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="group rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg hover:border-primary-200 transition-all animate-slide-up"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bgColor} mb-4`}>
                  <Icon className={`h-7 w-7 ${feature.iconColor}`} />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{feature.description}</p>
                <button
                  onClick={() => onNavigate(feature.id)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 group-hover:gap-3 transition-all"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Before / After Section */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8">
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-gray-900">How WorkMate AI Transforms Your Workday</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl mx-auto">
            See the difference AI makes in reducing repetitive workplace tasks
          </p>
        </div>
        <div className="space-y-4">
          {beforeAfter.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-xl border border-gray-100 p-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
                    <Icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Before</p>
                    <p className="text-sm text-gray-600 mt-0.5">{item.before}</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center justify-center">
                  <div className="flex items-center gap-1 text-primary-500">
                    <div className="h-px w-8 bg-primary-300" />
                    <ArrowRight className="h-5 w-5" />
                    <div className="h-px w-8 bg-primary-300" />
                  </div>
                </div>
                <div className="flex items-center gap-3 md:flex-row-reverse md:text-right">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide">After</p>
                    <p className="text-sm text-gray-900 font-medium mt-0.5">{item.after}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
