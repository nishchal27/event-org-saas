'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { CldUploadWidget } from 'next-cloudinary'
import { useToast } from '@/hooks/use-toast'

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  imageUrl: z.string().url().optional().nullable(),
  eventDate: z.string(),
  startTime: z.string(),
  endTime: z.string().optional().nullable(),
  locationType: z.enum(['physical', 'online']),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(1, 'Description is required'),
  additionalNotes: z.string().optional().nullable(),
  audienceType: z.enum(['all', 'selected', 'public']),
  customField1Label: z.string().optional().nullable(),
  customField1Value: z.string().optional().nullable(),
  customField2Label: z.string().optional().nullable(),
  customField2Value: z.string().optional().nullable(),
})

type EventFormData = z.infer<typeof eventSchema>

// Cloudinary upload validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

export function EventFormClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [showCustomFields, setShowCustomFields] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

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

  const createMutation = trpc.event.create.useMutation({
    onSuccess: (data) => {
      router.push(`/events/${data.id}`)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Create New Event</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
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
                  placeholder="e.g., Community Meditation Session"
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
                  {({ open }) => {
                    return (
                      <Button type="button" variant="outline" onClick={() => open()}>
                        {imageUrl ? 'Change Image' : 'Upload Image'}
                      </Button>
                    )
                  }}
                </CldUploadWidget>
                {imageUrl && (
                  <div className="mt-2">
                    <img src={imageUrl} alt="Event preview" className="h-32 w-auto rounded" />
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
              </div>

              <div>
                <Label htmlFor="endTime">End Time (Optional)</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register('endTime')}
                  className="mt-1"
                />
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
                  placeholder="Describe your event... Emojis are welcome! 🎉"
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
                      placeholder="e.g., Session"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customField1Value">Custom Field 1 Value</Label>
                    <Input
                      id="customField1Value"
                      {...register('customField1Value')}
                      placeholder="e.g., Meditation Level 1"
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
                      placeholder="e.g., Master"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customField2Value">Custom Field 2 Value</Label>
                    <Input
                      id="customField2Value"
                      {...register('customField2Value')}
                      placeholder="e.g., Shri ABC"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Creating...' : 'Create Event'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
