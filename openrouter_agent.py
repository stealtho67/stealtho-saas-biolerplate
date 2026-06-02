#!/usr/bin/env python3
"""
StealthO OpenRouter Agent — Multi-Model Router

Routes every task to the best free model. Falls back through a chain.
No single point of failure. Zero cost.

Usage:
  from openrouter_agent import OR
  or = OR()
  
  # Auto-route (picks best model for the task)
  result = or.run("Research plumbers in Austin without websites", task="research")
  result = or.run("Build a 5-page website for a barber", task="code")
  result = or.run("Score these 20 leads by priority", task="analysis")
  result = or.run("Write 4 GBP posts for a dentist", task="content")
  
  # Or specify a model
  result = or.run("...", model="qwen/qwen3-coder:free")
  
  # With fallback control
  result = or.run("...", task="research", fallback_depth=3)
"""

import os, json, time, sys
from datetime import datetime

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    print("ERROR: Set OPENROUTER_API_KEY environment variable")
    print("  export OPENROUTER_API_KEY='sk-or-v1-...'")
    print("  Or add to .env file: OPENROUTER_API_KEY=sk-or-v1-...")
    sys.exit(1)
OPENROUTER_BASE = "https://openrouter.ai/api/v1"

# ─── MODEL REGISTRY ──────────────────────────────────────────────────────────
# Every free model with its strengths, context window, and speed rating

MODELS = {
    # ── REASONING & RESEARCH ──
    "openai/gpt-oss-120b:free": {
        "strengths": ["research", "reasoning", "analysis", "scoring"],
        "context": 131072,
        "quality": 9,
        "speed": 4,
        "notes": "OpenAI 120B MoE — high reasoning, strong all-around"
    },
    "meta-llama/llama-3.3-70b-instruct:free": {
        "strengths": ["research", "reasoning", "analysis", "content", "scoring"],
        "context": 131072,
        "quality": 8,
        "speed": 6,
        "notes": "Meta Llama 3.3 70B — reliable, balanced, fast"
    },
    "nousresearch/hermes-3-llama-3.1-405b:free": {
        "strengths": ["research", "reasoning", "analysis", "scoring", "content"],
        "context": 131072,
        "quality": 10,
        "speed": 2,
        "notes": "405B params — biggest brain available, slower but deepest reasoning"
    },
    
    # ── CODING & WEBSITE BUILDING ──
    "qwen/qwen3-coder:free": {
        "strengths": ["code", "website", "build", "technical"],
        "context": 1048576,
        "quality": 10,
        "speed": 3,
        "notes": "1M context, purpose-built for code generation and agentic coding"
    },
    "poolside/laguna-m.1:free": {
        "strengths": ["code", "website", "build", "technical"],
        "context": 262144,
        "quality": 9,
        "speed": 3,
        "notes": "Coding agent model, complex software engineering"
    },
    "moonshotai/kimi-k2.6:free": {
        "strengths": ["code", "website", "build", "technical", "ui-ux"],
        "context": 262144,
        "quality": 9,
        "speed": 4,
        "notes": "Long-horizon coding, UI/UX generation, multi-agent orchestration"
    },
    
    # ── BIG ANALYSIS (1M context) ──
    "nvidia/nemotron-3-super-120b-a12b:free": {
        "strengths": ["analysis", "patterns", "big-data", "research"],
        "context": 1000000,
        "quality": 9,
        "speed": 3,
        "notes": "1M context, 120B params — analyze entire DB at once"
    },
    "openrouter/owl-alpha": {
        "strengths": ["analysis", "patterns", "agentic", "research"],
        "context": 1048756,
        "quality": 8,
        "speed": 4,
        "notes": "1M context, built for agentic workloads and long-context tasks"
    },
    
    # ── CONTENT & COPYWRITING ──
    "google/gemma-4-31b-it:free": {
        "strengths": ["content", "creative", "multimodal", "writing"],
        "context": 262144,
        "quality": 8,
        "speed": 5,
        "notes": "Google DeepMind 31B, multimodal, clean output"
    },
    "qwen/qwen3-next-80b-a3b-instruct:free": {
        "strengths": ["content", "fast", "general", "writing"],
        "context": 262144,
        "quality": 7,
        "speed": 9,
        "notes": "Fast, no thinking traces, responsive"
    },
    "z-ai/glm-4.5-air:free": {
        "strengths": ["content", "agentic", "general", "writing"],
        "context": 131072,
        "quality": 7,
        "speed": 7,
        "notes": "Agent-centric, lightweight, balanced"
    },
    
    # ── FALLBACK PAID (CHEAP) — only used when free models are exhausted ──
    "google/gemma-4-26b-a4b-it:free": {
        "strengths": ["content", "general", "writing"],
        "context": 262144,
        "quality": 7,
        "speed": 6,
        "cost_per_million": 0.00,
        "notes": "Gemma 4 MoE — efficient, free tier available"
    },
}

