// Minimal SMART on FHIR standalone-launch client (read-only, PKCE public client).
export const READ_SCOPES =
  "launch/patient openid fhirUser offline_access patient/Patient.read patient/MedicationRequest.read patient/Condition.read patient/Encounter.read patient/Observation.read";

export type SmartPending = {
  provider_name: string;
  fhir_base_url: string;
  client_id: string;
  token_url: string;
  verifier: string;
  state: string;
};

const PENDING_KEY = "pulse.smart.pending";

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const randomString = () => b64url(crypto.getRandomValues(new Uint8Array(32)));

async function challenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return b64url(new Uint8Array(digest));
}

export const redirectUri = () => `${window.location.origin}/ehr/callback`;

export async function discover(fhirBaseUrl: string) {
  const base = fhirBaseUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/.well-known/smart-configuration`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`This server did not return SMART settings (${res.status}). Check the FHIR address.`);
  const cfg = await res.json();
  if (!cfg.authorization_endpoint || !cfg.token_endpoint) throw new Error("Server is missing SMART authorization details.");
  return cfg as { authorization_endpoint: string; token_endpoint: string; scopes_supported?: string[] };
}

export async function beginLaunch(opts: { provider_name: string; fhir_base_url: string; client_id: string }) {
  const cfg = await discover(opts.fhir_base_url);
  const verifier = randomString();
  const state = randomString();
  const pending: SmartPending = {
    provider_name: opts.provider_name,
    fhir_base_url: opts.fhir_base_url.replace(/\/$/, ""),
    client_id: opts.client_id,
    token_url: cfg.token_endpoint,
    verifier,
    state,
  };
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));

  const url = new URL(cfg.authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", opts.client_id);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("scope", READ_SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("aud", pending.fhir_base_url);
  url.searchParams.set("code_challenge", await challenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  window.location.assign(url.toString());
}

export function takePending(): SmartPending | null {
  const raw = sessionStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PENDING_KEY);
  try {
    return JSON.parse(raw) as SmartPending;
  } catch {
    return null;
  }
}

export async function exchangeCode(pending: SmartPending, code: string) {
  const res = await fetch(pending.token_url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      client_id: pending.client_id,
      code_verifier: pending.verifier,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error_description ?? data?.error ?? `Token exchange failed (${res.status})`);
  return data as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    patient?: string;
  };
}
