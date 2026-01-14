/**
 * Enhanced AI Engine for Social Media Post Generation
 * Provides SEO-optimized, platform-specific content generation
 */

export type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'whatsapp'
export type Tone = 'friendly' | 'formal' | 'casual' | 'professional' | 'excited'
export type TargetAudience = 'general' | 'youth' | 'professionals' | 'families'
export type CallToAction = 'register' | 'learn-more' | 'share' | 'attend'

export interface EventData {
  title: string
  description: string
  eventDate: Date
  startTime: string
  endTime?: string | null
  location: string
  locationType: string
  imageUrl?: string | null
  additionalNotes?: string | null
  publicSlug: string
}

export interface GenerationOptions {
  platform: Platform
  tone?: Tone
  targetAudience?: TargetAudience
  callToAction?: CallToAction
  customPrompt?: string
  eventUrl: string
}

export interface GeneratedPost {
  content: string
  hashtags: string[]
  tokensUsed?: number
}

/**
 * Platform-specific character limits and guidelines
 */
const PLATFORM_GUIDELINES = {
  instagram: {
    maxLength: 2200,
    hashtagCount: 5,
    description: 'Instagram post with engaging visuals description, emojis, and relevant hashtags',
  },
  facebook: {
    maxLength: 5000,
    hashtagCount: 3,
    description: 'Facebook post that encourages engagement and sharing',
  },
  twitter: {
    maxLength: 280,
    hashtagCount: 2,
    description: 'Twitter/X post that is concise, engaging, and includes trending hashtags',
  },
  linkedin: {
    maxLength: 3000,
    hashtagCount: 5,
    description: 'LinkedIn post that is professional, informative, and network-oriented',
  },
  whatsapp: {
    maxLength: 1000,
    hashtagCount: 0,
    description: 'WhatsApp message that is friendly and personal',
  },
}

/**
 * Generate SEO-optimized social media post using OpenAI
 */
export async function generateSocialMediaPost(
  event: EventData,
  options: GenerationOptions
): Promise<GeneratedPost> {
  const apiKey = process.env.OPENAI_API_KEY
  // Use gpt-4o-mini for better quality, fallback to gpt-3.5-turbo if needed
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const supportsJsonMode = model.includes('gpt-4') || model.includes('gpt-3.5-turbo-1106')

  if (!apiKey) {
    // Fallback to template-based generation
    return generateFallbackPost(event, options)
  }

  const guidelines = PLATFORM_GUIDELINES[options.platform]
  const tone = options.tone || 'friendly'
  const targetAudience = options.targetAudience || 'general'
  const callToAction = options.callToAction || 'register'

  // Build comprehensive prompt for better quality
  const systemPrompt = buildSystemPrompt(options.platform, tone, targetAudience, guidelines)
  const userPrompt = buildUserPrompt(event, options, guidelines)

  try {
    const startTime = Date.now()
    const requestBody: any = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: Math.min(guidelines.maxLength / 2, 1000), // Reasonable token limit
      temperature: 0.8, // Creative but consistent
    }

    // Only use JSON mode if model supports it
    if (supportsJsonMode) {
      requestBody.response_format = { type: 'json_object' }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return generateFallbackPost(event, options)
    }

    const data = await response.json()
    const generationTime = Date.now() - startTime
    const tokensUsed = data.usage?.total_tokens || 0

    // Parse structured response
    try {
      const parsed = JSON.parse(data.choices[0]?.message?.content || '{}')
      return {
        content: parsed.content || parsed.post || '',
        hashtags: parsed.hashtags || extractHashtags(parsed.content || ''),
        tokensUsed,
      }
    } catch {
      // Fallback if JSON parsing fails
      const content = data.choices[0]?.message?.content || ''
      return {
        content,
        hashtags: extractHashtags(content),
        tokensUsed,
      }
    }
  } catch (error) {
    console.error('AI generation error:', error)
    return generateFallbackPost(event, options)
  }
}

/**
 * Build system prompt with platform-specific guidelines
 */
