#!/usr/bin/env bash
#
# Security Shield — pre-push Git hook
# Scans outgoing commits for hardcoded secrets before they reach the remote.
#
# Install (once per clone):
#   chmod +x scripts/git-hooks/pre-push.sh && ln -sf ../../scripts/git-hooks/pre-push.sh .git/hooks/pre-push
#
# Bypass for a single push (use sparingly, document why):
#   git push --no-verify

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

ZERO_SHA="0000000000000000000000000000000000000000"
FOUND=0

# Files whose content should never trigger the shield.
# Matches against the path shown in the diff header (b/path).
EXCLUDED_PATHS='(\.env\.example$|\.lock$|pnpm-lock\.yaml|package-lock\.json|scripts/git-hooks/pre-push\.sh|__snapshots__)'

# ─── Pattern registry ─────────────────────────────────────────────────────────
# Format: "Human-readable label|ERE pattern"
# Applied only to *added* lines in the diff (lines starting with a single +).
#
# Design constraints reviewed by Lead Dev:
#   - All patterns require a quoted literal value after the assignment.
#     This avoids false positives on `VAR = process.env.VAR` references.
#   - Minimum value lengths are set conservatively to reduce noise from
#     obvious test placeholders (e.g. 'pass', 'secret', 'mock').
#   - Cloud-provider key patterns match only their documented prefix+length format.
#   - JWT pattern requires three dot-separated base64url segments of realistic size.
# ─────────────────────────────────────────────────────────────────────────────
PATTERNS=(
  # SESSION_SECRET with a literal value (not an env var reference)
  # Lead Dev note: process.env.SESSION_SECRET won't match — no quotes follow the =
  "Hardcoded SESSION_SECRET value|SESSION_SECRET[[:space:]]*=[[:space:]]*['\"][^'\"[:space:]]{8,}['\"]"

  # AWS Access Key ID — prefix + 16 uppercase alphanumerics, no lookalike in normal code
  "AWS Access Key ID|(AKIA|ASIA|AROA)[0-9A-Z]{16}"

  # Hardcoded API key with a literal value ≥ 20 chars
  # Lead Dev note: raised from 16 to 20 to avoid matching short example strings in docs
  "Hardcoded API key|(api_key|apiKey|API_KEY)[[:space:]]*[:=][[:space:]]*['\"][a-zA-Z0-9_-]{20,}['\"]"

  # PEM private key block header — format is fixed by the spec, no false positives
  "PEM private key|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----"

  # Database URL with inline user:password credentials
  # Lead Dev note: postgres://localhost:5432/db won't match (no user:pass@)
  #               postgres://user:@host won't match (password < 4 chars)
  "DB URL with inline credentials|(postgres(ql)?|mysql|mongodb(\+srv)?):\/\/[^:[:space:]]+:[^@[:space:]]{4,}@[^\/[:space:]]"

  # Generic password assignment with a literal value ≥ 8 chars
  # Lead Dev note: threshold raised to 8 to avoid matching 'pass', 'test', 'mock'
  #               test files should use ≤ 7-char dummy values (e.g. 'secret!')
  "Hardcoded password|(password|passwd)[[:space:]]*=[[:space:]]*['\"][^'\"]{8,}['\"]"

  # Stripe live/test secret keys — documented format, zero ambiguity
  "Stripe secret key|sk_(live|test)_[a-zA-Z0-9]{24,}"

  # GitHub personal access tokens (classic and fine-grained)
  "GitHub personal access token|(ghp|gho|ghs|ghu|github_pat)_[a-zA-Z0-9_]{36,}"

  # JWT-shaped token hardcoded in source (three base64url segments of realistic size)
  # Lead Dev note: E2E fixture JWTs should be generated at test runtime, not hardcoded.
  #               If unavoidable, add the fixture file to EXCLUDED_PATHS above.
  "Hardcoded JWT token|eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{10,}"
)

