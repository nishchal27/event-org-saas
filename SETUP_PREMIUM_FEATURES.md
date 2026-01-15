# Premium Features Setup Guide

Complete setup guide for all premium features.

---

## 🚀 Quick Start

### 1. Database Migration

After pulling the latest code, run database migrations:

```bash
# Generate Prisma client with new models
npx prisma generate

# Push schema changes to database
npx prisma db push
```

**New Models Added:**
- `EventTemplate`
- `MessageTemplate`
- `ContactGroup`

**Enhanced Models:**
- `Event` (added `qrCode`, `maxCapacity`, `templateId`)
- `Attendee` (added `isWaitlist`, `checkedIn`, `checkedInAt`)

---

## 📦 Optional Dependencies

### QR Code Generation (Optional)

For QR code display and generation:

```bash
npm install qrcode @types/qrcode
```

**Note:** QR codes are generated automatically (unique string), but this package is needed for visual QR code display.

---

## ✅ Feature Verification

### Test Analytics Dashboard

1. Create a few events
2. Add some attendees
3. Go to Dashboard
4. Verify:
   - Metrics cards show data
   - Charts display (if you have 6+ months of data)
   - Trend indicators work
   - No errors in console

### Test Event Templates

1. Create an event
2. (Future: Save as template)
3. Go to create new event
4. Select template from dropdown
5. Verify form pre-fills

### Test CSV Export

1. Go to Contacts page
2. Click "Export" button
3. Verify CSV downloads
4. Open in spreadsheet app
5. Verify data is correct

### Test QR Check-in

1. Create an event
2. Go to event detail page
3. Verify "Check-in" button appears
4. (With qrcode package) QR code should display
5. Test check-in endpoint

### Test Capacity & Waitlist

1. Create event with `maxCapacity: 5`
2. Register 6 attendees
3. Verify 5th goes to confirmed
4. Verify 6th goes to waitlist
5. Check waitlist badge displays

---

## 🔧 Configuration

### Analytics

No configuration needed. Analytics work automatically once you have:
- Events created
- Attendees registered
- Data in database

### Templates

Templates are organization-specific. Each organization can create their own templates.

### Exports

Exports work automatically. No configuration needed.

### QR Codes

QR codes are auto-generated on event creation. No configuration needed.

**To Display QR Codes:**
1. Install `qrcode` package
2. Create QR display component (see example below)

### Contact Groups

Groups are organization-specific. No configuration needed.

---

## 💻 Code Examples

### Display QR Code (After installing qrcode)

```typescript
'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function QRCodeDisplay({ qrCode }: { qrCode: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    if (qrCode) {
      const url = `${window.location.origin}/checkin/${qrCode}`
      QRCode.toDataURL(url, (err, url) => {
        if (!err) setQrDataUrl(url)
      })
    }
  }, [qrCode])

  if (!qrDataUrl) return <div>Loading QR code...</div>

  return (
    <div>
      <img src={qrDataUrl} alt="QR Code" />
      <a href={qrDataUrl} download="qrcode.png">
        Download QR Code
      </a>
    </div>
  )
}
```

### Using Analytics

```typescript
import { trpc } from '@/lib/trpc-client'

function Dashboard() {
  const { data: analytics } = trpc.analytics.getOverview.useQuery()
  
  if (!analytics) return <div>Loading...</div>
  
  return (
    <div>
      <h2>Events: {analytics.currentMonth.events}</h2>
      <p>Trend: {analytics.trends.eventsChange}%</p>
    </div>
  )
}
```

### Using Templates

```typescript
// Get all templates
const { data: templates } = trpc.template.getAll.useQuery()

// Create event from template
const { data: template } = trpc.template.getById.useQuery({ id: templateId })

// Pre-fill form with template data
useEffect(() => {
  if (template) {
    setValue('title', template.title)
    setValue('description', template.description)
    // ... other fields
  }
}, [template])
```

