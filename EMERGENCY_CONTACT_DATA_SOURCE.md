# Emergency Contact Data Source - Admin Dashboard

## Overview
This document explains where emergency contact information is fetched from in the admin dashboard.

---

## Data Source: `bookings` Table

Emergency contact information is stored directly in the `bookings` table as separate columns:

### Database Columns:
- `emergency_contact_name` (TEXT)
- `emergency_contact_relation` (TEXT)  
- `emergency_contact_number` (TEXT)
- `emergency_contact_email` (TEXT) - if exists

---

## Data Flow

### 1. Initial Data Entry
Emergency contact data is collected when a client books an appointment through Calendly. The data is stored in the `bookings` table at the time of booking creation.

### 2. API Endpoint: `/api/client-details`
**Location:** `api/index.ts` (lines 1778-1900)

**How it works:**
```typescript
// Query fetches emergency contact directly from bookings table
SELECT 
  b.emergency_contact_name,
  b.emergency_contact_relation,
  b.emergency_contact_number,
  ...
FROM bookings b
WHERE invitee_email = $1 OR invitee_phone = $2
```

**Key Logic:**
- Accepts client email or phone as query parameters
- Fetches ALL appointments for that client
- Returns emergency contact fields from each booking record

### 3. Frontend Display Logic

#### In `components/AllTherapists.tsx` (lines 536-545):
```typescript
// Finds first appointment with emergency contact data
const aptWithEmergency = data.appointments.find(
  (apt: any) => apt.emergency_contact_name
) || data.appointments[0];

// Sets emergency contact in client state
setSelectedClient((prev: any) => ({
  ...prev,
  emergency_contact_name: aptWithEmergency.emergency_contact_name,
  emergency_contact_relation: aptWithEmergency.emergency_contact_relation,
  emergency_contact_number: aptWithEmergency.emergency_contact_number,
  emergency_contact_email: aptWithEmergency.emergency_contact_email
}));
```

**Logic:**
1. Searches through client's appointments
2. Finds the FIRST appointment that has `emergency_contact_name` populated
3. If no appointment has emergency contact, uses the first appointment
4. Displays emergency contact in the client detail view

#### Display Locations:
1. **All Therapists → Assigned Clients → Client Details** (`AllTherapists.tsx` lines 863-877)
2. **Therapist Dashboard → Client Details** (`TherapistDashboard.tsx` lines 1965-1979)
3. **SOS Documentation View** (`SOSDocumentationView.tsx`)

---

## Important Notes

### Multiple Bookings Scenario:
- A client may have multiple bookings with different emergency contacts
- The system shows emergency contact from the FIRST booking that has this data
- If emergency contact changes between bookings, only the first one is displayed

### Data Consistency:
- Emergency contact is stored per booking, not per client
- Same client can theoretically have different emergency contacts in different bookings
- Current logic assumes emergency contact remains consistent across bookings

### Potential Issues:
1. **Outdated Information:** If a client updates emergency contact in a newer booking, the old one might still display (if it appears first in the array)
2. **Missing Data:** If no booking has emergency contact, the field will be empty
3. **No Centralized Client Profile:** Emergency contact is not stored in a separate clients table

---

## Related Files

### API Files:
- `api/index.ts` - `/api/client-details` endpoint (lines 1778-1900)
- `api/client-profile.ts` - Client profile API (uses emergency contact)
- `api/sos-documentation.ts` - SOS documentation (uses emergency contact)

### Frontend Components:
- `components/AllTherapists.tsx` - Admin view (lines 536-545, 863-877)
- `components/TherapistDashboard.tsx` - Therapist view (lines 558-568, 1965-1979)
- `components/SOSDocumentationView.tsx` - SOS view

### Database:
- Table: `bookings`
- Columns: `emergency_contact_name`, `emergency_contact_relation`, `emergency_contact_number`, `emergency_contact_email`

---

## Summary

**Emergency contact in admin dashboard is fetched from:**
1. **Database Table:** `bookings` table
2. **API Endpoint:** `/api/client-details`
3. **Selection Logic:** First appointment with emergency contact data
4. **Display:** Client detail views in admin and therapist dashboards

The data originates from the booking form (Calendly) and is stored per booking, not per client.
