# DXGen — Complete System Architecture & Operations Manual

> **Comprehensive documentation covering platform architecture, role-based access control, Gemini AI live credit monitoring, VPS deployment, and Developer REST API integration.**

---

## Table of Contents
1. [Platform Architecture & Tech Stack](#1-platform-architecture--tech-stack)
2. [Credentials & Role-Based Access Control](#2-credentials--role-based-access-control)
3. [Gemini AI Engine & Live Quota / Credit Monitor](#3-gemini-ai-engine--live-quota--credit-monitor)
4. [VPS Deployment & Operations Guide](#4-vps-deployment--operations-guide)
5. [Public REST API Reference & Integration](#5-public-rest-api-reference--integration)
6. [Troubleshooting & Maintenance](#6-troubleshooting--maintenance)

---

## 1. Platform Architecture & Tech Stack

DXGen is a unified **AI Content Generation SaaS + Developer REST API platform**. It runs on a lightweight, standalone architecture without external proxy dependencies like Nginx.

```
                           +----------------------------------------+
                           |         Client Web Browser             |
                           +----------------------------------------+
                                              |
                                              | HTTP / Port 3101
                                              v
+-----------------------------------------------------------------------------------+
| Node.js / Express Server (Standalone Server & Static Host)                        |
|                                                                                   |
|  +---------------------------+        +----------------------------------------+  |
|  | Frontend Single Page App  |        | API Router (/api/v1)                   |  |
|  | React 18 + Vite + Tailwind|        | Express + TypeScript + Zod Validation  |  |
|  +---------------------------+        +----------------------------------------+  |
|                ^                                          |                       |
|                |                                          v                       |
|  +---------------------------+        +----------------------------------------+  |
|  | Authentication / JWT      |        | AI Engine: Google Gemini 2.5 Flash     |  |
|  | Role Guards (Admin / User)|        | (Live API Quota & Fallback Generator)  |  |
|  +---------------------------+        +----------------------------------------+  |
|                                                           |                       |
|                                                           v                       |
|                                       +----------------------------------------+  |
|                                       | SQLite with WAL Mode (dxgen.sqlite)    |  |
|                                       | Users, Keys, Generations, Observability|  |
|                                       +----------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Key Technical Characteristics
* **Backend**: Node.js 24+, Express, TypeScript, Zod request validation, SQLite (`node:sqlite` with Write-Ahead Logging for high concurrency).
* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide icons, GSAP animations.
* **Single Port Deployment**: The Express server serves both the REST API on `/api/v1` and the compiled SPA frontend bundle on port `3101`.
* **Zero Nginx Dependency**: Eliminates Nginx reverse-proxy overhead, SSL/upgrade-insecure-request issues on IP addresses, and simplifies PM2 daemon management.
* **Storage Isolation**: All database files, sqlite journals, and configuration files live strictly inside `backend/` and `frontend/`.

---

## 2. Credentials & Role-Based Access Control

### System Default Administrator Credentials

| Parameter | Value |
| :--- | :--- |
| **Admin Username** | `admin` *(or `admin@dxgen.ai`)* |
| **Password** | `dxgen2026` |
| **Role Assigned** | `owner` (Full Administrative Privileges) |
| **Designated Owner Accounts** | `admin`, `admin@dxgen.ai`, `zamir.0huo@gmail.com` |

### Role Permissions Matrix

| Feature / Route | Normal User (`business_user`) | Administrator (`owner` / `admin`) |
| :--- | :---: | :---: |
| **AI Content Generator** (`/generate`) | Allowed | Allowed |
| **Content History Archive** (`/history`) | Allowed (Own records only) | Allowed (All records) |
| **Dashboard Overview** (`/`) | Restricted (Redirected to `/generate`) | Allowed |
| **Developer API Keys** (`/api-keys`) | Restricted (Hidden & 403 Forbidden) | Allowed (Full CRUD) |
| **Usage Analytics & Logs** (`/usage`) | Restricted (Hidden & 403 Forbidden) | Allowed |
| **Business Profiles** (`/profiles`) | Select for Generation Only | Allowed (Full CRUD) |
| **API Documentation** (`/docs`) | Restricted (Hidden) | Allowed |
| **Admin Control Center** (`/admin`) | Restricted (Hidden & 403 Forbidden) | Allowed |

---

## 3. Gemini AI Engine & Live Quota / Credit Monitor

Located under **Admin Panel -> Gemini Quota & Credits**, this module provides real-time observability of Google Gemini API consumption.

### 1. Live Google Connection Ping
* Direct ping to `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`.
* Reports actual round-trip latency in milliseconds (e.g. `245ms`).
* Verifies key validity and active model availability.

### 2. Daily Request Quota Headroom
* **Free Tier Daily Cap**: `1,500 Requests Per Day (RPD)`.
* **Live Calculation**:
  $$\text{Requests Remaining} = \max(0, 1500 - \text{Requests Used Today})$$
  $$\text{Headroom \%} = \left(\frac{\text{Requests Remaining}}{1500}\right) \times 100$$
* Visual progress bar displaying consumed quota vs available headroom.

### 3. Token Limits & Specifications
* **Active Model**: `gemini-2.5-flash`
* **Context Window**: 1,048,576 tokens input limit.
* **Maximum Output**: 65,536 tokens output limit.
* **Rate Limits**: 15 Requests Per Minute (RPM), 1,000,000 Tokens Per Minute (TPM).

### 4. Real-Time Cost & Spend Estimation
Calculated using Google Gemini 2.5 Flash token rates:
* Input: `$0.075` per 1,000,000 tokens
* Output: `$0.30` per 1,000,000 tokens
* Provides daily and monthly estimated spend in USD.

---

## 4. VPS Deployment & Operations Guide

### Server Specifications
* **Server IP**: `http://51.20.121.253:3101`
* **Process Manager**: PM2 (`dxgen`)
* **Working Directory**: `~/DXGen`

### Updating Your VPS with Latest Code

Run the following commands on your Ubuntu VPS:

```bash
cd ~/DXGen

# 1. Fetch latest commits from GitHub
git pull origin main

# 2. Build backend and frontend bundles
npm run build

# 3. Restart PM2 application
pm2 restart dxgen

# 4. Confirm running status
pm2 status
```

### Essential PM2 Commands

```bash
# Check service status
pm2 status

# View live application logs
pm2 logs dxgen --lines 100

# Restart the application
pm2 restart dxgen

# Save process list across system reboots
pm2 save
```

### Environment Configuration (`backend/.env`)

```ini
NODE_ENV=production
PORT=3101
HOST=0.0.0.0
DATABASE_URL=file:./dxgen.sqlite
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
JWT_SECRET=dxgen-production-secret-key-38827471928471
CORS_ORIGIN=*
RATE_LIMIT_HOUR=100
RATE_LIMIT_DAY=1000
APP_URL=http://51.20.121.253:3101
API_URL=http://51.20.121.253:3101/api/v1
```

---

## 5. Public REST API Reference & Integration

Third-party websites, apps, and internal tools can integrate AI generation using an API Key.

### Base Endpoint
```
http://51.20.121.253:3101/api/v1
```

### Authentication Header
Every request must pass the API key in the `x-api-key` header:
```http
x-api-key: dxt_live_your_actual_api_key_here
Content-Type: application/json
```

---

### Core API Endpoints

#### 1. Universal Content Generation
* **Endpoint**: `POST /generate`
* **Payload**:
```json
{
  "topic": "Benefits of Laser Dentistry for Gum Health",
  "contentType": "seo_blog_article",
  "platform": "website",
  "tone": "professional",
  "length": "long",
  "targetAudience": "Adult dental patients",
  "keywords": ["laser dentistry", "painless gums", "oral hygiene"],
  "language": "English",
  "customInstructions": "Include a FAQ section at the end."
}
```

* **Response (HTTP 200)**:
```json
{
  "success": true,
  "data": {
    "id": "gen_8f1a7b9c2d",
    "topic": "Benefits of Laser Dentistry for Gum Health",
    "contentType": "seo_blog_article",
    "platform": "website",
    "title": "The Ultimate Guide to Modern Laser Dentistry",
    "content": "Full markdown content with headings and paragraphs...",
    "metaDescription": "Discover how laser dentistry offers painless, faster-healing dental care.",
    "keywords": ["laser dentistry", "painless gums", "oral hygiene"],
    "faq": [
      {
        "question": "Is laser dentistry painful?",
        "answer": "Laser dentistry typically requires minimal or no anesthesia."
      }
    ],
    "wordCount": 1420,
    "model": "gemini-2.5-flash",
    "latencyMs": 1450,
    "createdAt": "2026-09-26T02:00:00.000Z"
  }
}
```

---

#### 2. SEO Blog Article Generator
* **Endpoint**: `POST /generate/blog`
* **Payload**:
```json
{
  "topic": "Top 5 Preventative Dental Habits",
  "primaryKeyword": "preventative dentistry",
  "secondaryKeywords": ["teeth cleaning", "fluoride", "cavity prevention"],
  "targetWordCount": 1200,
  "tone": "informative"
}
```

---

#### 3. Social Media Content Generator
* **Endpoint**: `POST /generate/social`
* **Payload**:
```json
{
  "topic": "Weekend Dental Tip",
  "platform": "instagram",
  "tone": "casual",
  "includeHashtags": true
}
```

---

#### 4. Retrieve Past Generations
* **Endpoint**: `GET /content?page=1&limit=10`
* **Returns**: Paginated history of generated content assets.

---

### Code Integration Examples

#### cURL
```bash
curl -X POST http://51.20.121.253:3101/api/v1/generate \
  -H "Content-Type: application/json" \
  -H "x-api-key: dxt_live_your_actual_key_here" \
  -d '{
    "topic": "Modern Dental Whitening Methods",
    "contentType": "seo_blog_article",
    "platform": "website",
    "tone": "professional"
  }'
```

#### JavaScript / Node.js
```javascript
async function generateArticle() {
  const response = await fetch('http://51.20.121.253:3101/api/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'dxt_live_your_actual_key_here'
    },
    body: JSON.stringify({
      topic: 'Modern Dental Whitening Methods',
      contentType: 'seo_blog_article',
      platform: 'website',
      tone: 'professional'
    })
  });

  const result = await response.json();
  console.log('Article Title:', result.data.title);
  console.log('Article Body:', result.data.content);
}

generateArticle();
```

#### Python
```python
import requests

url = "http://51.20.121.253:3101/api/v1/generate"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "dxt_live_your_actual_key_here"
}
payload = {
    "topic": "Modern Dental Whitening Methods",
    "contentType": "seo_blog_article",
    "platform": "website",
    "tone": "professional"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Generated Content:\n", data["data"]["content"])
```

#### PHP
```php
<?php
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => "http://51.20.121.253:3101/api/v1/generate",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode([
        "topic" => "Modern Dental Whitening Methods",
        "contentType" => "seo_blog_article",
        "platform" => "website",
        "tone" => "professional"
    ]),
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "x-api-key: dxt_live_your_actual_key_here"
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

$result = json_decode($response, true);
echo $result['data']['content'];
?>
```

---

## 6. Troubleshooting & Maintenance

### 1. "email: Invalid email address format"
* **Cause**: Login validator was previously expecting strict RFC email format with `@`.
* **Resolution**: Updated `loginSchema` in [`authValidators.ts`](file:///c:/Users/zisha/Desktop/Test%20VS/DXGen/backend/src/validators/authValidators.ts) so plain usernames such as `admin` are accepted.

### 2. Normal Users Accessing Admin Screens
* **Resolution**: Protected frontend routes in [`App.tsx`](file:///c:/Users/zisha/Desktop/Test%20VS/DXGen/frontend/src/App.tsx) and sidebar items in [`Sidebar.tsx`](file:///c:/Users/zisha/Desktop/Test%20VS/DXGen/frontend/src/components/Sidebar.tsx).
* Non-admin roles (`business_user`) are strictly routed to `/generate` and `/history`.

### 3. Database Integrity & Maintenance
* The SQLite database is configured with **Write-Ahead Logging (WAL)**:
  - `dxgen.sqlite` (Main database)
  - `dxgen.sqlite-wal` (Write-ahead log)
  - `dxgen.sqlite-shm` (Shared memory index)
* **Never delete** the `.sqlite-wal` or `.sqlite-shm` files while the server is running.
* To back up the database, simply copy `dxgen.sqlite` while PM2 is stopped, or run `VACUUM INTO 'backup.sqlite'`.
