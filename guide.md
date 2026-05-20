§ API
API keys
Use a secret key to authenticate API requests. Never expose your key in client‑side code.

Create key
508 人在线
Name	Secret	Created	Last used	Today	
api
fe_oa_••••••••••••84e6	May 16, 2026	May 20, 2026	$9.67	Revoke
API routes
Use the endpoint below as your base URL.
Anthropic format
Anthropic
Native Claude API format for Claude Code, Cline, and Anthropic SDK applications.
节点	接入地址	在线	
claude-t0
https://cc.freemodel.dev	—	
claude-t1
T1+
https://api-cc.freemodel.dev	
128	
/v1/messages
Anthropic native Messages API. Supports streaming, tool use, vision, and extended thinking. Used by Claude Code, Cline, and all Anthropic SDK applications.
Claude Code 配置文档
OpenAI format
OpenAI
Compatible with ChatGPT SDK, Cursor, ChatBox, and all OpenAI-ecosystem tools.
节点	接入地址	在线	
默认线路
https://api.freemodel.dev	
314	
openai-t1-sg
T1+
https://vip-sg.freemodel.dev	
71	
openai-t2-sg
T2+
api-t2-sg.freemodel.dev	
1	
/v1/chat/completions
Classic chat completion API. Stateless — each request carries the full message history. Compatible with every OpenAI SDK and tool.
/v1/responses
New Responses API. Supports stateful multi-turn sessions via previous_response_id, built-in tools (file search, code interpreter), and richer streaming events.
Codex 配置文档
Keep secrets safe. Treat your API key like a password — anyone with it can call the API and spend your credits. Rotate immediately if exposed.

§ Documentation
Claude Code Setup Guide
Claude Code
Codex
On this page
Overview
Install Node.js
Get an API key
Install the client
Configure settings.json
Launch
FAQ
A walk‑through for installing the Claude Code client — from a clean machine to your first claude command in five short steps. Pick your OS below.

macOS
Windows
Linux
Platform · Windows 10 or later
Time · ~5 min
Updated · Apr 2026
Step 01
Install Git Bash (recommended)
We recommend running the CC client from Git Bash — it ships a Unix‑style shell that handles paths and quoting more reliably than CMD or PowerShell.

Download Git for Windows and run the installer with the default options.
Already have Git Bash? You can skip this step.
Step 02
Install Node.js (if you haven't already)
The CC client requires Node.js 18 or newer. Open PowerShell or Git Bash and run:

Copynode --version
If the printed version is ≥ 18.0.0, you're good. Otherwise:

Download the Windows installer (LTS, .msi) and run it with the default options.
After installing, close and reopen your terminal so the new node and npm commands are picked up.
Step 03
Create an API key
Open the API Keys page from the sidebar, click Create key, give it a memorable name, and copy the secret. You'll only see it once — keep it somewhere safe.

Heads up. Treat your key like a password. Anyone with it can spend your credits.
Step 04
Install the CC client
In PowerShell, Command Prompt, or Git Bash, run:

Copynpm install -g @anthropic-ai/claude-code
The package registers a PATH. Close and reopen your terminal afterwards.

Step 05
Create a settings.json file
On Windows the config lives at C:\Users\<you>\.claude\settings.json. If the .claude folder doesn't exist yet, run claude once to let it auto‑create the directory, then create the file with this content:

Copy{
    "env": {
        "ANTHROPIC_API_KEY": "YOUR_API_KEY",
        "ANTHROPIC_BASE_URL": "https://cc.freemodel.dev",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    },
    "permissions": {
        "allow": [],
        "deny": []
    },
    "apiKeyHelper": "echo 'YOUR_API_KEY'"
}
Replace both occurrences of YOUR_API_KEY with the secret from step 3.

Tip. If File Explorer hides files starting with a dot, type the path directly into the address bar to open .claude.
Step 06
Launch the client
Restart your terminal, then run:

Copyclaude
You should see the welcome banner and a prompt.

FAQ
Common questions
Q.
How do I update to the latest version?
Re‑run the install command — npm will replace the existing binary in place: npm install -g @anthropic-ai/claude-code
Q.
How do I uninstall?
npm uninstall -g @anthropic-ai/claude-code — and optionally delete ~/.claude/ (or %USERPROFILE%\.claude\on Windows) to remove your local settings.
Q.
Install fails with a network error. What now?
Try a faster mirror — for users in mainland China the Taobao registry usually works: npm install -g @anthropic-ai/claude-code --registry https://registry.npmmirror.com
Q.
Where do I get help?
Run claude --help to list every available command and flag, or email support@freemodel.dev.

§ Documentation
Codex Setup Guide
Claude Code
Codex
On this page
Overview
Install Codex CLI
Create .codex directory
Get an API key
Create auth.json
Create config.toml
Restart & verify
Start using
macOS / Linux
Windows
Official package — 100% official @openai/codex — identical to the upstream CLI, full compatibility guaranteed.
System requirements · Windows 10 (build 17763 / version 1809) or later
01
Install Codex CLI
Run either of the following commands to install the official Codex CLI globally:

Copynpm install -g @openai/codex
# 或者 / or
brew install codex
Both commands install the same package. Use whichever matches your setup.
02
Create the .codex directory
Delete the existing directory if present, then recreate it. In File Explorer or PowerShell:

Copy# PowerShell
Remove-Item -Recurse -Force ~\.codex -ErrorAction SilentlyContinue
New-Item -ItemType Directory ~\.codex
Replace <your-username> with your actual Windows username.
03
Get an API key
Go to the API Keys page in the dashboard, create a new key, and copy it.

04
Create auth.json
In C:\Users\<your-username>\.codex, delete any existing auth.json then create a new one:

Copy{
  "OPENAI_API_KEY": "YOUR_API_KEY"
}
Replace YOUR_API_KEY with the key you copied.
05
Create config.toml
In C:\Users\<your-username>\.codex, delete any existing config.toml then create a new one:

Copymodel_provider = "freemodel"
model = "gpt-5.5"
model_reasoning_effort = "xhigh"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.freemodel]
name = "freemodel"
base_url = "https://api.freemodel.dev"
wire_api = "responses"
Paste the content below exactly as shown — do not modify any values.
06
Restart & verify
Restart your terminal, then run the following to confirm the installation:

Copycodex -V
If a version number is printed, Codex is installed correctly.
07
Start using Codex
Navigate to any project folder and launch Codex:

Copy# 切换到项目目录 / Navigate to project
cd your-project-folder

# 启动 Codex / Launch Codex
codex
The official VSCode extension is fully supported.