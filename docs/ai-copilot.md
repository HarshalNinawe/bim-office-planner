# AI Copilot Integration

The AI Copilot uses Groq API endpoints and the Llama 3.3 70B model to parse design commands and compile project reports.

## Endpoint Services

### 1. Command Palette Interpreter
* **Endpoint:** `POST /api/copilot/command`
* **Workflow:** Translates natural language design inputs (e.g. *"increase building floors to 6"*) into structured JSON actions:
```json
{
  "actions": [
    { "type": "UPDATE_FLOORS", "value": 6 }
  ]
}
```

### 2. Feasibility Report Generator
* **Endpoint:** `POST /api/copilot/report`
* **Workflow:** Generates detailed Markdown reports based on current design calculations.

### 3. Graceful Local Fallbacks
If the Groq API key is invalid or unauthorized (401), the backend triggers a regex parser and returns pre-formatted reports containing live calculations. This keeps the application fully functional offline.
