# DXGen — Production-Ready AI Content & Blog Generation SaaS + API

DXGen is a modern, enterprise-grade AI content generation platform and developer API powered by **Google Gemini**. It enables businesses to produce optimized, publication-ready content across diverse platforms (SEO Blogs, Landing Pages, Social Posts, Google Business Profiles, Email Newsletters) with full brand voice fidelity, while exposing a public REST API with SHA-256 key hashing, rate limiting, and telemetry tracking.

---

## 🌟 Key Highlights

* **Decoupled Architecture**: The core AI generation engine is entirely independent from the frontend UI. Both the Web Dashboard and external API clients execute the exact same battle-tested backend services.
* **Modular PromptBuilder**: Transforms raw user topics into structured, injection-resistant prompts containing platform rules, tone modifiers, SEO criteria, and business profile context.
* **Configurable Gemini AI Integration**: Native integration with Google Gemini (`@google/generative-ai`), with model selection configurable via environment variables (`gemini-1.5-flash`, `gemini-2.5-flash`, `gemini-1.5-pro`) and automatic exponential backoff retries.
* **Developer REST API**: Full-featured API with `dxt_live_` and `dxt_test_` key prefixes, SHA-256 cryptographic hashing, hourly/daily quota enforcement, and live request logging.
* **Dark Modern SaaS UI**: Built with React, Vite, TypeScript, Tailwind CSS, Lucide Icons, and subtle GSAP micro-animations that strictly respect `prefers-reduced-motion`.
* **Zero-Config Database**: Seamlessly runs with built-in high-concurrency SQLite (WAL mode) out-of-the-box or connects to PostgreSQL for enterprise containerized deployments.
* **VPS & Docker Ready**: Complete deployment support including PM2 cluster configurations, Nginx reverse proxy with gzip compression and SSL termination, and Docker Compose.

---

## 🏗️ System Architecture

```text
               +----------------------------------------+
               |        Public Internet / Clients       |
               +----------------------------------------+
                     | (HTTPS :443 / HTTP :80)
                     v
               +----------------------------------------+
               |        Nginx Reverse Proxy Gateway     |
               +----------------------------------------+
                /                                      \
       (Static Assets)                              (API Proxy)
              /                                          \
             v                                            v
+------------------------+                   +------------------------+
|  React 18 + Vite SPA   |                   |  Node.js Express API   |
|   (Dark SaaS UI)       |                   |  (Configurable PORT)   |
+------------------------+                   +------------------------+
                                                          |
                      +-----------------------------------+-----------------------------------+
                      |                                   |                                   |
                      v                                   v                                   v
          +-----------------------+           +-----------------------+           +-----------------------+
          |     PromptBuilder     |           |     ApiKeyService     |           |  Database Layer (DB)  |
          |  PlatformRules        |           |  SHA-256 Hash Vault   |           |  SQLite (WAL) or      |
          |  ContentTypeRules     |           |  Rate Limiter Engine  |           |  PostgreSQL 16        |
          |  Tone & SEO Rules     |           |  Request Logger       |           +-----------------------+
          +-----------------------+           +-----------------------+
                      |
                      v
          +-----------------------+
          |     GeminiService     |
          |  Google Gemini API    |
          |  Exponential Backoff  |
          +-----------------------+
                      |
                      v
          +-----------------------+
          |  ResponseParser &     |
          |  ContentFormatter     |
          +-----------------------+
```

---

## 🚀 Quick Start (Development)

### Prerequisites

* **Node.js**: v20+ or v24+
* **npm**: v10+

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/dxgen.git
cd dxgen

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` in the root and configure your credentials:

```bash
cp .env.example .env
```

Set your Google Gemini API Key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
PORT=3001
```

> **Note**: If you run without a `GEMINI_API_KEY`, the application automatically uses an intelligent local fallback generator so you can test all UI workflows, database storage, and API keys without getting blocked!

### 3. Start Development Servers

Run backend and frontend concurrently from the root directory:

```bash
# Terminal 1: Backend API (port 3001)
npm run dev:backend

# Terminal 2: Frontend Dashboard (port 5173)
npm run dev:frontend
```

Open your browser at **`http://localhost:5173`**.

---

## 🔐 Default Demo Credentials

The database automatically seeds an initial owner account on first run:

* **Email**: `admin@dxgen.ai`
* **Password**: `Admin@123456`
* **Demo API Key**: `dxt_live_demo1234567890abcdef`

You can also use the 1-click **"Auto Fill"** button on the Login page.

---

## 🧪 Running Automated Tests

Run the backend test suite (unit tests for PromptBuilder, injection prevention, Zod request validation, API key hashing, and rate limiting):

```bash
npm run test:backend
```

---

## 🚢 Production Deployment

### Option A: Direct Node.js + PM2 (Recommended for VPS)

1. **Build Frontend and Backend**:
   ```bash
   npm run build
   ```

2. **Configure PM2**:
   Ensure `PORT` is set in your `.env` (e.g. `PORT=31045`).

3. **Start PM2 Cluster**:
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**:
   Copy `nginx/nginx.conf` to `/etc/nginx/sites-available/dxgen` and adjust proxy target to `http://127.0.0.1:3001`.

---

### Option B: Docker Compose

DXGen provides a multi-container Docker configuration with Nginx, Node.js API, PostgreSQL, and static Frontend:

```bash
# Export your Gemini API Key
export GEMINI_API_KEY="your_api_key"

# Launch all services
docker compose up -d --build
```

Services started:
* `dxgen_nginx`: Listening on ports `80` and `443`
* `dxgen_backend`: Express API service (internal network)
* `dxgen_frontend`: Pre-compiled SPA static server
* `dxgen_postgres`: PostgreSQL 16 database with automated healthchecks

---

## 📡 REST API Quick Usage

Generate content with a single cURL command:

```bash
curl -X POST http://localhost:3001/api/v1/generate \
  -H "Authorization: Bearer dxt_live_demo1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Proven strategies to scale SaaS in 2026",
    "contentType": "seo_blog_article",
    "platform": "website",
    "tone": "educational",
    "length": 1200,
    "keywords": ["saas scaling", "b2b growth"]
  }'
```

Refer to [API.md](./API.md) for full interactive endpoint specifications.

---

## 🛡️ Security & Prompt Injection Protection

1. **Untrusted Input Isolation**: All user-provided topics, custom instructions, and keywords are sanitized and framed with explicit system boundaries to prevent prompt jailbreaks.
2. **Key Hashing**: Secret API keys are hashed using `SHA-256` before storage; plaintext keys are displayed exactly once at creation time.
3. **Hard-coded Secrets Zero-Tolerance**: No API keys, database credentials, or JWT secrets exist in frontend bundles or source files.
4. **Header Hardening**: Pre-configured with Helmet for `nosniff`, `SAMEORIGIN`, and strict CORS policies.
5. **Rate Limiting**: Configurable hourly and daily quotas enforced per API key with standard `429 RATE_LIMIT_EXCEEDED` responses.

---

## 📄 License

MIT License. Designed and built for enterprise production use.
