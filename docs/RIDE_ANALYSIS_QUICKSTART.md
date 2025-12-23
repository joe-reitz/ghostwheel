# Ride Analysis with AI Coach - Quick Start

## 🚀 Quick Start (3 Steps)

### Step 1: Run Database Migration
```bash
npx tsx scripts/migrate-ride-analyses.ts
```

### Step 2: Verify Environment
Make sure `.env.local` has:
```bash
OPENAI_API_KEY=sk-...
```

### Step 3: Test It
1. Start dev server: `npm run dev`
2. Log in with Strava
3. Click on any ride from the Rides page
4. Start chatting with your AI coach!

## 💡 What Can You Ask?

### Performance Questions
- "How did I perform on this ride?"
- "Was this a good workout?"
- "How hard did I push today?"

### Pacing & Strategy
- "Was my pacing good?"
- "Should I have gone easier at the start?"
- "What's the best way to pace this route?"

### Training Advice
- "What should I improve?"
- "How does this fit my training plan?"
- "Am I training too hard?"
- "What workout should I do next?"

### Technical Analysis
- "Why is my variability index so high?"
- "What does my power distribution tell me?"
- "Is my heart rate response normal?"

### Context & Conditions
- "I felt really tired - should I be concerned?"
- "There was a strong headwind - how should I interpret these numbers?"
- "This was supposed to be a recovery ride - did I keep it easy enough?"

## 🎯 Pro Tips

1. **Be Specific**: Instead of "How was this?", ask "How does my average power compare to my FTP for this 2-hour endurance ride?"

2. **Add Context**: Share how you felt, weather conditions, sleep quality, etc. The AI will factor this into its analysis.

3. **Ask Follow-ups**: The AI remembers your conversation, so dig deeper!

4. **Reference Your Goals**: Mention upcoming events or goals for more targeted advice.

## 📊 What the AI Knows About You

When you ask a question, the AI has access to:
- ✅ Complete metrics from this ride
- ✅ Your FTP and max heart rate settings
- ✅ Your last 5 rides (for comparison)
- ✅ Your active goals and target dates
- ✅ The entire conversation history for this ride

## 🔧 Features

- **Smart Context**: AI understands your training history and goals
- **Persistent Conversations**: Come back anytime to continue the discussion
- **Real-time Analysis**: Instant responses to your questions
- **Multiple Rides**: Each ride has its own conversation thread
- **Beautiful UI**: Clean, modern interface with smooth animations

## 📱 Works On

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers
- ✅ Tablets

## 🆘 Troubleshooting

**"Failed to fetch activity"**
- Make sure you're logged in to Strava
- Verify the activity ID in the URL is correct

**"Failed to get AI response"**
- Check your internet connection
- Verify OPENAI_API_KEY is set correctly
- Check browser console for detailed errors

**No previous conversation showing**
- This is normal for the first visit to a ride
- Once you ask a question, it will be saved

**AI response seems generic**
- Make sure your FTP is set in Settings
- Add more context in your questions
- Try being more specific about what you want to know

## 📚 More Documentation

- [Full Feature Documentation](./RIDE_ANALYSIS.md)
- [Setup Guide](../RIDE_ANALYSIS_SETUP.md)
- [Testing Checklist](../TESTING_CHECKLIST_RIDE_ANALYSIS.md)

## 🎉 Example Conversation

```
You: How did I perform on this ride?

AI: Great ride! With 220W average over 2 hours, you were riding at 
about 73% of your 300W FTP, which is perfect for a Zone 2 endurance 
ride. Your heart rate averaged 145bpm, staying comfortably below your 
threshold, and your pacing was very consistent with a variability 
index of 1.06.

This is exactly the kind of steady, sustainable effort that builds 
aerobic base fitness. Compared to your recent rides, this shows good 
consistency in your training approach.

You: Should I have pushed harder?

AI: No, actually this intensity was spot-on for base building. Since 
you're training for the Seattle to Portland ride, these Zone 2 rides 
at 70-75% FTP are crucial. They build the endurance you'll need to 
sustain 17mph for 200+ miles without overreaching...

[conversation continues]
```

## 🚴‍♂️ Ready to Ride?

Head to any ride and start chatting with your AI coach. The more you use it, 
the better it gets at understanding your training!

Happy riding! 🚴‍♀️💨