function buildSystemPrompt(
  platform: Platform,
  tone: Tone,
  targetAudience: TargetAudience,
  guidelines: typeof PLATFORM_GUIDELINES[Platform]
): string {
  const toneDescriptions = {
    friendly: 'warm, approachable, and inviting',
    formal: 'professional, respectful, and structured',
    casual: 'relaxed, conversational, and easy-going',
    professional: 'business-oriented, polished, and credible',
    excited: 'energetic, enthusiastic, and engaging',
  }

  const audienceDescriptions = {
    general: 'a general audience',
    youth: 'young adults and students (18-30 years)',
    professionals: 'working professionals and business people',
    families: 'families with children',
  }

  return `You are an expert social media content creator specializing in ${guidelines.description}.

Your task is to create a ${platform} post for an event that:
- Is ${toneDescriptions[tone]} in tone
- Targets ${audienceDescriptions[targetAudience]}
- Is SEO-optimized with relevant keywords naturally integrated
- Includes appropriate emojis (use sparingly for ${platform === 'linkedin' ? 'LinkedIn' : platform})
- Stays within ${guidelines.maxLength} characters
- Includes ${guidelines.hashtagCount} relevant hashtags
- Has a clear call-to-action
- Is engaging and encourages interaction

Return your response as JSON with this structure:
{
  "content": "The main post content",
  "hashtags": ["hashtag1", "hashtag2", ...]
}

Important guidelines:
${platform === 'twitter' ? '- Keep it concise and punchy, under 280 characters' : ''}
${platform === 'instagram' ? '- Make it visually descriptive and engaging' : ''}
${platform === 'linkedin' ? '- Keep it professional, avoid excessive emojis' : ''}
${platform === 'facebook' ? '- Encourage comments and shares' : ''}
${platform === 'whatsapp' ? '- Keep it personal and conversational' : ''}
- Use natural language, avoid keyword stuffing
- Make hashtags relevant to the event topic and location
- Include event details naturally in the content`
}

/**
 * Build user prompt with event details
 */
function buildUserPrompt(
  event: EventData,
  options: GenerationOptions,
  guidelines: typeof PLATFORM_GUIDELINES[Platform]
): string {
  const dateStr = new Date(event.eventDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  let prompt = `Create a ${options.platform} post for this event:

**Event Title:** ${event.title}

**Date & Time:** ${dateStr} at ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}

**Location:** ${event.location}${event.locationType === 'online' ? ' (Online Event)' : ''}

**Description:** ${event.description}`

  if (event.additionalNotes) {
    prompt += `\n\n**Additional Notes:** ${event.additionalNotes}`
  }

  prompt += `\n\n**Registration Link:** ${options.eventUrl}`

  if (options.customPrompt) {
    prompt += `\n\n**Additional Context:** ${options.customPrompt}`
  }

  prompt += `\n\n**Call to Action:** ${options.callToAction}`

  prompt += `\n\nGenerate a ${guidelines.description} that is ${options.tone || 'friendly'} and targets ${options.targetAudience || 'general'} audience.`

  return prompt
}

/**
 * Extract hashtags from content
 */
function extractHashtags(content: string): string[] {
  const hashtagRegex = /#(\w+)/g
  const matches = content.match(hashtagRegex)
  return matches ? matches.map((tag) => tag.substring(1)) : []
}

/**
 * Fallback template-based generation
 */
function generateFallbackPost(event: EventData, options: GenerationOptions): GeneratedPost {
  const dateStr = new Date(event.eventDate).toLocaleDateString('en-IN')
  const guidelines = PLATFORM_GUIDELINES[options.platform]

  let content = ''
  const hashtags: string[] = []

  switch (options.platform) {
    case 'instagram':
      content = `🎉 ${event.title}\n\n📅 ${dateStr}\n🕐 ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}\n📍 ${event.location}\n\n${event.description}\n\n👉 Register now: ${options.eventUrl}\n\n#Event #${event.title.replace(/\s+/g, '')} #Community`
      hashtags.push('Event', event.title.replace(/\s+/g, ''), 'Community')
      break

    case 'facebook':
      content = `🎉 Join us for ${event.title}!\n\n📅 Date: ${dateStr}\n🕐 Time: ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}\n📍 Location: ${event.location}\n\n${event.description}\n\nRegister here: ${options.eventUrl}`
      hashtags.push('Event', 'Community')
      break

    case 'twitter':
      content = `🎉 ${event.title}\n\n📅 ${dateStr} at ${event.startTime}\n📍 ${event.location}\n\n${event.description.substring(0, 100)}...\n\nRegister: ${options.eventUrl}`
      hashtags.push('Event')
      break

    case 'linkedin':
      content = `We're excited to announce ${event.title}!\n\n📅 Date: ${dateStr}\n🕐 Time: ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}\n📍 Location: ${event.location}\n\n${event.description}\n\nJoin us! Register here: ${options.eventUrl}`
      hashtags.push('Event', 'Networking', 'Professional')
      break

    case 'whatsapp':
      content = `🎉 *${event.title}*\n\n📅 ${dateStr}\n🕐 ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}\n📍 ${event.location}\n\n${event.description}\n\n👉 Register: ${options.eventUrl}`
      break
  }

  return {
    content: content.substring(0, guidelines.maxLength),
    hashtags: hashtags.slice(0, guidelines.hashtagCount),
  }
}
