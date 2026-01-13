'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search } from 'lucide-react'

interface Contact {
  id: string
  name: string
  phone: string
  email?: string | null
  tags?: string[]
}

interface ContactSelectionProps {
  contacts: Contact[]
  selectedContacts: string[]
  onSelectionChange: (selected: string[]) => void
}

export function ContactSelection({
  contacts,
  selectedContacts,
  onSelectionChange,
}: ContactSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
  )

  const handleToggle = (contactId: string) => {
    if (selectedContacts.includes(contactId)) {
      onSelectionChange(selectedContacts.filter((id) => id !== contactId))
    } else {
      onSelectionChange([...selectedContacts, contactId])
    }
  }

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(filteredContacts.map((c) => c.id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {selectedContacts.length} of {filteredContacts.length} selected
        </p>
        <button
          onClick={handleSelectAll}
          className="text-sm text-primary hover:underline"
        >
          {selectedContacts.length === filteredContacts.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <Card>
        <CardContent className="max-h-96 space-y-2 overflow-y-auto p-4">
          {filteredContacts.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No contacts found</p>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-gray-50"
              >
                <Checkbox
                  checked={selectedContacts.includes(contact.id)}
                  onCheckedChange={() => handleToggle(contact.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.phone}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
