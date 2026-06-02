# OpenRouter Multi-Model Integration

**Date:** 2026-06-02  
**Status:** ✅ Live  
**Credits:** $10 loaded  
**Daily Cost:** ~$0 (free models)  

## Architecture

Instead of one Gemini model doing everything, we route each task to the best free model:

| Task | Primary | Free? | Context | Fallback Chain |
|------|---------|-------|---------|---------------|
| Lead Research | GPT-OSS-120B (OpenAI) | ✅ Free | 131K | Llama 3.3 70B → Hermes 405B |
| Lead Scoring | GPT-OSS-120B | ✅ Free | 131K | Nemotron 3 Super → cheap paid |
| Website Building | Qwen3-Coder | ✅ Free | **1M** | Laguna M.1 → Kimi K2.6 |
| Big Analysis | Nemotron 3 Super (NVIDIA) | ✅ Free | **1M** | Owl Alpha → fallback |
| Content Writing | Gemma 4 31B (Google) | ✅ Free | 256K | GLM-4.5-Air → cheap paid |
| Web Search | Gemini 2.5-flash | ❌ $0.15/run | — | Gemini-only feature |
| Final Fallback | Gemini Flash Lite | 💰 $0.04/M | — | Mistral 7B → Dolphin 24B |

## Key Files

- `openrouter_agent.py` — Model router with auto-routing, fallback chain, rate-limit handling
- `gemini-tool.py` — Refactored to use `call_llm()` unified interface

## Commands

```bash
python3 openrouter_agent.py test           # Test all free models
python3 openrouter_agent.py run research   # Run a research task
python3 gemini-tool.py build-site --business "X" --niche Y --city "Z"
```

## Cost Analysis

- **Free tier:** 6 models available, each with rate limits (~20 req/min)
- **Strategy:** Primary → free fallback → free fallback → cheap paid ($0.04/M) → Gemini ($0.15/run)
- **$10 credits:** Will last months with normal daily usage
