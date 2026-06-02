#!/usr/bin/env bash
# StealthO Daily Lead Gen — Run this every morning
# Usage: bash daily-leads.sh [city] [niche]
# Defaults: city=Austin, niche=rotates daily

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CITY="${1:-Austin}"
NICHE="${2}"
OUTPUT_DIR="${SCRIPT_DIR}/leads"

mkdir -p "$OUTPUT_DIR"

# Rotate through niches if none specified
NICHES=(
  "barbers"
  "plumbers" 
  "electricians"
  "dentists"
  "chiropractors"
  "auto-mechanics"
  "restaurants"
  "hvac"
  "landscapers"
  "cleaning-services"
)

if [ -z "$NICHE" ]; then
  DAY_OF_WEEK=$(date +%u)
  INDEX=$(( (DAY_OF_WEEK - 1) % ${#NICHES[@]} ))
  NICHE="${NICHES[$INDEX]}"
fi

DATE=$(date +%Y-%m-%d)
OUTPUT_FILE="${OUTPUT_DIR}/${DATE}_${NICHE}_${CITY}.csv"

echo ""
echo "=========================================="
echo "  STEALTHO DAILY LEAD GEN"
echo "  City:  $CITY"
echo "  Niche: $NICHE"
echo "  Date:  $DATE"
echo "=========================================="
echo ""

# Check for API key
if [ -z "$GEMINI_API_KEY" ]; then
  if [ -f "${SCRIPT_DIR}/.env" ]; then
    source "${SCRIPT_DIR}/.env"
  else
    echo "ERROR: Set GEMINI_API_KEY or create .env file"
    exit 1
  fi
fi

export GEMINI_API_KEY

# Run the pipeline
python3 "${SCRIPT_DIR}/gemini-tool.py" pipeline \
  --city "$CITY" \
  --type "$NICHE" \
  --output "$OUTPUT_FILE"

echo ""
echo "=========================================="
echo "  DONE — Leads saved to:"
echo "  $OUTPUT_FILE"
echo "=========================================="
echo ""
echo "Next step: Open the list, start calling."
echo "Log results in vault/cycles/ when done."
