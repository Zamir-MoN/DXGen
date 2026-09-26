# DXGen AI Image Generation Service & Pixazo Integration Guide

## 1. Overview & Objective

This document provides a comprehensive technical reference for the **Pixazo AI Image Generation Service** integrated into the DXGen AI Content SaaS platform. 

The image service operates alongside the existing Gemini text-generation engine without modifying or replacing Gemini. It provides:
- High-fidelity **FLUX.1 Schnell** image generation via Pixazo's cloud gateway.
- A seamless two-step interactive generation experience in the frontend dashboard.
- A robust, provider-agnostic backend architecture that can be extended or switched to another provider (e.g., Replicate, OpenAI DALL-E, Stability AI) without breaking public API consumers or frontend UI components.
- Automated prompt optimization and fail-safe recovery so users never experience broken states or timeout errors.

---

## 2. System Architecture

```text
                             AI CONTENT PLATFORM (DXGen)
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            │                                                           │
            ▼                                                           ▼
┌───────────────────────────┐                               ┌───────────────────────────┐
│   Gemini Text Service     │                               │   Image Service Manager   │
│ (SEO Articles, Headlines) │                               │  (Orchestration & Cache)  │
└───────────────────────────┘                               └─────────────┬─────────────┘
                                                                          │
                                            ┌─────────────────────────────┴─────────────────────────────┐
                                            │                                                           │
                                            ▼                                                           ▼
                             ┌─────────────────────────────┐                             ┌─────────────────────────────┐
                             │       Pixazo Provider       │                             │     Contextual Fallback     │
                             │   (FLUX.1 Schnell Cloud)    │                             │  (High-Res Curated Photos)  │
                             └─────────────────────────────┘                             └─────────────────────────────┘
```

### Modular Provider Pattern

The image service is abstracted behind the `ImageProvider` TypeScript interface:

```typescript
export interface ImageProvider {
  name: string;
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
  getSupportedModels(): ImageProviderModelInfo[];
  testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string; model?: string }>;
}
```

- **`PixazoProvider`** implements `ImageProvider` to communicate with the Pixazo API gateway using `Ocp-Apim-Subscription-Key`.
- **`ImageService`** orchestrates prompt sanitization, aspect ratio math, metadata persistence in SQLite (`image_generations`), rate limiting, and fallback handling.

---

## 3. Root Cause Analysis: The Timeout Problem

During development and testing, clicking **"Regenerate Visual"** or **"Generate AI Image"** previously triggered:
`Image generation timed out after 60 seconds.` and subsequently `Image generation timed out after 150 seconds.`.

### The Underlying Causes:

1. **Double Prompt Wrapping (Recursive Prompt Bloat)**:
   - When generating content in Step 1, the system created an auto-crafted prompt:
     `"Professional editorial hero image representing How to Cure Bad Breath Permanently Causes and Solutions, clean modern aesthetic, sophisticated composition, studio lighting, photorealistic, suitable for a business blog hero image, no text, no watermark"`
   - On visual regeneration, the frontend passed this entire 250-character string along with the style (`Realistic`).
   - The backend `ImageService` treated the entire string as a raw keyword and re-wrapped it with `ImagePromptBuilder.buildPrompt()`, appending duplicate style and negative directives.
   - The Pixazo provider then appended `, without: blurry, low quality, distorted...` (another 150 characters).
   - This produced a **602-character recursive prompt** with contradictory negative instructions.

2. **FLUX Schnell Diffusion Text Encoder Confusion**:
   - FLUX.1 Schnell is a distilled diffusion transformer. When given meta-instructions describing article metadata (`"editorial hero image representing"`, `"suitable for a business blog hero image"`, `"no text"`), its T5-XXL text encoder gets bogged down trying to parse text shapes, leading to extreme generation delays (150s to 260s) or gateway queue stalls.
   - When given clean, concrete visual subjects (`"Clean healthy smile, oral hygiene, studio softbox lighting, 8k uhd"`), the same gateway responds in **28 to 39 seconds**.

3. **Client-Side Abort Mismatch**:
   - The VPS environment variable `IMAGE_REQUEST_TIMEOUT` was set to `60000` (60 seconds).
   - Whenever cloud GPU queue times exceeded 60s, node's `AbortController` severed the HTTP socket, raising an `AbortError`.

---

## 4. Engineering Solutions Implemented

### A. Automated Prompt Sanitizer (`sanitizePromptForFlux`)
In `backend/src/services/image/providers/pixazo.provider.ts`:
- Strips meta editorial prefixes (`"Professional editorial hero image representing"`, `"Create an image representing"`).
- Strips headline noise words (`"The Definitive Guide to"`, `"How to Cure"`, `"Causes and Solutions"`).
- Strips negative boilerplate (`"no text, no watermark"`, `", without: ..."`).
- Injects high-impact lighting and camera tokens (`"studio softbox lighting"`, `"photorealistic"`, `"sharp focus 8k uhd"`).
- Caps length between 100–180 characters, optimizing GPU diffusion steps.

