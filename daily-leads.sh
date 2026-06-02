#!/usr/bin/env bash
# StealthO Daily Lead Gen — Run this every morning
# Rotates through business niches AND lead-finding situations
# Usage: bash daily-leads.sh [city] [niche] [situation]
# Defaults: city=Austin, niche=rotates daily, situation=rotates daily

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CITY="${1:-Austin}"
NICHE="${2}"
SITUATION="${3}"
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
  "cpa-tax-preparers"
  "contractors"
)

# Rotate through lead-finding SITUATIONS if none specified
SITUATIONS=(
  "home-based"
  "no-website"
  "service-area"
  "low-rating"
  "fb-only"
)

if [ -z "$NICHE" ]; then
  DAY_OF_WEEK=$(date +%u)  # 1=Mon, 2=Tue, etc
  NICHE_INDEX=$(( (DAY_OF_WEEK - 1) % ${#NICHES[@]} ))
  NICHE="${NICHES[$NICHE_INDEX]}"
fi

if [ -z "$SITUATION" ]; then
  DAY_OF_WEEK=$(date +%u)
  # Each day targets a different situation
  # Mon=home-based, Tue=no-website, Wed=service-area, Thu=low-rating, Fri=fb-only
  SIT_INDEX=$(( (DAY_OF_WEEK - 1) % ${#SITUATIONS[@]} ))
  SITUATION="${SITUATIONS[$SIT_INDEX]}"
fi

DATE=$(date +%Y-%m-%d)
OUTPUT_FILE="${OUTPUT_DIR}/${DATE}_${SITUATION}_${NICHE}_${CITY}.csv"

echo ""
echo "=========================================="
echo "  STEALTHO DAILY LEAD GEN"
echo "  City:      $CITY"
echo "  Niche:     $NICHE"
echo "  Situation: $SITUATION"
echo "  Date:      $DATE"
echo "=========================================="
echo ""

# Check for API keys
if [ -z "$GEMINI_API_KEY" ] || [ -z "$OPENROUTER_API_KEY" ]; then
  if [ -f "${SCRIPT_DIR}/.env" ]; then
    source "${SCRIPT_DIR}/.env"
  else
    echo "WARNING: No .env file found. Set GEMINI_API_KEY and OPENROUTER_API_KEY."
  fi
fi

export GEMINI_API_KEY
export OPENROUTER_API_KEY

# Run the pipeline with situation targeting
python3 "${SCRIPT_DIR}/gemini-tool.py" pipeline \
  --city "$CITY" \
  --type "$NICHE" \
  --situation "$SITUATION" \
  --output "$OUTPUT_FILE"

echo ""
echo "=========================================="
echo "  DONE — Leads saved to:"
echo "  $OUTPUT_FILE"
echo "=========================================="
echo ""
echo "Today's target: $SITUATION $NICHE in $CITY"
echo "Call these leads. Log results in vault/cycles/."
echo ""
