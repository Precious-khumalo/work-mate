export interface EmailInput {
  recipient: string;
  purpose: string;
  details: string;
  tone: string;
  additionalInstructions: string;
}

export interface GeneratedEmail {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  clarificationNeeded?: string;
}

export interface MeetingInput {
  title: string;
  date: string;
  notes: string;
}

export interface ActionItem {
  task: string;
  responsible: string;
  deadline: string;
}

export interface MeetingSummary {
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  followUp: string;
  clarificationNeeded?: string;
}

export interface TaskInput {
  id: string;
  name: string;
  deadline: string;
  priority: string;
  estimatedTime: string;
}

export interface ScheduledBlock {
  time: string;
  taskName: string;
  priority: string;
}

export interface TaskPlan {
  highPriority: TaskInput[];
  mediumPriority: TaskInput[];
  lowPriority: TaskInput[];
  schedule: ScheduledBlock[];
  tips: string[];
  clarificationNeeded?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// AI Proxy — calls the Supabase Edge Function which securely reaches OpenAI.
// Falls back to mock responses if the API key is not configured.
// ---------------------------------------------------------------------------

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;

const EDGE_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
};

type AIError = { error: string };
type AIData<T> = { data: T };

function isAIError(json: unknown): json is AIError {
  return typeof json === 'object' && json !== null && 'error' in json && !('data' in json);
}

function isAIData<T>(json: unknown): json is AIData<T> {
  return typeof json === 'object' && json !== null && 'data' in json;
}

async function callAI<T>(feature: string, payload: Record<string, unknown>, history?: ChatMessage[]): Promise<T> {
  const body: Record<string, unknown> = { feature, payload };
  if (history) body.history = history;

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: EDGE_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `AI request failed (${response.status})`);
  }

  const json: unknown = await response.json();

  if (isAIError(json)) {
    throw new Error(json.error);
  }

  if (isAIData<T>(json)) {
    return json.data;
  }

  throw new Error('Unexpected response format from AI service.');
}

// ---------------------------------------------------------------------------
// Email Generator
// ---------------------------------------------------------------------------

