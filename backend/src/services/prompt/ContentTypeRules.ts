export interface ContentTypeRule {
  category: 'blog' | 'marketing' | 'social' | 'business' | 'other';
  label: string;
  requirements: string[];
}

export const contentTypeRulesMap: Record<string, ContentTypeRule> = {
  // Blog
  seo_blog_article: {
    category: 'blog',
    label: 'SEO Blog Article',
    requirements: [
      'Write an exhaustive, SEO-optimized guide targeting primary and secondary keywords naturally.',
      'Use structured headings (# H1, ## H2, ### H3), bullet points, and key takeaway boxes.',
      'Provide search-engine friendly title, meta title, meta description, and URL slug.',
      'Include a 3-5 question FAQ section with concise schema-ready answers.',
      'Suggest logical internal and external reference anchor topics.'
    ]
  },
  informational_blog: {
    category: 'blog',
    label: 'Informational Blog',
    requirements: [
      'Focus on clarity, thorough explanation, and educational value.',
      'Break complex ideas into digestible concepts with real-world analogies.',
      'Include structured sub-sections and clear summary conclusions.'
    ]
  },
  how_to_article: {
    category: 'blog',
    label: 'How-To Article',
    requirements: [
      'Organize as a clear, sequential step-by-step tutorial (Step 1, Step 2, etc.).',
      'Specify prerequisites, tools required, and expected outcomes upfront.',
      'Include pro tips, common pitfalls to avoid, and verification steps.'
    ]
  },
  listicle: {
    category: 'blog',
    label: 'Listicle',
    requirements: [
      'Craft a numbers-driven catchy title (e.g., "10 Proven Strategies...").',
      'Structure each item with a bold title, distinct value proposition, practical explanation, and quick takeaway.',
      'Ensure high scannability and diverse examples.'
    ]
  },
  product_review: {
    category: 'blog',
    label: 'Product Review',
    requirements: [
      'Provide an objective, thorough evaluation covering features, performance, and user experience.',
      'Include explicit Pros & Cons list and a "Who is this for?" breakdown.',
      'Deliver a final verdict with an overall rating and purchasing recommendation.'
    ]
  },
  comparison_article: {
    category: 'blog',
    label: 'Comparison Article',
    requirements: [
      'Direct head-to-head comparison between 2 or more options/solutions.',
      'Feature a structured comparison breakdown (Features, Pricing, Ease of Use, Support).',
      'Provide clear situational recommendations ("Choose Option A if... Choose Option B if...").'
    ]
  },
  news_update_article: {
    category: 'blog',
    label: 'News / Update Article',
    requirements: [
      'Use journalistic inverted pyramid structure (crucial news in first 2 paragraphs).',
      'Provide background context, industry impact, and quotes or stakeholder implications.',
      'Maintain an objective, fast-paced reporting tone.'
    ]
  },
  educational_article: {
    category: 'blog',
    label: 'Educational Article',
    requirements: [
      'Academic rigor simplified for general or professional comprehension.',
      'Define foundational terminology and illustrate with clear examples.',
      'Include key takeaways and further reading suggestions.'
    ]
  },

  // Marketing
  promotional_content: {
    category: 'marketing',
    label: 'Promotional Content',
    requirements: [
      'Emphasize high emotional hooks, urgency, and compelling benefits over features.',
      'Highlight transformation and return on investment for the customer.',
      'Drive directly to a single irresistible call to action.'
    ]
  },
  product_promotion: {
    category: 'marketing',
    label: 'Product Promotion',
    requirements: [
      'Highlight unique features, problem-solution dynamic, and standout differentiators.',
      'Address common buying objections directly and build customer confidence.',
      'Include social proof framing and a clear purchase CTA.'
    ]
  },
  service_promotion: {
    category: 'marketing',
    label: 'Service Promotion',
    requirements: [
      'Frame the service as an effortless solution to a painful customer problem.',
      'Outline the simple engagement process (e.g. Step 1: Consult, Step 2: Deliver).',
      'Include trust signals, business experience, and a consultation/booking CTA.'
    ]
  },
  advertisement_copy: {
    category: 'marketing',
    label: 'Advertisement Copy',
    requirements: [
      'Provide 3 distinct ad variants: High Urgency, Curiosity/Story, and Benefit/ROI.',
      'Write punchy headlines, scroll-stopping primary text, and high-CTR button descriptions.',
      'Adhere to character brevity suitable for Google Ads or Meta Ads.'
    ]
  },
  sales_copy: {
    category: 'marketing',
    label: 'Sales Copy',
    requirements: [
      'Use classic conversion frameworks (PAS: Problem-Agitate-Solution or AIDA).',
      'Build overwhelming value, overcome friction, and weave in guarantees and urgency.',
      'Multiple strategic CTA placements.'
    ]
  },
  landing_page_copy: {
    category: 'marketing',
    label: 'Landing Page Copy',
    requirements: [
      'Hero section: Compelling H1 headline, sub-headline, primary CTA, and social proof badge.',
      'Problem / Agitation section, Feature & Benefit cards, How It Works (3 steps).',
      'Testimonial quotes placeholders, FAQ section, and Final conversion banner CTA.'
    ]
  },
  offer_announcement: {
    category: 'marketing',
    label: 'Offer Announcement',
    requirements: [
      'State the limited-time discount, bonus, or special deal clearly in the headline.',
      'Highlight deadline/scarcity and clear qualification instructions.',
      'Explicit redemption steps and urgent CTA.'
    ]
  },
  product_description: {
    category: 'marketing',
    label: 'Product Description',
    requirements: [
      'Vivid, sensory description that makes the customer visualize ownership.',
      'Bullet points of technical specifications converted into customer benefits.',
      'Materials, sizing, usage instructions, and value guarantee.'
    ]
  },

  // Social
  instagram_caption: {
    category: 'social',
    label: 'Instagram Caption',
    requirements: [
      'First sentence must be an irresistible hook.',
      'Use spaced paragraph formatting for mobile elegance.',
      'Include question or CTA prompting comments, shares, or link clicks.',
      'Group 10-15 relevant hashtags at the bottom.'
    ]
  },
  instagram_promotional_post: {
    category: 'social',
    label: 'Instagram Promotional Post',
    requirements: [
      'Visually descriptive caption guiding followers to view carousel or reel.',
      'Spotlight a special promo or feature with clear callouts.',
      'Direct followers to "Link in bio" or "DM for promo code".'
    ]
  },
  facebook_post: {
    category: 'social',
    label: 'Facebook Post',
    requirements: [
      'Engaging story-driven or conversation-starting tone.',
      'Direct link recommendation and clear question to spur community discussion.'
    ]
  },
  linkedin_post: {
    category: 'social',
    label: 'LinkedIn Post',
    requirements: [
      'Opening hook optimized for click-through before the fold.',
      'Actionable business insight, industry observation, or framework.',
      'Professional formatting with line breaks and discussion prompt.'
    ]
  },
  x_twitter_post: {
    category: 'social',
    label: 'X/Twitter Post',
    requirements: [
      'High-signal, concise, punchy tweet or thread.',
      'Strong perspective or memorable takeaway with minimal hashtags.'
    ]
  },

  // Business
  google_business_profile_post: {
    category: 'business',
    label: 'Google Business Profile Post',
    requirements: [
      'Targeted for local customers with immediate intent.',
      'Under 250 words, mentioning location/service area naturally.',
      'Direct phone/visit/website CTA without hashtags.'
    ]
  },
  business_announcement: {
    category: 'business',
    label: 'Business Announcement',
    requirements: [
      'Formal yet inspiring company milestone, expansion, or partnership update.',
      'Address what this means for clients and stakeholders.',
      'Express gratitude and future roadmap commitment.'
    ]
  },
  customer_update: {
    category: 'business',
    label: 'Customer Update',
    requirements: [
      'Clear, transparent communication regarding product enhancements, policy changes, or system improvements.',
      'Bullet points highlighting exact changes and timeline.',
      'Dedicated support contact links.'
    ]
  },
  service_introduction: {
    category: 'business',
    label: 'Service Introduction',
    requirements: [
      'Introduce a new offering, explaining why it was developed and whose problem it solves.',
      'Summary of inclusions, pricing tier or quote invitation.',
      'Clear onboarding steps.'
    ]
  },
  event_announcement: {
    category: 'business',
    label: 'Event Announcement',
    requirements: [
      'Highlight date, time, venue / virtual link, keynote speakers, and agenda highlights.',
      'Why attendees cannot afford to miss it.',
      'Early-bird registration CTA and RSVP link.'
    ]
  },
  local_business_promotion: {
    category: 'business',
    label: 'Local Business Promotion',
    requirements: [
      'Spotlight neighborhood presence, community roots, and local customer love.',
      'Exclusive in-store or local service discount.',
      'Directions, parking info, and direct phone CTA.'
    ]
  },

  // Other
  email: {
    category: 'other',
    label: 'Email',
    requirements: [
      'Subject line options (urgent, intriguing, benefit).',
      'Personal, warm 1-on-1 voice with high readability.',
      'Single focused CTA with anchor text.'
    ]
  },
  newsletter: {
    category: 'other',
    label: 'Newsletter',
    requirements: [
      'Catchy issue headline, editor note, 2-3 structured insight sections.',
      'Curated recommendations and subscriber discussion prompt.'
    ]
  },
  website_content: {
    category: 'other',
    label: 'Website Content',
    requirements: [
      'Clean modern copy for web pages (About Us, Services, Home).',
      'Benefit-driven sub-headings and micro-copy.'
    ]
  },
  faq: {
    category: 'other',
    label: 'FAQ',
    requirements: [
      'Comprehensive Q&A covering top customer objections, technical questions, pricing, and policies.',
      'Direct, accurate answers structured for easy reading.'
    ]
  },
  press_release: {
    category: 'other',
    label: 'Press Release',
    requirements: [
      'Standard PR format: FOR IMMEDIATE RELEASE, City, State — Date.',
      'Strong headline and sub-headline, executive quotes, company boilerplate, and media contact info.'
    ]
  },
  custom_content: {
    category: 'other',
    label: 'Custom Content',
    requirements: [
      'Tailor strictly to user instructions, topic specifications, and desired goal.'
    ]
  }
};

export function getContentTypeRules(contentType: string): { label: string; category: string; requirements: string[] } {
  const normalized = contentType.toLowerCase().trim().replace(/[\s\/-]+/g, '_');
  const match = contentTypeRulesMap[normalized] || contentTypeRulesMap[contentType.toLowerCase()] || {
    label: contentType,
    category: 'other',
    requirements: ['Generate high quality, engaging content aligned with the selected topic and format.']
  };
  return { label: match.label, category: match.category, requirements: match.requirements };
}
