# DivyAstroDB - Node.js Setup Guide

## ✅ Setup Complete!

Your Node.js project is ready with PostgreSQL connection and input/output functionality.

## 📁 Project Structure

```
DivyAstroDB/
├── config/
│   └── db.js              # Database connection pool
├── models/
│   ├── predictionWindow.js # Prediction window CRUD operations
│   └── prediction.js      # Prediction CRUD operations
├── index.js                # Main entry point with examples
├── test-connection.js     # Connection test script
├── .env                   # Database configuration (gitignored)
├── package.json
└── schema_divyastrodb.sql
```

## 🚀 Quick Start

### 1. Test Database Connection

```bash
npm test
```

Expected output: Should show all 13 tables and connection success.

### 2. Run Example Code

```bash
npm start
```

This will:
- Create a daily prediction window
- Create a sample prediction
- Fetch predictions for a user
- Show highlighted predictions for home screen

## 📝 Available Functions

### Prediction Windows

```javascript
import * as PredictionWindow from './models/predictionWindow.js';

// Create a window
const window = await PredictionWindow.createPredictionWindow({
  user_id: 1,
  chart_id: 1,
  scope: 'daily',
  start_at: new Date('2024-12-01T00:00:00Z'),
  end_at: new Date('2024-12-01T23:59:59Z'),
  timezone: 'Asia/Kolkata'
});

// Get windows for a user
const windows = await PredictionWindow.getPredictionWindows(1, 'daily', 10);

// Get single window
const window = await PredictionWindow.getPredictionWindowById(windowId);

// Update window
const updated = await PredictionWindow.updatePredictionWindow(windowId, {
  is_processed: true
});
```

### Predictions

```javascript
import * as Prediction from './models/prediction.js';

// Create a prediction
const prediction = await Prediction.createPrediction({
  window_id: 1,
  user_id: 1,
  chart_id: 1,
  scope: 'daily',
  status: 'generated',
  language_code: 'hi',
  summary_json: {
    headline: 'आज का सारांश...',
    money: { trend: 'up', intensity: 0.8 }
  },
  short_summary: 'आज का सारांश...',
  final_text: 'पूरा prediction text...',
  highlight_on_home: true
});

// Get predictions for user
const predictions = await Prediction.getPredictions(1, 'daily', 'hi', 10);

// Get highlighted predictions (for home screen)
const highlighted = await Prediction.getHighlightedPredictions(1, 'hi', 5);

// Get single prediction
const pred = await Prediction.getPredictionById(predictionId);

// Update prediction
const updated = await Prediction.updatePrediction(predictionId, {
  status: 'generated',
  final_text: 'Updated text...'
});
```

## 🔧 Configuration

Edit `.env` file to change database settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=divyastrodb_dev
DB_USER=vikassharma
DB_PASSWORD=
```

## 📊 Database Schema

All tables are ready:
- `prediction_windows` - Time/dasha windows
- `astro_state_snapshots` - Astro context snapshots
- `rules`, `rule_groups` - Knowledge base
- `text_templates` - Prediction templates
- `predictions` - Final predictions
- `prediction_applied_rules` - Applied rules tracking
- `remedies` - Remedy definitions
- `prediction_feedback` - User feedback

## 🎯 Next Steps

1. **Add more models** for other tables (rules, templates, remedies, etc.)
2. **Create API endpoints** (Express.js, Fastify, etc.)
3. **Add validation** using libraries like Joi or Zod
4. **Add error handling middleware**
5. **Create batch jobs** for generating windows and predictions

## 💡 Example Usage in Your App

```javascript
import * as Prediction from './models/prediction.js';

// In your API route or function
async function getDailyPrediction(userId) {
  const predictions = await Prediction.getPredictions(userId, 'daily', 'hi', 1);
  return predictions[0];
}

// For home screen
async function getHomeScreenData(userId) {
  const highlighted = await Prediction.getHighlightedPredictions(userId, 'hi', 5);
  return highlighted;
}
```

## 🐛 Troubleshooting

**Connection Error?**
- Check PostgreSQL is running: `brew services list | grep postgres`
- Verify database exists: `psql -l | grep divyastrodb_dev`
- Check `.env` file has correct credentials

**Module Not Found?**
- Run `npm install` again
- Check you're using Node.js 14+ (ES modules support)

