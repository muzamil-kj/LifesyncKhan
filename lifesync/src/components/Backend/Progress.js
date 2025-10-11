import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/LifesyncDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Mongoose Schemas
const progressSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  chatbotInteractions: { type: Number, default: 0 },
  journalEntries: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  chatbotInteractionsPerDay: [
    {
      day: String,
      count: Number
    }
  ],
  activeTimePerDay: [
    {
      day: String,
      minutes: Number
    }
  ],
  moodData: [
    {
      date: Date,
      value: Number // 0-5 scale (0=angry, 5=happy)
    }
  ]
});

const Progress = mongoose.model('Progress', progressSchema);

// 📌 Unified Weekday Order: Monday to Sunday
const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Update to use local day (getDay() for local time)
const getTodayName = () => {
  const index = (new Date().getDay() + 6) % 7; // Shift Sunday=0 to Sunday=6 for local time
  return orderedDays[index];
};

// Modify to get the correct order of days, starting from today
const getCurrentWeekDays = () => {
  const todayIndex = new Date().getDay(); // Local day index
  const daysInWeek = [...orderedDays];
  return daysInWeek.slice(todayIndex).concat(daysInWeek.slice(0, todayIndex));
};

const initializeProgressData = (userId) => {
  return new Progress({
    userId,
    chatbotInteractionsPerDay: orderedDays.map(day => ({ day, count: 0 })),
    journalEntries: 0, // Initialize to 0
    moodData: [
      { date: new Date(Date.now() - 86400000), value: 3 },
      { date: new Date(Date.now() - 172800000), value: 4 }
    ],
    activeTimePerDay: orderedDays.map(day => ({ day, minutes: 0 })) // Initialize all days
  });
};
// API Routes
app.get('/progress/:userId', async (req, res) => {
  try {
    let progress = await Progress.findOne({ userId: req.params.userId });

    if (!progress) {
      progress = await initializeProgressData(req.params.userId).save();
    }

    res.json({
      chatbotInteractions: progress.chatbotInteractions,
      journalEntries: progress.journalEntries,
      lastActive: formatLastActive(progress.lastActive),
      chatbotInteractionsPerDay: progress.chatbotInteractionsPerDay,
      activeTimePerDay: progress.activeTimePerDay,
      moodData: progress.moodData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/mood', async (req, res) => {
  try {
    const { userId, mood, date } = req.body;

    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = await initializeProgressData(userId);
    }

    progress.moodData.push({
      date: date || new Date(),
      value: mood
    });

    if (progress.moodData.length > 30) {
      progress.moodData = progress.moodData.slice(-30);
    }

    await progress.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📊 Mood Trend for Line Chart
app.get('/mood-trend/:userId', async (req, res) => {
  try {
    const progress = await Progress.findOne({ userId: req.params.userId });
    if (!progress) {
      return res.status(404).json({ message: 'User progress not found' });
    }

    const sortedMood = [...progress.moodData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const lastSeven = sortedMood.slice(-7).map(entry => ({
      date: new Date(entry.date).toISOString().split('T')[0],
      value: entry.value
    }));

    res.json({ moodTrend: lastSeven });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📥 Update chatbot interaction counts
app.post('/chatbot-interaction', async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('➡️ Received request to /chatbot-interaction');
    console.log('🧑‍💻 userId from frontend:', userId);

    if (!userId) {
      console.log('❌ No userId provided in request body.');
      return res.status(400).json({ message: 'Missing userId' });
    }

    const today = getTodayName();
    console.log('📅 Today is (UTC):', today);

    let progress = await Progress.findOne({ userId });
    if (!progress) {
      console.log('🆕 No progress found. Initializing new progress data...');
      progress = await initializeProgressData(userId);
    } else {
      console.log('✅ Found existing progress document.');
    }

    progress.chatbotInteractions += 1;
    console.log('🔁 chatbotInteractions incremented to:', progress.chatbotInteractions);

    const dayEntry = progress.chatbotInteractionsPerDay.find(entry => entry.day === today);
    if (dayEntry) {
      dayEntry.count += 1;
      console.log(`📈 Updated ${today} interaction count to:`, dayEntry.count);
    } else {
      progress.chatbotInteractionsPerDay.push({ day: today, count: 1 });
      console.log(`🆕 Added new day entry for ${today} with count: 1`);
    }

    progress.lastActive = new Date();
    console.log('⏱️ Updated lastActive to:', progress.lastActive);

    await progress.save();
    console.log('✅ Progress document saved successfully.');

    res.json({ success: true });
  } catch (err) {
    console.error('❗ Error in /chatbot-interaction route:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 🧭 Helper: format last active
function formatLastActive(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

// ⏱️ Update active time
// utils/timeTracking.js
const getCurrentDay = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
};

const getCurrentDateKey = () => {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
};

// Enhanced active time endpoint
app.post('/active-time', async (req, res) => {
  try {
    const { userId, seconds } = req.body;

    // Find or create progress record
    let progress = await Progress.findOne({ userId }) || await initializeProgressData(userId);

    const day = getCurrentDay();
    const dateKey = getCurrentDateKey();
    
    // Update daily time
    const dayEntry = progress.activeTimePerDay.find(entry => entry.day === day);
    if (dayEntry) {
      dayEntry.minutes = Math.floor((dayEntry.minutes * 60 + seconds) / 60);
    } else {
      progress.activeTimePerDay.push({ 
        day, 
        minutes: Math.floor(seconds / 60) 
      });
    }

    // Update detailed time log (optional)
    if (!progress.timeLogs) progress.timeLogs = {};
    progress.timeLogs[dateKey] = (progress.timeLogs[dateKey] || 0) + seconds;
    
    await progress.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating active time:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this new route to Progress.js
// Modify the journal-entry endpoint to include max entries logic
app.post('/journal-entry', async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('📔 Received journal entry for user:', userId);

    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = await initializeProgressData(userId);
    }

    // Increment journal entries count (capped at 1000)
    progress.journalEntries = Math.min(1000, progress.journalEntries + 1);
    progress.lastActive = new Date();

    await progress.save();
    console.log('✅ Journal entry logged successfully. Total:', progress.journalEntries);
    res.json({ 
      success: true,
      journalEntries: progress.journalEntries
    });
  } catch (err) {
    console.error('Error logging journal entry:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Similarly update the journal-entry-delete endpoint
app.post('/journal-entry-delete', async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('🗑️ Received journal entry deletion for user:', userId);

    let progress = await Progress.findOne({ userId });
    if (!progress) {
      return res.status(404).json({ message: 'User progress not found' });
    }

    // Decrement journal entries count (but don't go below 0)
    progress.journalEntries = Math.max(0, progress.journalEntries - 1);
    progress.lastActive = new Date();

    await progress.save();
    console.log('✅ Journal entry decremented successfully. Total:', progress.journalEntries);
    res.json({ 
      success: true,
      journalEntries: progress.journalEntries
    });
  } catch (err) {
    console.error('Error decrementing journal entry:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Progress server running on http://localhost:${PORT}`);
});
