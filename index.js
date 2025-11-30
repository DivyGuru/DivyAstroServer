import { query } from './config/db.js';
import * as PredictionWindow from './models/predictionWindow.js';
import * as Prediction from './models/prediction.js';

/**
 * Example: Create a daily prediction window
 */
async function createDailyWindowExample() {
  console.log('\n📅 Creating a daily prediction window...\n');
  
  try {
    const window = await PredictionWindow.createPredictionWindow({
      user_id: 1,
      chart_id: 1,
      scope: 'daily',
      start_at: new Date('2024-12-01T00:00:00Z'),
      end_at: new Date('2024-12-01T23:59:59Z'),
      timezone: 'Asia/Kolkata'
    });
    
    console.log('✅ Window created:', {
      id: window.id,
      scope: window.scope,
      start_at: window.start_at,
      end_at: window.end_at
    });
    
    return window;
  } catch (error) {
    console.error('❌ Error creating window:', error.message);
    throw error;
  }
}

/**
 * Example: Create a prediction for the window
 */
async function createPredictionExample(windowId) {
  console.log('\n🔮 Creating prediction...\n');
  
  try {
    const prediction = await Prediction.createPrediction({
      window_id: windowId,
      user_id: 1,
      chart_id: 1,
      scope: 'daily',
      status: 'generated',
      language_code: 'hi',
      summary_json: {
        headline: 'आज आर्थिक और काम के लिए सहयोगी दिन है।',
        money: { trend: 'up', intensity: 0.8 },
        career: { trend: 'steady', intensity: 0.6 },
        relationship: { trend: 'sensitive', intensity: 0.4 }
      },
      short_summary: 'आज आर्थिक और काम के लिए सहयोगी दिन है।',
      final_text: 'आज का दिन आपके लिए आर्थिक रूप से सकारात्मक रहेगा। कार्यक्षेत्र में स्थिरता बनी रहेगी। रिश्तों में थोड़ी संवेदनशीलता रह सकती है, इसलिए सावधानी बरतें।',
      generated_by: 'rule_engine',
      highlight_on_home: true
    });
    
    console.log('✅ Prediction created:', {
      id: prediction.id,
      status: prediction.status,
      short_summary: prediction.short_summary,
      highlight_on_home: prediction.highlight_on_home
    });
    
    return prediction;
  } catch (error) {
    console.error('❌ Error creating prediction:', error.message);
    throw error;
  }
}

/**
 * Example: Get predictions for a user
 */
async function getPredictionsExample(userId) {
  console.log('\n📖 Fetching predictions for user...\n');
  
  try {
    const predictions = await Prediction.getPredictions(userId, 'daily', 'hi', 5);
    
    console.log(`✅ Found ${predictions.length} predictions:\n`);
    predictions.forEach((pred, index) => {
      console.log(`${index + 1}. [${pred.scope}] ${pred.short_summary || 'No summary'}`);
      console.log(`   Status: ${pred.status} | Highlight: ${pred.highlight_on_home}`);
      console.log(`   Generated: ${pred.generated_at}\n`);
    });
    
    return predictions;
  } catch (error) {
    console.error('❌ Error fetching predictions:', error.message);
    throw error;
  }
}

/**
 * Example: Get highlighted predictions for home screen
 */
async function getHighlightedPredictionsExample(userId) {
  console.log('\n🏠 Fetching highlighted predictions for home screen...\n');
  
  try {
    const highlighted = await Prediction.getHighlightedPredictions(userId, 'hi', 3);
    
    console.log(`✅ Found ${highlighted.length} highlighted predictions:\n`);
    highlighted.forEach((pred, index) => {
      console.log(`${index + 1}. ${pred.short_summary}`);
      console.log(`   Scope: ${pred.scope} | Date: ${pred.start_at}\n`);
    });
    
    return highlighted;
  } catch (error) {
    console.error('❌ Error fetching highlighted predictions:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('🚀 DivyAstroDB - Node.js Example');
  console.log('='.repeat(60));
  
  try {
    // Test connection first
    await query('SELECT 1');
    console.log('✅ Database connection verified\n');
    
    // Example 1: Create a daily window
    const window = await createDailyWindowExample();
    
    // Example 2: Create a prediction
    const prediction = await createPredictionExample(window.id);
    
    // Example 3: Get all predictions for user
    await getPredictionsExample(1);
    
    // Example 4: Get highlighted predictions
    await getHighlightedPredictionsExample(1);
    
    console.log('='.repeat(60));
    console.log('✅ All examples completed successfully!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error in main:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

