'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dynamic from 'next/dynamic'
import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import React from 'react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { trackEvent } from '@/lib/analytics'
import { FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const CldUploadWidget = dynamic(
  () =>
    import('next-cloudinary').then((mod) => mod.CldUploadWidget as React.ComponentType<any>),
  { ssr: false }
)

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const eventSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    imageUrl: z.string().optional().nullable(),
    eventDate: z.string().min(1, 'Event date is required'),
    endDate: z.string().min(1, 'End date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    locationType: z.enum(['physical', 'online']),
    location: z.string().min(1, 'Location is required'),
    description: z.string().min(1, 'Description is required'),
    additionalNotes: z.string().optional().nullable(),
    audienceType: z.enum(['all', 'selected', 'public']),
    maxCapacity: z
      .preprocess(
        (val) => {
          if (val === '' || val === null || val === undefined || val === 0) return null
          const num = typeof val === 'string' ? Number(val) : (typeof val === 'number' ? val : null)
          if (num === null || isNaN(num) || num <= 0) return null
          return Math.floor(num)
        },
        z.union([z.number().int().positive(), z.null()]).optional()
      ),
    customField1Label: z.string().optional().nullable(),
    customField1Value: z.string().optional().nullable(),
    customField2Label: z.string().optional().nullable(),
    customField2Value: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const startDate = new Date(data.eventDate)
    const endDate = new Date(data.endDate)

    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
      if (endDate < startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'End date must be the same as or after the start date',
        })
      }

      const isSameDay = startDate.toDateString() === endDate.toDateString()
      if (isSameDay && timeToMinutes(data.endTime) <= timeToMinutes(data.startTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endTime'],
          message: 'End time must be after the start time',
        })
      }
    }
  })

type EventFormData = z.infer<typeof eventSchema>

// Cloudinary upload validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

