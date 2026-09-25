export interface PlatformRule {
  name: string;
  rules: string[];
}

export const platformRulesMap: Record<string, PlatformRule> = {
  website: {
    name: 'Website / Blog',
    rules: [
      'Structure with hierarchical markdown headings (# H1, ## H2, ### H3).',
      'Include a compelling, hook-driven introduction and an insightful conclusion.',
      'Optimize for user search intent and comprehensive depth.',
      'Incorporate structured FAQ section and internal/external reference placeholders.',
      'Include a clear, value-focused Call to Action (CTA).'
    ]
  },
  instagram: {
    name: 'Instagram',
    rules: [
      'Write engaging, hook-first copy designed to stop the scroll.',
      'Use short, punchy paragraphs with line breaks for readability.',
      'Integrate subtle, tasteful emojis where relevant.',
      'End with a high-converting CTA (e.g., Save this, Drop a comment, Tap the link in bio).',
      'Generate 10-15 hyper-relevant and trending hashtags grouped neatly at the end.'
    ]
  },
  facebook: {
    name: 'Facebook',
    rules: [
      'Use a conversational, community-oriented storytelling opening.',
      'Focus on emotional resonance, relatability, or practical value.',
      'Keep paragraphs short (1-3 sentences) for mobile feeds.',
      'Include an interactive conversation-starter question and direct CTA.',
      'Limit hashtags to 2-3 essential tags.'
    ]
  },
  linkedin: {
    name: 'LinkedIn',
    rules: [
      'Craft a provocative or insightful opening line (the "see more" click trigger).',
      'Deliver professional value: business frameworks, lessons learned, strategic insights, or data-driven perspectives.',
      'Use bullet points, white space, and bold highlights for effortless scanning.',
      'Maintain an authoritative yet approachable executive voice.',
      'Conclude with an engaging prompt for professional discussion and 3-5 focused hashtags.'
    ]
  },
  twitter: {
    name: 'X / Twitter',
    rules: [
      'Write in sharp, punchy, high-impact phrasing.',
      'Can be structured as a standalone viral post or a multi-part numbered thread (1/n).',
      'Eliminate all filler words and fluff.',
      'Strong provocative point-of-view or actionable framework.',
      'Include 1-2 targeted hashtags and a direct engagement CTA.'
    ]
  },
  google_business: {
    name: 'Google Business Profile',
    rules: [
      'Frame content strictly for local customers and high purchase intent.',
      'Highlight proximity, local service reliability, opening hours, or special offers.',
      'Keep copy concise, professional, and directly actionable (under 250 words).',
      'Avoid hashtags or unnecessary decorative formatting.',
      'Include a decisive local CTA (e.g., Call today, Visit our store, Book online, Request a quote).'
    ]
  },
  email: {
    name: 'Email',
    rules: [
      'Provide 3 high-converting subject line options (curiosity, urgency, benefit-driven).',
      'Include a personalized opening hook and conversational body copy.',
      'Focus on a single core message and eliminate cognitive overload.',
      'Feature a distinct, repetitive Call To Action (button text + link text).',
      'Include a compelling P.S. line that reinforces the urgency or core offer.'
    ]
  },
  newsletter: {
    name: 'Newsletter',
    rules: [
      'Format as a premium, value-packed newsletter edition with an engaging title.',
      'Organize into digestible sections with clear sub-headers.',
      'Blend analysis, curated insights, and actionable takeaways.',
      'Maintain an intimate, trusted advisor editorial voice.',
      'End with a subscriber feedback question and next-edition preview.'
    ]
  },
  custom: {
    name: 'Custom Platform',
    rules: [
      'Adapt formatting and tone to best suit the specified topic and audience.',
      'Ensure clear readability, logical progression, and relevant calls to action.'
    ]
  }
};

export function getPlatformRules(platform: string): string[] {
  const normalized = platform.toLowerCase().trim().replace(/[\s\/-]+/g, '_');
  const match = platformRulesMap[normalized] || platformRulesMap[platform.toLowerCase()] || platformRulesMap.custom;
  return match.rules;
}
