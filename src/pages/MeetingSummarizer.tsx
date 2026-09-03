import { useState } from 'react';
import { FileText, Copy, Trash2, RefreshCw, AlertTriangle, CheckCircle2, ListChecks, Gavel, Target, CalendarClock } from 'lucide-react';
import { summarizeMeeting, type MeetingInput, type MeetingSummary } from '@/lib/aiEngine';
import { LoadingSpinner, ButtonSpinner } from '@/components/LoadingSpinner';

export function MeetingSummarizer() {
  const [input, setInput] = useState<MeetingInput>({
    title: '',
    date: '',
    notes: '',
  });
  const [result, setResult] = useState<MeetingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    setError('');
    setResult(null);

    if (!input.notes.trim()) {
      setError('Please paste the meeting notes before summarizing.');
      return;
    }

    if (input.notes.trim().length < 20) {
      setError('The meeting notes are too short. Please provide more detailed notes for an accurate summary.');
      return;
    }

    setLoading(true);
    try {
      const summary = await summarizeMeeting(input);
      if (summary.clarificationNeeded) {
        setError(summary.clarificationNeeded);
      } else {
        setResult(summary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while summarizing the meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = [
      `MEETING: ${input.title || 'Untitled Meeting'}${input.date ? ` — ${input.date}` : ''}`,
      '',
      'MEETING SUMMARY',
      result.summary,
      '',
      'KEY POINTS',
      ...result.keyPoints.map((p, i) => `${i + 1}. ${p}`),
      '',
      'DECISIONS',
      ...result.decisions.map((d, i) => `${i + 1}. ${d}`),
      '',
      'ACTION ITEMS',
      ...result.actionItems.map((a, i) => `${i + 1}. ${a.task} | ${a.responsible} | ${a.deadline}`),
      '',
      'FOLLOW-UP',
      result.followUp,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput({ title: '', date: '', notes: '' });
    setResult(null);
    setError('');
  };

  const handleRegenerate = () => {
    if (input.notes.trim().length >= 20) {
      handleSummarize();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50">
            <FileText className="h-6 w-6 text-accent-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Meeting Details</h3>
            <p className="text-sm text-gray-500">Paste your meeting notes below</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Meeting Title <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={input.title}
              onChange={(e) => setInput({ ...input, title: e.target.value })}
              placeholder="e.g., Weekly Team Standup, Q3 Planning Meeting"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Meeting Date <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              value={input.date}
              onChange={(e) => setInput({ ...input, date: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Meeting Notes <span className="text-error-500">*</span>
            </label>
            <textarea
              value={input.notes}
              onChange={(e) => setInput({ ...input, notes: e.target.value })}
              placeholder="Paste the full meeting notes here. Include all discussions, decisions, and any mentioned action items, responsible persons, and deadlines..."
              rows={10}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-all resize-y scrollbar-thin"
            />
            <p className="text-xs text-gray-400 mt-1.5">{input.notes.length} characters</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-error-50 border border-error-200 px-4 py-3 animate-slide-up">
              <AlertTriangle className="h-5 w-5 text-error-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleSummarize}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent-600 px-5 py-3 text-sm font-semibold text-white hover:bg-accent-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <ButtonSpinner />
                Summarizing Meeting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Summarize Meeting
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Panel */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8 lg:sticky lg:top-24 h-fit max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-50">
              <CheckCircle2 className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Meeting Summary</h3>
              <p className="text-sm text-gray-500">Structured output from AI</p>
            </div>
          </div>
        </div>

        {loading && <LoadingSpinner label="AI is analyzing your meeting notes..." />}

        {!loading && !result && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
              <FileText className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Your meeting summary will appear here</p>
            <p className="text-xs text-gray-400 mt-1">Paste meeting notes and click "Summarize Meeting"</p>
          </div>
        )}

        {!loading && result && (
          <div className="animate-slide-up space-y-6">
            {/* Summary */}
            <SectionBlock icon={FileText} label="Meeting Summary" color="text-accent-600" bgColor="bg-accent-50">
              <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
            </SectionBlock>

            {/* Key Points */}
            <SectionBlock icon={Target} label="Key Points" color="text-primary-600" bgColor="bg-primary-50">
              <ul className="space-y-2">
                {result.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </SectionBlock>

            {/* Decisions */}
            <SectionBlock icon={Gavel} label="Decisions" color="text-warning-600" bgColor="bg-warning-50">
              <ul className="space-y-2">
                {result.decisions.map((decision, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-warning-500 flex-shrink-0 mt-0.5" />
                    {decision}
                  </li>
                ))}
              </ul>
            </SectionBlock>

            {/* Action Items */}
            <SectionBlock icon={ListChecks} label="Action Items" color="text-success-600" bgColor="bg-success-50">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-3 font-semibold text-gray-700">Task</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Responsible</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.actionItems.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0">
                        <td className="py-2.5 pr-3 text-gray-700">{item.task}</td>
                        <td className="py-2.5 px-3 text-gray-600">{item.responsible}</td>
                        <td className="py-2.5 px-3 text-gray-600">{item.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionBlock>

            {/* Follow-up */}
            <SectionBlock icon={CalendarClock} label="Follow-up" color="text-primary-600" bgColor="bg-primary-50">
              <p className="text-sm text-gray-700 leading-relaxed">{result.followUp}</p>
            </SectionBlock>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg bg-accent-50 px-4 py-2 text-sm font-semibold text-accent-700 hover:bg-accent-100 transition-colors"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Summary'}
              </button>
              <button
                onClick={handleRegenerate}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-warning-50 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-warning-500 flex-shrink-0" />
              <p className="text-xs text-warning-700 font-medium">
                AI-generated content should be reviewed by a human before professional use.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionBlock({
  icon: Icon,
  label,
  color,
  bgColor,
  children,
}: {
  icon: typeof FileText;
  label: string;
  color: string;
  bgColor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{label}</h4>
      </div>
      <div className="ml-10">{children}</div>
    </div>
  );
}
