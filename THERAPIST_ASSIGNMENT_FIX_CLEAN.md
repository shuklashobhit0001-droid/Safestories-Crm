# Therapist Assignment Fix - Clean Implementation

## Problem Solved
Fixed the persistent "Unassigned" therapist issue in CRM pipeline's "booked first session" stage.

## Root Cause
The original therapist lookup used AND logic requiring both phone AND email matches, but many leads only have phone numbers, causing lookups to fail.

## Solution Implemented

### 1. Enhanced Backend Logic (server/index.ts & api/index.ts)
- **Fixed OR Logic**: Phone OR email matching (not AND)
- **3-Tier Fallback Strategy**:
  - Strategy 1: Exact name match between booking host and therapist
  - Strategy 2: Partial name match (first name matching)
  - Strategy 3: Direct user lookup (fallback)
- **Comprehensive Logging**: Detailed logs for debugging assignment attempts
- **Better Error Handling**: Graceful fallbacks when lookups fail

### 2. Manual Assignment UI (TherapistAssignmentDropdown.tsx)
- **Dropdown Component**: Shows "Assign Therapist" button when therapist is unassigned
- **Therapist List**: Fetches all available therapists from `/api/therapists`
- **Real-time Updates**: Immediate UI update after assignment
- **Error Handling**: Proper loading states and error management

### 3. New API Endpoints
- **`GET /api/therapists`**: Returns list of all therapist users
- **`PATCH /api/leads/:id/assign-therapist`**: Manual therapist assignment

### 4. Updated CRM Pipeline (PipelineContent.tsx)
- **Conditional Display**: Shows therapist name if assigned, assignment button if not
- **Integration**: Seamless integration with existing pipeline UI
- **Permissions**: Only shows assignment option to users who can act on leads

## Key Improvements

### Auto-Assignment Logic
```typescript
// OLD: Required both phone AND email
WHERE (phone_match AND email_match)

// NEW: Requires phone OR email
WHERE (phone_match OR email_match)
```

### Fallback Strategies
1. **Exact Match**: `booking_host_name = therapist.name`
2. **Partial Match**: First name matching with ILIKE
3. **Direct Match**: Direct user table lookup

### Manual Assignment
- Shows when auto-assignment fails
- Dropdown with all available therapists
- Immediate UI feedback
- Proper error handling

## Files Modified

### Backend
- `server/index.ts` - Enhanced therapist lookup logic
- `api/index.ts` - Same enhancements for Vercel deployment

### Frontend
- `src/crm/components/PipelineContent.tsx` - Added manual assignment UI
- `src/crm/components/TherapistAssignmentDropdown.tsx` - New component

## Expected Results
- **Auto-assignment success rate**: Significantly improved
- **Manual assignment**: Available as backup
- **No more permanently unassigned**: Every lead can get a therapist
- **Better debugging**: Detailed logs show why assignments succeed/fail

## Safety Measures
- **Non-breaking**: Only affects therapist assignment, no other functions
- **Backward compatible**: Existing functionality unchanged
- **Graceful fallbacks**: Multiple strategies prevent total failure
- **Permission-based**: Only authorized users can assign therapists

## Testing Recommendations
1. Move a lead to "booked-first-session" stage
2. Check console logs for assignment attempts
3. If auto-assignment fails, verify manual assignment button appears
4. Test manual assignment with dropdown
5. Verify therapist name displays correctly after assignment