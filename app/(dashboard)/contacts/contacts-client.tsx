'use client'

import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search, Mail, Phone, MapPin, Download, Users, TrendingUp, Calendar, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  location: z.string().optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

export function ContactsClient() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const utils = trpc.useUtils()
  const { data: contacts, isLoading, refetch } = trpc.contact.getAll.useQuery()
  const { data: engagement } = trpc.analytics.getContactEngagement.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  const handleExport = async () => {
    try {
      const result = await utils.export.exportContacts.fetch({ format: 'csv' })
      if (result) {
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({
          title: 'Success',
          description: 'Contacts exported successfully',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export contacts',
        variant: 'destructive',
      })
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const createMutation = trpc.contact.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Contact added successfully',
      })
      reset()
      setIsDialogOpen(false)
      // Invalidate contacts list to refetch with new contact
      utils.contact.getAll.invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: ContactFormData) => {
    createMutation.mutate({
      ...data,
      email: data.email || null,
      tags: [],
    })
  }

  const filteredContacts = useMemo(() => {
    if (!contacts) return []
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [contacts, searchQuery])

  // Create engagement map for quick lookup
  const engagementMap = useMemo(() => {
    if (!engagement) return new Map()
    const map = new Map()
    engagement.forEach((eng) => {
      map.set(eng.contactId, eng)
    })
    return map
  }, [engagement])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Contacts</h1>
              <Link href="/contacts/groups">
                <Button variant="ghost" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Groups
                </Button>
              </Link>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contact
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                  <DialogDescription>
                    Add a new contact to your organization
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Enter contact name"
                      className="mt-1"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      placeholder="Enter phone number"
                      className="mt-1"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="Enter email address"
                      className="mt-1"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input
                      id="location"
                      {...register('location')}
                      placeholder="Enter location"
                      className="mt-1"
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isLoading}>
                      {createMutation.isLoading ? 'Adding...' : 'Add Contact'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Contacts</CardTitle>
            <CardDescription>
              Manage your organization's contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-gray-500">Loading contacts...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  {searchQuery ? 'No contacts found' : 'No contacts yet. Add your first contact!'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact) => {
                  const contactEngagement = engagementMap.get(contact.id)
                  return (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{contact.name}</h3>
                          {contactEngagement && contactEngagement.totalEvents > 0 && (
                            <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              <TrendingUp className="h-3 w-3" />
                              <span>{Math.round(contactEngagement.engagementRate)}% engaged</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {contact.phone}
                          </div>
                          {contact.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {contact.email}
                            </div>
                          )}
                          {contact.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {contact.location}
                            </div>
                          )}
                          {contactEngagement && contactEngagement.totalEvents > 0 && (
                            <>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{contactEngagement.totalEvents} event{contactEngagement.totalEvents !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-green-600">{contactEngagement.confirmedEvents} confirmed</span>
                              </div>
                            </>
                          )}
                        </div>
                        {contactEngagement && contactEngagement.lastEventDate && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Last event: {new Date(contactEngagement.lastEventDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
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
