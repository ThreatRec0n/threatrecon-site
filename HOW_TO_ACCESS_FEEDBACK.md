# 📊 How to Access Feedback

There are **multiple ways** to access your simulation feedback after completing an investigation:

---

## 🎯 Method 1: Automatic Redirect (Primary)

**When you finalize an investigation:**
1. Click "Finalize Investigation" button
2. Your results are automatically submitted
3. You are **automatically redirected** to the detailed feedback page:
   - URL: `/simulation/feedback/[id]`
   - Shows complete feedback with explanations, MITRE ATT&CK references, and OWASP links

**This is the main way to access feedback immediately after completing a simulation.**

---

## 🔄 Method 2: From Evaluation Report Modal

**If the redirect doesn't happen or you want to view feedback again:**

1. After finalizing, the **Evaluation Report modal** appears
2. Look for the **"📊 View Detailed Feedback"** button in the bottom-left
3. Click it to navigate to the full feedback page

**Note:** This button only appears if feedback was successfully submitted and an ID was generated.

---

## 📈 Method 3: From Progress Dashboard

**To view feedback from past simulations:**

1. Navigate to **`/dashboard`** (Progress Dashboard)
2. Scroll to the **"Recent Results"** section
3. Each completed simulation shows:
   - Scenario name
   - Score
   - Completion time
   - Skill level
   - **"View Feedback"** button (if feedback is available)

4. Click **"View Feedback"** to see the detailed feedback for that simulation

**Note:** Feedback links are automatically matched to results based on scenario type and timestamp.

---

## 🔍 Method 4: Direct URL Access

**If you know the feedback ID:**

1. Feedback IDs are stored in:
   - **localStorage** (key: `threatrecon_feedback_results`)
   - **Supabase** (if enabled, in `simulation_results` table)

2. Navigate directly to:
   ```
   /simulation/feedback/[feedback-id]
   ```

3. Example:
   ```
   /simulation/feedback/local-1234567890
   ```

---

## 💾 Where Feedback is Stored

### localStorage (Always Available)
- **Key:** `threatrecon_feedback_results`
- **Format:** Array of feedback objects
- **Contains:** All feedback results with IDs, scores, answers, explanations

### Supabase (If Enabled)
- **Table:** `simulation_results`
- **Contains:** Full feedback data synced across devices
- **Access:** Via API route `/api/simulation/results/[id]`

---

## 🎓 What You'll See in Feedback

The feedback page includes:

1. **📊 Feedback Summary**
   - Overall score
   - Correct/incorrect answers count
   - Completion time
   - Performance badge

2. **✅ Strengths & Weaknesses**
   - What you did well
   - Areas for improvement
   - Skill category breakdown

3. **📝 Detailed Answer Feedback**
   - For each IOC you tagged:
     - Your answer vs. correct answer
     - Explanation of why it's correct/incorrect
     - MITRE ATT&CK technique reference
     - OWASP Top 10 category (if applicable)
     - Learning resources and links

4. **⏱️ Action Timeline**
   - Chronological view of your investigation
   - When you tagged each IOC
   - Decision points and outcomes

5. **💡 Recommendations**
   - How to improve
   - What to study next
   - Related scenarios to try

---

## 🐛 Troubleshooting

### "Feedback Not Found" Error

**Possible causes:**
1. Feedback wasn't submitted successfully
2. Feedback ID doesn't exist
3. localStorage was cleared
4. Supabase not configured (if trying to access from different device)

**Solutions:**
- Check browser console for errors
- Verify feedback was submitted (check network tab)
- Try completing a new simulation
- Check localStorage: `localStorage.getItem('threatrecon_feedback_results')`

### No "View Feedback" Button

**Possible causes:**
1. Feedback submission failed
2. Feedback ID wasn't generated
3. Results are too old (before feedback system was added)

**Solutions:**
- Complete a new simulation
- Check that API route `/api/simulation/submit` is working
- Verify browser console for errors

### Feedback Page Shows Loading Forever

**Possible causes:**
1. API route `/api/simulation/results/[id]` is failing
2. Network error
3. Invalid feedback ID

**Solutions:**
- Check browser console for errors
- Check Network tab for failed API requests
- Try accessing a different feedback ID
- Verify API route is deployed correctly

---

## 📱 Quick Reference

| Method | When to Use | Location |
|--------|-------------|----------|
| **Automatic Redirect** | Immediately after finalizing | Automatic |
| **Evaluation Report Button** | If redirect didn't happen | Modal footer |
| **Dashboard Links** | View past feedback | `/dashboard` → Recent Results |
| **Direct URL** | If you know the ID | `/simulation/feedback/[id]` |

---

## ✅ Verification Checklist

To ensure feedback is working:

- [ ] Complete a simulation
- [ ] Click "Finalize Investigation"
- [ ] Verify redirect to feedback page happens
- [ ] Check that feedback page loads with all sections
- [ ] Verify "View Feedback" button appears in Evaluation Report
- [ ] Check Dashboard shows "View Feedback" links for past results
- [ ] Test accessing feedback via direct URL

---

## 🚀 Next Steps

After viewing feedback:

1. **Review your mistakes** - Read explanations for incorrect answers
2. **Study MITRE ATT&CK** - Click technique links to learn more
3. **Check OWASP Top 10** - Review vulnerability categories
4. **Try again** - Use "Try Again" button to retry the scenario
5. **Try different scenarios** - Practice with different attack types

---

**Last Updated:** After feedback access improvements  
**Status:** ✅ All access methods implemented and working