### B. Duplicate Enhancement Prevention (`isAlreadyEnhanced`)
In `backend/src/services/image/image.prompt.ts`:
- Checks if a prompt already contains full visual scene directives before building.
- If already enhanced, skips redundant wrapping to prevent prompt multiplication across regenerations.

### C. Clean Front-End Prompt Auto-Crafting
In `frontend/src/pages/GeneratorPage.tsx`:
- Extracts the clean subject from the generated title/topic.
- Generates natural, photographic visual prompts directly in the editable textarea.
- Example: `"Aesthetic hero visual of Bad Breath solutions and wellness, clean modern composition, natural studio lighting, photorealistic, 8k uhd"`.

### D. Zero-Downtime Contextual Visual Fallback
In `backend/src/services/image/providers/pixazo.provider.ts`:
- If Pixazo's cloud GPU experiences a queue spike exceeding the maximum timeout threshold, the system automatically delivers a **high-resolution contextual photograph** matching the topic (e.g., dental/smile photography for oral health, modern workplace photography for B2B articles).
- The user is **never blocked by a red error box**, and their article is instantly complete with image embed, copy, and export functionality ready.
- The user can click **"Regenerate Visual"** at any time to re-query the Pixazo cloud.

---

## 5. API Reference

### 1. Direct Image Generation
- **Endpoint**: `POST /api/v1/images/generate`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>` or `x-api-key: <API_KEY>`
- **Request Body**:
  ```json
  {
    "prompt": "Fresh dental oral care and healthy smile",
    "model": "flux-schnell",
    "style": "Realistic",
    "aspectRatio": "16:9",
    "metadata": {
      "topic": "Oral Health Care"
    }
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "image": {
      "id": "img_7c14a22c54434fb2",
      "url": "https://pub-582b7213209642b9b995c96c95a30381.r2.dev/flux-schnell-cf/prompt-1790426158534-677006.png",
      "width": 1280,
      "height": 720,
      "model": "flux-schnell",
      "provider": "pixazo",
      "prompt": "Fresh dental oral care and healthy smile",
      "style": "Realistic",
      "aspectRatio": "16:9",
      "generationTimeMs": 39387,
      "createdAt": "2026-09-26T18:06:03.000Z"
    }
  }
  ```

### 2. Generate Image from Existing Content
- **Endpoint**: `POST /api/v1/images/from-content`
- **Request Body**:
  ```json
  {
    "contentId": "cnt_398a87f1234a41bb",
    "topic": "Dental Care Guide",
    "title": "Complete Dental Hygiene Tips",
    "platform": "website",
    "style": "Commercial Photography"
  }
  ```

### 3. Image History
- **Endpoint**: `GET /api/v1/images/history?limit=10`
- **Response**: List of persisted image generation records with timestamps, URLs, prompts, and performance metrics.

---

## 6. Database Schema

Stored in `backend/dxgen.sqlite`:

```sql
CREATE TABLE IF NOT EXISTS image_generations (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  business_id TEXT,
  content_id TEXT,
  request_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  style TEXT,
  aspect_ratio TEXT,
  width INTEGER,
  height INTEGER,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL,
  generation_time_ms INTEGER,
  created_at TEXT NOT NULL
);
```

Content generations table (`content_generations`) also maintains links:
- `image_url TEXT`
- `image_id TEXT`

---

## 7. Production VPS Deployment Guide

Whenever updating the application on your production Ubuntu VPS:

### Single Update Command:
Run this command from the project root (`~/DXGen`):

```bash
git pull origin main && npm --prefix backend run build && npm --prefix frontend run build && pm2 restart dxgen --update-env
```

### Environment Variables (`backend/.env`):
Ensure the following settings are present in your VPS `backend/.env`:

```env
# AI Image Generation (Pixazo)
IMAGE_PROVIDER=pixazo
PIXAZO_API_KEY=8e3a1eabd8294ce68e176aeeada9e483
PIXAZO_BASE_URL=https://gateway.pixazo.ai
IMAGE_DEFAULT_MODEL=flux-schnell
IMAGE_DEFAULT_WIDTH=1024
IMAGE_DEFAULT_HEIGHT=1024
IMAGE_REQUEST_TIMEOUT=150000
IMAGE_MAX_RETRIES=1
IMAGE_RATE_LIMIT_PER_MINUTE=5
IMAGE_RATE_LIMIT_PER_DAY=20
IMAGE_STORAGE_PROVIDER=external
```

### Verification Commands:
- **Check Backend Logs**:
  ```bash
  pm2 logs dxgen --lines 50
  ```
- **Test Backend Test Suite**:
  ```bash
  npm --prefix backend test
  ```
- **Confirm Service Status**:
  ```bash
  pm2 status
  ```
