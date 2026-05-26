# PlaneKey Agent Runtime Map

PlaneKey Client v1.5.3 separates agent control-plane/runtime activity from app source activity.

## Providers detected

- Anthropic / Claude
- OpenAI / ChatGPT / Codex
- Google / Gemini / Vertex AI
- Hugging Face
- IBM / watsonx
- Microsoft / Azure OpenAI
- AWS / Bedrock
- Meta / Llama
- Local agents / Ollama / LocalAI / LangChain / MCP

## Rule

Agent runtime files are forensic evidence, not canon source. Keep them out of public repos and deploy bundles unless explicitly promoted after review.

## Commands

```bash
pk-client debug map <path> --name <label> --force
pk-client debug agents <path> --name <label> --force
```

## Storm detection

The client flags persistence storms when agent config writes, temp writes, atomic renames, or lock errors happen in tight bursts. This catches loops such as repeated `.claude.json` save/rename churn and generalizes the same check for OpenAI, Google/Gemini, Hugging Face, IBM/watsonx, Azure, AWS/Bedrock, Meta/Llama, and local agent runtimes.
