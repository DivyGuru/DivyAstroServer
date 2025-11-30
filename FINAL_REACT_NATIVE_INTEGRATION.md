# Final React Native Integration - Complete Guide

**One document to integrate everything into DivyGuru App**

---

## ✅ What's Already Done

You've already implemented:
- ✅ Basic API calls (`GET /predictions`, `POST /windows/:id/generate`)
- ✅ Caching (1-hour cache with AsyncStorage)
- ✅ Error handling
- ✅ Chart data integration (Swiss Ephemeris)
- ✅ `getOrGeneratePrediction()` flow (GET first, POST if 404)
- ✅ **Remedies support** - Backend now returns remedies with predictions

---

## 🎯 What You Need to Add Now

**3 new endpoints integration:**
1. `POST /users/ensure` - User management
2. `POST /windows` - Window creation
3. `GET /users/:firebaseUid/windows` - Window lookup

**Goal**: Replace hardcoded `windowId = 2` with dynamic window creation.

---

## 📋 Step-by-Step Implementation

### Step 1: Add User Management Function

**File**: `astroDbApi.ts` (or your API service file)

**Add this function**:

```typescript
/**
 * Get or create user from Firebase UID
 * Call this immediately after Firebase authentication
 * 
 * @returns { id, firebase_uid, email, phone }
 */
export async function ensureUser(
  firebaseUid: string,
  email?: string,
  phone?: string
): Promise<{ id: number; firebase_uid: string; email?: string; phone?: string }> {
  const response = await fetch(`${API_BASE_URL}/users/ensure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firebaseUid,
      email: email || null,
      phone: phone || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to ensure user');
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Failed to ensure user');
  }

  return data.user;
}
```

---

### Step 2: Update `getTodayWindowId()` Function

**File**: `astroDbApi.ts`

**Replace the current hardcoded version** with this:

```typescript
/**
 * Get or create today's prediction window
 * 
 * @param firebaseUid - From Firebase auth
 * @param userId - From ensureUser() response
 * @param chartId - From Swiss Ephemeris
 * @returns windowId
 */
