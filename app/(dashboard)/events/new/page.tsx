import { EventFormClient } from './event-form-client'

export default function NewEventPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Create New Event</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <EventFormClient embedded />
      </div>
    </div>
  )
}
