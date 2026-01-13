'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function CreateOrganizationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const createOrg = trpc.organization.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Organization created!',
        description: 'Your organization has been created successfully.',
      })
      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organization',
        variant: 'destructive',
      })
      setIsCreating(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    createOrg.mutate({ name: name.trim(), slug: slug.trim().toLowerCase() })
  }

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value)
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50)
      setSlug(autoSlug)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Organization</CardTitle>
          <CardDescription>
            Get started by creating your organization. This will be your workspace for managing events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                placeholder="My Community"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                minLength={1}
                maxLength={100}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL-friendly identifier)</Label>
              <Input
                id="slug"
                placeholder="my-community"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
                minLength={3}
                maxLength={50}
                pattern="[a-z0-9-]+"
                disabled={isCreating}
              />
              <p className="text-xs text-gray-500">
                Only lowercase letters, numbers, and hyphens. This will be used in URLs.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
