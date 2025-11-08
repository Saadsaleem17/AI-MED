# Medical History Integration for Symptom Checker

## Overview

Enhanced the symptom checker to use the patient's medical history from saved reports to provide more personalized and accurate symptom analysis.

## How It Works

### 1. Medical History Extraction

When a user analyzes symptoms:
- System retrieves the 5 most recent medical reports for the user
- Fetches symptom logs from the last 30 days (up to 10 entries)
- Extracts key information:
  - Report summaries and diagnoses
  - Abnormal/critical parameters
  - Report dates
  - Recurring abnormal findings across multiple reports
  - Tracked symptoms with dates, severity, and notes
  - Recurring symptom patterns (symptoms logged 2+ times)

### 2. AI-Powered Analysis with Context

The Gemini AI receives:
- Current symptoms described by the user
- Patient's medical history from reports (if available)
- Patient's symptom tracking history (if available)
- Instructions to look for:
  - Patterns matching previous conditions
  - Symptoms related to known abnormal parameters
  - Potential complications or progression
  - Possible recurrence of previous issues
  - Recurring symptom patterns from tracking
  - Chronic conditions indicated by persistent symptoms

### 3. Personalized Results

The analysis considers:
- Previous diagnoses and conditions
- Chronic issues indicated by recurring abnormal parameters
- Historical context for better accuracy
- Risk factors from past medical data

## Implementation Details

### Backend Changes

**server/routes/symptoms.ts**:
- Added `getMedicalHistory()` helper function
- Fetches recent reports from database
- Extracts abnormal parameters and summaries
- Passes medical history to AI analysis

**server/services/geminiService.js**:
- Updated `analyzeSymptoms()` to accept medical history
- Builds context from patient's past reports
- Includes history in AI prompt for better analysis
- Returns flag indicating if history was used

### Frontend Changes

**src/pages/SymptomChecker.tsx**:
- Sends userId with symptom analysis request
- Displays indicator when medical history is used
- Shows "Personalized Analysis" badge

## Benefits

1. **More Accurate Diagnoses**: AI considers patient's medical background
2. **Pattern Recognition**: Identifies recurring issues or chronic conditions
3. **Risk Assessment**: Better evaluation based on known health issues
4. **Personalized Recommendations**: Tailored advice based on medical history
5. **Continuity of Care**: Connects current symptoms with past conditions

## Privacy & Security

- Medical history only accessed for authenticated users
- Data retrieved securely from user's own reports
- No sharing of medical data between users
- History used only for current analysis session

## Example Use Cases

1. **Chronic Condition Monitoring**:
   - User with diabetes reports fatigue
   - System considers past high glucose levels
   - Provides diabetes-specific recommendations

2. **Recurring Issues**:
   - User had respiratory infections in past reports
   - Current cough symptoms analyzed in that context
   - Suggests monitoring for chronic respiratory issues

3. **Medication Side Effects**:
   - Past reports show medication prescriptions
   - Current symptoms may be related to medications
   - AI can identify potential side effects

4. **Symptom Pattern Recognition**:
   - User has logged "headache" 5 times in the last month
   - Reports headache again
   - AI recognizes chronic pattern and suggests migraine evaluation

5. **Allergic Condition Tracking**:
   - User previously diagnosed with allergic bronchitis
   - Has logged cough symptoms multiple times
   - Current cough analyzed as likely allergic bronchitis recurrence

## Completed Features

✅ Medical report history integration
✅ Symptom tracker logs integration
✅ Recurring symptom pattern detection
✅ Past diagnosis extraction and prioritization

## Future Enhancements

- Add medication history integration
- Generate health trend reports and visualizations
- Alert for concerning patterns or worsening trends
- Predict potential health issues based on patterns
- Integration with wearable device data
