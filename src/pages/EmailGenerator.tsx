import { useState } from 'react';
import { Mail, Copy, Trash2, RefreshCw, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { generateEmail, type EmailInput, type GeneratedEmail } from '@/lib/aiEngine';
import { LoadingSpinner, ButtonSpinner } from '@/components/LoadingSpinner';

const tones = ['Professional', 'Friendly', 'Formal', 'Persuasive', 'Concise'];

export function EmailGenerator() {
  const [input, setInput] = useState<EmailInput>({
    recipient: '',
    purpose: '',
    details: '',
    tone: 'Professional',
    additionalInstructions: '',
  });
  const [result, setResult] = useState<GeneratedEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setError('');
    setResult(null);

    if (!input.recipient.trim() && !input.purpose.trim() && !input.details.trim()) {
      setError('Please fill in at least the recipient, purpose, and important information fields.');
      return;
    }

    setLoading(true);
    try {
      const email = await generateEmail(input);
      if (email.clarificationNeeded) {
        setError(email.clarificationNeeded);
      } else {
        setResult(email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while generating the email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const fullEmail = `Subject: ${result.subject}\n\n${result.greeting}\n\n${result.body}\n\n${result.closing}`;
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput({
      recipient: '',
      purpose: '',
      details: '',
      tone: 'Professional',
      additionalInstructions: '',
    });
    setResult(null);
    setError('');
  };

  const handleRegenerate = () => {
    if (input.recipient.trim() && input.purpose.trim() && input.details.trim()) {
      handleGenerate();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
            <Mail className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Email Details</h3>
            <p className="text-sm text-gray-500">Fill in the details below</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Recipient / Audience <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={input.recipient}
              onChange={(e) => setInput({ ...input, recipient: e.target.value })}
              placeholder="e.g., John Smith, my team, the marketing department"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Purpose <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={input.purpose}
              onChange={(e) => setInput({ ...input, purpose: e.target.value })}
              placeholder="e.g., requesting a project deadline extension"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Important Information <span className="text-error-500">*</span>
            </label>
            <textarea
              value={input.details}
              onChange={(e) => setInput({ ...input, details: e.target.value })}
              placeholder="Key points, context, and any specific details to include in the email..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tone</label>
            <select
              value={input.tone}
              onChange={(e) => setInput({ ...input, tone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white"
            >
              {tones.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Additional Instructions <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={input.additionalInstructions}
              onChange={(e) => setInput({ ...input, additionalInstructions: e.target.value })}
              placeholder="Any extra instructions for the AI, such as format preferences or specific phrases to use..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-error-50 border border-error-200 px-4 py-3 animate-slide-up">
              <AlertTriangle className="h-5 w-5 text-error-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <ButtonSpinner />
                Generating Email...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Generate Email
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Panel */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8 lg:sticky lg:top-24 h-fit">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-50">
              <CheckCircle2 className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Generated Email</h3>
              <p className="text-sm text-gray-500">Review and copy your email</p>
            </div>
          </div>
        </div>

        {loading && <LoadingSpinner label="AI is composing your email..." />}

        {!loading && !result && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
              <Mail className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Your generated email will appear here</p>
            <p className="text-xs text-gray-400 mt-1">Fill in the form and click "Generate Email"</p>
          </div>
        )}

        {!loading && result && (
          <div className="animate-slide-up">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Subject</p>
                <p className="text-sm font-semibold text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
                  {result.subject}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">
                  {result.greeting}
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mt-3">
                  {result.body}
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mt-3 font-medium">
                  {result.closing}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Email'}
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
