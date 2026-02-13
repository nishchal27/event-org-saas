export type GuideSection = {
  id: string
  title: string
  shortIntro: string
  steps: string[]
  commonMistake: string
  reassurance: string
  screenshotLabel?: string
  tutorialVideoLabel?: string
}

export const guideSections: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    shortIntro: 'You don’t need to be technical. Lexnify is made for simple organizers.',
    steps: [
      'Open Lexnify on your phone or laptop.',
      'Sign in and create your organization (this is just your group name).',
      'Go to Events and click “Create Event”.',
    ],
    commonMistake: 'Worrying that you will break something. You won’t.',
    reassurance: 'Everything can be edited later. Nothing is deleted unless you choose to delete it.',
    screenshotLabel: 'SAMPLE SCREENSHOT HERE (Dashboard Home)',
    tutorialVideoLabel: 'TUTORIAL VIDEO PLACEHOLDER (1 min: Getting Started)',
  },
  {
    id: 'create-first-event',
    title: 'Creating Your First Event',
    shortIntro: 'Create your event first. You can always change details later.',
    steps: [
      'Click “Create New Event”.',
      'Add event name, date, time, and location.',
      'Click “Create”.',
      'Open the event to see your event page and tools.',
    ],
    commonMistake: 'Trying to make it perfect on the first try.',
    reassurance: 'Don’t worry. You can edit the event anytime.',
    screenshotLabel: 'SAMPLE SCREENSHOT HERE (Create Event Screen)',
    tutorialVideoLabel: 'TUTORIAL VIDEO PLACEHOLDER (2 min: Create an Event)',
  },
  {
    id: 'adding-contacts',
    title: 'Adding Contacts',
    shortIntro: 'Contacts are the people you invite. Add once, reuse anytime.',
    steps: [
      'Go to Contacts.',
      'Click “Add Contact” (or import many).',
      'Add name and phone number.',
      'Save. That’s it.',
    ],
    commonMistake: 'Using different phone formats each time (spaces, +91, etc.).',
    reassurance: 'It’s okay. Lexnify understands common phone formats and keeps things consistent.',
    screenshotLabel: 'SAMPLE SCREENSHOT HERE (Contacts Screen)',
    tutorialVideoLabel: 'TUTORIAL VIDEO PLACEHOLDER (2 min: Add Contacts)',
  },
  {
    id: 'sending-whatsapp',
    title: 'Sending WhatsApp',
    shortIntro: 'Lexnify helps you send clear WhatsApp invitations and reminders.',
    steps: [
      'Open your event.',
      'Click “Send WhatsApp”.',
      'Choose your contacts (or group).',
      'Send the message on WhatsApp.',
    ],
    commonMistake: 'Thinking Lexnify will message people without your permission.',
    reassurance: 'You are always in control. You choose when to send and to whom.',
    screenshotLabel: 'SAMPLE SCREENSHOT HERE (WhatsApp Send Screen)',
    tutorialVideoLabel: 'TUTORIAL VIDEO PLACEHOLDER (2 min: WhatsApp Invites)',
  },
  {
    id: 'public-registration',
    title: 'Public Registration Page',
    shortIntro: 'This is the simple page your attendees open to register.',
    steps: [
      'Open your event.',
      'Copy your public registration link.',
      'Share it on WhatsApp or anywhere.',
      'Attendees register from their phone.',
    ],
    commonMistake: 'Sharing the wrong link.',
    reassurance: 'If the attendee sees your event details and a registration form, it’s the correct link.',
    screenshotLabel: 'SAMPLE SCREENSHOT HERE (Public Registration Page)',
    tutorialVideoLabel: 'TUTORIAL VIDEO PLACEHOLDER (1 min: Share Registration Link)',
  },
  {
    id: 'check-in',
    title: 'Check-In (Very Important)',
    shortIntro: 'The goal: fast entry at the venue. No stress.',
    steps: [
      'Go to your event → Check-in.',
      'Show/print the Event QR at the entrance.',
      'Attendees scan it and check in from their own phone.',
      'Optional: Use staff scanning if you prefer.',
    ],
    commonMistake: 'Trying check-in too early (before it opens) or too late (after it closes).',
    reassurance: 'Lexnify will clearly tell you when check-in is open. When the event is over, check-in automatically closes.',
    screenshotLabel: 'SAMPLE SCREENSHOT HERE (Check-in Page + Event QR)',
    tutorialVideoLabel: 'TUTORIAL VIDEO PLACEHOLDER (3 min: Self Check-in + Staff Scan)',
  },
  {
    id: 'reports',
    title: 'Viewing Reports',
    shortIntro: 'See who registered and who checked in—anytime.',
    steps: [
      'Open your event.',
      'Go to Attendance/Reports.',
      'View totals and lists.',
      'Export if needed.',
    ],
    commonMistake: 'Refreshing again and again when the list is large.',
    reassurance: 'It’s okay. Reports update automatically. You can also export for sharing.',
    screenshotLabel: 'SAMPLE SCREENSHOT HERE (Reports Screen)',
    tutorialVideoLabel: 'TUTORIAL VIDEO PLACEHOLDER (2 min: Reports)',
  },
  {
    id: 'billing',
    title: 'Subscription & Billing',
    shortIntro: 'Upgrade only if you need more features or higher limits.',
    steps: [
      'Open Pricing/Billing from the sidebar.',
      'Choose the plan you want.',
      'Pay securely.',
      'Your plan activates automatically.',
    ],
    commonMistake: 'Thinking you’ll be charged without confirmation.',
    reassurance: 'You will always see the plan and price before you pay.',
    screenshotLabel: 'SAMPLE SCREENSHOT HERE (Pricing Page)',
    tutorialVideoLabel: 'TUTORIAL VIDEO PLACEHOLDER (1 min: Upgrade Plan)',
  },
  {
    id: 'safety',
    title: 'Safety & Data',
    shortIntro: 'Your data is safe, and you stay in control.',
    steps: [
      'Your events and contacts stay inside your organization.',
      'You can edit anytime.',
      'Check-in prevents duplicate entries.',
      'If something looks wrong, you can contact support.',
    ],
    commonMistake: 'Assuming a mistake will delete data.',
    reassurance: 'Nothing is deleted unless you choose to delete it. Most actions are safe and reversible.',
    screenshotLabel: 'SAMPLE SCREENSHOT HERE (Safety Tips)',
    tutorialVideoLabel: 'TUTORIAL VIDEO PLACEHOLDER (1 min: Safety)',
  },
]

