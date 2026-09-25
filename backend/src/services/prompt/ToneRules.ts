export const toneRulesMap: Record<string, string> = {
  professional: 'Objective, authoritative, polished, articulate, and trustworthy.',
  friendly: 'Warm, welcoming, supportive, and approachable like a trusted peer.',
  casual: 'Relaxed, natural, unpretentious, using everyday conversational language.',
  conversational: 'Interactive, direct, speaking to "you", engaging the reader as in a dialogue.',
  educational: 'Instructive, explanatory, patient, structured, and easy to grasp.',
  persuasive: 'Compelling, rhetoric-driven, benefit-focused, inspiring decisive action.',
  promotional: 'Exciting, vibrant, high-energy, spotlighting offers and exclusive advantages.',
  premium: 'Sophisticated, discerning, high-status, refined, and confident.',
  technical: 'Precise, terminology-accurate, detail-rich, and analytically rigorous.',
  minimal: 'Direct, succinct, devoid of fluff, getting straight to the point.',
  enthusiastic: 'Passionate, energetic, optimistic, and uplifting.',
  luxury: 'Exclusive, elegant, bespoke, evoking craftsmanship, prestige, and distinction.',
  local_business: 'Community-rooted, personal, neighborly, and proud of local service.'
};

export function getToneRule(tone: string, customTone?: string): string {
  if (customTone && customTone.trim()) {
    return `Custom Tone Specification: ${customTone.trim()}`;
  }
  const normalized = tone.toLowerCase().trim().replace(/[\s\/-]+/g, '_');
  const match = toneRulesMap[normalized];
  if (match) return match;
  return `Tone description: ${tone}`;
}