# ─── CHEAP PAID FALLBACKS (cents per million tokens) ───────────────────────
# These are ONLY used when all free models fail
CHEAP_PAID_FALLBACKS = [
    {"model": "google/gemini-2.0-flash-lite", "cost_per_million": 0.04, "quality": 6, "strengths": ["general", "fast"]},
    {"model": "mistralai/mistral-7b-instruct:nitro", "cost_per_million": 0.07, "quality": 6, "strengths": ["general", "fast"]},
    {"model": "cognitivecomputations/dolphin-mistral-24b", "cost_per_million": 0.14, "quality": 7, "strengths": ["general", "content"]},
]

# ─── TASK ROUTING TABLE ─────────────────────────────────────────────────────

TASK_ROUTES = {
    "research": {
        "primary": ["openai/gpt-oss-120b:free", "meta-llama/llama-3.3-70b-instruct:free"],
        "fallback": ["nousresearch/hermes-3-llama-3.1-405b:free", "nvidia/nemotron-3-super-120b-a12b:free"],
        "description": "Finding businesses, verifying websites, GBP status"
    },
    "scoring": {
        "primary": ["meta-llama/llama-3.3-70b-instruct:free", "openai/gpt-oss-120b:free"],
        "fallback": ["nousresearch/hermes-3-llama-3.1-405b:free"],
        "description": "Scoring leads, prioritizing, generating pitch angles"
    },
    "analysis": {
        "primary": ["nvidia/nemotron-3-super-120b-a12b:free", "openrouter/owl-alpha"],
        "fallback": ["openai/gpt-oss-120b:free", "nousresearch/hermes-3-llama-3.1-405b:free"],
        "description": "Big-pattern analysis, database-wide insights"
    },
    "code": {
        "primary": ["qwen/qwen3-coder:free", "poolside/laguna-m.1:free"],
        "fallback": ["moonshotai/kimi-k2.6:free", "openai/gpt-oss-120b:free"],
        "description": "Website building, code generation, technical tasks"
    },
    "website": {
        "primary": ["qwen/qwen3-coder:free", "moonshotai/kimi-k2.6:free"],
        "fallback": ["poolside/laguna-m.1:free", "openai/gpt-oss-120b:free"],
        "description": "Full website generation from prompt"
    },
    "content": {
        "primary": ["google/gemma-4-31b-it:free", "meta-llama/llama-3.3-70b-instruct:free"],
        "fallback": ["qwen/qwen3-next-80b-a3b-instruct:free", "nousresearch/hermes-3-llama-3.1-405b:free"],
        "description": "GBP posts, website copy, review templates"
    },
    "general": {
        "primary": ["meta-llama/llama-3.3-70b-instruct:free", "openai/gpt-oss-120b:free"],
        "fallback": ["qwen/qwen3-next-80b-a3b-instruct:free", "google/gemma-4-31b-it:free"],
        "description": "General purpose, quick tasks"
    },
}


