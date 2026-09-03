import { ShieldCheck, Eye, Lock, AlertTriangle, Scale, UserCheck } from 'lucide-react';

const principles = [
  {
    icon: Eye,
    title: 'Human Review Required',
    description:
      'AI-generated content should always be reviewed by a human before being used professionally. Never send an AI-generated email or publish a summary without reading it first and confirming it is accurate and appropriate.',
  },
  {
    icon: Lock,
    title: 'Protect Confidential Information',
    description:
      'Users should not enter confidential, sensitive, or private company information into this tool. This includes trade secrets, financial data, personal information of colleagues, or any restricted company documents.',
  },
  {
    icon: AlertTriangle,
    title: 'AI Can Make Mistakes',
    description:
      'AI is not infallible and should not be treated as automatically correct. It may misinterpret context, omit important details, or produce text that does not fully match your intent. Always verify critical information independently.',
  },
  {
    icon: Scale,
    title: 'No Discriminatory Decisions',
    description:
      'The system should not be used to make discriminatory decisions about people, including hiring, promotion, performance evaluation, or any decision that could unfairly affect individuals or groups.',
  },
  {
    icon: UserCheck,
    title: 'User Responsibility',
    description:
      'Users remain responsible for all final decisions and communications made using AI-generated content. The AI is a tool to assist productivity — it does not replace human judgment, accountability, or professional standards.',
  },
];

export function ResponsibleAI() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 px-8 py-12 lg:px-12 lg:py-14 animate-fade-in">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/10 mb-4">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Responsible AI Usage</h1>
        <p className="mt-4 text-lg text-white/85 max-w-2xl leading-relaxed">
          WorkMate AI is designed to enhance — not replace — human judgment in the workplace.
          These guidelines ensure safe, ethical, and responsible use of AI tools.
        </p>
      </section>

      {/* Principles */}
      <section className="space-y-4">
        {principles.map((principle) => {
          const Icon = principle.icon;
          return (
            <div
              key={principle.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow animate-slide-up"
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{principle.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{principle.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Summary Callout */}
      <section className="rounded-2xl border-l-4 border-primary-500 bg-primary-50 p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-primary-900 mb-1">Remember</h3>
            <p className="text-sm text-primary-800 leading-relaxed">
              WorkMate AI is a productivity assistant that helps you work faster and smarter. It is not a
              replacement for your expertise, judgment, or professional responsibility. Always review
              AI-generated content, protect sensitive information, and take ownership of your final
              decisions and communications.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
