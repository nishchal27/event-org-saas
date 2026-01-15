'use client'

import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, FileText, Search, Edit, Trash2, ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export function TemplatesClient() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const utils = trpc.useUtils()

  const { data: templates, isLoading } = trpc.template.getAll.useQuery()

  const createMutation = trpc.template.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Template created successfully',
      })
      setIsDialogOpen(false)
      resetForm()
      utils.template.getAll.invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateMutation = trpc.template.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Template updated successfully',
      })
      setEditingTemplate(null)
      setIsDialogOpen(false)
      resetForm()
      utils.template.getAll.invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = trpc.template.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      })
      utils.template.getAll.invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    locationType: 'physical' as 'physical' | 'online',
    location: '',
    startTime: '',
    endTime: '',
    additionalNotes: '',
    customField1Label: '',
    customField1Value: '',
    customField2Label: '',
    customField2Value: '',
    maxCapacity: null as number | null,
  })

  const [showCustomFields, setShowCustomFields] = useState(false)

  const filteredTemplates = templates?.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate,
        data: formData,
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (template: any) => {
    setEditingTemplate(template.id)
    setFormData({
      name: template.name,
      title: template.title,
      description: template.description,
      locationType: template.locationType as 'physical' | 'online',
      location: template.location || '',
      startTime: template.startTime || '',
      endTime: template.endTime || '',
      additionalNotes: template.additionalNotes || '',
      customField1Label: template.customField1Label || '',
      customField1Value: template.customField1Value || '',
      customField2Label: template.customField2Label || '',
      customField2Value: template.customField2Value || '',
      maxCapacity: template.maxCapacity || null,
    })
    setShowCustomFields(!!(template.customField1Label || template.customField2Label))
    setIsDialogOpen(true)
  }

  const handleDelete = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template? This will not delete events created from it.')) {
      deleteMutation.mutate({ id: templateId })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      description: '',
      locationType: 'physical',
      location: '',
      startTime: '',
      endTime: '',
      additionalNotes: '',
      customField1Label: '',
      customField1Value: '',
      customField2Label: '',
      customField2Value: '',
      maxCapacity: null,
    })
    setShowCustomFields(false)
    setEditingTemplate(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/events">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Event Templates</h1>
                <p className="text-sm text-gray-600">Save and reuse event configurations</p>
              </div>
            </div>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) resetForm()
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                  <DialogDescription>
                    {editingTemplate
                      ? 'Update template details'
                      : 'Create a reusable template for common event types'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name *</Label>
                    <Input
                      id="template-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Weekly Workshop, Monthly Meetup"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-title">Event Title *</Label>
                    <Input
                      id="template-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Event title..."
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-description">Description *</Label>
                    <Textarea
                      id="template-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your event..."
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location-type">Location Type *</Label>
                      <Select
                        value={formData.locationType}
                        onValueChange={(value: 'physical' | 'online') =>
                          setFormData({ ...formData, locationType: value })
                        }
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
                      <Label htmlFor="template-location">Location</Label>
                      <Input
                        id="template-location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Event location..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time">Start Time</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time">End Time</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="max-capacity">Max Capacity (Optional)</Label>
                    <Input
                      id="max-capacity"
                      type="number"
                      min="1"
                      value={formData.maxCapacity || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxCapacity: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="Leave empty for unlimited"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="additional-notes">Additional Notes</Label>
                    <Textarea
                      id="additional-notes"
                      value={formData.additionalNotes}
                      onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                      placeholder="Any additional information..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="custom-fields"
                      checked={showCustomFields}
                      onCheckedChange={setShowCustomFields}
                    />
                    <Label htmlFor="custom-fields">Add Custom Fields</Label>
                  </div>
                  {showCustomFields && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="custom1-label">Custom Field 1 Label</Label>
                          <Input
                            id="custom1-label"
                            value={formData.customField1Label}
                            onChange={(e) =>
                              setFormData({ ...formData, customField1Label: e.target.value })
                            }
                            placeholder="e.g., Category"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="custom1-value">Custom Field 1 Value</Label>
                          <Input
                            id="custom1-value"
                            value={formData.customField1Value}
                            onChange={(e) =>
                              setFormData({ ...formData, customField1Value: e.target.value })
                            }
                            placeholder="e.g., Workshop"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="custom2-label">Custom Field 2 Label</Label>
                          <Input
                            id="custom2-label"
                            value={formData.customField2Label}
                            onChange={(e) =>
                              setFormData({ ...formData, customField2Label: e.target.value })
                            }
                            placeholder="e.g., Organizer"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="custom2-value">Custom Field 2 Value</Label>
                          <Input
                            id="custom2-value"
                            value={formData.customField2Value}
                            onChange={(e) =>
                              setFormData({ ...formData, customField2Value: e.target.value })
                            }
                            placeholder="e.g., John Doe"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false)
                        resetForm()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createMutation.isLoading ||
                        updateMutation.isLoading ||
                        !formData.name ||
                        !formData.title ||
                        !formData.description
                      }
                    >
                      {editingTemplate ? 'Update' : 'Create'} Template
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Templates</CardTitle>
                <CardDescription>Manage your event templates</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-gray-500">Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">
                  {searchQuery ? 'No templates found' : 'No templates yet. Create your first template!'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="mt-1">{template.title}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {template.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{template.location}</span>
                          </div>
                        )}
                        {(template.startTime || template.endTime) && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {template.startTime}
                              {template.endTime && ` - ${template.endTime}`}
                            </span>
                          </div>
                        )}
                        {template.maxCapacity && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Max {template.maxCapacity} attendees</span>
                          </div>
                        )}
                      </div>
                      <Link href={`/events/new?template=${template.id}`}>
                        <Button variant="outline" className="w-full mt-4">
                          Use Template
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
