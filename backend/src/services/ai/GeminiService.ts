import { config } from '../../config/index.js';

export interface AiGenerationResult {
  rawText: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  generationTimeMs: number;
}

export class GeminiService {
  private resolveModelName(modelOverride?: string): string {
    let model = modelOverride || process.env.GEMINI_MODEL || config.gemini.model || 'gemini-3.8-flash';
    if (model.startsWith('models/')) {
      model = model.replace('models/', '');
    }
    return model;
  }

  async generate(prompt: string, modelOverride?: string): Promise<AiGenerationResult> {
    const startTime = Date.now();
    let lastError: any = null;
    const maxRetries = config.gemini.maxRetries || 3;
    let delay = config.gemini.retryDelayMs || 1000;

    const apiKey = (process.env.GEMINI_API_KEY || config.gemini.apiKey || '').trim();

    if (!apiKey) {
      console.warn('[GeminiService] No GEMINI_API_KEY configured. Using intelligent simulated response generator for local testing.');
      return this.generateSimulatedResponse(prompt, modelOverride || config.gemini.model, startTime);
    }

    let targetModel = this.resolveModelName(modelOverride);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const candidateModels = [targetModel, 'gemini-3.8-flash', 'gemini-3.5-flash-lite'];
        const uniqueModels = [...new Set(candidateModels)];

        let successfulResult: any = null;

        for (const currentModel of uniqueModels) {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
          
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [{ text: prompt }]
                  }
                ],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.7,
                  maxOutputTokens: 8192
                }
              })
            });

            const data: any = await response.json();

            if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
              const rawText = data.candidates[0].content.parts[0].text;
              const duration = Date.now() - startTime;
              const usage = data.usageMetadata || {};

              return {
                rawText,
                model: currentModel,
                inputTokens: usage.promptTokenCount || Math.round(prompt.length / 4),
                outputTokens: usage.candidatesTokenCount || Math.round(rawText.length / 4),
                generationTimeMs: duration
              };
            } else {
              lastError = new Error(data?.error?.message || `Failed with ${currentModel}`);
            }
          } catch (err: any) {
            lastError = err;
          }
        }
      } catch (err: any) {
        lastError = err;
        console.error(`[GeminiService] Attempt ${attempt} failed: ${err.message}`);
        if (attempt < maxRetries) {
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
        }
      }
    }

    throw new Error(`AI_GENERATION_FAILED: ${lastError?.message || 'Failed after multiple retries'}`);
  }

  private generateSimulatedResponse(prompt: string, model: string, startTime: number): AiGenerationResult {
    const topicMatch = prompt.match(/TOPIC:\s*\n([^\n]+)/);
    const topic = topicMatch ? topicMatch[1].trim() : 'Optimizing Modern Business Growth';
    const isSocial = prompt.includes('INSTAGRAM') || prompt.includes('X / TWITTER') || prompt.includes('LINKEDIN');

    const sampleJson = {
      title: `${topic}: The Ultimate Strategic Playbook for 2026`,
      body: `## Introduction\nIn today's fast-moving market, **${topic}** has transitioned from an optional advantage into a fundamental growth imperative. Forward-thinking leaders and modern enterprises must establish consistent, measurable frameworks to stay ahead of the curve.\n\n### Key Pillars for Execution\n1. **Data-Driven Strategy**: Align your team around concrete performance metrics rather than subjective hunches.\n2. **Iterative Execution**: Launch high-velocity experiments, assess feedback loops, and scale what works.\n3. **Modern Technology Leverage**: Automate repetitive workflows using next-generation AI pipelines.\n\n### Practical Implementation Checklist\n- [x] Audit your current systems and benchmark against industry leaders.\n- [x] Integrate automated tooling to streamline cross-functional handoffs.\n- [x] Measure key outcome indicators weekly to maintain compounding momentum.\n\n## Conclusion\nMastering **${topic}** requires a blend of clarity, relentless execution, and adaptive tools. When executed effectively, your business gains sustainable operational leverage that competitors struggle to replicate.`,
      metaTitle: `${topic} - Proven Strategies & Complete Guide (2026)`,
      metaDescription: `Discover high-impact frameworks and practical tips for ${topic}. Boost your performance with our step-by-step playbook.`,
      slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      keywords: [topic, 'growth strategy', 'optimization', 'performance'],
      faq: [
        {
          question: `Why is ${topic} essential for scaling modern businesses?`,
          answer: `It establishes scalable systems, minimizes wasted overhead, and creates repeatable outcomes that compound over time.`
        },
        {
          question: `How quickly can we expect measurable results?`,
          answer: `Most businesses witness clear improvements in conversion, efficiency, and clarity within the first 14 to 30 days of implementation.`
        }
      ],
      hashtags: isSocial ? ['#GrowthStrategy', '#Innovation', '#Marketing', '#BusinessScaling', '#AI'] : [],
      cta: `Ready to accelerate your outcomes? Connect with our team today or explore our dedicated solutions at DXGen.`
    };

    const simulatedText = JSON.stringify(sampleJson, null, 2);
    const duration = Math.max(350, Date.now() - startTime);

    return {
      rawText: simulatedText,
      model: `${model} (Dev Fallback)`,
      inputTokens: Math.round(prompt.length / 4),
      outputTokens: Math.round(simulatedText.length / 4),
      generationTimeMs: duration
    };
  }
}

export const geminiService = new GeminiService();
