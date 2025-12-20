# Final React Native Integration - Complete Guide

**One document to integrate everything into DivyGuru App**

---

## 🔌 Important: How App Connects to Database

**⚠️ CRITICAL UNDERSTANDING:**

1. **App does NOT connect directly to PostgreSQL database**
   - App connects to **REST API server** (Node.js/Express backend)
   - Backend server handles all database operations
   - App only makes HTTP API calls

2. **Connection Flow:**
   ```
   React Native App
      ↓ (HTTP/HTTPS)
   Express API Server (Node.js)
      ↓ (PostgreSQL connection pool)
   PostgreSQL Database
   ```

3. **What App Needs:**
   - **API Base URL** (e.g., `http://localhost:3000` for dev, `https://api.divyguru.com` for production)
   - **No database credentials** needed in app
   - **No direct SQL queries** from app

4. **Complete Data Flow:**
   ```
   User Input (Birth Details)
      ↓
   Swiss Ephemeris Service (Chart Calculation)
      ↓
   Chart Data (planets, houses, transits)
      ↓
   API Call: POST /windows (with chart_data)
      ↓
   Backend creates window + astro snapshot in DB
      ↓
   API Call: GET /predictions/:windowId
      ↓
   Backend evaluates rules from DB, generates prediction
      ↓
   App receives prediction + remedies + timing windows
   ```

---

## ✅ What's Already Done

You've already implemented:
- ✅ Basic API calls (`GET /predictions`, `POST /windows/:id/generate`)
- ✅ Caching (1-hour cache with AsyncStorage)
- ✅ Error handling
- ✅ Chart data integration (Swiss Ephemeris)
- ✅ `getOrGeneratePrediction()` flow (GET first, POST if 404)
- ✅ **Remedies support** - Backend now returns remedies with predictions
- ✅ **Timing Windows** - Month-year windows for marriage, career, business, finance, health

---

## 🎯 What You Need to Add Now

**Complete endpoint integration:**
1. `POST /users/ensure` - User management
2. `POST /windows` - Window creation (with chart_data support)
3. `GET /users/:firebaseUid/windows` - Window lookup
4. `POST /windows/:windowId/astro-snapshot` - Update astro snapshot
5. **Timing Windows** - Display month-year ranges from prediction response

**Goal**: Replace hardcoded `windowId = 2` with dynamic window creation and display timing windows.

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

**Base URL Configuration**:

