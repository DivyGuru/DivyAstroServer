# Scope Prediction Analysis

## Issue Summary

The server supports multiple scope-specific outputs, but the client can easily confuse them:

- `/kundli/:windowId` returns **kundli sections** (e.g., `life_overview`) and can look similar across scopes because it contains long-form life narrative.
- `/predictions/:windowId` returns **rule-engine prediction summary** (e.g., `short_summary`, `appliedRuleCount`) and may look similar across scopes depending on rule coverage.
- `/daily-experience/:windowId` and `/weekly-experience/:windowId` return **daily/weekly experience narratives** (the “today/this week” style content).

## Current Behavior (from logs)

### What's Working
- ✅ Yearly predictions are being fetched successfully
- ✅ Server responds correctly with yearly scope data
- ✅ Varshfal data is included for yearly windows

### What to Watch For

If daily/weekly is showing `life_overview` style sections, it means the client is rendering the **kundli payload** (`/kundli/:windowId`) rather than using the **experience endpoints**.

## Server-Side Support

The server **fully supports** all scopes:

### Supported Scopes
- `hourly`
- `choghadiya`
- `daily`
- `weekly`
- `monthly`
- `yearly`
- `mahadasha`
- `antardasha`
- `pratyantardasha`
- `life_theme`

### API Endpoints

#### 1. Get/Create Window
```
GET /users/:firebaseUid/windows?scope={scope}&date={date}
POST /windows
```

**Example for daily:**
```
GET /users/{firebaseUid}/windows?scope=daily&date=2025-12-28
```

**Example for weekly:**
```
GET /users/{firebaseUid}/windows?scope=weekly&date=2025-12-28
```

#### 2. Get Prediction
```
GET /predictions/:windowId?lang=en
```

This endpoint works for **all scopes**. The response structure is the same, except:
- **Yearly windows**: Include `varshfal` object with timeline periods
- **Other scopes**: No `varshfal` object

#### 3. Daily Experience (recommended for scope=daily “today” narrative)
```
GET /daily-experience/:windowId?date=YYYY-MM-DD
```

#### 4. Weekly Experience (recommended for scope=weekly “this week” narrative)
```
GET /weekly-experience/:windowId
```

#### 5. Monthly Experience (recommended for scope=monthly “this month” narrative)
```
GET /monthly-experience/:windowId
```

#### 6. Get Kundli
```
GET /kundli/:windowId?scope={scope}
```

Works for scopes: `daily`, `weekly`, `monthly`, `yearly`

## Response Structure Comparison

### Yearly Prediction Response
```json
{
  "ok": true,
  "prediction": {
    "id": "43",
    "window_id": "2",
    "scope": "yearly",
    "short_summary": "...",
    ...
  },
  "appliedRuleCount": 914,
  "remedies": [],
  "varshfal": {
    "meta": { "window_id": "2", "year": 2025 },
    "details": { "lagna": {...}, "moon": {...} },
    "muntha": { "house": 10, "narrative": "..." },
    "timeline_periods": [...]
  }
}
```

### Daily/Weekly Prediction Response
```json
{
  "ok": true,
  "prediction": {
    "id": "44",
    "window_id": "3",
    "scope": "daily",  // or "weekly"
    "short_summary": "...",
    ...
  },
  "appliedRuleCount": 150,
  "remedies": [],
  // NO varshfal object (only for yearly)
}
```

## Client-Side Guidance

The client typically needs **separate calls** depending on what it wants to render:

### Recommended Flow (per scope)

1. **Daily**
   - `windows?scope=daily&date=...` → get/create daily window
   - `daily-experience/{windowId}?date=...` → daily narrative (today-style)
   - optionally `predictions/{windowId}?lang=en` → rule summary for the day

2. **Weekly**
   - `windows?scope=weekly&date=...` → get/create weekly window
   - `weekly-experience/{windowId}` → weekly narrative (planning-style)
   - optionally `predictions/{windowId}?lang=en` → rule summary for the week

3. **Yearly**
   - `windows?scope=yearly&date=...` → get/create yearly window
   - `predictions/{windowId}?lang=en` → yearly prediction (+ `varshfal`)
   - optionally `kundli/{windowId}?scope=yearly` → kundli sections

## Server Code References

### Window Creation (supports all scopes)
```12:628:src/server.js
// For time-based scopes (daily, weekly, monthly, yearly), auto-generate dates if not provided
if (['daily', 'weekly', 'monthly', 'yearly'].includes(scope)) {
  if (!start_at || !end_at) {
    const targetDate = date ? new Date(date) : new Date();
    const windowDates = getWindowDatesForScope(scope, targetDate, timezone);
    finalStartAt = windowDates.start_at;
    finalEndAt = windowDates.end_at;
  }
}
```

### Prediction Generation (scope-aware)
```16:61:src/services/predictionEngine.js
// Load active rules for this scope
const rulesRes = await query(
  `SELECT * FROM rules 
   WHERE is_active = TRUE 
     AND $1 = ANY(applicable_scopes)
   ...
  `,
  [scope]  // Uses window scope
);
```

### Varshfal (yearly only)
```1804:1819:src/server.js
// ---- Varshfal data (for yearly windows only) ----
let varshfal = null;
if (windowCtx && windowCtx.scope === 'yearly') {
  try {
    const { generateVarshfal } = await import('./services/varshfalGeneration.js');
    varshfal = await generateVarshfal(windowId);
    ...
  }
}
```

## Testing

To verify server support for daily/weekly:

```bash
# Test daily window creation
curl -X POST http://localhost:3000/windows \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "chart_id": 1,
    "scope": "daily",
    "date": "2025-12-28",
    "timezone": "Asia/Kolkata"
  }'

# Test weekly window creation
curl -X POST http://localhost:3000/windows \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "chart_id": 1,
    "scope": "weekly",
    "date": "2025-12-28",
    "timezone": "Asia/Kolkata"
  }'
```

## Conclusion

**Server Status:** ✅ Fully functional for all scopes  
**Client Status:** ❌ Only requesting yearly scope  
**Action Required:** Update client code to fetch daily and weekly predictions separately