export function EventFormClient({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter()
  const { toast } = useToast()
  const [showCustomFields, setShowCustomFields] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const { data: templates } = trpc.template.getAll.useQuery()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const utils = trpc.useUtils()
  
  type Template = { id: string; name: string }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      locationType: 'physical',
      audienceType: 'all',
    },
  })

  const { data: selectedTemplate } = trpc.template.getById.useQuery(
    { id: selectedTemplateId },
    { enabled: !!selectedTemplateId }
  )

  // Pre-fill form when template is selected
  React.useEffect(() => {
    if (selectedTemplate) {
      setValue('title', selectedTemplate.title)
      setValue('description', selectedTemplate.description)
      setValue('locationType', selectedTemplate.locationType as 'physical' | 'online')
      setValue('location', selectedTemplate.location || '')
      setValue('startTime', selectedTemplate.startTime || '')
      setValue('endTime', selectedTemplate.endTime || '')
      setValue('additionalNotes', selectedTemplate.additionalNotes || '')
      setValue('customField1Label', selectedTemplate.customField1Label || '')
      setValue('customField1Value', selectedTemplate.customField1Value || '')
      setValue('customField2Label', selectedTemplate.customField2Label || '')
      setValue('customField2Value', selectedTemplate.customField2Value || '')
      setValue('maxCapacity', selectedTemplate.maxCapacity || null)
      toast({
        title: 'Template loaded',
        description: 'Form pre-filled from template. Update dates and details as needed.',
      })
    }
  }, [selectedTemplate, setValue, toast])

  const createTemplateMutation = trpc.template.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Template saved successfully',
      })
      utils.template.getAll.invalidate()
      setShowSaveTemplateDialog(false)
      setTemplateName('')
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const createMutation = trpc.event.create.useMutation({
    onSuccess: (data: any) => {
      if (data && 'id' in data) {
        trackEvent('event_created', { eventId: data.id }, undefined, data.organizationId)
        router.push(`/events/${data.id}`)
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description:
          error.data?.code === 'UNAUTHORIZED'
            ? 'Please sign in again and try creating the event.'
            : error.message,
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: EventFormData) => {
    // Final validation before submit
    if (imageUrl && !imageUrl.startsWith('https://res.cloudinary.com')) {
      toast({
        title: 'Invalid image',
        description: 'Please upload a valid image from Cloudinary.',
        variant: 'destructive',
      })
      return
    }

    createMutation.mutate({
      ...data,
      imageUrl: imageUrl || null,
    })
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
          {/* Template Selection */}
          {templates && templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Start from Template (Optional)</CardTitle>
                <CardDescription>Quickly create events from saved templates</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None - Create from scratch</SelectItem>
                    {templates.map((template: Template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplateId && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Template will pre-fill the form. You can modify any fields.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Section A: Core Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Core Event Details</CardTitle>
              <CardDescription>Basic information about your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g., Community Meetup, Workshop, Training Session, Event"
                  className="mt-1"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label>Event Image / Banner (Optional)</Label>
                <p className="mb-2 text-xs text-gray-500">
                  Max size: 5MB. Formats: JPG, PNG, WebP, GIF
                </p>
                <CldUploadWidget
                  uploadPreset="event_images"
                  onSuccess={(result: any) => {
                    if (result?.info?.secure_url) {
                      setImageUrl(result.info.secure_url)
                      toast({
                        title: 'Image uploaded',
                        description: 'Your event image has been uploaded successfully.',
                      })
                    }
                  }}
                  onError={(error: any) => {
                    console.error('Cloudinary upload error:', error)
                    toast({
                      title: 'Upload failed',
                      description: error?.message || 'Failed to upload image. Please try again.',
                      variant: 'destructive',
                    })
                  }}
                  onQueuesEnd={(result: any, { widget }: any) => {
                    // This fires when upload completes
                    if (result?.info?.error) {
                      toast({
                        title: 'Upload failed',
                        description: result.info.error.message || 'Failed to upload image.',
                        variant: 'destructive',
                      })
                    }
                  }}
                  options={{
                    maxFiles: 1, // Only 1 image per event
                    maxFileSize: MAX_FILE_SIZE,
                    resourceType: 'image',
                    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
                    sources: ['local', 'camera'], // Only allow local files and camera
                    multiple: false,
                    cropping: false, // Disable cropping to keep it simple
                    showAdvancedOptions: false,
                    showPoweredBy: false,
                  }}
                >
                  {({ open }: { open: () => void }) => {
                    return (
                      <Button type="button" variant="outline" onClick={() => open()}>
                        {imageUrl ? 'Change Image' : 'Upload Image'}
                      </Button>
                    )
                  }}
                </CldUploadWidget>
                {imageUrl && (
                  <div className="mt-2">
                    <Image
                      src={imageUrl}
                      alt="Event preview"
                      width={256}
                      height={128}
                      className="h-32 w-auto rounded object-cover"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setImageUrl(null)
                        setValue('imageUrl', null)
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="eventDate">Event Date *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    {...register('eventDate')}
                    className="mt-1"
                  />
                  {errors.eventDate && (
                    <p className="mt-1 text-sm text-destructive">{errors.eventDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...register('endDate')}
                    className="mt-1"
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-destructive">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    {...register('startTime')}
                    className="mt-1"
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-destructive">{errors.startTime.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    {...register('endTime')}
                    className="mt-1"
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-sm text-destructive">{errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="locationType">Location Type *</Label>
                <Select
                  value={watch('locationType')}
                  onValueChange={(value) => setValue('locationType', value as 'physical' | 'online')}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder={
                    watch('locationType') === 'online'
                      ? 'Meeting link or platform'
                      : 'Address or venue name'
                  }
                  className="mt-1"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-destructive">{errors.location.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Event Description *</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe your event... What will attendees experience? What should they know? Emojis are welcome! 🎉"
                  rows={5}
                  className="mt-1"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                <Textarea
                  id="additionalNotes"
                  {...register('additionalNotes')}
                  placeholder="Any special instructions or notes..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="audienceType">Who is this event for? *</Label>
                <Select
                  value={watch('audienceType')}
                  onValueChange={(value) =>
                    setValue('audienceType', value as 'all' | 'selected' | 'public')
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contacts</SelectItem>
                    <SelectItem value="selected">Selected Contacts</SelectItem>
                    <SelectItem value="public">Public (Anyone with link)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxCapacity">Maximum Capacity (Optional)</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  min="1"
                  {...register('maxCapacity', { 
                    setValueAs: (v) => {
                      if (v === '' || v === null || v === undefined) return null
                      const num = Number(v)
                      return isNaN(num) ? null : num
                    }
                  })}
                  placeholder="e.g., 20 (for events with limited capacity)"
                  className="mt-1"
                />
                {errors.maxCapacity && (
                  <p className="mt-1 text-sm text-destructive">{errors.maxCapacity.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Set a limit for how many people can attend. When full, new registrations will be added to waitlist.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section B: Custom Fields (Optional) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Custom Fields (Optional)</CardTitle>
                  <CardDescription>Add up to 2 custom fields for your event</CardDescription>
                </div>
                <Switch
                  checked={showCustomFields}
                  onCheckedChange={setShowCustomFields}
                />
              </div>
            </CardHeader>
            {showCustomFields && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="customField1Label">Custom Field 1 Label</Label>
                    <Input
                      id="customField1Label"
                      {...register('customField1Label')}
                      placeholder="e.g., Category, Organizer, Requirements"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customField1Value">Custom Field 1 Value</Label>
                    <Input
                      id="customField1Value"
                      {...register('customField1Value')}
                      placeholder="e.g., All Levels, Professional, Bring ID"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="customField2Label">Custom Field 2 Label</Label>
                    <Input
                      id="customField2Label"
                      {...register('customField2Label')}
                      placeholder="e.g., Facilitator, Duration, Fee"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customField2Value">Custom Field 2 Value</Label>
                    <Input
                      id="customField2Value"
                      {...register('customField2Value')}
                      placeholder="e.g., John Doe, 2 hours, Free"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <div className="flex gap-4">
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Creating...' : 'Create Event'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const formData = watch()
                  if (!formData.title || !formData.description) {
                    toast({
                      title: 'Error',
                      description: 'Please fill in title and description before saving as template',
                      variant: 'destructive',
                    })
                    return
                  }
                  setShowSaveTemplateDialog(true)
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Save as Template
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
  )

  const formAndDialog = (
    <>
      {formContent}
      {/* Save as Template Dialog */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this event configuration as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Weekly Workshop, Monthly Meetup"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveTemplateDialog(false)
                setTemplateName('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const formData = watch()
                if (!templateName) {
                  toast({
                    title: 'Error',
                    description: 'Please enter a template name',
                    variant: 'destructive',
                  })
                  return
                }
                createTemplateMutation.mutate({
                  name: templateName,
                  title: formData.title,
                  description: formData.description,
                  locationType: formData.locationType,
                  location: formData.location || null,
                  startTime: formData.startTime || null,
                  endTime: formData.endTime || null,
                  additionalNotes: formData.additionalNotes || null,
                  customField1Label: formData.customField1Label || null,
                  customField1Value: formData.customField1Value || null,
                  customField2Label: formData.customField2Label || null,
                  customField2Value: formData.customField2Value || null,
                  maxCapacity: formData.maxCapacity || null,
                })
              }}
              disabled={createTemplateMutation.isLoading || !templateName}
            >
              {createTemplateMutation.isLoading ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  if (embedded) return formAndDialog
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Create New Event</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        {formAndDialog}
      </div>
    </div>
  )
}
