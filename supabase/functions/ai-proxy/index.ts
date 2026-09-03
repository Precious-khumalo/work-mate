// WorkMate AI — Edge Function
// Securely proxies AI requests to OpenAI, keeping the API key server-side.
// Supports 4 features: email, meeting, planner, chat.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callOpenAI(messages: ChatCompletionMessage[], jsonMode: boolean): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured. Add it as a secret in Supabase Edge Functions > Secrets.");
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }
  return content;
}

// ---------- Feature 1: Email Generator ----------

const EMAIL_SYSTEM_PROMPT = `You are a professional workplace communication assistant.

Your task is to generate professional workplace emails using ONLY the information provided by the user.

Requirements:
- Adapt the tone to the selected tone.
- Adapt the communication to the intended audience.
- Do not invent names, dates, facts, commitments or information.
- If essential information is missing, clearly identify what information is needed.
- Generate an appropriate subject line.
- Generate a professional greeting.
- Generate a clear and concise email body.
- Generate an appropriate professional closing.
- Keep the email practical and ready for human review.

You MUST respond in JSON format with the following structure:
{
  "subject": "The email subject line",
  "greeting": "The greeting line (e.g., Dear John,)",
  "body": "The main email body text",
  "closing": "The professional closing (e.g., Best regards,)"
}

If essential information is missing and you cannot generate a meaningful email, respond with:
{
  "clarificationNeeded": "Explanation of what information is missing"
}

Do not include any text outside the JSON object.`;

// ---------- Feature 2: Meeting Summarizer ----------

const MEETING_SYSTEM_PROMPT = `You are an AI meeting assistant.

Analyze the meeting notes provided by the user.

Produce:
1. A concise meeting summary
2. Key discussion points
3. Decisions made
4. Action items (with responsible person and deadline)
5. Follow-up information

Do not invent information.
If a responsible person or deadline is not mentioned, write "Not specified".
Keep the summary concise, accurate and easy to scan.

You MUST respond in JSON format with the following structure:
{
  "summary": "A short summary of the meeting",
  "keyPoints": ["Point 1", "Point 2", ...],
  "decisions": ["Decision 1", "Decision 2", ...],
  "actionItems": [
    {"task": "Description of the task", "responsible": "Person name or Not specified", "deadline": "Date or Not specified"}
  ],
  "followUp": "Important follow-up information"
}

If the meeting notes are too short or empty to summarize, respond with:
{
  "clarificationNeeded": "Explanation of what is needed"
}

Do not include any text outside the JSON object.`;

// ---------- Feature 3: Task Planner ----------

const PLANNER_SYSTEM_PROMPT = `You are an AI workplace productivity planner.

Organize the user's tasks according to:
- urgency
- importance
- deadline
- estimated completion time

Create a realistic schedule.
Do not change user-provided deadlines.
Do not invent missing information.
Explain briefly why important tasks have been prioritized.

Return:
- High priority tasks
- Medium priority tasks
- Low priority tasks
- Suggested daily schedule (with time blocks)
- Productivity recommendations

You MUST respond in JSON format with the following structure:
{
  "highPriority": [{"id": "task id from input", "name": "task name", "deadline": "deadline", "priority": "High", "estimatedTime": "estimated time", "reason": "brief reason for prioritization"}],
  "mediumPriority": [same structure],
  "lowPriority": [same structure],
  "schedule": [{"time": "09:00 AM - 10:00 AM", "taskName": "task name", "priority": "High"}],
  "tips": ["Productivity tip 1", "Productivity tip 2", ...]
}

If no valid tasks are provided, respond with:
{
  "clarificationNeeded": "Explanation of what is needed"
}

Do not include any text outside the JSON object.`;

// ---------- Feature 4: Chatbot ----------

const CHAT_SYSTEM_PROMPT = `You are WorkMate AI, a professional workplace productivity assistant.

Help users with:
- workplace communication
- email writing
- meeting preparation
- meeting summaries
- task organization
- time management
- productivity
- general professional workplace questions

Give practical, clear and concise answers.

Do not invent facts.
Ask clarification questions when necessary.
Do not provide discriminatory, harmful or inappropriate workplace advice.
Remind users to review important AI-generated information before using it professionally.

Maintain the conversation context during the current session.

Keep responses concise — typically 3-6 sentences unless the user asks for detail. Use bullet points or numbered lists when helpful. Do not use markdown headers.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { feature, payload, history } = await req.json();

    let systemPrompt = "";
    let userMessage = "";
    let jsonMode = true;
    let messages: ChatCompletionMessage[] = [];

    switch (feature) {
      case "email": {
        systemPrompt = EMAIL_SYSTEM_PROMPT;
        userMessage = `Generate a professional email with the following details:

Recipient/Audience: ${payload.recipient || "(not provided)"}
Email Purpose: ${payload.purpose || "(not provided)"}
Important Information: ${payload.details || "(not provided)"}
Tone: ${payload.tone || "Professional"}
Additional Instructions: ${payload.additionalInstructions || "(none provided)"}

Remember: Use ONLY the information provided above. Do not invent facts, dates, names, or commitments.`;
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ];
        break;
      }

      case "meeting": {
        systemPrompt = MEETING_SYSTEM_PROMPT;
        userMessage = `Summarize the following meeting notes:

Meeting Title: ${payload.title || "(not provided)"}
Meeting Date: ${payload.date || "(not provided)"}

Meeting Notes:
${payload.notes}

Remember: Do not invent information. If a responsible person or deadline is not mentioned, mark it as "Not specified".`;
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ];
        break;
      }

      case "planner": {
        systemPrompt = PLANNER_SYSTEM_PROMPT;
        const taskList = payload.tasks
          .map((t: Record<string, string>, i: number) => `Task ${i + 1} (id: ${t.id}):
  - Name: ${t.name || "(not provided)"}
  - Deadline: ${t.deadline || "(not provided)"}
  - Priority: ${t.priority || "Medium"}
  - Estimated Time: ${t.estimatedTime || "(not provided)"}`)
          .join("\n\n");
        userMessage = `Organize the following tasks into a priority-based plan and daily schedule:

${taskList}

Remember: Do not change user-provided deadlines. Do not invent information. Briefly explain why high-priority tasks were prioritized.`;
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ];
        break;
      }

      case "chat": {
        jsonMode = false;
        messages = [
          { role: "system", content: CHAT_SYSTEM_PROMPT },
        ];
        if (history && Array.isArray(history)) {
          for (const msg of history) {
            messages.push({
              role: msg.role === "user" ? "user" : "assistant",
              content: msg.content,
            });
          }
        }
        messages.push({ role: "user", content: payload.message });
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown feature. Must be one of: email, meeting, planner, chat." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const aiResponse = await callOpenAI(messages, jsonMode);

    if (jsonMode) {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(aiResponse);
      } catch {
        return new Response(
          JSON.stringify({ error: "The AI returned an invalid response format. Please try again." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ data: parsed }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Chat mode: return plain text
    return new Response(
      JSON.stringify({ data: { content: aiResponse } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
