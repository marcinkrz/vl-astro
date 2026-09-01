export const prerender = false; // on-demand — wymaga adaptera (patrz: astro.config)

import type { APIRoute } from "astro";
import { getT, type Locale } from "@/i18n/messages";
import { Resend } from "resend";

const ALLOWED_BUDGETS: ReadonlySet<string> = new Set([
  "budget-tier-1",
  "budget-tier-2",
  "budget-tier-3",
  "budget-tier-4",
  "budget-unknown",
]);

// ---------- Sanityzacja ----------
function sanitize(value: unknown, max = 200): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "'");
}

// ---------- Walidatory (identyczne reguły jak w kliencie) ----------
const NIP_WEIGHTS: number[] = [6, 5, 7, 2, 3, 4, 5, 6, 7];

function isValidNip(value: string): boolean {
  const nip = value.replace(/[\s-]/g, "");
  if (!/^\d{10}$/.test(nip)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += NIP_WEIGHTS[i]! * Number(nip[i]);
  return sum % 11 === Number(nip[9]);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}

function isValidPhone(value: string): boolean {
  const compact = value.replace(/[\s\-().]/g, "");
  if (compact.length < 7 || compact.length > 20) return false;
  if (/^(\+48|0048)?\d{9}$/.test(compact)) return true;
  if (/^\+\d{7,15}$/.test(compact)) return true;
  if (/^00\d{8,15}$/.test(compact)) return true;
  if (/^0\d{9,14}$/.test(compact)) return true;
  return false;
}

function isValidWebsite(value: string): boolean {
  return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d{2,5})?(\/\S*)?$/i.test(value);
}

// ---------- Walidacja całego formularza ----------
interface BriefData {
  firstName: string;
  email: string;
  phone: string;
  nip: string;
  message: string;
  website: string;
  services: string[];
  budget: string;
}

interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  data: BriefData;
}

// KLUCZOWA POPRAWKA: typ t pochodzi z getT (klucze typowane przez NestedKeyOf),
// NIE jako (key: string) => string — to była przyczyna TS2345.
type TFn = ReturnType<typeof getT>;

function validateBrief(formData: FormData, t: TFn): ValidationResult {
  const errors: Record<string, string> = {};

  const firstName = sanitize(formData.get("firstName"), 120);
  const email = sanitize(formData.get("email"), 254);
  const phone = sanitize(formData.get("phone"), 25);
  const nipRaw = sanitize(formData.get("nip"), 16);
  const message = sanitize(formData.get("message"), 5000);
  const websiteRaw = sanitize(formData.get("website"), 300);

  let services = formData
    .getAll("services")
    .map((v) => sanitize(v, 80))
    .filter(Boolean)
    .slice(0, 10);

  // Opcja F: wartość „other" + wpisany tekst
  const otherValue = sanitize(formData.get("other-service"), 120);
  if (otherValue) {
    services = services.map((s) => (s === "other" ? `Inny — ${otherValue}` : s));
  }

  const budget = sanitize(formData.get("budget"), 40);

  if (firstName.length < 2) errors.firstName = t("brief-form.errors.required");
  if (!isValidEmail(email)) errors.email = t("brief-form.errors.email");

  if (!isValidPhone(phone)) errors.phone = t("brief-form.errors.phone");

  if (nipRaw && !isValidNip(nipRaw)) errors.nip = t("brief-form.errors.nip"); // opcjonalny, ale poprawny
  if (!message) errors.message = t("brief-form.errors.message");
  if (websiteRaw && !isValidWebsite(websiteRaw)) errors.website = t("brief-form.errors.website");
  if (services.length === 0) errors.services = t("brief-form.errors.services");
  if (services.includes("other") && !otherValue) errors.services = t("brief-form.errors.other-service");
  if (!ALLOWED_BUDGETS.has(budget)) errors.budget = t("brief-form.errors.budget");

  const website = websiteRaw
    ? /^https?:\/\//i.test(websiteRaw)
      ? websiteRaw
      : `https://${websiteRaw}`
    : "";

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: { firstName, email, phone, nip: nipRaw, message, website, services, budget },
  };
}

// ---------- Treść maila ----------
function buildEmail(data: BriefData): { html: string; text: string } {
  const rows: Array<[string, string]> = [
    ["Usługi", data.services.join(", ") || "—"],
    ["Budżet", data.budget],
    ["Opis projektu", data.message],
    ["Obecna strona", data.website || "—"],
    ["Imię", data.firstName],
    ["Telefon", data.phone],
    ["E-mail", data.email],
    ["NIP", data.nip || "—"],
  ];

  const html = `
    <h2>Nowy brief — Visual Label</h2>
    <table cellpadding="6" cellspacing="0" border="0" style="font-family:sans-serif;font-size:14px;">
      ${rows
      .map(
        ([label, value]) => `
        <tr>
          <td style="color:#666;vertical-align:top;white-space:nowrap;"><strong>${escapeHtml(label)}:</strong></td>
          <td style="white-space:pre-wrap;">${escapeHtml(value)}</td>
        </tr>`
      )
      .join("")}
    </table>`;

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  return { html, text };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

// ---------- GET: podgląd endpointu w przeglądarce ----------
export const GET: APIRoute = async () => {
  return new Response(
    `<!doctype html><html lang="pl"><meta charset="utf-8">
     <title>Brief API</title>
     <body style="font-family:sans-serif">
       <p>To jest endpoint API formularza briefu. Ten adres przyjmuje żądania <strong>POST</strong>.</p>
       <p><a href="/">← Wróć na stronę główną</a></p>
     </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
};

// ---------- POST: walidacja + wysyłka przez Resend SDK ----------
export const POST: APIRoute = async ({ request }) => {
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const locale: Locale = acceptLanguage.trim().toLowerCase().startsWith("pl") ? "pl" : "en";
  const t = getT(locale);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ ok: false, errors: { _form: t("brief-form.errors.send-failed") } }, 400);
  }

  // Honeypot: bot wypełnił ukryte pole → udajemy sukces, nic nie wysyłamy
  if (sanitize(formData.get("company"), 100)) {
    return jsonResponse({ ok: true });
  }

  const { ok, errors, data } = validateBrief(formData, t);
  if (!ok) {
    return jsonResponse({ ok: false, errors }, 400);
  }

  const env = import.meta.env as Record<string, string | undefined>;
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM;
  const to = env.RESEND_TO;

  if (!apiKey || !from || !to) {
    console.error("[brief] Brak zmiennych środowiskowych: RESEND_API_KEY / RESEND_FROM / RESEND_TO");
    return jsonResponse(
      { ok: false, errors: { _form: t("brief-form.errors.send-failed"), debug: "missing-env" } },
      500,
    );
  }

  const { html, text } = buildEmail(data);

  try {
    const resend = new Resend(apiKey);
    const { data: sent, error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: data.email, // SDK: camelCase „replyTo" (surowe REST API używa „reply_to")
      subject: `Nowy brief — ${data.firstName}`,
      html,
      text,
    });

    if (error) {
      console.error(`[brief] Resend error: ${error.name}: ${error.message}`);
      return jsonResponse(
        { ok: false, errors: { _form: t("brief-form.errors.send-failed"), debug: `resend-${error.name}` } },
        500,
      );
    }

    return jsonResponse({ ok: true, id: sent?.id ?? null });
  } catch (err) {
    console.error("[brief] Błąd połączenia z Resend:", err);
    return jsonResponse(
      { ok: false, errors: { _form: t("brief-form.errors.send-failed"), debug: "network" } },
      500,
    );
  }
};