export async function generateEmail(input: EmailInput): Promise<GeneratedEmail> {
  try {
    return await callAI<GeneratedEmail>('email', {
      recipient: input.recipient,
      purpose: input.purpose,
      details: input.details,
      tone: input.tone,
      additionalInstructions: input.additionalInstructions,
    });
  } catch (err) {
    if (isMissingKeyError(err)) {
      return mockGenerateEmail(input);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Meeting Summarizer
// ---------------------------------------------------------------------------

export async function summarizeMeeting(input: MeetingInput): Promise<MeetingSummary> {
  try {
    return await callAI<MeetingSummary>('meeting', {
      title: input.title,
      date: input.date,
      notes: input.notes,
    });
  } catch (err) {
    if (isMissingKeyError(err)) {
      return mockSummarizeMeeting(input);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Task Planner
// ---------------------------------------------------------------------------

export async function createTaskPlan(tasks: TaskInput[]): Promise<TaskPlan> {
  try {
    return await callAI<TaskPlan>('planner', { tasks });
  } catch (err) {
    if (isMissingKeyError(err)) {
      return mockCreateTaskPlan(tasks);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Chatbot
// ---------------------------------------------------------------------------

export async function chatResponse(message: string, history: ChatMessage[]): Promise<string> {
  try {
    const result = await callAI<{ content: string }>('chat', { message }, history);
    return result.content;
  } catch (err) {
    if (isMissingKeyError(err)) {
      return mockChatResponse(message, history);
    }
    throw err;
  }
}

function isMissingKeyError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes('openai_api_key') || msg.includes('not configured') || msg.includes('api key');
}

// ---------------------------------------------------------------------------
// Mock fallbacks — used when OPENAI_API_KEY is not yet set as a Supabase secret
// ---------------------------------------------------------------------------

function mockGenerateEmail(input: EmailInput): GeneratedEmail {
  if (!input.recipient.trim()) {
    return {
      subject: '',
      greeting: '',
      body: '',
      closing: '',
      clarificationNeeded:
        "Could you please specify who the email is for? For example: 'my manager', 'the entire team', or 'a new client'.",
    };
  }
  if (!input.purpose.trim()) {
    return {
      subject: '',
      greeting: '',
      body: '',
      closing: '',
      clarificationNeeded: 'Could you please describe the purpose of this email?',
    };
  }
  if (!input.details.trim()) {
    return {
      subject: '',
      greeting: '',
      body: '',
      closing: '',
      clarificationNeeded: 'Could you provide important information to include in the email?',
    };
  }

  const purpose = input.purpose.trim();
  const recipient = input.recipient.trim();
  const details = input.details.trim();

  const capitalizedPurpose = purpose.charAt(0).toUpperCase() + purpose.slice(1);
  const subject = capitalizedPurpose;

  const recipientName = recipient.charAt(0).toUpperCase() + recipient.slice(1);

  const bodyLines: string[] = [];
  bodyLines.push(`I would like to ${purpose}.`);
  bodyLines.push('');
  bodyLines.push(details.charAt(0).toUpperCase() + details.slice(1));
  if (input.additionalInstructions.trim()) {
    bodyLines.push('');
    bodyLines.push(input.additionalInstructions.trim());
  }
  bodyLines.push('');
  bodyLines.push('Please let me know if you need any additional information.');

  return {
    subject,
    greeting: `Dear ${recipientName},`,
    body: bodyLines.join('\n'),
    closing: 'Best regards,',
  };
}

function mockSummarizeMeeting(input: MeetingInput): MeetingSummary {
  if (!input.notes.trim() || input.notes.trim().length < 20) {
    return {
      summary: '',
      keyPoints: [],
      decisions: [],
      actionItems: [],
      followUp: '',
      clarificationNeeded: 'The meeting notes appear to be empty or too short. Please paste the full meeting notes.',
    };
  }
  const sentences = input.notes.split(/[.\n]/).map((s) => s.trim()).filter((s) => s.length > 10);
  return {
    summary: sentences.slice(0, 3).join('. ') + '.',
    keyPoints: sentences.slice(0, 5),
    decisions: sentences.length > 0 ? [sentences[0]] : ['No explicit decisions identified.'],
    actionItems: [{ task: 'Review meeting notes for action items.', responsible: 'Not specified', deadline: 'Not specified' }],
    followUp: 'A follow-up meeting is recommended to review action items.',
  };
}

function mockCreateTaskPlan(tasks: TaskInput[]): TaskPlan {
  const valid = tasks.filter((t) => t.name.trim());
  if (valid.length === 0) {
    return {
      highPriority: [],
      mediumPriority: [],
      lowPriority: [],
      schedule: [],
      tips: [],
      clarificationNeeded: 'Please add at least one task with a name.',
    };
  }
  const slots = ['09:00 AM – 10:00 AM', '10:00 AM – 11:00 AM', '11:00 AM – 12:00 PM', '01:00 PM – 02:00 PM', '02:00 PM – 03:00 PM', '03:00 PM – 04:00 PM', '04:00 PM – 05:00 PM'];
  return {
    highPriority: valid.filter((t) => t.priority === 'High'),
    mediumPriority: valid.filter((t) => t.priority === 'Medium'),
    lowPriority: valid.filter((t) => t.priority === 'Low'),
    schedule: valid.slice(0, 7).map((t, i) => ({ time: slots[i] || `Block ${i + 1}`, taskName: t.name, priority: t.priority })),
    tips: ['Start with the most important task when your energy is highest.', 'Group similar tasks to reduce context switching.', 'Use the Pomodoro technique for focused work.'],
  };
}

function mockChatResponse(message: string, _history: ChatMessage[]): string {
  const msg = message.toLowerCase();
  if (msg.includes('hello') || msg.includes('hi')) {
    return 'Hello! I am WorkMate AI, your workplace productivity assistant. How can I help you today?';
  }
  return 'I can help with workplace communication, meeting preparation, task organization, and productivity. What would you like assistance with?';
}