```typescript
// In your config file (e.g., config.ts or constants.ts)
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'  // Development (use your actual dev server URL)
  : 'https://your-production-api.com';  // Production (replace with actual production URL)

// ⚠️ IMPORTANT: For Android emulator, use 'http://10.0.2.2:3000' instead of 'localhost'
// For iOS simulator, 'http://localhost:3000' works fine
// For physical devices, use your computer's local IP: 'http://192.168.x.x:3000'
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
 * @param chartData - Optional: Swiss Ephemeris chart data (planets, houses, etc.)
 * @returns windowId
 */
export async function getTodayWindowId(
  firebaseUid: string,
  userId: number,
  chartId: number,
  chartData?: any // Swiss Ephemeris chart data
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
        const existingWindowId = windowsData.windows[0].id;
        
        // If chart_data provided and window exists, update snapshot
        if (chartData) {
          try {
            await fetch(`${API_BASE_URL}/windows/${existingWindowId}/astro-snapshot`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chart_data: chartData }),
            });
          } catch (snapshotErr) {
            console.log('Failed to update snapshot (non-critical):', snapshotErr);
          }
        }
        
        return existingWindowId;
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
      chart_data: chartData || null, // ⭐ NEW: Include chart_data if available
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
 * Birth Details Type (define this in your types file)
 */
export interface BirthDetails {
  date: string;        // ISO date string: "1990-05-15"
  time: string;        // Time string: "14:30" (24-hour format)
  timezone: string;    // Timezone: "Asia/Kolkata" or offset like "+05:30"
  latitude: number;    // Latitude: 28.6139
  longitude: number;   // Longitude: 77.2090
  place?: string;      // Optional: "New Delhi, India"
}

/**
 * Swiss Ephemeris Chart Data Type (adjust based on your Swiss Ephemeris library)
 */
export interface ChartData {
  chartId?: number;    // If your Swiss Ephemeris service returns a chart ID
  planets: Array<{
    name: string;      // "Sun", "Moon", "Mars", etc.
    house: number;     // 1-12
    sign: string;      // "Aries", "Taurus", etc.
    longitude: number; // Degree position
    nakshatra?: string; // Nakshatra name
    pada?: number;     // 1-4
    isRetrograde?: boolean;
    strength?: number;
  }>;
  houses?: Array<{
    house: number;
    sign: string;
    lord: string;
  }>;
  lagna?: {
    sign: string;
    degree: number;
  };
  moon?: {
    sign: string;
    nakshatra: string;
  };
  transits?: Array<{
    planet: string;
    sign: string;
    house: number;
  }>;
  yogas?: Array<{
    name: string;
    type: string;
  }>;
  doshas?: Array<{
    name: string;
    severity: string;
  }>;
}

/**
 * Complete flow: Birth Details → Chart → Window → Prediction
 * 
 * This function:
 * 1. Takes user's birth details
 * 2. Calls Swiss Ephemeris to calculate chart
 * 3. Creates/updates prediction window in backend DB
 * 4. Gets prediction from backend DB
 */
export async function getChartAndGeneratePrediction(
  firebaseUid: string,
  userId: number, // ⭐ From ensureUser() - stored in app state
  birthDetails: BirthDetails // User's birth details from form
): Promise<PredictionResponse> {
  // Step 1: Get chart from Swiss Ephemeris
  // ⚠️ IMPORTANT: You need to implement this function based on your Swiss Ephemeris service
  // This could be:
  // - A local library (swisseph, jyotish.js, etc.)
  // - An external API call
  // - A native module
  const chartData = await getChartFromSwissEphemeris(birthDetails);
  
  // Extract chartId (if your service provides one, otherwise use a hash or timestamp)
  const chartId = chartData.chartId || generateChartId(birthDetails);

  // Step 2: Get or create today's window (⭐ NEW - replaces hardcoded windowId)
  // ⭐ Pass chartData so snapshot is created/updated automatically in backend DB
  const windowId = await getTodayWindowId(firebaseUid, userId, chartId, chartData);

  // Step 3: Get or generate prediction from backend DB
  // Backend will:
  // - Load astro snapshot from DB
  // - Evaluate rules from DB
  // - Generate prediction
  // - Return prediction + remedies + timing windows
  const predictionResponse = await getOrGeneratePrediction(windowId, 'en');

  return predictionResponse;
}

/**
 * Helper: Generate a stable chart ID from birth details
 * (Use this if your Swiss Ephemeris service doesn't return chartId)
 */
function generateChartId(birthDetails: BirthDetails): number {
  // Simple hash function (you can use a better one)
  const str = `${birthDetails.date}-${birthDetails.time}-${birthDetails.latitude}-${birthDetails.longitude}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Example: Swiss Ephemeris integration
 * Replace this with your actual Swiss Ephemeris implementation
 */
async function getChartFromSwissEphemeris(birthDetails: BirthDetails): Promise<ChartData> {
  // Option 1: If using a JavaScript library
  // import { calculateChart } from 'swisseph-js';
  // return calculateChart(birthDetails);
  
  // Option 2: If using an external API
  // const response = await fetch('https://your-swiss-ephemeris-api.com/calculate', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(birthDetails),
  // });
  // return await response.json();
  
  // Option 3: If using a native module
  // import { NativeModules } from 'react-native';
  // return NativeModules.SwissEphemeris.calculateChart(birthDetails);
  
  // For now, return a placeholder (you must implement this)
  throw new Error('getChartFromSwissEphemeris() must be implemented with your Swiss Ephemeris service');
}
```

---

### Step 5: Update Your Screen Component

**File**: `AiAstrologerScreen.tsx` (or your prediction screen)

**Update the component**:

```typescript
import { ensureUser, getChartAndGeneratePrediction, BirthDetails } from './services/astroDbApi';
import { useAuth } from './contexts/AuthContext'; // Your auth context

