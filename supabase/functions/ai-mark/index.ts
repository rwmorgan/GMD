/* ============================================================
   ai-mark — Edge Function
   ------------------------------------------------------------
   Drafts a rubric-based mark (per-criterion rating + feedback)
   for a student's submitted work, using Claude to read the
   evidence against the task's existing marking guide.

   This NEVER writes to marks / mark_feedback. It only returns a
   suggestion for the teacher to review, edit, and save through
   the normal marking modal (api.saveMarks). The only table this
   function writes to is ai_mark_suggestions, an audit log of
   what was drafted (see supabase/ai-mark-setup.sql).

   Deploy: paste this file's contents into Supabase Dashboard ->
   Edge Functions -> ai-mark -> code editor -> Deploy updates.
   Secrets needed (Dashboard -> Edge Functions -> Secrets):
     ANTHROPIC_API_KEY
   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected
   automatically — nothing to set for those.
   See supabase/ai-mark-README.md for the full walkthrough.
   ============================================================ */

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import Anthropic from "npm:@anthropic-ai/sdk";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk/helpers/zod";
import { z } from "npm:zod@3";
import mammoth from "npm:mammoth@1.8.0";
import { Buffer } from "node:buffer";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const EXT_IMAGE: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp",
};

function extOf(name: string | null | undefined) {
  return (name || "").split(".").pop()?.toLowerCase() || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!ANTHROPIC_API_KEY) {
      return json({ ok: false, reason: "not_configured", message: "ANTHROPIC_API_KEY secret is not set for this function yet." });
    }

    const { studentId, taskId } = await req.json();
    if (!studentId || !taskId) return json({ ok: false, reason: "bad_request", message: "Missing studentId or taskId." }, 400);

    // ---- who is calling? must be a signed-in, active teacher ----
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ ok: false, reason: "unauthenticated", message: "Not signed in." }, 401);
    const { data: callerProfile } = await userClient
      .from("profiles").select("role, active").eq("id", user.id).maybeSingle();
    if (!callerProfile || callerProfile.role !== "teacher" || !callerProfile.active) {
      return json({ ok: false, reason: "forbidden", message: "Teacher access only." }, 403);
    }

    // ---- privileged reads (service role bypasses RLS) ----
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: task } = await admin.from("tasks").select("*").eq("id", taskId).maybeSingle();
    if (!task) return json({ ok: false, reason: "not_found", message: "Task not found." }, 404);

    const { data: taskCriteria } = await admin.from("task_criteria").select("criterion_id").eq("task_id", taskId);
    const criteriaIds: string[] = (taskCriteria || []).map((r: { criterion_id: string }) => r.criterion_id);
    if (!criteriaIds.length) return json({ ok: false, reason: "no_rubric", message: "This task has no marking criteria attached." });

    const { data: submissions } = await admin
      .from("submissions").select("*")
      .eq("student_id", studentId).eq("task_id", taskId)
      .order("created_at", { ascending: false }).limit(1);
    const submission = submissions?.[0];
    if (!submission) return json({ ok: false, reason: "no_submission", message: "No submission found for this student/task." });

    // ---- build evidence content blocks ----
    const evidence: Record<string, unknown>[] = [];
    if (submission.file_path) {
      const { data: blob, error: dlErr } = await admin.storage.from("submissions").download(submission.file_path);
      if (dlErr || !blob) return json({ ok: false, reason: "download_failed", message: "Could not read the submitted file." });
      const ext = extOf(submission.file_name || submission.file_path);
      const buf = new Uint8Array(await blob.arrayBuffer());
      const b64 = Buffer.from(buf).toString("base64");

      if (EXT_IMAGE[ext]) {
        evidence.push({ type: "image", source: { type: "base64", media_type: EXT_IMAGE[ext], data: b64 } });
      } else if (ext === "pdf") {
        evidence.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } });
      } else if (ext === "docx") {
        const { value: text } = await mammoth.extractRawText({ buffer: Buffer.from(buf) });
        if (!text?.trim()) return json({ ok: false, reason: "empty_document", message: "The Word document appears to have no readable text." });
        evidence.push({ type: "text", text: `Submitted document text:\n\n${text.slice(0, 40000)}` });
      } else {
        return json({ ok: false, reason: "unsupported_file_type", message: `AI drafting doesn't support .${ext || "this"} files yet — upload images/PDF/.docx, or mark manually.` });
      }
    } else if (submission.url) {
      return json({ ok: false, reason: "external_link", message: "This submission is an external link, not an uploaded file — open the link and mark manually." });
    } else {
      return json({ ok: false, reason: "no_evidence", message: "This submission has no file or link to read." });
    }
    if (submission.comment) evidence.push({ type: "text", text: `Student's note with the submission: "${submission.comment}"` });

    // ---- rubric text + per-criterion allowed ratings (mirrors the marking modal's rule) ----
    const guide: { criterion: string; c?: string; a?: string }[] = task.body?.marking || [];
    const allowed: Record<string, string[]> = {};
    const rubricLines: string[] = [];
    for (const cid of criteriaIds) {
      allowed[cid] = cid.startsWith("ICT") ? ["A", "C", "t", "z"] : ["C", "t", "z"];
      const g = guide.find((m) => m.criterion === cid);
      rubricLines.push(
        `${cid}:${g?.c ? `\n  C-standard: ${g.c}` : ""}${g?.a ? `\n  A-standard: ${g.a}` : ""}`
      );
    }

    const schemaShape: Record<string, z.ZodTypeAny> = {};
    for (const cid of criteriaIds) schemaShape[cid] = z.enum(allowed[cid] as [string, ...string[]]);
    const MarkSchema = z.object({
      ratings: z.object(schemaShape),
      feedback: z.string().describe("2-4 sentences of specific, encouraging feedback for the student, referencing what they actually did and one concrete way to improve."),
    });

    const system = `You are assisting a Tasmanian senior secondary (Years 11-12) teacher in drafting a rubric-based mark for a Game Making & Design task. Rating scale: A = high standard (only valid for ICT criteria), C = satisfactory standard, t = below standard, z = no usable evidence. Base every rating strictly on the evidence provided and the C/A descriptors given — do not invent achievements not shown in the evidence. If evidence is thin or ambiguous for a criterion, prefer 't' or 'z' over guessing 'C'/'A'. This is a DRAFT ONLY: the teacher will review and can change anything before it is saved.`;

    const userText = `Task: ${task.code} ${task.title}\n${task.overview || ""}\n\nMarking guide:\n${rubricLines.join("\n\n")}\n\nEvidence follows.`;

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system,
      messages: [
        { role: "user", content: [{ type: "text", text: userText }, ...evidence] as never,
        },
      ],
      output_config: { format: zodOutputFormat(MarkSchema) },
    });

    if (response.stop_reason === "refusal") {
      return json({ ok: false, reason: "refusal", message: "Claude declined to draft this one — mark it manually." });
    }
    const parsed = response.parsed_output;
    if (!parsed) {
      return json({ ok: false, reason: "parse_failed", message: "Could not get a structured draft back — mark manually." });
    }

    await admin.from("ai_mark_suggestions").insert({
      student_id: studentId, task_id: taskId,
      submission_id: submission.id, model: response.model,
      ratings: parsed.ratings, feedback: parsed.feedback,
      requested_by: user.id,
    });

    return json({ ok: true, ratings: parsed.ratings, feedback: parsed.feedback });
  } catch (err) {
    console.error("ai-mark error:", err);
    return json({ ok: false, reason: "error", message: "Something went wrong drafting this mark. Mark manually." }, 500);
  }
});