# ─── Scanner ──────────────────────────────────────────────────────────────────
scan_diff() {
  local diff="$1"
  local current_file=""
  local skip_file=0

  while IFS= read -r line; do
    # Track current file from diff header lines
    if [[ "$line" =~ ^diff\ --git\ a/.+\ b/(.+)$ ]]; then
      current_file="${BASH_REMATCH[1]}"
      if echo "$current_file" | grep -qE "$EXCLUDED_PATHS"; then
        skip_file=1
      else
        skip_file=0
      fi
      continue
    fi

    [ "$skip_file" -eq 1 ] && continue

    # Only scan added lines; skip the +++ header
    [[ "$line" =~ ^\+ ]] || continue
    [[ "$line" =~ ^\+\+\+ ]] && continue

    local content="${line:1}"  # strip leading '+'

    for entry in "${PATTERNS[@]}"; do
      local label="${entry%%|*}"
      local pattern="${entry#*|}"

      if echo "$content" | grep -qE "$pattern" 2>/dev/null; then
        if [ "$FOUND" -eq 0 ]; then
          echo -e "\n${RED}${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
          echo -e "${RED}${BOLD}║   SECURITY SHIELD — potential secrets detected       ║${RESET}"
          echo -e "${RED}${BOLD}╚══════════════════════════════════════════════════════╝${RESET}\n"
        fi
        local match
        match=$(echo "$content" | grep -oE "$pattern" 2>/dev/null | head -1 || true)
        echo -e "  ${RED}✗ ${BOLD}${label}${RESET}"
        echo -e "    ${YELLOW}File :${RESET} ${current_file:-unknown}"
        echo -e "    ${YELLOW}Match:${RESET} ${match}"
        echo ""
        FOUND=1
      fi
    done
  done <<< "$diff"
}

# ─── Main ─────────────────────────────────────────────────────────────────────
# Test mode: pass a raw unified diff on stdin instead of git refs.
#   echo "<diff>" | bash scripts/git-hooks/pre-push.sh --test
if [ "${1:-}" = "--test" ]; then
  scan_diff "$(cat)"
  if [ "$FOUND" -eq 1 ]; then
    echo -e "${RED}${BOLD}[test] secrets found — would block push.${RESET}"
    exit 1
  fi
  echo -e "${GREEN}[test] no secrets detected.${RESET}"
  exit 0
fi

# Normal pre-push mode: git feeds refs on stdin.
COMBINED_DIFF=""

while IFS=' ' read -r local_ref local_sha remote_ref remote_sha; do
  # Deleting a remote branch — nothing to scan
  [ "$local_sha" = "$ZERO_SHA" ] && continue

  if [ "$remote_sha" = "$ZERO_SHA" ]; then
    # New branch: diff against the common ancestor with the upstream default branch
    base=$(git merge-base HEAD origin/main 2>/dev/null \
        || git rev-list --max-parents=0 HEAD 2>/dev/null \
        || echo "")
    if [ -n "$base" ]; then
      COMBINED_DIFF+=$(git diff --unified=0 "$base" "$local_sha" -- 2>/dev/null || true)
    else
      COMBINED_DIFF+=$(git show "$local_sha" --unified=0 2>/dev/null || true)
    fi
  else
    COMBINED_DIFF+=$(git diff --unified=0 "$remote_sha" "$local_sha" -- 2>/dev/null || true)
  fi
done

if [ -n "$COMBINED_DIFF" ]; then
  scan_diff "$COMBINED_DIFF"
fi

if [ "$FOUND" -eq 1 ]; then
  echo -e "${RED}${BOLD}Push blocked.${RESET} Remove or rotate any real secrets shown above."
  echo -e "${YELLOW}Tip:${RESET} Store real values in ${BOLD}.env.local${RESET} and reference via ${BOLD}process.env.VAR${RESET}."
  echo -e "${YELLOW}Tip:${RESET} If this is a confirmed false positive, bypass once with ${BOLD}git push --no-verify${RESET}"
  echo -e "     and open an issue to widen the exclusion list.\n"
  exit 1
fi

echo -e "\n${GREEN}✓ Security Shield: no secrets detected. Push proceeding.${RESET}\n"
exit 0
