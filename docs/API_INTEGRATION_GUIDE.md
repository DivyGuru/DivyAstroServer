# API Integration Guide - Mobile App

**Complete guide for integrating DivyAstro Server APIs with mobile app.**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
   - [Core Endpoints](#core-endpoints)
   - [Prediction Endpoints](#prediction-endpoints)
   - [Specialized Endpoints](#specialized-endpoints)
5. [Chart Data Structure](#chart-data-structure)
6. [Integration Flow](#integration-flow)
7. [Request/Response Examples](#requestresponse-examples)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [API Changes & Migration Guide](#api-changes--migration-guide)

---

## Quick Start

### Basic Integration Flow

1. **Create/Get Window**: `POST /windows` or `GET /users/:firebaseUid/windows`
2. **Update Chart Data**: `POST /windows/:windowId/astro-snapshot`
3. **Get Predictions**: `GET /predictions/:windowId`
4. **Get Specialized Data**:
   - Varshfal: `GET /varshfal/:windowId`
   - Mahadasha Phal: `GET /mahadasha-phal/:windowId`
   - Transit Today: `GET /transit-today/:windowId`
   - Lal Kitab: `GET /lalkitab-prediction/:windowId`
  - Daily Experience: `GET /daily-experience/:windowId?date=YYYY-MM-DD`
  - Weekly Experience: `GET /weekly-experience/:windowId`
  - Monthly Experience: `GET /monthly-experience/:windowId`

### Example: Complete Flow

```javascript
// 1. Ensure user exists
const user = await fetch('/users/ensure', {
  method: 'POST',
  body: JSON.stringify({ firebaseUid: 'xxx', email: 'user@example.com' })
});

// 2. Create yearly window
const window = await fetch('/windows', {
  method: 'POST',
  body: JSON.stringify({
    user_id: user.id,
    chart_id: chartId,
    scope: 'yearly',
    date: '2025-12-22',
    chart_data: { /* complete chart data */ }
  })
});

// 3. Get all predictions
const prediction = await fetch(`/predictions/${window.id}?lang=hi`);
const varshfal = await fetch(`/varshfal/${window.id}`);
const mahadashaPhal = await fetch(`/mahadasha-phal/${window.id}`);
const transitToday = await fetch(`/transit-today/${window.id}`);
const lalkitab = await fetch(`/lalkitab-prediction/${window.id}`);
```

---

## Base URL

```
Production: https://api.divyastro.com
Development: http://localhost:3000
```

---

## Authentication

Currently, APIs do not require authentication tokens. All endpoints accept requests directly.

**Note:** In production, you may need to add authentication headers. Check with backend team.

---

## API Endpoints

### Core Endpoints

#### 1. Create Prediction Window

**Endpoint:** `POST /windows`

**Purpose:** Create a prediction window (daily/weekly/monthly/yearly) and optionally attach chart data.

**Request Body:**

```json
{
  "user_id": 123,
  "chart_id": 456,
  "scope": "yearly",
  "date": "2025-01-15",
  "timezone": "Asia/Kolkata",
  "chart_data": {
    // See Chart Data Structure section below
  }
}
```

**Required Fields:**
- `user_id` (number): User ID from your database
- `chart_id` (number): Chart ID from your database
- `scope` (string): One of: `daily`, `monthly`, `yearly`, `weekly`, `hourly`, `choghadiya`, `mahadasha`, `antardasha`, `pratyantardasha`, `life_theme`

**Optional Fields:**
- `date` (string, ISO date): Target date for window. If not provided, uses current date.
- `start_at` (string, ISO datetime): Explicit start time. If not provided, auto-generated based on scope.
- `end_at` (string, ISO datetime): Explicit end time. If not provided, auto-generated based on scope.
- `timezone` (string): Timezone (default: "Asia/Kolkata")
- `chart_data` (object): Complete chart data (see Chart Data Structure section)

**Response:**

```json
{
  "ok": true,
  "window": {
    "id": 789,
    "user_id": 123,
    "chart_id": 456,
    "scope": "yearly",
    "start_at": "2025-01-01T00:00:00.000Z",
    "end_at": "2025-12-31T23:59:59.999Z",
    "timezone": "Asia/Kolkata",
    "created_at": "2025-01-15T10:30:00.000Z"
  },
  "alreadyExists": false
}
```

**Notes:**
- If window already exists for same user/chart/scope/time, returns existing window with `alreadyExists: true`
- If `chart_data` is provided, automatically creates/updates `astro_state_snapshot`
- For `daily`, `weekly`, `monthly`, `yearly` scopes, dates are auto-generated if not provided

---

#### 2. Update Chart Data for Existing Window

**Endpoint:** `POST /windows/:windowId/astro-snapshot`

**Purpose:** Update or create astro snapshot for an existing window.

**Request Body:**

```json
{
  "chart_data": {
    // See Chart Data Structure section below
  }
}
```

**Response:**

```json
{
  "ok": true,
  "message": "Astro snapshot created/updated successfully"
}
```

---

#### 3. Get Kundli (General)

**Endpoint:** `GET /kundli/:windowId`

**Purpose:** Get complete kundli data for a window (works for daily/weekly/monthly/yearly).

**Query Parameters:**
- `scope` (optional): `daily` | `weekly` | `monthly` | `yearly` - If provided, validates window scope matches

---

#### 3B. Daily / Weekly / Monthly Experience (Narrative)

These endpoints return the **experience-style narrative** (what you see in the Daily/Weekly tabs).
They do **not** expose planet/dasha labels in the narrative.

- **Daily**: `GET /daily-experience/:windowId?date=YYYY-MM-DD`
- **Weekly**: `GET /weekly-experience/:windowId`
- **Monthly**: `GET /monthly-experience/:windowId`

**Response:**

```json
{
  "ok": true,
  "meta": {
    "window_id": "789",
    "generated_at": "2025-01-15T10:35:00.000Z",
    "overall_confidence": 0.75
  },
  "sections": [
    {
      "domain": "career_direction",
      "summary_metrics": {
        "pressure": "high",
        "support": "medium",
        "stability": "low",
        "confidence": 0.7
      },
      "time_windows": {
        "years": [
          {
            "from": 2025,
            "to": 2027,
            "nature": "consolidation"
          }
        ],
        "months": [
          {
            "from": "2025-03",
            "to": "2025-07",
            "nature": "decision_sensitive"
          }
        ]
      },
      "narrative": "Your professional life is entering a phase where responsibilities may feel heavier...",
      "remedy_hook": {
        "message": "During such phases, supportive practices can help maintain clarity and balance.",
        "cta": "View supportive remedies"
      },
      "remedies": [
        {
          "type": "meditation",
          "title": "Focus and Stability Meditation",
          "description": "A short daily meditation to help maintain clarity during demanding phases.",
          "frequency": "daily",
          "duration": "10 minutes"
        }
      ]
    }
  ]
}
```

**Notes:**
- `time_windows.years` and `time_windows.months` can be empty arrays (valid)
- `remedy_hook` and `remedies` are optional (only present if confidence >= 0.6)
- `narrative` is always present and non-empty

---

#### 4. Get Monthly Kundli (Convenience Endpoint)

**Endpoint:** `GET /kundli/monthly/:windowId`

**Purpose:** Same as `/kundli/:windowId` but validates window scope is `monthly`.

**Response:** Same format as `/kundli/:windowId`

**Error if scope mismatch:**
```json
{
  "ok": false,
  "error": "Window scope must be 'monthly'. Found: yearly"
}
```

---

#### 5. Get Yearly Kundli (Convenience Endpoint)

**Endpoint:** `GET /kundli/yearly/:windowId`

**Purpose:** Same as `/kundli/:windowId` but validates window scope is `yearly`.

**Response:** Same format as `/kundli/:windowId`

**Error if scope mismatch:**
```json
{
  "ok": false,
  "error": "Window scope must be 'yearly'. Found: daily"
}
```

---

### Prediction Endpoints

#### 6. Get Varshfal (Annual Predictions)

**Endpoint:** `GET /varshfal/:windowId`

**Purpose:** Returns Varshfal-style (Annual Predictions) data for yearly windows. Similar to PDF pages 20-22 structure: Muntha + Year Timeline with Dasha Periods.

**Response:**
```json
{
  "ok": true,
  "meta": {
    "window_id": "5",
    "generated_at": "2025-12-22T13:40:02.654Z",
    "year": 2025
  },
  "details": {
    "year": 2025,
    "lagna": {
      "sign": 10,
      "signName": "Capricorn"
    },
    "moon": {
      "sign": 8,
      "signName": "Scorpio",
      "nakshatra": "Swati"
    }
  },
  "muntha": {
    "house": 10,
    "narrative": "Career, reputation, and public standing take center stage..."
  },
  "timeline_periods": [
    {
      "from": "2025-12-22",
      "to": "2026-02-15",
      "dasha_planet": "SUN",
      "bhav": 1,
      "narrative": "You will be confident and positive during this period...",
      "is_current": true
    }
  ]
}
```

**Note:** 
- Requires `scope: "yearly"` window. 
- Timeline periods always start from `window.start_at` and cover next 12 months.
- **Quality Update (Dec 2025)**: Varshfal narratives now use correct ordinal grammar (1st, 2nd, 3rd house) and include specific life-domain descriptions.

---

#### 7. Get Mahadasha Phal (Dasha Predictions)

**Endpoint:** `GET /mahadasha-phal/:windowId`

**Purpose:** Returns Vimshottari Mahadasha Phal (Dasha Predictions) data. Similar to PDF pages 20-21 structure: All Mahadasha periods with planet positions and narratives.

**Response:**
```json
{
  "ok": true,
  "meta": {
    "window_id": "5",
    "generated_at": "2025-12-22T13:40:02.654Z",
    "birth_date": "1986-12-27"
  },
  "mahadasha_periods": [
    {
      "planet": "SATURN",
      "from": "2009-02-28",
      "to": "2028-02-28",
      "planet_position": {
        "sign": 8,
        "signName": "Scorpio",
        "house": 12
      },
      "narrative": "This is not a very satisfactory period for you. You may get indulge into sudden losses financially...",
      "is_current": true
    },
    {
      "planet": "MERCURY",
      "from": "2028-02-28",
      "to": "2045-02-28",
      "planet_position": {
        "sign": 10,
        "signName": "Capricorn",
        "house": 1
      },
      "narrative": "During Mercury Mahadasha, Mercury influences your 1st house...",
      "is_current": false
    }
  ]
}
```

**Note:** 
- Works with any window scope. 
- Requires `dasha.mahadashaPeriods` or `dasha.mahadasha` in `chart_data` when creating window.
- **Quality Update (Dec 2025)**: Dasha narratives now use correct ordinal grammar and include specific life-domain descriptions for better clarity.

---

#### 8. Get Transit Today

**Endpoint:** `GET /transit-today/:windowId?date=2025-12-22`

**Purpose:** Returns Transit Today data for a specific date. Similar to PDF pages 27-28 structure: Each planet's transit position with narrative.

**Query Parameters:**
- `date` (optional): Target date in ISO format (YYYY-MM-DD). Defaults to today's date.

**Response:**
```json
{
  "ok": true,
  "meta": {
    "window_id": "6",
    "generated_at": "2025-12-22T15:30:00.000Z",
    "date": "2025-12-22"
  },
  "transits": [
    {
      "planet": "SUN",
      "sign": 8,
      "signName": "Scorpio",
      "house": 12,
      "longitude": 240.5,
      "narrative": "Don't try to be aggressive in nature because your aggressiveness can shove you into difficult situations..."
    },
    {
      "planet": "MOON",
      "sign": 9,
      "signName": "Sagittarius",
      "house": 1,
      "longitude": 265.2,
      "narrative": "You will not be able to grab the chances coming your way though you will have a lot of opportunities..."
    }
    // ... more planets
  ]
}
```

**Note:** 
- Works with any window scope.
- Requires `transits` array in `chart_data` when creating/updating snapshot.
- Transits should include: `planet`, `sign`, `house`, `longitude` for each planet.
- **Quality Update (Dec 2025)**: Transit narratives now use correct ordinal grammar (1st, 2nd, 3rd house) and include specific life-domain descriptions instead of generic text.

---

#### 9. Get Lal Kitab Prediction

**Endpoint:** `GET /lalkitab-prediction/:windowId`

**Purpose:** Returns Lal Kitab Prediction data based on planet positions. Similar to PDF pages 31-33 structure: Planet in house predictions with remedies.

**Response:**
```json
{
  "ok": true,
  "meta": {
    "window_id": "6",
    "generated_at": "2025-12-22T15:30:00.000Z"
  },
  "predictions": [
    {
      "planet": "MOON",
      "house": 11,
      "narrative": "This house is strongly influenced by Jupiter and Saturn. Every planet placed in this house will destroy its inimical planets...",
      "remedies": [
        {
          "number": 1,
          "description": "Offer milk in Bhairo Mandir and donate milk to others liberally."
        },
        {
          "number": 2,
          "description": "Ensure that the grandmother does not see her grandson."
        }
      ]
    },
    {
      "planet": "MARS",
      "house": 3,
      "narrative": "The 3rd house is affected by Mars and Mercury, who provide brothers and sisters to the native...",
      "remedies": [
        {
          "number": 1,
          "description": "Be soft hearted and avoid arrogance. Be good to brothers for prosperity."
        }
      ]
    }
  ]
}
```

**Note:** 
- Works with any window scope.
- Requires Lal Kitab rules to be present in the `rules` table with `source_book = 'lalkitab'` and `rule_type = 'BASE'`.
- Rules are automatically matched based on planet positions in the chart.
- **Quality Update (Dec 2025)**: Lal Kitab prediction narratives now use improved, specific descriptions with correct grammar and reduced repetition.

---

## Chart Data Structure

**IMPORTANT:** The `chart_data` object should contain all astrological data that your app has calculated. The backend will extract and normalize this data.

### Required Chart Data Fields

```json
{
  "planets": [
    {
      "name": "SUN",
      "planet": "SUN",
      "house": 1,
      "sign": 9,
      "longitude": 251.28,
      "nakshatra": "Purva Ashadha",
      "nakshatraId": 20,
      "pada": 2,
      "isRetrograde": false,
      "retrograde": false,
      "strength": 0.75
    }
    // ... more planets (MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, RAHU, KETU)
  ],
  "houses": [
    {
      "house": 1,
      "sign": 9,
      "lord": "JUPITER"
    }
    // ... houses 1-12
  ],
  "lagna": {
    "sign": 9,
    "signName": "Sagittarius",
    "degree": 251.28
  },
  "moon": {
    "sign": 7,
    "signName": "Libra",
    "nakshatra": "Swati",
    "nakshatraId": 15
  },
  "yogas": [
    {
      "name": "Gaj Kesari Yoga",
      "type": "benefic"
    }
  ],
  "doshas": [
    {
      "name": "Mangal Dosha",
      "type": "malefic"
    }
  ],
  "transits": [
    {
      "planet": "SATURN",
      "house": 10,
      "sign": 10,
      "longitude": 280.5
    }
  ]
}
```

### Field Mappings (Backend Accepts Multiple Formats)

The backend is flexible and accepts multiple field name variations:

#### Planets Array

**Accepted field names:**
- `planets` or `planetsData` (array)
- Each planet object can have:
  - `name` or `planet` or `id` → planet name (SUN, MOON, MARS, etc.)
  - `house` or `h` → house number (1-12)
  - `sign` or `s` → sign number (1-12, where 1=Aries, 2=Taurus, etc.)
  - `longitude` or `long` or `position` → longitude in degrees
  - `nakshatra` or `nakshatraId` → nakshatra name or ID
  - `pada` → pada number (1-4)
  - `isRetrograde` or `retrograde` → boolean
  - `strength` → planet strength (0.0-1.0)

#### Houses

**Accepted field names:**
- `houses` or `housesData` (array or object)

#### Lagna

**Accepted field names:**
- `lagna.sign` or `lagnaSign` → sign number
- `lagna.signName` → sign name (optional)

#### Moon

**Accepted field names:**
- `moon.sign` or `moonSign` → sign number
- `moon.nakshatra` or `moonNakshatra` → nakshatra name or ID

#### Yogas

**Accepted field names:**
- `yogas` or `yogasData` (array)

#### Doshas

**Accepted field names:**
- `doshas` or `doshasData` (array)

#### Transits

**Accepted field names:**
- `transits` or `transitsData` (array)

### Additional Chart Data (Optional but Recommended)

For **yearly windows (Varshaphal)**, you can also include:

```json
{
  "varshaphal": {
    "year": 2025,
    "solarReturnDate": "2025-12-27",
    "muntha": {
      "house": 4,
      "description": "Some ups and downs in money matters..."
    },
    "dashaPeriods": [
      {
        "from": "2025-12-27",
        "to": "2026-02-17",
        "planet": "MERCURY",
        "bhav": 12,
        "description": "This is not a very satisfactory period..."
      },
      {
        "from": "2026-02-17",
        "to": "2026-03-10",
        "planet": "KETU",
        "bhav": 9,
        "description": "This is a good time for self-expression..."
      }
      // ... more periods covering the full year
    ]
  },
  "dasha": {
    "mahadasha": {
      "planet": "SATURN",
      "startDate": "2009-02-28",
      "endDate": "2028-02-28"
    },
    "antardasha": {
      "planet": "MERCURY",
      "startDate": "2024-01-15",
      "endDate": "2026-05-20"
    },
    "mahadashaPeriods": [
      {
        "planet": "RAHU",
        "from": "1986-12-27",
        "to": "1993-02-28",
        "description": "Volatility & some lack of direction in career will prevail..."
      },
      {
        "planet": "JUPITER",
        "from": "1993-02-28",
        "to": "2009-02-28",
        "description": "There will be a strong influence from others to help you..."
      },
      {
        "planet": "SATURN",
        "from": "2009-02-28",
        "to": "2028-02-28",
        "description": "This is not a very satisfactory period for you..."
      }
      // ... more periods covering all mahadashas (past, current, future)
    ]
  }
}
```

**Note:** 
- If you provide `varshaphal.dashaPeriods`, the backend can generate Varshfal-style timeline data.
- If you provide `dasha.mahadashaPeriods` or `dasha.mahadasha`, the backend can generate Mahadasha Phal data via `/mahadasha-phal/:windowId` endpoint.
- If you provide `transits` array, the backend can generate Transit Today data via `/transit-today/:windowId` endpoint.
- Otherwise, it will use available dasha/transit data.

---

## Request/Response Examples

### Example 1: Create Yearly Window with Chart Data

**Request:**
```bash
POST http://localhost:3000/windows
Content-Type: application/json

{
  "user_id": 123,
  "chart_id": 456,
  "scope": "yearly",
  "date": "2025-01-15",
  "timezone": "Asia/Kolkata",
  "chart_data": {
    "planets": [
      {
        "name": "SUN",
        "house": 1,
        "sign": 9,
        "longitude": 251.28,
        "nakshatra": "Purva Ashadha",
        "pada": 2,
        "isRetrograde": false,
        "strength": 0.75
      }
      // ... all planets
    ],
    "lagna": {
      "sign": 9,
      "signName": "Sagittarius"
    },
    "moon": {
      "sign": 7,
      "nakshatra": "Swati"
    },
    "yogas": [],
    "doshas": [],
    "transits": []
  }
}
```

**Response:**
```json
{
  "ok": true,
  "window": {
    "id": 789,
    "user_id": 123,
    "chart_id": 456,
    "scope": "yearly",
    "start_at": "2025-01-01T00:00:00.000Z",
    "end_at": "2025-12-31T23:59:59.999Z",
    "timezone": "Asia/Kolkata",
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```

### Example 2: Get Kundli for Yearly Window

**Request:**
```bash
GET http://localhost:3000/kundli/yearly/789
```

**Response:**
```json
{
  "ok": true,
  "meta": {
    "window_id": "789",
    "generated_at": "2025-01-15T10:35:00.000Z",
    "overall_confidence": 0.75
  },
  "sections": [
    {
      "domain": "career_direction",
      "summary_metrics": {
        "pressure": "high",
        "support": "medium",
        "stability": "low",
        "confidence": 0.7
      },
      "time_windows": {
        "years": [
          {
            "from": 2025,
            "to": 2027,
            "nature": "consolidation"
          }
        ],
        "months": []
      },
      "narrative": "Your professional life is entering a phase where responsibilities may feel heavier and progress may appear slower than expected. This period encourages patience, discipline, and steady skill development rather than quick gains. Between 2025 and 2027, consistent effort and thoughtful planning can gradually strengthen your position.",
      "remedy_hook": {
        "message": "During such phases, supportive practices can help maintain clarity and balance.",
        "cta": "View supportive remedies"
      },
      "remedies": [
        {
          "type": "meditation",
          "title": "Focus and Stability Meditation",
          "description": "A short daily meditation to help maintain clarity during demanding phases.",
          "frequency": "daily",
          "duration": "10 minutes"
        }
      ]
    }
    // ... more domains
  ]
}
```

### Example 3: Create Monthly Window

**Request:**
```bash
POST http://localhost:3000/windows
Content-Type: application/json

{
  "user_id": 123,
  "chart_id": 456,
  "scope": "monthly",
  "date": "2025-03-15",
  "chart_data": {
    // ... chart data
  }
}
```

**Response:**
```json
{
  "ok": true,
  "window": {
    "id": 790,
    "user_id": 123,
    "chart_id": 456,
    "scope": "monthly",
    "start_at": "2025-03-01T00:00:00.000Z",
    "end_at": "2025-03-31T23:59:59.999Z",
    "timezone": "Asia/Kolkata",
    "created_at": "2025-01-15T10:40:00.000Z"
  }
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "ok": false,
  "error": "user_id, chart_id, and scope are required"
}
```

**404 Not Found:**
```json
{
  "ok": false,
  "error": "Window not found: 789"
}
```

**500 Internal Server Error:**
```json
{
  "ok": false,
  "error": "Failed to generate kundli"
}
```

### Error Handling Best Practices

1. **Always check `ok` field** in response
2. **Handle network errors** (timeout, connection refused)
3. **Validate window exists** before calling `/kundli/:windowId`
4. **Retry logic** for transient errors (optional)
5. **Log errors** for debugging

---

## Best Practices

### 1. Window Creation Flow

```
1. User selects date/scope (e.g., "Year 2025")
2. App calculates chart data for that date
3. POST /windows with chart_data
4. Store window.id from response
5. Use window.id for all subsequent API calls
```

### 2. Chart Data Preparation

- **Calculate all planets** (SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, RAHU, KETU)
- **Include houses** (1-12) with signs and lords
- **Include yogas and doshas** if available
- **Include transits** for the target date
- **For yearly windows**, include `varshaphal.dashaPeriods` if you have them
- **For Mahadasha Phal**, include `dasha.mahadashaPeriods` (all periods) or `dasha.mahadasha` (current only)
- **For Transit Today**, include `transits` array with current planetary positions for the target date

### 3. Caching Strategy

- **Cache window.id** per user/chart/scope/date combination
- **Check if window exists** before creating (backend handles this, but you can optimize)
- **Cache kundli response** for a reasonable time (e.g., 1 hour)

### 4. Scope Selection

- **Daily**: For day-specific predictions
- **Monthly**: For month-specific predictions (better time patches)
- **Yearly**: For annual predictions (Varshfal-style)

### 5. Date Handling

- **Always use ISO 8601 format** for dates: `"2025-01-15"`
- **Timezone matters**: Specify `timezone` in request (default: "Asia/Kolkata")
- **For yearly windows**: Use `date` field to specify which year (e.g., "2025-01-15" for year 2025)

---

## Important API Changes (December 2025)

### ⚠️ Breaking Changes for App Integration

**IMPORTANT:** Server-side fixes have been applied. App needs to update accordingly.

#### 1. Remedy Type Enum Change

**Issue:** Database enum uses `'mantra'` not `'jap'`

**Change Required:**
- If app is sending remedy type as `'jap'`, it should be `'mantra'`
- Database enum values: `'mantra'`, `'meditation'`, `'donation'`, `'feeding_beings'`, `'puja'`, `'fast'`

**App Action:**
- Check if app code uses `'jap'` anywhere → change to `'mantra'`
- Update any remedy type mappings/constants

#### 2. Prediction Theme Enum Mapping

**Issue:** App sends domain names like `'family_home'`, but database enum uses simple names like `'family'`

**Database Enum Values:**
```
'money', 'career', 'relationship', 'health', 'spirituality', 
'general', 'travel', 'education', 'family'
```

**Domain to Enum Mapping (Server-side):**
- `money_finance` → `'money'`
- `career_direction` → `'career'`
- `relationships` → `'relationship'`
- `family_home` → `'family'` ⚠️ **IMPORTANT**
- `health_body` → `'health'`
- `spiritual_growth` → `'spirituality'`
- `mental_state` → `'general'`
- `timing_luck` → `'general'`
- `events_changes` → `'general'`
- `self_identity` → `'general'`

**App Action:**
- **No change needed** - Server handles mapping automatically
- But if app is directly querying remedies by theme, use database enum values

#### 3. Varshfal Current Bhav Fix

**Issue:** Varshfal timeline was skipping current bhav (period that includes window start date)

**Fix Applied (Server-side):**
- Server now correctly identifies and includes current bhav
- Current bhav is marked with `is_current: true`
- Timeline always starts from window start date

**App Action:**
- **No change needed** - Server handles this automatically
- App should display periods with `is_current: true` as "Current Period"
- Ensure timeline periods are displayed in order (sorted by `from` date)

#### 4. Varshfal Timeline Periods

**Fix:** Timeline periods now:
- Always start from `window.start_at` (not birth date)
- Include current bhav even if it started before window start
- Cover next 12 months from window start date
- Dates in ISO format: `"YYYY-MM-DD"`

**App Action:**
- **No change needed** - Server handles this automatically
- Display timeline periods as received from API
- Highlight period with `is_current: true`

---

## Complete Integration Example (React Native / JavaScript)

```javascript
const API_BASE = 'http://localhost:3000';

// Step 1: Create window with chart data
async function createYearlyWindow(userId, chartId, year, chartData) {
  const response = await fetch(`${API_BASE}/windows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      chart_id: chartId,
      scope: 'yearly',
      date: `${year}-01-15`, // Use any date in the year
      timezone: 'Asia/Kolkata',
      chart_data: chartData,
    }),
  });
  
  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error);
  }
  
  return data.window.id; // Return window ID
}

