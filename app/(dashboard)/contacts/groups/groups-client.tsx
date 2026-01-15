'use client'

import { trpc } from '@/lib/trpc-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Users, Search, Edit, Trash2, ArrowLeft } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'

export function GroupsClient() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const utils = trpc.useUtils()

  const { data: groups, isLoading } = trpc.group.getAll.useQuery()
  const { data: contacts } = trpc.contact.getAll.useQuery()

  const createMutation = trpc.group.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Group created successfully',
      })
      setIsDialogOpen(false)
      utils.group.getAll.invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateMutation = trpc.group.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Group updated successfully',
      })
      setEditingGroup(null)
      setIsDialogOpen(false)
      utils.group.getAll.invalidate()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = trpc.group.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Group deleted successfully',
      })
      utils.group.getAll.invalidate()
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
    description: '',
    contactIds: [] as string[],
  })

  const filteredGroups = groups?.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingGroup) {
      updateMutation.mutate({
        id: editingGroup,
        data: formData,
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (group: any) => {
    setEditingGroup(group.id)
    setFormData({
      name: group.name,
      description: group.description || '',
      contactIds: group.contactIds || [],
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (groupId: string) => {
    if (confirm('Are you sure you want to delete this group? This will not delete the contacts.')) {
      deleteMutation.mutate({ id: groupId })
    }
  }

  const toggleContact = (contactId: string) => {
    setFormData((prev) => ({
      ...prev,
      contactIds: prev.contactIds.includes(contactId)
        ? prev.contactIds.filter((id) => id !== contactId)
        : [...prev.contactIds, contactId],
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      contactIds: [],
    })
    setEditingGroup(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/contacts">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Contact Groups</h1>
                <p className="text-sm text-gray-600">Organize your contacts into groups</p>
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
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
                  <DialogDescription>
                    {editingGroup
                      ? 'Update group details and members'
                      : 'Create a new group to organize your contacts'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Group Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., VIP Members, Regular Attendees"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe this group..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Select Contacts</Label>
                    <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
                      {contacts && contacts.length > 0 ? (
                        contacts.map((contact) => (
                          <div key={contact.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={contact.id}
                              checked={formData.contactIds.includes(contact.id)}
                              onCheckedChange={() => toggleContact(contact.id)}
                            />
                            <label
                              htmlFor={contact.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {contact.name} ({contact.phone})
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No contacts available</p>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formData.contactIds.length} contact{formData.contactIds.length !== 1 ? 's' : ''} selected
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
                      disabled={createMutation.isLoading || updateMutation.isLoading || !formData.name}
                    >
                      {editingGroup ? 'Update' : 'Create'} Group
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
                <CardTitle>All Groups</CardTitle>
                <CardDescription>Manage your contact groups</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-gray-500">Loading groups...</div>
            ) : filteredGroups.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500">
                  {searchQuery ? 'No groups found' : 'No groups yet. Create your first group!'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredGroups.map((group) => (
                  <Card key={group.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          {group.description && (
                            <CardDescription className="mt-1">{group.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(group)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(group.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{group.contactCount || 0} contact{group.contactCount !== 1 ? 's' : ''}</span>
                      </div>
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
