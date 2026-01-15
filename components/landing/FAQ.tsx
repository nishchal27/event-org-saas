import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Do I need a credit card to get started?',
    answer:
      'No, you can start using EventOrg completely free. Our free plan includes everything you need to create events and send WhatsApp notifications. No credit card required.',
  },
  {
    question: 'Is this suitable for fitness trainers and coaches?',
    answer:
      'Absolutely! EventOrg is perfect for trainers, coaches, and instructors. You can create class schedules, send WhatsApp reminders to students, track attendance, and manage repeat events easily.',
  },
  {
    question: 'How do WhatsApp notifications work?',
    answer:
      'EventOrg integrates with WhatsApp Business API to send automated notifications. Once you create an event and add contacts, you can send invitations, reminders, and updates directly to attendees via WhatsApp.',
  },
  {
    question: 'Can I use this for community events and meetups?',
    answer:
      'Yes! EventOrg works great for housing societies, spiritual groups, clubs, and associations. Create events, notify members via WhatsApp, and track who\'s attending—all in one place.',
  },
  {
    question: 'Can I import my existing contact list?',
    answer:
      'Yes! You can import contacts from CSV files or add them manually. Our contact management system makes it easy to organize students, members, or attendees into groups for different events.',
  },
  {
    question: 'What happens if a notification fails to send?',
    answer:
      'Our system automatically retries failed notifications and provides detailed delivery reports. You can track the status of each notification in your dashboard.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. We use industry-standard encryption to protect your data. Your contact information and event details are stored securely and never shared with third parties.',
  },
  {
    question: 'Can I customize notification messages?',
    answer:
      'Yes! You can customize all notification templates with your event details, branding, and personal messages. Make every notification feel personal and professional.',
  },
]

export function FAQ() {
  return (
    <section id="faq" className="relative bg-gradient-to-br from-background via-primary/5 to-background dark:via-primary/15 py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about EventOrg. Can't find the answer you're looking for?
            Contact our support team.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="mt-12">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-lg border border-border/50 px-6 transition-all hover:border-primary/50"
              >
                <AccordionTrigger className="text-left text-lg font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
