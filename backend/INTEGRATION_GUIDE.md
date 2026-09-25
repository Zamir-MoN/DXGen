# DXGen API Integration Guide

This guide explains how to integrate the **DXGen AI Content Generation API** (`http://51.20.121.253:3101`) into any website, CMS, web app, or backend service.

---

## 1. Quick Overview

* **Base Endpoint**: `http://51.20.121.253:3101/api/v1`
* **Authentication**: Bearer Token in HTTP Header (`Authorization: Bearer YOUR_API_KEY`)
* **Request Format**: JSON (`Content-Type: application/json`)
* **Response Format**: JSON with structured content, SEO tags, FAQs, and usage metadata.

---

## 2. Getting Your API Key

1. Open the DXGen Dashboard in your browser:  
   👉 **`http://51.20.121.253:3101`**
2. Navigate to **API Keys** in the sidebar.
3. Click **Create New API Key**:
   * **Name**: Name of your website (e.g., `MyBlog Integration`)
   * **Environment**: Select `Live` (starts with `dxt_live_`) or `Test` (starts with `dxt_test_`)
   * **Rate Limits**: Configure requests per hour / day
4. Copy your API key immediately and store it securely (e.g., `dxt_live_xxxxxxxxxxxxxxxxxxxxxxxx`).

> ⚠️ **Security Rule**: Never expose your API key in public client-side browser code (HTML/JavaScript). Always make the API call from your backend, serverless function, or CMS server.

---

## 3. Core API Endpoints

| Endpoint | Method | Best For |
| :--- | :--- | :--- |
| `/api/v1/generate` | `POST` | Universal generator (blogs, landing pages, marketing, copy) |
| `/api/v1/generate/blog` | `POST` | Long-form SEO blog articles with H1/H2/H3 headings, meta tags, and FAQs |
| `/api/v1/generate/social` | `POST` | Social media posts (Instagram, LinkedIn, X/Twitter, Facebook) |
| `/api/v1/generate/business`| `POST` | Google Business Profile posts and local business announcements |
| `/api/v1/content/:id` | `GET` | Fetch previously generated content by ID |
| `/api/v1/usage` | `GET` | Check remaining requests and token usage |
| `/api/v1/health` | `GET` | Server status probe |

---

## 4. Complete Code Examples

### A. Next.js / Node.js (Secure Server Route)

In Next.js (App Router `app/api/generate/route.ts` or Pages Router `pages/api/generate.ts`), create an API route:

```typescript
// app/api/generate/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topic, keywords } = await req.json();

    const response = await fetch('http://51.20.121.253:3101/api/v1/generate/blog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DXGEN_API_KEY}` // e.g. dxt_live_...
      },
      body: JSON.stringify({
        topic: topic,
        tone: 'professional',
        length: 1200,
        language: 'English',
        keywords: keywords || []
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### B. Standard JavaScript / Fetch (Node.js Backend)

```javascript
const DXGEN_API_KEY = 'YOUR_API_KEY_HERE'; // Replace with dxt_live_...

async function generateArticle(topic) {
  const response = await fetch('http://51.20.121.253:3101/api/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DXGEN_API_KEY}`
    },
    body: JSON.stringify({
      topic: topic,
      contentType: 'seo_blog_article',
      platform: 'website',
      tone: 'educational',
      length: 1500,
      language: 'English',
      keywords: ['web design', 'small business growth'],
      seo: {
        primaryKeyword: 'web design tips',
        searchIntent: 'Informational'
      }
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Article Title:', result.content.title);
    console.log('SEO Meta Description:', result.content.metaDescription);
    console.log('Article Body (Markdown):', result.content.body);
    console.log('FAQs:', result.content.faq);
    return result.content;
  } else {
    console.error('API Error:', result.error);
  }
}

// Example call
generateArticle('10 Essential Web Design Tips for 2026');
```

---

### C. Python (Django / Flask / FastAPI / Automation Script)

```python
import requests

API_URL = "http://51.20.121.253:3101/api/v1/generate"
API_KEY = "YOUR_API_KEY_HERE" # e.g. dxt_live_...

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

payload = {
    "topic": "How Artificial Intelligence is Transforming E-Commerce",
    "contentType": "seo_blog_article",
    "platform": "website",
    "tone": "professional",
    "length": 1500,
    "language": "English",
    "keywords": ["AI e-commerce", "retail automation", "online sales"]
}

response = requests.post(API_URL, json=payload, headers=headers)
data = response.json()

if response.status_code == 200 and data.get("success"):
    content = data["content"]
    print("Title:", content["title"])
    print("Slug:", content["slug"])
    print("Body:\n", content["body"])
else:
    print("Failed:", data.get("error"))
```

---

### D. PHP (WordPress / Custom PHP Website)

To automatically publish articles or generate copy in WordPress or custom PHP:

```php
<?php
$api_url = 'http://51.20.121.253:3101/api/v1/generate';
$api_key = 'YOUR_API_KEY_HERE'; // Replace with dxt_live_...

$payload = [
    'topic'       => 'Best Marketing Automation Tools for 2026',
    'contentType' => 'seo_blog_article',
    'platform'    => 'website',
    'tone'        => 'persuasive',
    'length'      => 1200,
    'language'    => 'English',
    'keywords'    => ['marketing automation', 'crm tools']
];

$ch = curl_init($api_url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $api_key,
        'Content-Type: application/json'
    ],
    CURLOPT_POSTFIELDS     => json_encode($payload)
]);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);

