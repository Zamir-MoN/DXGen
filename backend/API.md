# DXGen Public REST API Reference (v1)

The DXGen REST API allows developers to integrate enterprise-grade AI content generation into CMS platforms, mobile apps, marketing automation bots, or internal enterprise dashboards.

---

## Base URL

```text
https://yourdomain.com/api/v1
```

Or for local development:

```text
http://localhost:3001/api/v1
```

---

## Authentication

Every API call requires a secret API key sent via the `Authorization` header as a Bearer token or via the `x-api-key` header.

```http
Authorization: Bearer dxt_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

API keys can be generated from the **API Keys** tab in the DXGen Web Dashboard.

* Keys prefixed with `dxt_live_` run in production mode.
* Keys prefixed with `dxt_test_` run in sandbox mode.

---

## Rate Limiting

Rate limits are configured on a per-key basis. Standard defaults:

* **100 requests per hour**
* **1,000 requests per day**

### Rate Limit Response (`429 Too Many Requests`)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Hourly rate limit exceeded (100 req/hr). Try again later."
  },
  "requestId": "req_8df83910c"
}
```

---

## Endpoints

### 1. Universal Content Generation

```http
POST /api/v1/generate
```

Generates structured content across any supported platform and content type.

#### Request Headers

| Header | Type | Description |
| :--- | :--- | :--- |
| `Authorization` | `string` | `Bearer <API_KEY>` |
| `Content-Type` | `string` | `application/json` |

#### Request Body Schema

```json
{
  "topic": "Best web development services for small businesses",
  "contentType": "seo_blog_article",
  "platform": "website",
  "tone": "professional",
  "length": 1500,
  "language": "English",
  "keywords": [
    "web development",
    "small business website"
  ],
  "audience": "Small business owners and founders",
  "location": "Global",
  "businessId": "optional_business_profile_id",
  "customInstructions": "Include a comparison between custom code and website builders.",
  "includeImage": true,
  "imageStyle": "Commercial Photography",
  "imageAspectRatio": "16:9",
  "imageModel": "flux-schnell",
  "seo": {
    "primaryKeyword": "web development services",
    "secondaryKeywords": ["custom website", "small business SEO"],
    "searchIntent": "Commercial investigation",
    "brandName": "Delta X Digital",
    "competitorReference": "Generic template agencies"
  }
}
```

#### Successful Response (`200 OK`)

```json
{
  "success": true,
  "requestId": "req_a4c7e12f9b10",
  "contentId": "cnt_91823749a0b1",
  "content": {
    "title": "Best Web Development Services for Small Businesses (2026 Guide)",
    "body": "## Introduction\nIn today's digital landscape...\n\n## Why Custom Development Matters\n...",
    "metaTitle": "Best Web Development Services for Small Businesses (2026)",
    "metaDescription": "Discover how custom web development services accelerate small business growth and drive qualified leads.",
    "slug": "best-web-development-services-small-business",
    "keywords": [
      "web development",
      "small business website"
    ],
    "faq": [
      {
        "question": "How much does custom web development cost for a small business?",
        "answer": "Costs typically range from $3,000 to $15,000 depending on complexity and integrations."
      }
    ],
    "cta": "Ready to transform your online presence? Schedule a free discovery call with Delta X Digital today.",
    "wordCount": 1420,
    "readingTimeMinutes": 7
  },
  "image": {
    "id": "img_72948201a0bc",
    "url": "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/flux-schnell-cf/prompt-1790416688074-45041.png",
    "width": 1280,
    "height": 720,
    "model": "flux-schnell",
    "provider": "pixazo",
    "style": "Commercial Photography",
    "aspectRatio": "16:9",
    "generationTimeMs": 28400,
    "createdAt": "2026-09-26T17:30:00Z"
  },
  "prompt": "ROLE: ...",
  "usage": {
    "model": "gemini-1.5-flash",
    "inputTokens": 412,
    "outputTokens": 1480,
    "generationTimeMs": 842,
    "imageGenerationTimeMs": 28400
  }
}
```

---

### 2. SEO Blog Generation

```http
POST /api/v1/generate/blog
```

Optimized shortcut for long-form, search-engine targeted articles with H1-H3 hierarchy, schema FAQs, and SERP metadata.

#### Request Body

```json
{
  "topic": "Proven strategies to scale SaaS to 10k MRR",
  "tone": "educational",
  "length": 2000,
  "language": "English",
  "keywords": ["saas growth", "mrr strategy", "b2b sales"]
}
```

---

### 3. Social Media Content Generation

```http
POST /api/v1/generate/social
```

Generates high-engagement captions, scroll-stopping hooks, conversation starters, and grouped hashtags.

#### Request Body

