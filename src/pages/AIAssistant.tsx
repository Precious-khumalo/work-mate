import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, Trash2 } from 'lucide-react';
import { chatResponse, type ChatMessage } from '@/lib/aiEngine';
import { ButtonSpinner } from '@/components/LoadingSpinner';

const exampleQuestions = [
  'What should I prioritize today?',
  'Help me write a professional email.',
  'How can I prepare for a meeting?',
  'Help me organize my tasks.',
];

export function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatResponse(text, [...messages, userMessage]);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response, timestamp: Date.now() },
      ]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'I encountered an error while processing your request.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I apologize, but I encountered an error: ${errorMsg}. Please try asking your question again.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-7rem)]">
      <div className="flex-1 rounded-2xl border border-gray-200 bg-white overflow-hidden flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-warning-400 to-warning-600 shadow-md">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">WorkMate AI Assistant</h3>
              <p className="text-xs text-success-600 font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success-500 animate-pulse" />
                Online — Ready to help
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Chat
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-warning-100 to-warning-200 mb-5">
                <MessageSquare className="h-10 w-10 text-warning-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">How can I help you today?</h3>
              <p className="text-sm text-gray-500 mb-6">
                I am WorkMate AI, your professional workplace assistant. Ask me about emails, meetings,
                task management, productivity, and more.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {exampleQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => handleSend(question)}
                    className="text-left rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-700 hover:border-warning-300 hover:bg-warning-50 transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {loading && (
                <div className="flex gap-3 animate-slide-in">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-warning-400 to-warning-600">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-2 focus-within:border-warning-400 focus-within:ring-2 focus-within:ring-warning-100 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your workplace question here..."
                rows={1}
                className="flex-1 resize-none text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent max-h-32 scrollbar-thin"
                style={{ minHeight: '24px' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-warning-500 text-white hover:bg-warning-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                {loading ? <ButtonSpinner /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Press Enter to send, Shift + Enter for a new line · AI-generated content should be reviewed before professional use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 animate-slide-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
          isUser ? 'bg-primary-100' : 'bg-gradient-to-br from-warning-400 to-warning-600'
        }`}
      >
        {isUser ? (
          <User className="h-5 w-5 text-primary-600" />
        ) : (
          <Bot className="h-5 w-5 text-white" />
        )}
      </div>
      <div
        className={`rounded-2xl px-4 py-3 max-w-[80%] ${
          isUser
            ? 'rounded-tr-sm bg-primary-600 text-white'
            : 'rounded-tl-sm bg-gray-100 text-gray-800'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