// Step 2: Get kundli
async function getKundli(windowId) {
  const response = await fetch(`${API_BASE}/kundli/yearly/${windowId}`);
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(data.error);
  }
  
  return data; // Returns full kundli with sections
}

// Usage
async function generateYearlyKundli(userId, chartId, year, chartData) {
  try {
    // Create window
    const windowId = await createYearlyWindow(userId, chartId, year, chartData);
    
    // Get kundli
    const kundli = await getKundli(windowId);
    
    return kundli;
  } catch (error) {
    console.error('Error generating kundli:', error);
    throw error;
  }
}
```

---

---

## Quick Reference: All Endpoints

| Endpoint | Method | Purpose | Required Data |
|----------|--------|---------|--------------|
| `/users/ensure` | POST | Create/get user | `firebaseUid`, `email` |
| `/users/:firebaseUid/windows` | GET | List user windows | `scope`, `date` (query params) |
| `/windows` | POST | Create window | `user_id`, `chart_id`, `scope`, `chart_data` |
| `/windows/:windowId/astro-snapshot` | POST | Update chart data | `chart_data` |
| `/predictions/:windowId` | GET | Get prediction | `lang` (query param) |
| `/kundli/:windowId` | GET | Get kundli | - |
| `/varshfal/:windowId` | GET | Get Varshfal | Yearly window |
| `/mahadasha-phal/:windowId` | GET | Get Mahadasha Phal | `dasha` in chart_data |
| `/transit-today/:windowId` | GET | Get Transit Today | `transits` in chart_data, `date` (query param) |
| `/lalkitab-prediction/:windowId` | GET | Get Lal Kitab | Planet positions in chart_data |

---

## Integration Checklist

### ✅ Pre-Integration

- [ ] Read this complete guide
- [ ] Understand chart data structure requirements
- [ ] Set up API base URL (development/production)
- [ ] Prepare chart calculation logic

### ✅ Chart Data Preparation

- [ ] Calculate all 9 planets (SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, RAHU, KETU)
- [ ] Calculate houses (1-12) with signs
- [ ] Calculate lagna and moon positions
- [ ] For Varshfal: Calculate `varshaphal.dashaPeriods` (optional)
- [ ] For Mahadasha Phal: Calculate `dasha.mahadashaPeriods` (required)
- [ ] For Transit Today: Calculate `transits` array (required)

### ✅ API Integration

- [ ] Implement user ensure flow
- [ ] Implement window create/get flow
- [ ] Implement chart data update flow
- [ ] Implement prediction fetch flow
- [ ] Implement specialized endpoints (Varshfal, Mahadasha, Transit, Lal Kitab)
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add caching strategy

### ✅ Testing

- [ ] Test with different scopes (daily, monthly, yearly)
- [ ] Test with different dates
- [ ] Test error scenarios (network errors, invalid data)
- [ ] Verify all endpoints return expected data
- [ ] Test with real user data

---

## Support

For questions or issues:
- Check error messages in API responses
- Verify chart_data structure matches requirements
- Ensure window scope matches endpoint (e.g., `/kundli/yearly/:windowId` requires `scope: "yearly"`)

---

---

## Universal Knowledge-Aware System (December 2025)

### Overview

The prediction system now uses a **Universal Knowledge-Aware** architecture that preserves maximum astrology knowledge from source books (Lal Kitab, BParasharHoraShastra, etc.).

### Rule Classification

Rules are classified into three categories:

1. **EXECUTABLE** (`rule_nature = 'EXECUTABLE'`)
   - Clear planet + house mapping
   - `execution_status = 'READY'`
   - Used for actual prediction generation
   - Example: "Jupiter in 1st house supports wisdom and leadership"

2. **ADVISORY** (`rule_nature = 'ADVISORY'`)
   - Situational, behavioral, or partial mapping
   - `execution_status = 'PENDING'`
   - May be included for context (future enhancement)
   - Example: "During challenging periods, patience is advised"

3. **OBSERVATIONAL** (`rule_nature = 'OBSERVATIONAL'`)
   - Philosophical, symbolic, or observational
   - `execution_status = 'RAW'`
   - Knowledge preservation (not used in execution)
   - Example: "Traditional texts note that certain combinations indicate..."

### Rule Execution Status

- **READY**: Rule can be executed immediately (EXECUTABLE rules)
- **PENDING**: Rule needs setup or is advisory (ADVISORY rules)
- **RAW**: Rule is knowledge-only (OBSERVATIONAL rules)

### Prediction Generation

The prediction engine:
- **Uses**: Rules with `execution_status = 'READY'` (EXECUTABLE rules)
- **Prioritizes**: EXECUTABLE rules over ADVISORY rules
- **Preserves**: All rules in database (knowledge layer)

### API Response Changes

#### `/windows/:windowId/generate` Response

Now includes `ruleExecutionInfo`:

```json
{
  "ok": true,
  "windowId": 789,
  "predictionId": 123,
  "prediction": { ... },
  "summary": { ... },
  "shortSummary": "...",
  "appliedRuleCount": 45,
  "remedies": [ ... ],
  "ruleExecutionInfo": {
    "totalRulesEvaluated": 45,
    "executableRules": 42,
    "advisoryRules": 3
  }
}
```

#### `/predictions/:windowId` Response

Applied rules now include universal knowledge metadata:

```json
{
  "ok": true,
  "prediction": { ... },
  "appliedRules": [
    {
      "id": 1,
      "rule_id": 456,
      "score": 0.75,
      "weight": 1.0,
      "rule_effect_json": { ... },
      "rule_nature": "EXECUTABLE",
      "execution_status": "READY",
      "raw_rule_type": "direct",
      "confidence_level": "HIGH",
      "source_book": "lalkitab",
      "rule_type": "BASE",
      "canonical_meaning": "..."
    }
  ],
  "remedies": [ ... ]
}
```

### Source Books

Current books in system:
- **lalkitab**: 769 rules, 501 remedies
- **BParasharHoraShastra**: 1979 rules, 1105 remedies

### Knowledge Preservation

- **All rules preserved**: Even if not executable
- **No deduplication**: Each source entry = one DB row
- **Confidence levels**: HIGH, MEDIUM, LOW (all preserved)
- **Source tracking**: `source_book` field tracks origin

### Quality Improvements (December 2025)

**Post-Ingestion Quality Polish:**
- **Specific Narratives**: Generic phrases like "This planetary configuration creates specific influences" have been replaced with specific life-domain descriptions (e.g., "This placement influences self-identity and personality, bringing emotions and related energies").
- **Grammar Fixes**: Correct ordinal formatting (1st, 2nd, 3rd house instead of 1th, 2th, 3th).
- **Placeholder Removal**: Removed placeholder text like "(house)" and "Unknown sign" from narratives.
- **Repetition Reduction**: Adjacent repetitive sentences have been cleaned up for better readability.
- **Transit/Dasha Quality**: Transit Today, Mahadasha Phal, and Varshfal narratives now include specific life-domain information instead of generic descriptions.

**Impact:**
- Predictions are more informative and meaningful
- Text reads naturally, like a human astrologer explaining
- No awkward grammar or placeholder text
- Better user experience with clearer, more specific predictions

---

**Last Updated:** 2025-12-25

**Recent Updates:**
- **Quality Polish Pass (Dec 2025)**: Improved prediction narrative quality
  - Generic narratives replaced with specific life-domain descriptions
  - Ordinal grammar fixed (1st, 2nd, 3rd instead of 1th, 2th, 3th)
  - Placeholder text removed
  - Repetition reduced for better readability
  - Transit, Dasha, and Varshfal narratives now more informative
- **Universal Knowledge-Aware System**: Rules now classified as EXECUTABLE/ADVISORY/OBSERVATIONAL
- **Execution Status**: Rules filtered by `execution_status = 'READY'` for predictions
- **Rule Metadata**: API responses include `rule_nature`, `execution_status`, `raw_rule_type`, `confidence_level`
- **Multiple Books**: System now supports multiple source books (Lal Kitab, BParasharHoraShastra)
- Fixed remedy type enum (`'jap'` → `'mantra'`)
- Fixed prediction theme enum mapping (domain names → database enum values)
- Fixed Varshfal current bhav detection and inclusion
- Improved Varshfal timeline period generation

