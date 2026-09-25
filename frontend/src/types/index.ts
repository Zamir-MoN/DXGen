export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'owner' | 'admin' | 'business_user';
  businessId?: string;
  businessName?: string;
}

export interface BusinessProfile {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  industry: string;
  description: string;
  website: string;
  location: string;
  target_audience: string;
  services: string;
  products: string;
  brand_voice: string;
  contact_info: string;
  cta: string;
  usps: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  business_id?: string;
  name: string;
  key_prefix: string;
  environment: 'live' | 'test';
  status: 'active' | 'disabled';
  rate_limit_hour: number;
  rate_limit_day: number;
  requests_used: number;
  last_used_at: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface GeneratedContent {
  id: string;
  topic: string;
  content_type: string;
  platform: string;
  tone: string;
  length: string;
  language: string;
  title: string;
  body: string;
  meta_title?: string;
  meta_description?: string;
  slug?: string;
  faq?: Array<{ question: string; answer: string }>;
  cta?: string;
  hashtags?: string[];
  model: string;
  input_tokens?: number;
  output_tokens?: number;
  generation_time_ms: number;
  created_at: string;
}

export interface UsageMetrics {
  totalGenerations: number;
  requestsToday: number;
  requestsThisMonth: number;
  totalTokensThisMonth: number;
  averageLatencyMs: number;
  successfulRequests: number;
  failedRequests: number;
  platformDistribution: Array<{ platform: string; count: number }>;
  timeline: Array<{ date: string; requests: number; tokens: number }>;
}

export interface RequestLog {
  id: string;
  request_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  content_type: string;
  platform: string;
  model: string;
  response_time_ms: number;
  input_tokens: number;
  output_tokens: number;
  error_message?: string;
  ip: string;
  created_at: string;
}