const AiAstrologerScreen = () => {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [timingWindows, setTimingWindows] = useState<any>({});
  const [loading, setLoading] = useState(false);
  
  // ⭐ Get from your auth context
  const { firebaseUid, userId } = useAuth();

  // ⭐ Birth details form state
  const [birthDetails, setBirthDetails] = useState<BirthDetails>({
    date: '',
    time: '',
    timezone: 'Asia/Kolkata',
    latitude: 0,
    longitude: 0,
    place: '',
  });

  const handleGetPrediction = async () => {
    try {
      setLoading(true);

      // Validate birth details
      if (!birthDetails.date || !birthDetails.time || !birthDetails.latitude || !birthDetails.longitude) {
        throw new Error('Please fill all birth details');
      }

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

      // ⭐ Complete flow: Birth Details → Chart → Window → Prediction
      // This function will:
      // 1. Calculate chart from birth details (Swiss Ephemeris)
      // 2. Create/update window in backend DB
      // 3. Get prediction from backend DB
      const result = await getChartAndGeneratePrediction(
        firebaseUid,
        currentUserId,
        birthDetails
      );

      setPrediction(result.prediction);
      setRemedies(result.remedies || []);
      setTimingWindows({
        marriage: result.marriageTimingWindows,
        career: result.careerTimingWindows,
        business: result.businessTimingWindows,
        finance: result.financeTimingWindows,
        health: result.healthTimingWindows,
      });
    } catch (error) {
      console.error('Failed to get prediction:', error);
      // Show error to user (use Alert, Toast, etc.)
      Alert.alert('Error', error.message || 'Failed to get prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      {/* Birth Details Form */}
      <View style={styles.form}>
        <TextInput
          placeholder="Date (YYYY-MM-DD)"
          value={birthDetails.date}
          onChangeText={(text) => setBirthDetails({ ...birthDetails, date: text })}
        />
        <TextInput
          placeholder="Time (HH:MM)"
          value={birthDetails.time}
          onChangeText={(text) => setBirthDetails({ ...birthDetails, time: text })}
        />
        <TextInput
          placeholder="Latitude"
          keyboardType="numeric"
          value={String(birthDetails.latitude)}
          onChangeText={(text) => setBirthDetails({ ...birthDetails, latitude: parseFloat(text) || 0 })}
        />
        <TextInput
          placeholder="Longitude"
          keyboardType="numeric"
          value={String(birthDetails.longitude)}
          onChangeText={(text) => setBirthDetails({ ...birthDetails, longitude: parseFloat(text) || 0 })}
        />
        <Button title="Get Prediction" onPress={handleGetPrediction} disabled={loading} />
      </View>

      {/* Prediction Display */}
      {loading && <Text>Loading prediction...</Text>}
      {prediction && <PredictionCard prediction={prediction} />}
      
      {/* Timing Windows */}
      {timingWindows.marriage?.ok && (
        <TimingWindowCard title="Marriage Timing" windows={timingWindows.marriage} />
      )}
      
      {/* Remedies */}
      {remedies.length > 0 && <RemediesList remedies={remedies} />}
    </ScrollView>
  );
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
   → Get chartId + chartData (planets, houses, transits, etc.)
   ↓
5. Call getTodayWindowId(firebaseUid, userId, chartId, chartData)
   → GET /users/:firebaseUid/windows?scope=daily&date=today
   → If exists: 
      - Update snapshot via POST /windows/:windowId/astro-snapshot (if chartData provided)
      - Return windowId
   → If not: 
      - POST /windows (with chart_data) → create window + snapshot → return windowId
   ↓
6. Call getOrGeneratePrediction(windowId) [Already implemented]
   → GET /predictions/:windowId?lang=en
   → If 404 or empty: POST /windows/:windowId/generate
   → Response includes: prediction, appliedRules, remedies, timingWindows
   ↓
7. Display prediction + remedies + timing windows
```

---

## ✅ Implementation Checklist

Copy this checklist and check off as you go:

- [ ] **Step 1**: Add `ensureUser()` function to `astroDbApi.ts`
- [ ] **Step 2**: Replace hardcoded `getTodayWindowId()` with dynamic version (include chartData parameter)
- [ ] **Step 3**: Update authentication flow to call `ensureUser()` and store `userId`
- [ ] **Step 4**: Update `getChartAndGeneratePrediction()` to pass `chartData` to `getTodayWindowId()`
- [ ] **Step 5**: Update screen component to use new flow
- [ ] **Step 6**: Remove any hardcoded `windowId = 2` references
- [ ] **Step 7**: Update TypeScript types to include `remedies` and `timingWindows`
- [ ] **Step 8**: Update `getOrGeneratePrediction()` return type to include timing windows
- [ ] **Step 9**: Create `TimingWindowCard` component to display month-year ranges
- [ ] **Step 10**: Display timing windows in UI (marriage, career, business, finance, health)
- [ ] **Step 11**: Test user creation flow
- [ ] **Step 12**: Test window creation flow (with and without chart_data)
- [ ] **Step 13**: Test astro snapshot update flow
- [ ] **Step 14**: Test complete prediction flow
- [ ] **Step 15**: Test timing windows appear in response
- [ ] **Step 16**: Test error handling (network errors, 404s, etc.)
- [ ] **Step 17**: Display remedies in UI (if not already done)

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
  ],
  // ⭐ NEW: Timing Windows (month-year ranges)
  marriageTimingWindows: {
    ok: boolean,
    point_code: 'RELATIONSHIP_MARRIAGE_TIMING',
    primary_window: string | null,      // e.g., "Feb 2026 to Jun 2026"
    secondary_window: string | null,
    additional_window: string | null,
    narrative_hi: string | null,        // English narrative
    windows: Array<{ range_text: string, avgScore: number, monthCount: number }>
  } | null,
  careerTimingWindows: {
    ok: boolean,
    context: 'career',
    windowsByPoint: {
      [pointCode: string]: {
        ok: boolean,
        point_code: string,
        primary_window: string | null,
        secondary_window: string | null,
        additional_window: string | null,
        narrative_hi: string | null,
        windows: Array<{ range_text: string, avgScore: number, monthCount: number }>
      }
    }
  } | null,
  businessTimingWindows: { ... } | null,  // Same structure as careerTimingWindows
  financeTimingWindows: { ... } | null,   // Same structure as careerTimingWindows
  healthTimingWindows: { ... } | null,    // Same structure as careerTimingWindows
}
```

### Update TypeScript Types

**File**: `astroDbApi.ts` (or your types file)

**Add these types**:

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

export interface TimingWindow {
  range_text: string;      // e.g., "Feb 2026 to Jun 2026"
  avgScore: number;
  monthCount: number;
}

export interface TimingWindowsByPoint {
  ok: boolean;
  point_code: string;
  primary_window: string | null;
  secondary_window: string | null;
  additional_window: string | null;
  narrative_hi: string | null;
  windows: TimingWindow[];
}

export interface MarriageTimingWindows {
  ok: boolean;
  point_code: 'RELATIONSHIP_MARRIAGE_TIMING';
  primary_window: string | null;
  secondary_window: string | null;
  additional_window: string | null;
  narrative_hi: string | null;
  windows: TimingWindow[];
  source: string;
}

export interface CareerTimingWindows {
  ok: boolean;
  context: 'career';
  windowsByPoint: {
    [pointCode: string]: TimingWindowsByPoint;
  };
}

export interface BusinessTimingWindows {
  ok: boolean;
  context: 'business';
  windowsByPoint: {
    [pointCode: string]: TimingWindowsByPoint;
  };
}

export interface FinanceTimingWindows {
  ok: boolean;
  context: 'finance';
  windowsByPoint: {
    [pointCode: string]: TimingWindowsByPoint;
  };
}

export interface HealthTimingWindows {
  ok: boolean;
  context: 'health';
  windowsByPoint: {
    [pointCode: string]: TimingWindowsByPoint;
  };
}

export interface PredictionResponse {
  ok: boolean;
  prediction: Prediction;
  appliedRules: AppliedRule[];
  remedies: Remedy[];  // ⭐ Add this
  // ⭐ NEW: Timing Windows
  marriageTimingWindows: MarriageTimingWindows | null;
  careerTimingWindows: CareerTimingWindows | null;
  businessTimingWindows: BusinessTimingWindows | null;
  financeTimingWindows: FinanceTimingWindows | null;
  healthTimingWindows: HealthTimingWindows | null;
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
  
  // Now data includes remedies and timing windows
  return {
    ok: data.ok,
    prediction: data.prediction,
    appliedRules: data.appliedRules || [],
    remedies: data.remedies || [],  // ⭐ Add this
    // ⭐ NEW: Timing Windows
    marriageTimingWindows: data.marriageTimingWindows || null,
    careerTimingWindows: data.careerTimingWindows || null,
    businessTimingWindows: data.businessTimingWindows || null,
    financeTimingWindows: data.financeTimingWindows || null,
    healthTimingWindows: data.healthTimingWindows || null,
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
  const [timingWindows, setTimingWindows] = useState<{
    marriage?: MarriageTimingWindows | null;
    career?: CareerTimingWindows | null;
    business?: BusinessTimingWindows | null;
    finance?: FinanceTimingWindows | null;
    health?: HealthTimingWindows | null;
  }>({});
  
  const handleGetPrediction = async () => {
    const result = await getOrGeneratePrediction(windowId);
    setPrediction(result.prediction);
    setRemedies(result.remedies);  // ⭐ Set remedies
    
    // ⭐ NEW: Set timing windows
    setTimingWindows({
      marriage: result.marriageTimingWindows,
      career: result.careerTimingWindows,
      business: result.businessTimingWindows,
      finance: result.financeTimingWindows,
      health: result.healthTimingWindows,
    });
  };
  
  return (
    <ScrollView>
      {/* Prediction display */}
      {prediction && <PredictionCard prediction={prediction} />}
      
      {/* ⭐ NEW: Timing Windows display */}
      {timingWindows.marriage?.ok && timingWindows.marriage.primary_window && (
        <TimingWindowCard 
          title="Marriage Timing"
          windows={timingWindows.marriage}
        />
      )}
      
      {timingWindows.career?.ok && (
        <TimingWindowCard 
          title="Career Timing"
          windows={timingWindows.career}
        />
      )}
      
      {/* Remedies display */}
      {remedies.length > 0 && <RemediesList remedies={remedies} />}
    </ScrollView>
  );
};
```

### Display Timing Windows Component

```typescript
interface TimingWindowCardProps {
  title: string;
  windows: MarriageTimingWindows | CareerTimingWindows | BusinessTimingWindows | FinanceTimingWindows | HealthTimingWindows;
}

const TimingWindowCard = ({ title, windows }: TimingWindowCardProps) => {
  if (!windows.ok) return null;
  
  // For marriage: single point
  if ('primary_window' in windows && windows.primary_window) {
    return (
      <View style={styles.timingCard}>
        <Text style={styles.timingTitle}>{title}</Text>
        <Text style={styles.timingNarrative}>{windows.narrative_hi}</Text>
        {windows.primary_window && (
          <Text style={styles.timingWindow}>Primary: {windows.primary_window}</Text>
        )}
        {windows.secondary_window && (
          <Text style={styles.timingWindow}>Secondary: {windows.secondary_window}</Text>
        )}
      </View>
    );
  }
  
  // For career/business/finance/health: multiple points
  if ('windowsByPoint' in windows) {
    return (
      <View style={styles.timingCard}>
        <Text style={styles.timingTitle}>{title}</Text>
        {Object.entries(windows.windowsByPoint).map(([pointCode, pointWindows]) => (
          <View key={pointCode} style={styles.pointSection}>
            <Text style={styles.pointTitle}>{pointCode}</Text>
            {pointWindows.narrative_hi && (
              <Text style={styles.timingNarrative}>{pointWindows.narrative_hi}</Text>
            )}
            {pointWindows.primary_window && (
              <Text style={styles.timingWindow}>Primary: {pointWindows.primary_window}</Text>
            )}
            {pointWindows.secondary_window && (
              <Text style={styles.timingWindow}>Secondary: {pointWindows.secondary_window}</Text>
            )}
          </View>
        ))}
      </View>
    );
  }
  
  return null;
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
1. `astroDbApi.ts` - Add `ensureUser()`, update `getTodayWindowId()` (with chartData), update `getChartAndGeneratePrediction()`, update `getOrGeneratePrediction()` return type
2. `types.ts` (or similar) - Add `Remedy`, `TimingWindow`, `TimingWindowsByPoint`, `MarriageTimingWindows`, `CareerTimingWindows`, `BusinessTimingWindows`, `FinanceTimingWindows`, `HealthTimingWindows`, update `PredictionResponse`
3. `AuthContext.tsx` (or similar) - Call `ensureUser()` after Firebase auth
4. `AiAstrologerScreen.tsx` (or similar) - Use new flow, display timing windows
5. `TimingWindowCard.tsx` (new) - Component to display timing windows

**Lines to remove:**
- Any hardcoded `const windowId = 2;`
- Any comments like `// TODO: Replace with dynamic window creation`

**New features to add:**
- Chart data integration in window creation
- Timing windows display (marriage, career, business, finance, health)

---

## 🎯 What This Achieves

✅ **Dynamic window creation** - No more hardcoded window IDs  
✅ **User management** - Firebase UID → Backend user mapping  
✅ **Chart data integration** - Automatic astro snapshot creation/update  
✅ **Timing windows** - Month-year ranges for marriage, career, business, finance, health  
✅ **Production-ready** - Full flow from auth to prediction  
✅ **Scalable** - Works for multiple users, multiple windows  
✅ **Error-resilient** - Handles missing windows, network errors, etc.

---

## 📚 API Endpoints Reference

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-production-api.com`

### Available Endpoints

1. **GET /health** - Health check
   - Returns: `{ status: 'ok' }`

2. **POST /users/ensure** - Get or create user
   - Body: `{ firebaseUid: string, email?: string, phone?: string }`
   - Returns: `{ ok: true, user: { id, firebase_uid, email, phone } }`

3. **POST /windows** - Create prediction window
   - Body: `{ user_id: number, chart_id: number, scope: string, start_at?: string, end_at?: string, timezone?: string, chart_data?: object }`
   - Returns: `{ ok: true, window: {...} }`

4. **GET /users/:firebaseUid/windows** - Get user windows
   - Query: `?scope=daily&date=2024-01-15`
   - Returns: `{ ok: true, windows: [...], count: number }`

5. **POST /windows/:windowId/astro-snapshot** - Update astro snapshot
   - Body: `{ chart_data: {...} }`
   - Returns: `{ ok: true, message: '...' }`

6. **GET /predictions/:windowId** - Get prediction
   - Query: `?lang=en`
   - Returns: `{ ok: true, prediction: {...}, appliedRules: [...], remedies: [...], marriageTimingWindows: {...}, careerTimingWindows: {...}, businessTimingWindows: {...}, financeTimingWindows: {...}, healthTimingWindows: {...} }`

7. **POST /windows/:windowId/generate** - Generate prediction
   - Body: `{ language?: string }`
   - Returns: `{ ok: true, windowId: number, predictionId: number, prediction: {...}, summary: {...}, shortSummary: string, appliedRuleCount: number, remedies: [...] }`

---

## 🚀 You're Done!

Once you complete the checklist, your React Native app will be fully integrated with the production-ready backend. All endpoints are live and tested.

**Next**: Test with real Firebase users and verify the complete flow works end-to-end, including timing windows display.

---

## 📋 Quick Summary: Can App Connect & Get Predictions?

### ✅ YES! Here's what the app can do:

1. **✅ Connect to Backend API** (not directly to DB)
   - App uses REST API endpoints
   - No database credentials needed in app
   - Just need API_BASE_URL

2. **✅ User Authentication & Management**
   - Firebase auth → `ensureUser()` → Backend creates user in DB
   - User ID stored in app state

3. **✅ Input Birth Details**
   - User enters: date, time, timezone, latitude, longitude
   - App validates and formats data

4. **✅ Calculate Chart (Swiss Ephemeris)**
   - App calls Swiss Ephemeris service (library/API/native module)
   - Gets chart data: planets, houses, transits, nakshatras, etc.

5. **✅ Create Window in Backend DB**
   - App sends chart data to `POST /windows`
   - Backend creates `prediction_windows` row in DB
   - Backend creates `astro_state_snapshots` row in DB

6. **✅ Get Prediction from Backend DB**
   - App calls `GET /predictions/:windowId`
   - Backend:
     - Loads astro snapshot from DB
     - Evaluates rules from DB
     - Generates prediction
     - Links remedies from DB
     - Computes timing windows
   - App receives: prediction, remedies, timing windows

### 🔄 Complete Flow Diagram:

```
┌─────────────────┐
│  React Native   │
│      App        │
└────────┬────────┘
         │
         │ 1. Firebase Auth
         ▼
┌─────────────────┐
│  ensureUser()   │ → POST /users/ensure
└────────┬────────┘
         │
         │ 2. User Input (Birth Details)
         ▼
┌─────────────────┐
│ Swiss Ephemeris │ → Calculate Chart
└────────┬────────┘
         │
         │ 3. Chart Data
         ▼
┌─────────────────┐
│ getTodayWindowId│ → POST /windows (with chart_data)
└────────┬────────┘   Backend: Creates window + snapshot in DB
         │
         │ 4. Window ID
         ▼
┌─────────────────┐
│getOrGeneratePred│ → GET /predictions/:windowId
└────────┬────────┘   Backend: Evaluates rules, generates prediction
         │
         │ 5. Prediction Response
         ▼
┌─────────────────┐
│  Display in UI  │ ← prediction + remedies + timing windows
└─────────────────┘
```

### ⚠️ Important Notes:

1. **App does NOT directly access PostgreSQL**
   - All DB operations happen in backend
   - App only makes HTTP API calls

2. **Swiss Ephemeris must be implemented in app**
   - Use a library (swisseph-js, jyotish.js)
   - Or call an external API
   - Or use a native module

3. **Backend must be running**
   - Development: `http://localhost:3000`
   - Production: Your production API URL

4. **All data flows through API**
   - Birth details → API → DB
   - Chart data → API → DB
   - Prediction ← API ← DB

**Result**: ✅ App can fully connect, input user details/kundli/charts, and get predictions from DB via API!

