# Testing Checklist: Ride Analysis with AI Coach

## Prerequisites
- [ ] Database migration completed (`npx tsx scripts/migrate-ride-analyses.ts`)
- [ ] OpenAI API key configured in `.env.local`
- [ ] Dev server running (`npm run dev`)
- [ ] Logged in with Strava account
- [ ] At least one ride in your Strava account

## 1. Basic Page Load
- [ ] Navigate to `/rides/[activity_id]` with a valid Strava activity ID
- [ ] Page loads without errors
- [ ] Ride name and date display correctly
- [ ] Key metrics (distance, time, elevation, etc.) display correctly
- [ ] Charts render (Power/HR, Elevation, Speed/Cadence)

## 2. AI Chat Interface
- [ ] Chat interface is visible at the top of the page
- [ ] Empty state shows welcome message and suggested questions
- [ ] Three suggested question buttons are clickable
- [ ] Clicking a suggested question populates the input field

## 3. Asking Questions
- [ ] Type a question in the text area
- [ ] Send button becomes enabled when text is entered
- [ ] Press Enter sends the question
- [ ] Shift+Enter creates a new line (doesn't send)
- [ ] User message appears in chat immediately
- [ ] Loading indicator (three bouncing dots) appears
- [ ] AI response appears after a few seconds
- [ ] Response is relevant and well-formatted
- [ ] Timestamp shows on each message

## 4. Conversation Context
- [ ] Ask a follow-up question referencing the previous answer
- [ ] AI response acknowledges the previous context
- [ ] Conversation flows naturally

## 5. Context-Aware Responses
Test questions that should leverage training context:
- [ ] "How does this compare to my recent rides?"
  - Verify AI references your training history
- [ ] "How does this fit with my goals?"
  - Verify AI mentions your active goals (if any)
- [ ] "Is this intensity appropriate for my FTP?"
  - Verify AI uses your FTP setting (if configured)

## 6. Adding Personal Context
- [ ] Ask: "I felt really tired today, should I be concerned about my performance?"
- [ ] Verify AI acknowledges your stated condition
- [ ] Ask a follow-up referencing the same context

## 7. Conversation History
- [ ] Refresh the page
- [ ] Verify all previous messages are still visible
- [ ] Verify messages are in correct order
- [ ] Navigate away and back to the ride
- [ ] Verify conversation persists

## 8. Multiple Rides
- [ ] Navigate to a different ride
- [ ] Verify it shows a fresh/empty conversation
- [ ] Ask a question on this new ride
- [ ] Go back to the first ride
- [ ] Verify the first ride's conversation is still there

## 9. Edge Cases
- [ ] Try sending an empty message - should not send
- [ ] Try sending a very long message (500+ characters)
- [ ] Try asking multiple questions rapidly (spam the send button)
- [ ] Check that only one AI request happens at a time

## 10. Error Handling
- [ ] Temporarily disable internet connection
- [ ] Try asking a question
- [ ] Verify friendly error message appears
- [ ] Restore connection and try again

## 11. Mobile Responsiveness
- [ ] Resize browser to mobile width
- [ ] Verify chat interface is still usable
- [ ] Verify metrics grid adapts to smaller screen
- [ ] Verify charts are readable on mobile

## 12. Performance
- [ ] Initial page load is fast (<2 seconds)
- [ ] AI responses arrive in reasonable time (3-7 seconds)
- [ ] Scrolling is smooth
- [ ] No console errors

## 13. Data Accuracy
- [ ] Compare displayed metrics with Strava
- [ ] Verify distance, time, elevation match
- [ ] Verify power and heart rate data match (if available)
- [ ] Check that charts show reasonable data

## 14. AI Quality
Test various question types:
- [ ] Performance analysis: "How did I perform?"
- [ ] Pacing: "Was my pacing good?"
- [ ] Training advice: "What should I focus on?"
- [ ] Technical: "Why was my variability index high?"
- [ ] Strategic: "How should I prepare for a 200-mile ride?"

Verify responses are:
- [ ] Specific and data-driven
- [ ] Encouraging but honest
- [ ] Actionable
- [ ] Appropriate length (not too short or too long)

## 15. Database Verification
If you have database access:
```sql
-- Check that conversations are being saved
SELECT * FROM ride_analyses ORDER BY created_at DESC LIMIT 10;

-- Check for a specific ride
SELECT user_prompt, ai_response, created_at 
FROM ride_analyses 
WHERE activity_id = [your_activity_id] 
ORDER BY created_at ASC;
```

## Known Limitations / Future Enhancements
- [ ] No streaming responses (full response arrives at once)
- [ ] No export/download conversation feature
- [ ] No ability to edit or delete messages
- [ ] No markdown rendering in AI responses
- [ ] No ability to attach images or additional data

## Bug Reporting
If you find issues, note:
1. What you were trying to do
2. What you expected to happen
3. What actually happened
4. Any error messages in console
5. Browser and OS information

## Success Criteria
✅ All basic functionality works without errors  
✅ AI responses are relevant and helpful  
✅ Conversation history persists correctly  
✅ Page performs well on desktop and mobile  
✅ User experience is smooth and intuitive