```json
{
  "topic": "5 Lessons from launching our enterprise AI API",
  "platform": "linkedin",
  "tone": "conversational"
}
```

#### Successful Response

```json
{
  "success": true,
  "requestId": "req_social_18a2",
  "content": {
    "title": "5 Lessons from Launching an Enterprise AI API",
    "body": "Most founders think building the AI is the hardest part.\n\nThey're wrong.\n\nThe hardest part is...",
    "hashtags": [
      "#SaaS",
      "#ArtificialIntelligence",
      "#Founders",
      "#APIDevelopment"
    ],
    "cta": "What was the most surprising lesson from your latest release? Drop your thoughts below."
  }
}
```

---

### 4. Google Business Profile & Local Update

```http
POST /api/v1/generate/business
```

Creates concise, high-intent local updates (under 250 words) adhering strictly to Google Business Profile guidelines.

#### Request Body

```json
{
  "topic": "Summer AC Tune-Up Discount Announcement",
  "location": "Austin, Texas",
  "tone": "local_business"
}
```

---

### 5. Content Retrieval by ID

```http
GET /api/v1/content/:id
```

Retrieve full stored content and telemetry for a previously generated piece.

---

### 6. Usage & Metrics

```http
GET /api/v1/usage
```

Returns total requests today, this month, token usage, and average response latency.

---

### 7. Available AI Models

```http
GET /api/v1/models
```

#### Response

```json
{
  "success": true,
  "activeModel": "gemini-1.5-flash",
  "models": [
    { "id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "maxTokens": 8192 },
    { "id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "maxTokens": 8192 },
    { "id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro", "maxTokens": 8192 }
  ]
}
```

---

### 8. System Health Probe

```http
GET /api/v1/health
```

#### Response

```json
{
  "status": "ok",
  "service": "content-api",
  "version": "1.0.0",
  "database": "connected",
  "aiModel": "gemini-1.5-flash",
  "timestamp": "2026-09-25T18:30:00.000Z"
}
```

---

### 9. AI Image Generation (Pixazo)

```http
POST /api/v1/images/generate
```

Generates high-resolution images powered by Pixazo (FLUX Schnell / SDXL) with platform-specific aspect ratios, artistic styles, and injection filtering.

#### Request Headers

| Header | Type | Description |
| :--- | :--- | :--- |
| `Authorization` | `string` | `Bearer <API_KEY>` or `x-api-key` header |
| `Content-Type` | `string` | `application/json` |

#### Request Body Schema

```json
{
  "prompt": "Modern premium workspace with a laptop, dark theme, professional technology company aesthetic",
  "model": "flux-schnell",
  "width": 1024,
  "height": 1024,
  "style": "Commercial Photography",
  "aspectRatio": "1:1",
  "negativePrompt": "blurry, low quality, distorted, watermark"
}
```

#### Successful Response (`200 OK`)

```json
{
  "success": true,
  "requestId": "req_8df83910c2a1",
  "image": {
    "id": "img_72948201a0bc",
    "url": "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/flux-schnell-cf/prompt-1790416688074-45041.png",
    "width": 1024,
    "height": 1024,
    "model": "flux-schnell",
    "provider": "pixazo",
    "prompt": "Modern premium workspace with a laptop, dark theme, professional technology company aesthetic",
    "style": "Commercial Photography",
    "aspectRatio": "1:1"
  },
  "usage": {
    "provider": "pixazo",
    "generationTimeMs": 1420
  }
}
```

---

### 10. Generate Image From Generated Content

```http
POST /api/v1/images/from-content
```

Automatically generates a platform-aware featured or hero image based on an existing content generation asset.

#### Request Body Schema

```json
{
  "contentId": "cnt_91823749a0b1",
  "style": "Commercial Photography"
}
```

---

### 11. Image Models & Styles Discovery

```http
GET /api/v1/images/models
GET /api/v1/images/styles
```

Returns supported models, aspect ratios, and visual styles.

---

## Standard Error Codes

All errors return a consistent JSON payload:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Topic must be at least 3 characters long."
  },
  "requestId": "req_98b7123"
}
```

| HTTP Status | Error Code | Meaning |
| :--- | :--- | :--- |
| `400` | `INVALID_REQUEST` | Malformed JSON or failed Zod validation |
| `401` | `UNAUTHORIZED` | Missing or invalid API key or JWT token |
| `403` | `FORBIDDEN` | Disabled API key or insufficient privileges |
| `404` | `NOT_FOUND` | Resource or content ID does not exist |
| `429` | `RATE_LIMIT_EXCEEDED` | Hourly or daily quota exceeded |
| `500` | `INTERNAL_SERVER_ERROR` | Internal server or unhandled exception |
| `502` | `AI_GENERATION_FAILED` | Gemini API unavailable after retries |
