'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { CldUploadWidget } from 'next-cloudinary'
import { Loader2, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'

export function SettingsClient() {
  const { toast } = useToast()
  const utils = trpc.useUtils()
  const { isLoaded: userLoaded } = useUser()
  const { data: organization, isLoading } = trpc.organization.getCurrent.useQuery(undefined, {
    enabled: userLoaded, // Only fetch when user is loaded
    retry: (failureCount, error: any) => {
      // Retry on UNAUTHORIZED errors (might be timing issue)
      if (error?.data?.code === 'UNAUTHORIZED' && failureCount < 2) {
        return true
      }
      return false
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
  
  const [workspaceName, setWorkspaceName] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [accentColor, setAccentColor] = useState('#3b82f6')
  const [backgroundColor, setBackgroundColor] = useState<'light' | 'dark'>('light')
  const [fontStyle, setFontStyle] = useState<'default' | 'modern' | 'classic'>('default')

  // Initialize state when organization data loads
  useEffect(() => {
    if (organization) {
      setWorkspaceName(organization.name || '')
      setLogo(organization.logo || null)
      setAccentColor(organization.accentColor || '#3b82f6')
      setBackgroundColor((organization.backgroundColor as 'light' | 'dark') || 'light')
      setFontStyle((organization.fontStyle as 'default' | 'modern' | 'classic') || 'default')
    }
  }, [organization])

  const updateOrgMutation = trpc.organization.update.useMutation({
    onSuccess: () => {
      toast({ title: 'Saved', description: 'Workspace name updated.' })
      utils.organization.getCurrent.invalidate()
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = trpc.organization.updateCustomization.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Event page customization saved successfully',
      })
      utils.organization.getCurrent.invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleSave = () => {
    updateMutation.mutate({
      logo: logo || null,
      accentColor,
      backgroundColor,
      fontStyle,
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <Link href="/settings/message-templates">
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Message Templates
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace name</CardTitle>
              <CardDescription>
                This name appears in the sidebar and on your event pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workspace-name">Name</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="My Events"
                  className="mt-1 max-w-md"
                />
              </div>
              <Button
                onClick={() => updateOrgMutation.mutate({ name: workspaceName.trim() || undefined })}
                disabled={updateOrgMutation.isPending || !workspaceName.trim() || workspaceName === organization?.name}
              >
                {updateOrgMutation.isPending ? 'Saving…' : 'Save name'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Page Customization</CardTitle>
              <CardDescription>
                Customize how your public event pages look
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Organization Logo */}
              <div>
                <Label htmlFor="logo">Organization Logo</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload your organization logo. If not uploaded, your organization name will be displayed.
                </p>
                <div className="mt-3 space-y-3">
                  {logo && (
                    <div className="flex items-center gap-4">
                      <Image
                        src={logo}
                        alt="Organization logo"
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-lg object-cover border border-border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLogo(null)}
                      >
                        Remove Logo
                      </Button>
                    </div>
                  )}
                  <CldUploadWidget
                    uploadPreset="event_images"
                    onSuccess={(result: any) => {
                      if (result?.info?.secure_url) {
                        setLogo(result.info.secure_url)
                        toast({
                          title: 'Logo uploaded!',
                          description: 'Click "Save Customization" to apply changes',
                        })
                      }
                    }}
                    onError={(error: any) => {
                      console.error('Upload error:', error)
                      toast({
                        title: 'Upload failed',
                        description: 'Failed to upload logo. Please try again.',
                        variant: 'destructive',
                      })
                    }}
                    options={{
                      maxFileSize: 5 * 1024 * 1024, // 5MB
                      resourceType: 'image',
                    }}
                  >
                    {({ open }: any) => (
                      <Button type="button" variant="outline" onClick={() => open()}>
                        {logo ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                    )}
                  </CldUploadWidget>
                </div>
              </div>

              {/* Theme Color */}
              <div>
                <Label htmlFor="themeColor">Event Page Theme Color</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a color theme for your public event pages
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <Input
                    id="themeColor"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-12 w-32 cursor-pointer"
                  />
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={accentColor}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                          setAccentColor(value)
                        }
                      }}
                      placeholder="#3b82f6"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div
                  className="mt-2 h-20 rounded-lg"
                  style={{ backgroundColor: accentColor }}
                />
              </div>

              {/* Font Style */}
              <div>
                <Label htmlFor="fontStyle">Font Style</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose the font style for your event pages
                </p>
                <select
                  id="fontStyle"
                  value={fontStyle}
                  onChange={(e) => setFontStyle(e.target.value as 'default' | 'modern' | 'classic')}
                  className="mt-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="default">Default</option>
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                </select>
              </div>

              {/* Background */}
              <div>
                <Label>Background</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose the background style for your event pages
                </p>
                <div className="mt-3 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="background"
                      value="light"
                      checked={backgroundColor === 'light'}
                      onChange={() => setBackgroundColor('light')}
                      className="cursor-pointer"
                    />
                    <span>Light</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="background"
                      value="dark"
                      checked={backgroundColor === 'dark'}
                      onChange={() => setBackgroundColor('dark')}
                      className="cursor-pointer"
                    />
                    <span>Dark</span>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={updateMutation.isLoading}
                className="w-full"
              >
                {updateMutation.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Customization'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
