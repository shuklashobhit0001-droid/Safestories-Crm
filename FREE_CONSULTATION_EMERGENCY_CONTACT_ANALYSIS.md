# Free Consultation Emergency Contact Data Analysis

## Key Finding: DATA MISMATCH ISSUE

### Problem Identified:
The `emergency_contact_name` column in the bookings table is being **incorrectly populated with the `invitee_question` data** instead of actual emergency contact information.

---

## Data Analysis Results

### Statistics (30 Free Consultation Bookings):
- **Total bookings:** 30
- **Bookings with invitee_question:** 11 (36.7%)
- **Bookings with emergency_contact_name:** 14 (46.7%)
- **Bookings with BOTH fields populated:** 11 (36.7%)
- **Bookings with NEITHER field:** 16 (53.3%)

### Critical Issue:
**Whenever `invitee_question` has data, it's being copied to `emergency_contact_name`**

---

## Examples of Incorrect Data:

### Example 1 - Advaita (Booking ID: 702531)
```
invitee_question: "I am feeling extremely anxious since 2-3 days, and shallow breathing with extremely sweaty hands and inability to cry"

emergency_contact_name: "I am feeling extremely anxious since 2-3 days, and shallow breathing with extremely sweaty hands and inability to cry"
emergency_contact_relation: (empty)
emergency_contact_number: (empty)
```
❌ This is the client's concern, NOT an emergency contact name!

### Example 2 - Shivani Shinde (Booking ID: 701147)
```
invitee_question: "This is my first time of therapy I don't know how it works"

emergency_contact_name: "This is my first time of therapy I don't know how it works"
emergency_contact_relation: (empty)
emergency_contact_number: (empty)
```
❌ This is a question about therapy, NOT an emergency contact!

### Example 3 - Rupak Malik (Booking ID: 699973)
```
invitee_question: "Two things, I am too kind or innocent to face the world. I am getting double thoughts on my marriage"

emergency_contact_name: "Two things, I am too kind or innocent to face the world. I am getting double thoughts on my marriage"
emergency_contact_relation: (empty)
emergency_contact_number: (empty)
```
❌ This is personal concern, NOT an emergency contact!

### Example 4 - Mukesh Choudhary (Booking ID: 695195)
```
invitee_question: "I am depressed no body to talk relationship failure broken friendship with many of mine friends"

emergency_contact_name: "I am depressed no body to talk relationship failure broken friendship with many of mine friends"
emergency_contact_relation: (empty)
emergency_contact_number: (empty)
```
❌ This is depression description, NOT an emergency contact!

---

## Bookings with ONLY emergency_contact_name (No invitee_question):

### Example 1 - Muskan (Booking ID: 674913)
```
invitee_question: (empty)
emergency_contact_name: "Just want to generally enquire"
```

### Example 2 - Samara Grewal (Booking ID: 675586)
```
invitee_question: (empty)
emergency_contact_name: "Hi, I have been looking for a therapist for a while now. Need someone with who is very experienced and deals with - trauma, depression, anxiety, ptsd, adhd, etc"
```

### Example 3 - Ketki Chaudhari (Booking ID: 672837)
```
invitee_question: (empty)
emergency_contact_name: "Interview regarding ethical, practical and social work practices"
```

---

## Root Cause Analysis

### Likely Causes:
1. **Calendly Form Mapping Issue:** The Calendly form question field is being mapped to the wrong database column
2. **Webhook Processing Error:** The webhook that processes Calendly bookings is incorrectly assigning `invitee_question` data to `emergency_contact_name`
3. **Missing Emergency Contact Field:** Free consultation forms may not have an actual emergency contact field, so the system is using the question field as a fallback

### Expected Behavior:
- `invitee_question` should contain: Client's questions/concerns about therapy
- `emergency_contact_name` should contain: Name of emergency contact person (e.g., "John Doe", "Mother", "Spouse")
- `emergency_contact_relation` should contain: Relationship (e.g., "Father", "Friend", "Spouse")
- `emergency_contact_number` should contain: Phone number of emergency contact

### Actual Behavior:
- `invitee_question` contains: Client's questions/concerns ✅ CORRECT
- `emergency_contact_name` contains: Same as invitee_question ❌ WRONG
- `emergency_contact_relation` is always empty
- `emergency_contact_number` is always empty

---

## Impact on Admin Dashboard

### Current Display Issue:
When viewing a client who only has free consultation bookings, the admin dashboard shows:
- **Emergency Contact Name:** Client's therapy concerns/questions (completely wrong!)
- **Emergency Contact Relation:** Empty
- **Emergency Contact Number:** Empty

### Example - What Admin Sees for Advaita:
```
Emergency Contact Name: "I am feeling extremely anxious since 2-3 days, and shallow breathing with extremely sweaty hands and inability to cry"
Emergency Contact Relation: -
Emergency Contact Number: -
```

This is **completely misleading** and could be dangerous in an actual emergency situation!

---

## Recommendations

### Option 1: Fix Data Mapping (Recommended)
1. Identify where Calendly webhook processes free consultation bookings
2. Fix the field mapping to NOT copy `invitee_question` to `emergency_contact_name`
3. Add proper emergency contact fields to the free consultation Calendly form
4. Clean up existing incorrect data in the database

### Option 2: Hide Emergency Contact for Free Consultations
1. Don't display emergency contact for free consultation bookings
2. Only show emergency contact for paid therapy sessions where it's properly collected
3. Add logic to check if booking is free consultation before displaying emergency contact

### Option 3: Data Migration
1. Clear all `emergency_contact_name` values where they match `invitee_question`
2. Set them to NULL to indicate no emergency contact was collected
3. Update frontend to show "Not collected for free consultations" message

---

## Next Steps - AWAITING YOUR DECISION

Please review the findings and let me know which approach you'd like to take:

1. **Fix the Calendly webhook mapping** (requires finding webhook code)
2. **Hide emergency contact display for free consultations** (quick frontend fix)
3. **Clean up existing data** (database migration script)
4. **Combination of above** (comprehensive fix)

What would you like me to proceed with?
