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
    temperature: 0.3,
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

// ---------- Mechanical post-processing: catches what the AI might miss ----------

function postProcessEmail(email: Record<string, unknown>): Record<string, unknown> {
  const fields = ["subject", "greeting", "body", "closing"];
  for (const field of fields) {
    if (typeof email[field] !== "string") continue;
    let text = email[field] as string;

    // Fix standalone lowercase "i" → "I"
    text = text.replace(/(?<=\s|^)i(?=\s|[',.;!?]|$)/g, "I");
    // Fix "i'm", "i've", "i'll", "i'd", "i"
    text = text.replace(/(?<=\s|^)i'/g, "I'");
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

// ---------- Feature 1: Email Generator ----------
// Three-pass pipeline: DRAFT → EDIT → VERIFY. Every pass runs before the
// response reaches the UI. If any AI pass fails, the previous pass + post-
// processing is used so the user always gets a result.

const EMAIL_DRAFT_PROMPT = `You are an expert professional workplace communication assistant who writes emails on behalf of busy professionals.

Your task: write a professional workplace email using ONLY the information the user provides.

ABSOLUTE RULES (never violate these):
1. Rewrite the user's purpose and details into natural, grammatically correct English. The user's input may be terse, ungrammatical, or awkward — you must NEVER copy their wording verbatim. Always rephrase into proper sentences.
2. FORBIDDEN patterns — never produce any phrase like these:
   - "regarding requesting..."
   - "regarding request..."
   - "I am writing to you regarding requesting..."
   - "I am writing to you regarding request..."
   Instead, use natural openings such as:
   - "I would like to request..."
   - "I am writing to request..."
   - "I would like to invite you to..."
   - "I am reaching out to share..."
3. State the email's purpose ONCE in the opening sentence. Do NOT repeat it in later sentences.
4. Do NOT invent facts, dates, names, deadlines, reasons, or commitments the user did not provide.
5. Do NOT add information the user did not supply. If a detail is missing, simply omit it — do not guess.
6. Capitalize correctly: the pronoun "I" is always capitalized. Sentences start with a capital letter.
7. Keep the email concise — typically 3-6 sentences in the body.
8. Match the tone the user selected and adapt to the stated audience.

Email structure:
- Subject line: concise, professional, title-case preferred
- Greeting: appropriate for the audience (e.g., "Dear Manager," or "Hi Team,")
- Body: opens with a clear natural sentence stating the purpose, then covers the user's details, then a polite closing line
- Closing: professional sign-off (e.g., "Kind regards," or "Best regards,")

Respond in this exact JSON format:
{
  "subject": "...",
  "greeting": "...",
  "body": "...",
  "closing": "..."
}

If essential information is missing and you cannot write a meaningful email, respond with:
{"clarificationNeeded": "explanation of what is missing"}

Output ONLY the JSON object. No other text.`;

const EMAIL_EDIT_PROMPT = `You are a meticulous senior copy editor at a professional services firm. You are reviewing a draft email before it is sent to a client or manager.

You will receive:
1. The ORIGINAL user input (purpose, details, tone, audience)
2. A DRAFT email in JSON format

Your job: perform a mandatory final editing pass and return a polished, ready-to-send version.

You MUST silently check and fix ALL of the following:
1. GRAMMAR — every sentence must be grammatically correct. Fix all errors.
2. SPELLING — no spelling errors allowed.
3. CAPITALIZATION — the pronoun "I" must always be capitalized. Every sentence must start with a capital letter. Proper nouns must be capitalized. "Dear manager" must become "Dear Manager".
4. NATURAL SENTENCE STRUCTURE — rewrite any awkward, robotic, or unnatural phrasing into fluent professional English. This is the most important check. Examples of what you MUST fix:
   - "I am writing to you regarding requesting leave" → "I would like to request leave."
   - "I am writing to you regarding request annual leave" → "I would like to request annual leave."
   - "regarding requesting..." → rephrase into natural English
   - "regarding request..." → rephrase into natural English
   The email must sound like a native English-speaking professional wrote it.
5. PROFESSIONAL TONE — the language must be polished, respectful, and workplace-appropriate.
6. REPETITION — remove any sentence that repeats the purpose or duplicates information already stated. The purpose should appear once, in the opening.
7. CLARITY — the email must be easy to read and understand in a single pass.
8. PURPOSE ALIGNMENT — the email must directly and clearly address the user's stated purpose.

STRICT RULES (never violate):
- Do NOT change the user's intended meaning.
- Do NOT add any information that was not in the original user input or the draft. No new facts, dates, names, reasons, deadlines, or commitments.
- Do NOT remove information from the draft unless it is a redundant duplicate.
- Do NOT change the tone the user selected.
- If the draft is already excellent, you may return it unchanged — but you must still verify all 8 checks.

Return the edited email in the same JSON format:
{
  "subject": "...",
  "greeting": "...",
  "body": "...",
  "closing": "..."
}

Output ONLY the JSON object. No other text.`;

const EMAIL_VERIFY_PROMPT = `You are a final quality-control reviewer for outgoing professional emails. You are the last check before the email reaches the user.

You will receive a draft email in JSON format. You must verify it meets professional standards.

Check each item. If ALL pass, return the email unchanged. If ANY fail, fix ONLY the failing issue and return the corrected version.

Checklist:
1. Is every sentence grammatically correct?
2. Are there any spelling errors?
3. Is "I" always capitalized? Are all sentences capitalized?
4. Are there any awkward or unnatural phrases (e.g., "regarding requesting...")? If so, rewrite them into natural English.
5. Is the tone professional and appropriate?
6. Is there unnecessary repetition of the purpose or any information?
7. Is the email clear and concise?
8. Does the email directly address the stated purpose?

STRICT RULES:
- Do NOT change the meaning.
- Do NOT add new information.
- Do NOT remove important information.
- Only fix actual problems. Do not rewrite for the sake of it.

Return the final email in the same JSON format:
{
  "subject": "...",
  "greeting": "...",
  "body": "...",
  "closing": "..."
}

Output ONLY the JSON object. No other text.`;

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

interface EmailPayload {
  recipient?: string;
  purpose?: string;
  details?: string;
  tone?: string;
  additionalInstructions?: string;
}

function buildEmailUserMessage(payload: EmailPayload): string {
  return `Generate a professional email with the following details:

Recipient/Audience: ${payload.recipient || "(not provided)"}
Email Purpose: ${payload.purpose || "(not provided)"}
Important Information: ${payload.details || "(not provided)"}
Tone: ${payload.tone || "Professional"}
Additional Instructions: ${payload.additionalInstructions || "(none provided)"}

CRITICAL REMINDERS:
- Use ONLY the information above. Do not invent anything.
- Rephrase the user's purpose and details into natural, grammatically correct English.
- FORBIDDEN: "regarding requesting...", "regarding request...", "I am writing to you regarding requesting..."
- Instead use: "I would like to request...", "I am writing to request...", etc.
- State the purpose once. Do not repeat it.
- Capitalize "I" and all sentence starts.
- The email must read as if written by a fluent professional.`;
}

function safeParseJSON(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function generateEmailThreePass(payload: EmailPayload): Promise<Response> {
  const userMsg = buildEmailUserMessage(payload);

  // === PASS 1: DRAFT ===
  const draftMessages: ChatCompletionMessage[] = [
    { role: "system", content: EMAIL_DRAFT_PROMPT },
    { role: "user", content: userMsg },
  ];

  const draftRaw = await callOpenAI(draftMessages, true);
  const draftParsed = safeParseJSON(draftRaw);

  if (!draftParsed) {
    return new Response(
      JSON.stringify({ error: "The AI returned an invalid response format. Please try again." }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // If clarification is needed, return immediately — no editing required.
  if (draftParsed.clarificationNeeded) {
    return new Response(
      JSON.stringify({ data: draftParsed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // === PASS 2: EDIT (with original user input for context) ===
  const editUserMessage = `ORIGINAL USER INPUT:
${userMsg}

DRAFT EMAIL TO EDIT:
${JSON.stringify(draftParsed, null, 2)}

Perform the mandatory final editing pass. Fix grammar, spelling, capitalization, unnatural phrasing, repetition, tone, clarity, and purpose alignment. The edited version must sound like it was written by a native English-speaking professional. Do not change the meaning. Do not add new information. Return the same JSON structure.`;

  const editMessages: ChatCompletionMessage[] = [
    { role: "system", content: EMAIL_EDIT_PROMPT },
    { role: "user", content: editUserMessage },
  ];

  let editedParsed: Record<string, unknown>;
  try {
    const editedRaw = await callOpenAI(editMessages, true);
    const parsed = safeParseJSON(editedRaw);
    if (parsed && !parsed.clarificationNeeded) {
      editedParsed = parsed;
    } else {
      editedParsed = draftParsed;
    }
  } catch {
    editedParsed = draftParsed;
  }

  // === PASS 3: VERIFY (final quality gate) ===
  const verifyUserMessage = `Please verify this email meets all quality standards. Fix any remaining issues. Return the final version.

EMAIL TO VERIFY:
${JSON.stringify(editedParsed, null, 2)}`;

  const verifyMessages: ChatCompletionMessage[] = [
    { role: "system", content: EMAIL_VERIFY_PROMPT },
    { role: "user", content: verifyUserMessage },
  ];

  let finalEmail: Record<string, unknown>;
  try {
    const verifiedRaw = await callOpenAI(verifyMessages, true);
    const parsed = safeParseJSON(verifiedRaw);
    if (parsed && !parsed.clarificationNeeded) {
      finalEmail = parsed;
    } else {
      finalEmail = editedParsed;
    }
  } catch {
    finalEmail = editedParsed;
  }

  // === Mechanical post-processing (always runs as safety net) ===
  finalEmail = postProcessEmail(finalEmail);

  return new Response(
    JSON.stringify({ data: finalEmail }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { feature, payload, history } = await req.json();

    // ----- Email: three-pass generation (draft → edit → verify) -----
    if (feature === "email") {
      return await generateEmailThreePass(payload as EmailPayload);
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
      const parsed = safeParseJSON(aiResponse);
      if (!parsed) {
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
