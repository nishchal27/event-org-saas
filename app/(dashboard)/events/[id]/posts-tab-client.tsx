'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Sparkles,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  MessageSquare,
  Copy,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  TrendingUp,
  Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'whatsapp'
type Tone = 'friendly' | 'formal' | 'casual' | 'professional' | 'excited'

const PLATFORM_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  whatsapp: MessageSquare,
}

const PLATFORM_COLORS = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  facebook: 'bg-blue-600',
  twitter: 'bg-black',
  linkedin: 'bg-blue-700',
  whatsapp: 'bg-green-500',
}

interface PostsTabClientProps {
  eventId: string
}

export function PostsTabClient({ eventId }: PostsTabClientProps) {
  const { toast } = useToast()
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram')
  const [tone, setTone] = useState<Tone>('friendly')
  const [targetAudience, setTargetAudience] = useState<'general' | 'youth' | 'professionals' | 'families'>('general')
  const [callToAction, setCallToAction] = useState<'register' | 'learn-more' | 'share' | 'attend'>('register')
  const [customPrompt, setCustomPrompt] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [editingHashtags, setEditingHashtags] = useState<string[]>([])

  const utils = trpc.useUtils()
  const { data: posts, isLoading: postsLoading } = trpc.ai.getPostsByEvent.useQuery(
    { eventId },
    {
      // Keep posts fresh for 1 minute (they don't change often)
      staleTime: 60 * 1000,
    }
  )
  const { data: usageStats } = trpc.ai.getUsageStats.useQuery(undefined, {
    // Usage stats can be cached for 2 minutes
    staleTime: 2 * 60 * 1000,
  })

  const generateMutation = trpc.ai.generatePost.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success!',
        description: `Post generated for ${selectedPlatform}`,
      })
      // Invalidate and refetch posts query
      utils.ai.getPostsByEvent.invalidate({ eventId })
      // Invalidate usage stats to show updated count
      utils.ai.getUsageStats.invalidate()
      setCustomPrompt('')
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateMutation = trpc.ai.updatePost.useMutation({
    onSuccess: () => {
      toast({
        title: 'Updated',
        description: 'Post updated successfully',
      })
      setEditingPostId(null)
      // Invalidate posts query to refetch updated data
      utils.ai.getPostsByEvent.invalidate({ eventId })
    },
  })

  const deleteMutation = trpc.ai.deletePost.useMutation({
    onSuccess: () => {
      toast({
        title: 'Deleted',
        description: 'Post deleted successfully',
      })
      // Invalidate posts query to refetch without deleted item
      utils.ai.getPostsByEvent.invalidate({ eventId })
    },
  })

  const handleGenerate = () => {
    generateMutation.mutate({
      eventId,
      platform: selectedPlatform,
      tone,
      targetAudience,
      callToAction,
      customPrompt: customPrompt || undefined,
      saveToDb: true,
    })
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: 'Copied!',
      description: 'Post content copied to clipboard',
    })
  }

  const handleEdit = (post: any) => {
    setEditingPostId(post.id)
    setEditingContent(post.content)
    setEditingHashtags(post.hashtags || [])
  }

  const handleSaveEdit = () => {
    if (!editingPostId) return
    updateMutation.mutate({
      postId: editingPostId,
      content: editingContent,
      hashtags: editingHashtags,
    })
  }

  const handleDelete = (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate({ postId })
    }
  }

  const PlatformIcon = PLATFORM_ICONS[selectedPlatform]
  const platformColor = PLATFORM_COLORS[selectedPlatform]

  return (
    <div className="space-y-6">
      {/* Usage Stats */}
      {usageStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Generations</p>
                <p className="text-2xl font-bold">
                  {usageStats.currentCount} / {usageStats.limit}
                </p>
                <p className="text-xs text-gray-500">{usageStats.remaining} remaining</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tokens Used</p>
                <p className="text-2xl font-bold">{usageStats.tokensUsed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Posts Generated</p>
                <p className="text-2xl font-bold">{usageStats.postsGenerated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate New Post */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Social Media Post
          </CardTitle>
          <CardDescription>
            Create SEO-optimized posts for your event across different platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Platform</Label>
            <div className="grid grid-cols-5 gap-2">
              {(['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp'] as Platform[]).map((platform) => {
                const Icon = PLATFORM_ICONS[platform]
                const color = PLATFORM_COLORS[platform]
                return (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all',
                      selectedPlatform === platform
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className={cn('rounded-full p-2 text-white', color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium capitalize">{platform}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Basic Options */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="professional">Professional</option>
                <option value="excited">Excited</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="general">General</option>
                <option value="youth">Youth</option>
                <option value="professionals">Professionals</option>
                <option value="families">Families</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Call to Action</Label>
              <select
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value as any)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="register">Register</option>
                <option value="learn-more">Learn More</option>
                <option value="share">Share</option>
                <option value="attend">Attend</option>
              </select>
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-primary hover:underline"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
            {showAdvanced && (
              <div className="mt-2 space-y-2">
                <Label>Additional Context (Optional)</Label>
                <Textarea
                  placeholder="Add any specific details or style preferences for the post..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">
                  Help AI understand your event better. For example: "Focus on the networking aspect" or "Highlight the
                  keynote speaker"
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isLoading}
            className="w-full"
            size="lg"
          >
            {generateMutation.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Post
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Posts</CardTitle>
          <CardDescription>Your saved social media posts</CardDescription>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">No posts generated yet</p>
              <p className="text-sm">Generate your first post above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const Icon = PLATFORM_ICONS[post.platform as Platform]
                const color = PLATFORM_COLORS[post.platform as Platform]
                const isEditing = editingPostId === post.id

                return (
                  <div
                    key={post.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('rounded-lg p-2 text-white', color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold capitalize">{post.platform}</h3>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                post.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : post.status === 'archived'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-blue-100 text-blue-800'
                              )}
                            >
                              {post.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                            {post.tokensUsed && ` • ${post.tokensUsed} tokens`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleSaveEdit}
                              disabled={updateMutation.isLoading}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingPostId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopy(post.content)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(post)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(post.id)}
                              disabled={deleteMutation.isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-4 space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={6}
                          className="font-mono text-sm"
                        />
                        <div className="space-y-1">
                          <Label className="text-xs">Hashtags (comma-separated)</Label>
                          <input
                            type="text"
                            value={editingHashtags.join(', ')}
                            onChange={(e) =>
                              setEditingHashtags(
                                e.target.value
                                  .split(',')
                                  .map((tag) => tag.trim())
                                  .filter(Boolean)
                              )
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="hashtag1, hashtag2, hashtag3"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <div className="rounded-md bg-gray-50 p-4">
                          <p className="whitespace-pre-wrap text-sm">{post.content}</p>
                        </div>
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {post.hashtags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                              >
                                <Hash className="h-3 w-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
