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
    temperature: 0.4,
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

// ---------- Post-processing: mechanical fixes the AI sometimes misses ----------

function postProcessEmail(email: Record<string, unknown>): Record<string, unknown> {
  const fields = ["subject", "greeting", "body", "closing"];
  for (const field of fields) {
    if (typeof email[field] !== "string") continue;
    let text = email[field] as string;

    // Fix lowercase "i" when used as a standalone pronoun
    text = text.replace(/\bi\b/g, "I");
    // Fix "i'm", "i've", "i'll", "i'd" at start or mid-sentence
    text = text.replace(/\bi'/g, "I'");
    // Capitalize first letter of each sentence in the body
    if (field === "body") {
      text = text.replace(/(^|\.\s+|\n\s*)([a-z])/g, (_match, prefix: string, letter: string) =>
        prefix + letter.toUpperCase()
      );
    }
    // Capitalize first letter of subject and greeting
    if (field === "subject" || field === "greeting") {
      text = text.replace(/^\s*([a-z])/, (_m, letter: string) => letter.toUpperCase());
    }
    // Collapse multiple blank lines into one
    text = text.replace(/\n{3,}/g, "\n\n");
    // Trim trailing whitespace per line
    text = text
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n");

    email[field] = text;
  }
  return email;
}

// ---------- Feature 1: Email Generator (two-pass: draft + edit) ----------

const EMAIL_DRAFT_PROMPT = `You are an expert professional workplace communication assistant.

Write a professional workplace email using ONLY the information provided by the user.

Rules:
- Rewrite the user's purpose and details into natural, grammatically correct English. Never copy the user's wording verbatim if it is awkward or ungrammatical.
- Do NOT produce phrases like "I am writing to you regarding requesting leave." Instead write natural English such as "I would like to request leave for Friday."
- Do NOT repeat the email's purpose in multiple sentences. State it once clearly in the opening, then move to details.
- Do not invent facts, dates, names, commitments, or reasons the user did not provide.
- Adapt the tone to the selected tone and the communication to the intended audience.
- The email must read as if written by a fluent professional.

The email should contain:
- A concise subject line
- An appropriate greeting
- A clear, natural opening sentence that states the purpose
- The relevant details provided by the user, expressed in proper sentences
- A polite closing or request for a response where appropriate
- A professional sign-off

Respond in JSON:
{
  "subject": "...",
  "greeting": "...",
  "body": "...",
  "closing": "..."
}

If essential information is missing, respond with:
{"clarificationNeeded": "..."}

Do not include any text outside the JSON object.`;

const EMAIL_EDIT_PROMPT = `You are a meticulous professional email editor.

You will receive a draft email in JSON format. Your job is to perform a mandatory final quality check and return a polished version.

Silently check and fix ALL of the following:
1. Grammar — every sentence must be grammatically correct
2. Spelling — no spelling errors
3. Capitalization — the pronoun "I" must always be capitalized; sentences must start with a capital letter; proper nouns must be capitalized
4. Natural sentence structure — rewrite any awkward or unnatural phrasing into fluent professional English. For example, "I am writing to you regarding requesting leave" must become "I would like to request leave."
5. Professional tone — the language must be polished and workplace-appropriate
6. Repetition — remove any sentences that unnecessarily repeat the purpose or duplicate information
7. Clarity — the email must be easy to read and understand
8. Purpose alignment — the email must directly address the user's stated purpose

Critical rules:
- Do NOT change the user's intended meaning.
- Do NOT add information that was not in the draft (no new facts, dates, names, reasons, or commitments).
- Do NOT remove information from the draft unless it is a duplicated/redundant statement.
- If the draft is already good, return it unchanged.
- Preserve the JSON structure exactly.

Return the edited email in the same JSON format:
{
  "subject": "...",
  "greeting": "...",
  "body": "...",
  "closing": "..."
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
  "keyPoints": ["Point 1", "Point 2"],
  "decisions": ["Decision 1", "Decision 2"],
  "actionItems": [
    {"task": "Description of the task", "responsible": "Person name or Not specified", "deadline": "Date or Not specified"}
  ],
  "followUp": "Important follow-up information"
}

If the meeting notes are too short or empty to summarize, respond with:
{"clarificationNeeded": "Explanation of what is needed"}

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
  "mediumPriority": [{"id": "...", "name": "...", "deadline": "...", "priority": "Medium", "estimatedTime": "...", "reason": "..."}],
  "lowPriority": [{"id": "...", "name": "...", "deadline": "...", "priority": "Low", "estimatedTime": "...", "reason": "..."}],
  "schedule": [{"time": "09:00 AM - 10:00 AM", "taskName": "task name", "priority": "High"}],
  "tips": ["Productivity tip 1", "Productivity tip 2"]
}

If no valid tasks are provided, respond with:
{"clarificationNeeded": "Explanation of what is needed"}

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

    // ----- Email: two-pass generation (draft + edit) -----
    if (feature === "email") {
      const draftUserMessage = `Generate a professional email with the following details:

Recipient/Audience: ${payload.recipient || "(not provided)"}
Email Purpose: ${payload.purpose || "(not provided)"}
Important Information: ${payload.details || "(not provided)"}
Tone: ${payload.tone || "Professional"}
Additional Instructions: ${payload.additionalInstructions || "(none provided)"}

Rules:
- Use ONLY the information provided above. Do not invent facts, dates, names, or commitments.
- Rewrite the user's purpose and details into natural, grammatically correct sentences.
- Do NOT produce awkward phrasing like "regarding requesting leave." Write natural English instead.
- Do NOT repeat the purpose multiple times. State it once, then cover the details.
- The email must read as if written by a fluent professional.`;

      const draftMessages: ChatCompletionMessage[] = [
        { role: "system", content: EMAIL_DRAFT_PROMPT },
        { role: "user", content: draftUserMessage },
      ];

      const draftRaw = await callOpenAI(draftMessages, true);

      let draftParsed: Record<string, unknown>;
      try {
        draftParsed = JSON.parse(draftRaw);
      } catch {
        return new Response(
          JSON.stringify({ error: "The AI returned an invalid response format. Please try again." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If the draft asked for clarification, return it immediately — no editing needed.
      if (draftParsed.clarificationNeeded) {
        return new Response(
          JSON.stringify({ data: draftParsed }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Second pass: mandatory editing step
      const editUserMessage = `Here is the draft email to review and polish. Perform the mandatory final quality check and return the corrected version.

Draft:
${JSON.stringify(draftParsed, null, 2)}

Remember: fix grammar, spelling, capitalization, natural sentence structure, professional tone, repetition, and clarity. Do not change the meaning. Do not add new information. Return the same JSON structure.`;

      const editMessages: ChatCompletionMessage[] = [
        { role: "system", content: EMAIL_EDIT_PROMPT },
        { role: "user", content: editUserMessage },
      ];

      let finalEmail: Record<string, unknown>;
      try {
        const editedRaw = await callOpenAI(editMessages, true);
        finalEmail = JSON.parse(editedRaw);
      } catch {
        // If the editing pass fails, use the draft with post-processing
        finalEmail = draftParsed;
      }

      // Always run mechanical post-processing as a safety net
      finalEmail = postProcessEmail(finalEmail);

      return new Response(
        JSON.stringify({ data: finalEmail }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ----- Other features: single-pass -----
    let systemPrompt = "";
    let userMessage = "";
    let jsonMode = true;
    let messages: ChatCompletionMessage[] = [];

    switch (feature) {
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
        const taskList = (payload.tasks as Record<string, string>[])
          .map((t, i: number) => `Task ${i + 1} (id: ${t.id}):
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
