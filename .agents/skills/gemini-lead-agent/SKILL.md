# Gemini Lead Agent

You can use the Gemini API for lead research and content generation.

## Setup

```bash
export GEMINI_API_KEY="your-key"
```

## Commands

### Full Pipeline (Research - Verify - Score - Export)
```bash
python gemini-tool.py pipeline --city "Austin" --type "plumbers" --output leads.csv
```

### Verify a Single Business Before Calling
```bash
python gemini-tool.py verify --business "Ace Plumbing" --city "Austin"
```

### Generate GBP Content
```bash
python gemini-tool.py content --task weekly-posts --business "Austin Barbershop"
python gemini-tool.py content --task website-homepage --business "Austin Barbershop"
python gemini-tool.py content --task review-request --business "Austin Barbershop"
```

## Daily Lead Gen Workflow

Every morning:
1. Run pipeline for today's niche
2. Review the scored lead list
3. Start calling top priority first
4. Log results back to vault