if (!empty($result['success'])) {
    $article = $result['content'];
    echo "<h1>" . htmlspecialchars($article['title']) . "</h1>";
    echo "<p><strong>Meta:</strong> " . htmlspecialchars($article['metaDescription']) . "</p>";
    echo "<div>" . nl2br(htmlspecialchars($article['body'])) . "</div>";
} else {
    echo "Error: " . $result['error']['message'];
}
?>
```

---

### E. cURL (Terminal / Command Line)

```bash
curl -X POST http://51.20.121.253:3101/api/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Top 5 productivity hacks for remote developers",
    "contentType": "seo_blog_article",
    "platform": "website",
    "tone": "casual",
    "length": 800
  }'
```

---

## 5. Request Parameters Reference

| Field | Type | Required | Default | Description / Supported Values |
| :--- | :--- | :--- | :--- | :--- |
| `topic` | `string` | **Yes** | — | The headline, subject, or title (3–500 chars). |
| `contentType` | `string` | No | `seo_blog_article` | `seo_blog_article`, `how_to_article`, `listicle`, `product_review`, `promotional_content`, `sales_copy`, `landing_page_copy`, `instagram_caption`, `linkedin_post`, `x_twitter_post`, `google_business_profile_post`, `email`, `newsletter`. |
| `platform` | `string` | No | `website` | `website`, `instagram`, `facebook`, `linkedin`, `twitter`, `google_business`, `email`, `newsletter`. |
| `tone` | `string` | No | `professional` | `professional`, `friendly`, `casual`, `conversational`, `educational`, `persuasive`, `promotional`, `luxury`, `technical`, `minimal`. |
| `customTone`| `string` | No | — | Custom brand voice description (e.g. `sarcastic tech visionary`). |
| `length` | `string\|number` | No | `medium` | `short` (~400w), `medium` (~1000w), `long` (~1800w), or exact word count like `1500`. |
| `language` | `string` | No | `English` | `English`, `Hindi`, `Bengali`, `Spanish`, `French`, `German`. |
| `keywords` | `array` | No | `[]` | List of target SEO keywords e.g. `["seo", "marketing"]`. |
| `audience` | `string` | No | — | Target demographic e.g. `B2B Founders`, `College Students`. |
| `location` | `string` | No | — | Geographic target e.g. `New York`, `Global`. |
| `customInstructions` | `string` | No | — | Custom writing directives or formatting notes. |
| `seo` | `object` | No | `{}` | SEO settings: `primaryKeyword`, `secondaryKeywords`, `searchIntent`, `brandName`. |

---

## 6. Response Structure (`200 OK`)

The API returns a clean, structured JSON object:

```json
{
  "success": true,
  "requestId": "req_18f2a93c04d2",
  "contentId": "cnt_72948201a0bc",
  "content": {
    "title": "Top 5 Productivity Hacks for Remote Developers (2026 Guide)",
    "body": "## 1. Deep Work Blocks\n...\n\n## 2. Async-First Communication\n...",
    "metaTitle": "Top 5 Productivity Hacks for Remote Developers (2026)",
    "metaDescription": "Boost your engineering output with these 5 proven remote work strategies.",
    "slug": "top-5-productivity-hacks-remote-developers",
    "keywords": ["remote work", "developer productivity"],
    "faq": [
      {
        "question": "How many hours of deep work should a developer aim for daily?",
        "answer": "Aim for 3 to 4 uninterrupted hours per day for maximum cognitive output."
      }
    ],
    "hashtags": ["#Productivity", "#RemoteWork", "#DevLife"],
    "cta": "Start streamlining your remote developer workflow today.",
    "wordCount": 940,
    "readingTimeMinutes": 5
  },
  "usage": {
    "model": "gemini-2.5-flash",
    "inputTokens": 320,
    "outputTokens": 980,
    "generationTimeMs": 680
  }
}
```

---

## 7. Error Handling

All error responses return a standardized format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Topic must be at least 3 characters long."
  },
  "requestId": "req_847291a0"
}
```

| HTTP Status | Error Code | Cause & Solution |
| :--- | :--- | :--- |
| `400` | `INVALID_REQUEST` | Missing required `topic` or invalid JSON syntax. Check payload. |
| `401` | `UNAUTHORIZED` | Invalid, missing, or malformed API key. Check `Authorization: Bearer dxt_...`. |
| `403` | `FORBIDDEN` | The API key has been disabled in the dashboard. Enable it or create a new key. |
| `429` | `RATE_LIMIT_EXCEEDED` | Exceeded hourly or daily limit. Wait or increase quota in dashboard. |
| `500` | `INTERNAL_SERVER_ERROR` | Server exception. Check `requestId` in logs. |

---

## 8. Checking Health and Connectivity

You can test if the API is active anytime with a simple GET request:

```bash
curl http://51.20.121.253:3101/api/v1/health
```

Output:
```json
{
  "status": "ok",
  "service": "content-api",
  "version": "1.0.0",
  "database": "connected",
  "aiModel": "gemini-2.5-flash"
}
```
