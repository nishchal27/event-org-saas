'use client'

import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, MessageSquare, Search, Edit, Trash2, ArrowLeft, Mail, Bell, Send } from 'lucide-react'
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

const templateTypes = [
  { value: 'invitation', label: 'Invitation', icon: Mail, description: 'Initial event invitation' },
  { value: 'reminder', label: 'Reminder', icon: Bell, description: 'Event reminder message' },
  { value: 'followup', label: 'Follow-up', icon: Send, description: 'Post-event follow-up' },
]

export function MessageTemplatesClient() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)
  const utils = trpc.useUtils()

  const { data: templates, isLoading } = trpc.messageTemplate.getAll.useQuery()

  const createMutation = trpc.messageTemplate.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Message template created successfully',
      })
      setIsDialogOpen(false)
      resetForm()
      utils.messageTemplate.getAll.invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateMutation = trpc.messageTemplate.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Message template updated successfully',
      })
      setEditingTemplate(null)
      setIsDialogOpen(false)
      resetForm()
      utils.messageTemplate.getAll.invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = trpc.messageTemplate.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Message template deleted successfully',
      })
      utils.messageTemplate.getAll.invalidate()
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
    content: '',
    type: 'invitation' as 'invitation' | 'reminder' | 'followup',
  })

  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || template.type === typeFilter
    return matchesSearch && matchesType
  }) || []

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
      content: template.content,
      type: template.type as 'invitation' | 'reminder' | 'followup',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (templateId: string) => {
    if (confirm('Are you sure you want to delete this message template?')) {
      deleteMutation.mutate({ id: templateId })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      type: 'invitation',
    })
    setEditingTemplate(null)
  }

  const getTypeIcon = (type: string) => {
    const typeInfo = templateTypes.find((t) => t.value === type)
    return typeInfo?.icon || MessageSquare
  }

  const getTypeLabel = (type: string) => {
    const typeInfo = templateTypes.find((t) => t.value === type)
    return typeInfo?.label || type
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Message Templates</h1>
                <p className="text-sm text-gray-600">Save and reuse WhatsApp message templates</p>
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
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                  <DialogDescription>
                    {editingTemplate
                      ? 'Update your message template'
                      : 'Create a reusable WhatsApp message template'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name *</Label>
                    <Input
                      id="template-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Standard Invitation, Reminder 24h"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-type">Message Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'invitation' | 'reminder' | 'followup') =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateTypes.map((type) => {
                          const Icon = type.icon
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {templateTypes.find((t) => t.value === formData.type)?.description}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="template-content">Message Content *</Label>
                    <Textarea
                      id="template-content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Enter your message template. Use {name} for contact name, {eventTitle} for event title, {eventDate} for event date..."
                      required
                      rows={8}
                      className="mt-1 font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Available variables: {'{name}'}, {'{eventTitle}'}, {'{eventDate}'}, {'{eventTime}'}, {'{eventLocation}'}
                    </p>
                  </div>
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
                        !formData.content
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
                <CardTitle>All Message Templates</CardTitle>
                <CardDescription>Manage your WhatsApp message templates</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {templateTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-gray-500">Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">
                  {searchQuery || typeFilter !== 'all'
                    ? 'No templates found'
                    : 'No message templates yet. Create your first template!'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => {
                  const TypeIcon = getTypeIcon(template.type)
                  return (
                    <Card key={template.id} className="relative">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <TypeIcon className="h-5 w-5 text-primary" />
                              <span className="text-xs font-semibold uppercase text-primary">
                                {getTypeLabel(template.type)}
                              </span>
                            </div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
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
                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {template.content}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
