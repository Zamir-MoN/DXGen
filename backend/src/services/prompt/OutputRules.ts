export function getOutputRules(isBlogOrWebsite: boolean, isSocial: boolean): string {
  return `
Return ONLY a valid, raw JSON object matching the following structure. Do NOT enclose inside markdown backticks (like \`\`\`json) if possible, or return strictly valid parseable JSON:
{
  "title": "A captivating, high-impact headline or title",
  "body": "The complete generated content formatted in clean markdown (with headings, lists, bold text where applicable)",
  ${isBlogOrWebsite ? `"metaTitle": "Optimized SEO meta title under 60 characters",
  "metaDescription": "Optimized SEO meta description under 160 characters",
  "slug": "url-friendly-lowercase-hyphenated-slug",
  "keywords": ["primary keyword", "secondary keyword 1", "secondary keyword 2"],
  "faq": [
    { "question": "Frequently asked question 1?", "answer": "Clear, concise authoritative answer." },
    { "question": "Frequently asked question 2?", "answer": "Clear, concise authoritative answer." }
  ],` : ''}
  ${isSocial ? `"hashtags": ["#tag1", "#tag2", "#tag3"],` : ''}
  "cta": "A compelling, context-appropriate Call to Action statement"
}

IMPORTANT: Ensure all quotes inside JSON strings are properly escaped. Do not output conversational preamble or postscript outside the JSON object.
`;
}
