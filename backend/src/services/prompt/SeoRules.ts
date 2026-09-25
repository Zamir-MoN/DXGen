export interface SeoOptions {
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  targetLocation?: string;
  targetAudience?: string;
  searchIntent?: string;
  industry?: string;
  brandName?: string;
  competitorReference?: string;
}

export function buildSeoRules(seo?: SeoOptions): string[] {
  if (!seo) return ['Optimize naturally for readability and clarity without forced keyword stuffing.'];

  const rules: string[] = [];

  if (seo.primaryKeyword) {
    rules.push(`Primary Target Keyword: "${seo.primaryKeyword}". Include naturally in Title, H1, first 100 words, one H2 subheading, and conclusion. Do NOT keyword-stuff.`);
  }

  if (seo.secondaryKeywords && seo.secondaryKeywords.length > 0) {
    rules.push(`Secondary Keywords to weave naturally: ${seo.secondaryKeywords.map(k => `"${k}"`).join(', ')}.`);
  }

  if (seo.searchIntent) {
    rules.push(`Search Intent: ${seo.searchIntent}. Fully satisfy the user query so they do not need to click back to search results.`);
  }

  if (seo.targetLocation) {
    rules.push(`Geographic Target: ${seo.targetLocation}. Include natural local context, references, or relevance.`);
  }

  if (seo.brandName) {
    rules.push(`Brand Positioning: Naturally reference brand name "${seo.brandName}" as a credible authority.`);
  }

  if (seo.competitorReference) {
    rules.push(`Market Context/Competitor Benchmark: Consider context around "${seo.competitorReference}" without negative disparagement.`);
  }

  rules.push('Generate an optimized meta title (50-60 characters) and high-CTR meta description (140-155 characters).');
  rules.push('Generate a clean URL slug (lowercase, hyphen-separated).');
  rules.push('Provide a 3-5 item FAQ section with clear answers addressing common search queries.');

  return rules;
}