export async function getTodayWindowId(
  firebaseUid: string,
  userId: number,
  chartId: number
): Promise<number> {
  // Step 1: Check if today's window exists
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  try {
    const windowsResponse = await fetch(
      `${API_BASE_URL}/users/${encodeURIComponent(firebaseUid)}/windows?scope=daily&date=${today}`
    );

    if (windowsResponse.ok) {
      const windowsData = await windowsResponse.json();
      
      if (windowsData.ok && windowsData.windows?.length > 0) {
        // Window exists, return its ID
        return windowsData.windows[0].id;
      }
    }
  } catch (error) {
    // If user not found (404), continue to create window
    console.log('Window lookup failed, will create new:', error);
  }

  // Step 2: Window doesn't exist, create it
  const startAt = new Date();
  startAt.setHours(0, 0, 0, 0);
  const endAt = new Date(startAt);
  endAt.setHours(23, 59, 59, 999);

  const createResponse = await fetch(`${API_BASE_URL}/windows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      chart_id: chartId,
      scope: 'daily',
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      timezone: 'Asia/Kolkata', // Adjust if needed
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(error.error || 'Failed to create window');
  }

  const createData = await createResponse.json();
  
  if (!createData.ok) {
    throw new Error(createData.error || 'Failed to create window');
  }

  return createData.window.id;
}
```

---

### Step 3: Update Authentication Flow

**File**: Your authentication context/provider (e.g., `AuthContext.tsx`)

**After Firebase authentication succeeds**, add this:

```typescript
import { ensureUser } from './services/astroDbApi'; // Adjust path

// In your login/signup success handler:
async function handleAuthSuccess(firebaseUser: FirebaseUser) {
  try {
    // Ensure user exists in backend
    const user = await ensureUser(
      firebaseUser.uid,
      firebaseUser.email || undefined,
      firebaseUser.phoneNumber || undefined
    );

    // Store in your app state/context
    setUserContext({
      firebaseUid: firebaseUser.uid,
      userId: user.id, // ⭐ IMPORTANT: Store this
      email: user.email,
      phone: user.phone,
    });
  } catch (error) {
    console.error('Failed to ensure user:', error);
    // Handle error (show message, retry, etc.)
  }
}
```

---

### Step 4: Update Prediction Generation Flow

**File**: `astroDbApi.ts` or wherever you call `getTodayWindowId()`

**Update your prediction generation function**:

```typescript
/**
 * Complete flow: Chart → Window → Prediction
 */
export async function getChartAndGeneratePrediction(
  firebaseUid: string,
  userId: number, // ⭐ From ensureUser() - stored in app state
  birthDetails: BirthDetails // Your birth details type
): Promise<Prediction> {
  // Step 1: Get chart from Swiss Ephemeris
  const chartData = await getChartFromSwissEphemeris(birthDetails);
  const chartId = chartData.chartId; // Adjust based on your API

  // Step 2: Get or create today's window (⭐ NEW - replaces hardcoded windowId)
  const windowId = await getTodayWindowId(firebaseUid, userId, chartId);

  // Step 3: Get or generate prediction (already implemented)
  const prediction = await getOrGeneratePrediction(windowId, 'en');

  return prediction;
}
```

---

### Step 5: Update Your Screen Component

**File**: `AiAstrologerScreen.tsx` (or your prediction screen)

**Update the component**:

```typescript
import { ensureUser, getChartAndGeneratePrediction } from './services/astroDbApi';
import { useAuth } from './contexts/AuthContext'; // Your auth context

const AiAstrologerScreen = () => {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  
  // ⭐ Get from your auth context
  const { firebaseUid, userId } = useAuth();

  const handleGetPrediction = async () => {
    try {
      setLoading(true);

      // Ensure we have userId
      let currentUserId = userId;
      if (!currentUserId && firebaseUid) {
        // If userId not stored, ensure user first
        const user = await ensureUser(firebaseUid);
        currentUserId = user.id;
        // Update context with userId
      }

      if (!currentUserId || !firebaseUid) {
        throw new Error('User not authenticated');
      }

      // Get birth details (from your form/state)
      const birthDetails = getBirthDetails(); // Your function

      // ⭐ NEW: Use dynamic window creation
      const pred = await getChartAndGeneratePrediction(
        firebaseUid,
        currentUserId,
        birthDetails
      );

      setPrediction(pred);
    } catch (error) {
      console.error('Failed to get prediction:', error);
      // Show error to user
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
};
```

---

## 🔄 Complete Flow (After Integration)

```
1. User authenticates via Firebase
   ↓
2. Call ensureUser(firebaseUid, email, phone)
   → Get userId
   → Store in app state/context
   ↓
3. User requests prediction
   ↓
4. Get chart from Swiss Ephemeris
   → Get chartId
   ↓
5. Call getTodayWindowId(firebaseUid, userId, chartId)
   → GET /users/:firebaseUid/windows?scope=daily&date=today
   → If exists: return windowId
   → If not: POST /windows → create → return windowId
   ↓
6. Call getOrGeneratePrediction(windowId) [Already implemented]
   → GET /predictions/:windowId
   → If 404: POST /windows/:windowId/generate
   ↓
7. Display prediction + remedies
```

---

## ✅ Implementation Checklist

Copy this checklist and check off as you go:

- [ ] **Step 1**: Add `ensureUser()` function to `astroDbApi.ts`
- [ ] **Step 2**: Replace hardcoded `getTodayWindowId()` with dynamic version
- [ ] **Step 3**: Update authentication flow to call `ensureUser()` and store `userId`
- [ ] **Step 4**: Update `getChartAndGeneratePrediction()` to use new `getTodayWindowId()`
- [ ] **Step 5**: Update screen component to use new flow
- [ ] **Step 6**: Remove any hardcoded `windowId = 2` references
- [ ] **Step 7**: Test user creation flow
- [ ] **Step 8**: Test window creation flow
- [ ] **Step 9**: Test complete prediction flow
- [ ] **Step 10**: Test error handling (network errors, 404s, etc.)
- [ ] **Step 11**: Update TypeScript types to include `remedies` array
- [ ] **Step 12**: Display remedies in UI (if not already done)

---

## 🆕 Remedies Support (NEW)

**Backend now automatically links remedies to predictions!**

### API Response Structure

Both `GET /predictions/:windowId` and `POST /windows/:windowId/generate` now return:

```typescript
{
  ok: true,
  prediction: { ... },
  appliedRules: [ ... ],
  remedies: [                    // ⭐ NEW
    {
      id: number,
      prediction_id: number,
      remedy_id: number,
      priority: number,
      name: string,              // e.g., "[CAREER_CHANGE_CONFUSION] Abundance mindset reflection"
      type: string,             // "mantra" | "meditation" | "donation" | "feeding_beings" | "fast" | "puja"
      description: string,
      target_themes: string[],   // e.g., ["career", "general"]
      min_duration_days: number | null,
      recommended_frequency: string | null,  // e.g., "daily", "weekly"
      safety_notes: string | null
    }
  ]
}
```

### Update TypeScript Types

**File**: `astroDbApi.ts` (or your types file)

**Add this type**:

```typescript
export interface Remedy {
  id: number;
  prediction_id: number;
  remedy_id: number;
  priority: number;
  name: string;
  type: 'mantra' | 'meditation' | 'donation' | 'feeding_beings' | 'fast' | 'puja';
  description: string;
  target_planets?: number[];
  target_themes?: string[];
  min_duration_days?: number | null;
  recommended_frequency?: string | null;
  safety_notes?: string | null;
}

export interface PredictionResponse {
  ok: boolean;
  prediction: Prediction;
  appliedRules: AppliedRule[];
  remedies: Remedy[];  // ⭐ Add this
}
```

### Update `getOrGeneratePrediction()` Function

**File**: `astroDbApi.ts`

**Update the return type**:

```typescript
export async function getOrGeneratePrediction(
  windowId: number,
  language: string = 'en'
): Promise<PredictionResponse> {  // ⭐ Update return type
  // ... existing code ...
  
  const data = await response.json();
  
  // Now data.remedies is available
  return {
    ok: data.ok,
    prediction: data.prediction,
    appliedRules: data.appliedRules || [],
    remedies: data.remedies || [],  // ⭐ Add this
  };
}
```

### Display Remedies in UI

**Example component**:

```typescript
import { Remedy } from './services/astroDbApi';

const RemediesList = ({ remedies }: { remedies: Remedy[] }) => {
  // Group by type
  const remediesByType = remedies.reduce((acc, remedy) => {
    const type = remedy.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(remedy);
    return acc;
  }, {} as Record<string, Remedy[]>);

  return (
    <View>
      <Text style={styles.title}>Recommended Remedies</Text>
      
      {Object.entries(remediesByType).map(([type, typeRemedies]) => (
        <View key={type} style={styles.typeSection}>
          <Text style={styles.typeTitle}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
          
          {typeRemedies.map((remedy) => (
            <View key={remedy.id} style={styles.remedyCard}>
              <Text style={styles.remedyName}>{remedy.name}</Text>
              <Text style={styles.remedyDescription}>{remedy.description}</Text>
              
              {remedy.recommended_frequency && (
                <Text style={styles.frequency}>
                  Frequency: {remedy.recommended_frequency}
                </Text>
              )}
              
              {remedy.min_duration_days && (
                <Text style={styles.duration}>
                  Duration: {remedy.min_duration_days} days
                </Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};
```

### Usage in Screen Component

```typescript
const AiAstrologerScreen = () => {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [remedies, setRemedies] = useState<Remedy[]>([]);  // ⭐ Add state
  
  const handleGetPrediction = async () => {
    const result = await getOrGeneratePrediction(windowId);
    setPrediction(result.prediction);
    setRemedies(result.remedies);  // ⭐ Set remedies
  };
  
  return (
    <ScrollView>
      {/* Prediction display */}
      {prediction && <PredictionCard prediction={prediction} />}
      
      {/* Remedies display */}
      {remedies.length > 0 && <RemediesList remedies={remedies} />}
    </ScrollView>
  );
};
```

### Notes

- **Remedies are automatically linked** based on applied rules' `point_code`
- **Priority**: Higher score rules = higher priority remedies
- **Limit**: Max 50 remedies per prediction (to avoid overwhelming users)
- **Filtering**: Only active remedies are returned

---

## 🧪 Quick Test

After implementation, test with this:

```typescript
// Test 1: User creation
const user = await ensureUser('test-uid-123', 'test@example.com');
console.log('✅ User ID:', user.id);

// Test 2: Window creation
const windowId = await getTodayWindowId('test-uid-123', user.id, 1);
console.log('✅ Window ID:', windowId);

// Test 3: Complete flow
const prediction = await getChartAndGeneratePrediction(
  'test-uid-123',
  user.id,
  birthDetails
);
console.log('✅ Prediction:', prediction.short_summary);
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "User not found" error
**Fix**: Make sure you call `ensureUser()` after Firebase auth and before creating windows.

### Issue 2: "Failed to create window"
**Fix**: Verify `userId` and `chartId` are valid numbers, not strings.

### Issue 3: Window already exists but returns 404
**Fix**: Check Firebase UID encoding: use `encodeURIComponent(firebaseUid)` in URL.

### Issue 4: userId is undefined
**Fix**: Store `userId` in app state/context after `ensureUser()` call.

---

## 📝 Code Changes Summary

**Files to modify:**
1. `astroDbApi.ts` - Add `ensureUser()`, update `getTodayWindowId()`, update `getChartAndGeneratePrediction()`
2. `AuthContext.tsx` (or similar) - Call `ensureUser()` after Firebase auth
3. `AiAstrologerScreen.tsx` (or similar) - Use new flow

**Lines to remove:**
- Any hardcoded `const windowId = 2;`
- Any comments like `// TODO: Replace with dynamic window creation`

---

## 🎯 What This Achieves

✅ **Dynamic window creation** - No more hardcoded window IDs  
✅ **User management** - Firebase UID → Backend user mapping  
✅ **Production-ready** - Full flow from auth to prediction  
✅ **Scalable** - Works for multiple users, multiple windows  
✅ **Error-resilient** - Handles missing windows, network errors, etc.

---

## 📚 Reference

If you need more details:
- **API Details**: See `API_DOCUMENTATION.md` (already implemented)
- **Workflow Details**: See `USE_CASE_FLOWS.md`
- **Endpoint Details**: See `FUTURE_ENDPOINTS_IMPLEMENTED.md`

---

## 🚀 You're Done!

Once you complete the checklist, your React Native app will be fully integrated with the production-ready backend. All endpoints are live and tested.

**Next**: Test with real Firebase users and verify the complete flow works end-to-end.

