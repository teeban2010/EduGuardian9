---
name: requestSecrets corruption with overlapping substrings
description: A Supabase URL + anon key pair (sharing the project ref substring) got saved via requestSecrets with garbled/swapped values; verify shape after saving.
---

Observed once (2026-07-14): after a user submitted `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` via the `requestSecrets` form, `process.env` held corrupted values for both — neither was a valid URL or JWT, and both contained the Supabase project ref substring concatenated oddly. Also observed once when the user pasted secret values directly in chat instead of using the form.

**Why it matters:** Don't trust "user confirmed requested secrets" as proof the values are usable. A workflow can start cleanly and only fail at runtime with a cryptic client-library error (e.g. "Invalid supabaseUrl").

**How to apply:**
- After any `requestSecrets` round-trip, validate shape in a shell/node check before assuming success — e.g. check prefix/length/regex (`https://...`, `eyJ...` for a JWT) rather than printing the raw value.
- If corrupted, don't just re-run `requestSecrets` for both keys blindly — consider setting the non-sensitive parts (like a public project URL) via `setEnvVars` directly, and only re-request the truly sensitive piece via `requestSecrets`, to reduce room for mis-save.
- Remember: setting a key via `setEnvVars` while the same key still exists as a secret creates two stores for one name; the env var value takes precedence at runtime, but clean up/reconcile if it matters long-term.