class OpenRouterAgent:
    """Routes tasks to the best free model with automatic fallback chains."""

    def __init__(self, api_key=None):
        self.api_key = api_key or OPENROUTER_API_KEY
        self.base_url = OPENROUTER_BASE
        self.stats = {"calls": 0, "failures": 0, "models_used": {}, "total_cost": 0.0}
        self._import_httpx()
    
    def _import_httpx(self):
        """Lazy import httpx to avoid startup cost."""
        try:
            import httpx
            self.httpx = httpx
        except ImportError:
            import requests as req
            self.httpx = None
            self.requests = req
    
    def _call_api(self, model, messages, temperature=0.2, max_tokens=4096, timeout=60):
        """Make an API call to OpenRouter."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://stealtho.ai",
            "X-Title": "StealthO Lead Agent",
        }
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        try:
            if self.httpx:
                with self.httpx.Client(timeout=timeout) as client:
                    resp = client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )
            else:
                resp = self.requests.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=timeout,
                )
            
            data = resp.json()
            
            if resp.status_code == 429:
                return {"error": "rate_limited", "retry_after": 5}
            if resp.status_code != 200:
                err = data.get("error", {}).get("message", str(data))
                return {"error": f"http_{resp.status_code}", "message": err}
            
            choice = data.get("choices", [{}])[0]
            content = choice.get("message", {}).get("content", "")
            
            # Track usage if available
            usage = data.get("usage", {})
            
            self.stats["calls"] += 1
            self.stats["models_used"][model] = self.stats["models_used"].get(model, 0) + 1
            
            return {"content": content, "usage": usage, "model": model}
            
        except Exception as e:
            return {"error": "exception", "message": str(e)}

    def run(self, prompt, task="general", model=None, fallback_depth=3, 
            system_prompt=None, temperature=0.2, max_tokens=4096, timeout=60):
        """
        Run a task through the best available model with fallback chain.
        
        Args:
            prompt: The user prompt / question
            task: Task type — "research", "scoring", "analysis", "code", "website", "content", "general"
            model: Override — skip auto-routing and use a specific model
            fallback_depth: How many models to try before giving up (default 3)
            system_prompt: Optional system message
            temperature: 0-1
            max_tokens: Max response tokens
            timeout: Per-call timeout
            
        Returns:
            {"content": "...", "model": "...", "usage": {}, "fallback_chain": ["model1", "model2"]}
        """
        # Determine which models to try
        models_to_try = []
        fallback_chain = []
        
        if model:
            models_to_try = [model]
            fallback_chain = [model]
        else:
            route = TASK_ROUTES.get(task, TASK_ROUTES["general"])
            free_models = route["primary"][:fallback_depth] + route["fallback"][:max(0, fallback_depth - len(route["primary"]))]
            
            # Add cheap paid fallbacks after free models
            paid_fallbacks = [fb["model"] for fb in CHEAP_PAID_FALLBACKS]
            models_to_try = free_models + paid_fallbacks
            fallback_chain = models_to_try.copy()
        
        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        # Try each model in sequence
        for i, model_id in enumerate(models_to_try):
            if i > 0:
                wait = min(i * 2, 10)
                time.sleep(wait)
            
            result = self._call_api(model_id, messages, temperature, max_tokens, timeout)
            
            if "error" not in result:
                result["fallback_chain"] = fallback_chain[:i+1]
                result["task"] = task
                return result
            
            error_type = result.get("error", "")
            self.stats["failures"] += 1
            
            # If rate limited, wait and retry
            if error_type == "rate_limited" and i < len(models_to_try) - 1:
                retry_after = result.get("retry_after", 5)
                print(f"      ⏳ Rate limited on {model_id}, waiting {retry_after}s...")
                time.sleep(retry_after)
                continue
            
            # If it's the last model, return the error
            if i == len(models_to_try) - 1:
                return {
                    "error": True,
                    "content": f"All models failed. Last error: {error_type}: {result.get('message', '')}",
                    "models_tried": models_to_try[:i+1],
                    "task": task,
                }
        
        return {"error": True, "content": "No models available", "task": task}
    
    def get_stats(self):
        """Get usage statistics, including cost."""
        return {
            **self.stats,
            "models_used_sorted": sorted(
                self.stats["models_used"].items(),
                key=lambda x: -x[1]
            )
        }
    
    def list_available_models(self):
        """Test which models are actually responding."""
        results = []
        for model_id in MODELS:
            info = MODELS[model_id]
            r = self._call_api(model_id, [{"role": "user", "content": "Reply with OK"}], max_tokens=10, timeout=10)
            if "error" not in r:
                results.append({"model": model_id, "status": "available", **info})
            else:
                results.append({"model": model_id, "status": r.get("error", "unknown"), **info})
        return results


# ─── SINGLETON ───────────────────────────────────────────────────────────────

_or_instance = None

def get_router():
    global _or_instance
    if _or_instance is None:
        _or_instance = OpenRouterAgent()
    return _or_instance

OR = get_router()


# ─── CLI ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    or_agent = OpenRouterAgent()
    
    if len(sys.argv) >= 2 and sys.argv[1] == "test":
        print("\n🧪 Testing all free models...\n")
        results = or_agent.list_available_models()
        for r in results:
            status_icon = "✅" if r["status"] == "available" else "❌"
            strengths = ", ".join(r["strengths"][:3])
            print(f"  {status_icon} {r['model'][:50]:50} {r['status']}")
            print(f"     Context: {r['context']:,} | Speed: {'█' * r['speed']}{'░' * (10-r['speed'])} | {strengths}")
            print()
    
    elif len(sys.argv) >= 2 and sys.argv[1] == "run":
        task = sys.argv[2] if len(sys.argv) > 2 else "general"
        prompt = sys.argv[3] if len(sys.argv) > 3 else "Say hello"
        print(f"\n📡 Running task '{task}' via auto-router...\n")
        result = or_agent.run(prompt, task=task)
        if "error" in result and result["error"]:
            print(f"❌ {result['content']}")
        else:
            print(f"  Model: {result.get('model', '?')}")
            print(f"  Chain: {' → '.join(result.get('fallback_chain', []))}")
            print(f"\n{result['content']}\n")
    
    else:
        print("Usage:")
        print("  python openrouter_agent.py test           # Test all free models")
        print("  python openrouter_agent.py run research    # Research task")
        print("  python openrouter_agent.py run scoring     # Scoring task")
        print("  python openrouter_agent.py run code        # Code task")
        print("  python openrouter_agent.py run content     # Content task")
        print("  python openrouter_agent.py run analysis    # Analysis task")
        print("  python openrouter_agent.py run website     # Website building task")