### Exporting Data

```typescript
const exportMutation = trpc.export.exportContacts.useQuery(
  { format: 'csv' },
  { enabled: false }
)

const handleExport = async () => {
  const result = await exportMutation.refetch()
  if (result.data) {
    const blob = new Blob([result.data.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.data.filename
    a.click()
    window.URL.revokeObjectURL(url)
  }
}
```

---

## 🐛 Troubleshooting

### Database Migration Issues

**Error: "Table already exists"**
```bash
# Reset database (development only!)
npx prisma migrate reset

# Or manually drop tables and re-run
npx prisma db push --force-reset
```

**Error: "Column does not exist"**
- Ensure you ran `npx prisma generate`
- Verify schema changes are correct
- Check database connection

### Analytics Not Working

**No data showing:**
- Create some events first
- Add attendees to events
- Wait a few minutes for data to populate

**Charts not displaying:**
- Check Recharts is installed: `npm list recharts`
- Verify you have data for 6+ months
- Check browser console for errors

### Templates Not Appearing

**Template dropdown empty:**
- Create a template first
- Verify template belongs to your organization
- Check template router is working

### Export Not Downloading

**File not downloading:**
- Check browser download settings
- Ensure pop-ups are allowed
- Try different browser
- Check browser console for errors

### QR Code Issues

**QR code not generating:**
- Verify event creation succeeded
- Check `event.qrCode` field in database
- Ensure `generateSlug()` is working

**QR code not displaying:**
- Install `qrcode` package
- Check QR component implementation
- Verify QR code string is valid

---

## 📊 Database Schema Reference

### New Fields Summary

**Event:**
- `qrCode: String? @unique` - Auto-generated on creation
- `maxCapacity: Int?` - Set by user
- `templateId: String?` - Links to template

**Attendee:**
- `isWaitlist: Boolean @default(false)` - Auto-set when full
- `checkedIn: Boolean @default(false)` - Manual/QR check-in
- `checkedInAt: DateTime?` - Check-in timestamp

### Indexes Added

For performance:
- `Event`: `@@index([organizationId])`, `@@index([eventDate])`
- `Attendee`: `@@index([eventId])`, `@@index([contactId])`

---

## 🔐 Security Notes

### QR Code Check-in

- QR codes are unique per event
- Public endpoint requires valid QR code + phone
- Phone must match registered attendee
- Prevents unauthorized check-ins

### Export Endpoints

- All exports are protected (require authentication)
- Organization-scoped (users can only export their data)
- No sensitive data exposure

### Analytics

- All analytics are organization-scoped
- Users only see their own data
- No cross-organization data leakage

---

## 📈 Performance Considerations

### Analytics Queries

- Queries are cached (5 minutes stale time)
- GroupBy operations may be slow with large datasets
- Consider adding database indexes if needed

### Export Queries

- Large exports may take time
- Consider pagination for very large datasets
- CSV generation is efficient for typical sizes

### QR Code Generation

- QR codes generated on event creation (one-time cost)
- Display generation is client-side (fast)
- No server load for QR display

---

## ✅ Checklist

Before going to production:

- [ ] Database migration completed
- [ ] Prisma client regenerated
- [ ] Analytics dashboard tested
- [ ] Templates tested
- [ ] Exports tested
- [ ] QR check-in tested (if using)
- [ ] Capacity/waitlist tested
- [ ] Contact groups tested (if using)
- [ ] All features work in production environment
- [ ] Error handling verified
- [ ] Performance acceptable

---

## 📚 Related Documentation

- `DOCUMENTATION.md` - Complete technical documentation
- `API_REFERENCE.md` - API endpoint reference
- `USER_GUIDE_PREMIUM_FEATURES.md` - User-facing guide
- `PREMIUM_SAAS_TRANSFORMATION.md` - Feature overview

---

**Last Updated:** 2024
**Status:** Ready for Production ✅
