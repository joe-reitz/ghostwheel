# Individual Ride Analysis with AI Coach

## Overview

The Individual Ride Analysis page provides a conversational AI coaching experience where you can ask questions about your ride, get performance insights, and receive personalized training advice.

## Features

### 1. Comprehensive Ride Metrics
- Distance, time, elevation
- Speed and power data
- Heart rate metrics
- Advanced metrics (TSS, IF, VI)
- Interactive charts for power, heart rate, speed, cadence, and elevation

### 2. Conversational AI Coach
- Ask any question about your ride performance
- Add contextual information (how you felt, weather conditions, etc.)
- Get personalized coaching feedback based on your goals and training history
- Conversation history is saved for each ride

### 3. Context-Aware Analysis
The AI coach has access to:
- Complete ride metrics
- Your FTP and max heart rate settings
- Recent training history (last 5 rides)
- Your active goals
- Previous conversations about this ride

## Example Questions to Ask

### Performance Analysis
- "How did I perform on this ride?"
- "Was my power output appropriate for this effort?"
- "How does this compare to my recent rides?"
- "Did I achieve my training goals for this ride?"

### Pacing & Strategy
- "Was my pacing good for this ride?"
- "Should I have gone easier/harder?"
- "How could I improve my pacing on similar rides?"
- "What's the ideal pacing strategy for this route?"

### Training Insights
- "What should I focus on improving?"
- "How does this ride fit into my training plan?"
- "What type of workout should I do next?"
- "Am I training too hard or not hard enough?"

### Technical Analysis
- "Why was my variability index high?"
- "What does my intensity factor tell me?"
- "Is my power-to-heart-rate relationship normal?"
- "How efficient was this ride?"

### Context & Conditions
You can also add context to help the AI provide better advice:
- "I felt really tired today because I didn't sleep well. Should I be concerned about my performance?"
- "The wind was really strong on this ride. How should I interpret these numbers?"
- "This was a recovery ride. Did I keep it easy enough?"
- "I'm training for a 200-mile event. How should this ride fit into my plan?"

## How to Use

1. **Navigate to a Ride**: From the Rides page, click on any ride to view its details
2. **Review the Metrics**: Check out the charts and key metrics at the top
3. **Start a Conversation**: 
   - Use one of the suggested starter questions, or
   - Type your own question in the text area
4. **Add Context**: Share information about how you felt, conditions, or goals
5. **Ask Follow-ups**: Continue the conversation to dig deeper into specific aspects

## Tips for Getting the Best Insights

1. **Be Specific**: Instead of "How was this ride?", try "How does my power output compare to my FTP, and was this an appropriate intensity for base training?"

2. **Add Context**: The more context you provide about how you felt, external conditions, or your goals, the better the AI can tailor its advice.

3. **Ask Follow-ups**: Don't hesitate to ask clarifying questions or dig deeper into recommendations.

4. **Share Goals**: Mention your upcoming events or goals so the AI can provide relevant advice.

5. **Review History**: Your conversation is saved, so you can come back later and continue the discussion.

## Privacy & Data

- All conversations are stored securely in your account
- Only you can see your ride analyses and conversations
- The AI coach uses OpenAI's GPT-4o model
- No ride data is shared with third parties except as required for AI processing

## Troubleshooting

### "Failed to fetch activity"
- Ensure you're logged in to Strava
- Check that the ride exists in your Strava account
- Try refreshing the page

### "Failed to get AI response"
- Check your internet connection
- Ensure the OpenAI API key is configured
- Try asking your question again

### No conversation history showing
- This is normal for the first analysis of a ride
- Once you ask your first question, the conversation will be saved

## Technical Details

### Data Sources
- Ride metrics: Strava API
- User profile: Database (FTP, max HR, etc.)
- Training history: Recent rides from database
- Goals: Active goals from database

### AI Model
- Model: GPT-4o
- Temperature: 0.7 (balanced between consistency and creativity)
- Max tokens: 1000 per response
- System prompt: Experienced cycling coach persona

### Performance
- Initial load: ~1-2 seconds for ride data
- AI response: ~2-5 seconds per question
- Conversation history: Loaded on page load

