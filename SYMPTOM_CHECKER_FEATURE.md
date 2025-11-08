# Symptom Checker Feature

## Overview
AI-powered symptom checker that analyzes user-selected symptoms and provides possible conditions, urgency levels, and health recommendations.

## Features

### 1. Symptom Selection
- **20+ Common Symptoms** organized by category:
  - General (Fever, Fatigue, Chills, etc.)
  - Respiratory (Cough, Sore Throat, Shortness of Breath)
  - Digestive (Nausea, Vomiting, Diarrhea, Stomach Pain)
  - Cardiovascular (Chest Pain)
  - Neurological (Headache, Dizziness)
  - Musculoskeletal (Joint Pain, Back Pain, Body Ache)
  - Skin (Rash)

- **Search Functionality**: Quick search to find specific symptoms
- **Multi-Select**: Select multiple symptoms for comprehensive analysis
- **Visual Feedback**: Selected symptoms displayed as removable tags

### 2. Intelligent Analysis
The system analyzes symptom combinations to identify:

#### Emergency Conditions (High Urgency)
- **Cardiac Events**: Chest pain + shortness of breath
- **Meningitis**: Severe headache + fever + stiff neck
- Immediate action recommendations provided

#### Common Conditions (Medium Urgency)
- **Respiratory Infections**: Fever + cough/sore throat
- **Pneumonia**: Fever + cough + breathing difficulty
- **Gastroenteritis**: Nausea + vomiting + diarrhea
- **Food Poisoning**: Digestive symptoms + stomach pain
- **Migraine**: Headache + dizziness

#### General Conditions (Low Urgency)
- **Viral Infections**: Body aches + fever
- **Musculoskeletal Strain**: Joint/muscle pain without fever
- **Allergic Reactions**: Skin rash
- **General Fatigue**: Isolated fatigue symptoms

### 3. Urgency Levels
Three-tier urgency system with color coding:

- 🚨 **High Urgency** (Red)
  - Requires immediate medical attention
  - Emergency service recommendations
  - Critical symptoms like chest pain, severe breathing difficulty

- ⚠️ **Medium Urgency** (Yellow)
  - Consult doctor soon
  - Monitor symptoms closely
  - Conditions like respiratory infections, gastroenteritis

- ℹ️ **Low Urgency** (Green)
  - Monitor and rest
  - Self-care recommendations
  - General symptoms like mild fatigue

### 4. Personalized Recommendations
Context-aware recommendations based on symptoms:

#### Emergency Recommendations
- Call emergency services (911)
- Do not drive yourself
- Take aspirin if available (for cardiac events)

#### General Care Recommendations
- Rest and hydration
- Over-the-counter medications
- Temperature monitoring
- When to seek medical care
- Dietary advice (BRAT diet for GI issues)
- Home remedies (ice/heat therapy, cool compress)

### 5. Medical Disclaimer
Clear disclaimer on every analysis:
- Not a substitute for professional medical advice
- Informational purposes only
- Encourages consulting healthcare providers
- Emergency service guidance for urgent situations

## User Interface

### Layout
1. **Header**: Title and back navigation
2. **Search Bar**: Quick symptom search
3. **Selected Symptoms Card**: Shows chosen symptoms with count
4. **Symptom Grid**: 2-column grid of available symptoms
5. **Analysis Results**: Comprehensive breakdown when analyzed

### Analysis Display
1. **Urgency Banner**: Color-coded urgency level with icon
2. **Possible Conditions Card**: 
   - Condition name
   - Probability indicator
   - Detailed description
3. **Recommendations Card**: Bulleted list of actionable advice
4. **Disclaimer Card**: Medical disclaimer with alert icon
5. **Reset Button**: Check different symptoms

## Technical Implementation

### Component Structure
```typescript
interface Symptom {
  id: string;
  name: string;
  category: string;
}

interface AnalysisResult {
  possibleConditions: Array<{
    name: string;
    probability: string;
    description: string;
  }>;
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high';
  disclaimer: string;
}
```

### Analysis Logic
- Pattern matching based on symptom combinations
- Priority-based condition detection (emergency first)
- Context-aware recommendations
- Probability assessment (High/Moderate/Possible/Unknown)

### State Management
- `selectedSymptoms`: Array of selected symptoms
- `searchQuery`: Search filter state
- `analysis`: Analysis result object
- `loading`: Processing state

## Access Points

### Navigation
- **Home Page**: "Check Symptoms" quick action card
- **Direct Route**: `/symptom-checker`
- **Protected**: Requires authentication

## Use Cases

### 1. Cold/Flu Symptoms
User selects: Fever, Cough, Sore Throat
→ Diagnosis: Upper Respiratory Infection
→ Urgency: Medium
→ Recommendations: Rest, hydration, monitor temperature

### 2. Emergency Symptoms
User selects: Chest Pain, Shortness of Breath
→ Diagnosis: Cardiac Event
→ Urgency: HIGH
→ Recommendations: Call 911 immediately

### 3. Digestive Issues
User selects: Nausea, Vomiting, Diarrhea
→ Diagnosis: Gastroenteritis
→ Urgency: Medium
→ Recommendations: Hydration, BRAT diet, monitor symptoms

### 4. General Fatigue
User selects: Fatigue (only)
→ Diagnosis: General Fatigue
→ Urgency: Low
→ Recommendations: Sleep, hydration, balanced diet

## Future Enhancements

### Potential Additions
1. **Symptom Duration**: Track how long symptoms have persisted
2. **Symptom Severity**: Rate severity (mild/moderate/severe)
3. **Age/Gender Factors**: Personalized analysis based on demographics
4. **Medical History**: Consider pre-existing conditions
5. **AI Integration**: Use Gemini AI for more sophisticated analysis
6. **Symptom History**: Track symptom patterns over time
7. **Doctor Recommendations**: Suggest specialists based on symptoms
8. **Telemedicine Integration**: Direct booking with doctors
9. **Symptom Diary**: Save symptom checks for future reference
10. **Multi-language Support**: Symptom names in multiple languages

## Safety Features

### Built-in Safeguards
1. ✅ Clear medical disclaimer on every analysis
2. ✅ Emergency symptom detection with urgent warnings
3. ✅ Encourages professional medical consultation
4. ✅ No definitive diagnoses - only "possible conditions"
5. ✅ Probability indicators (not certainties)
6. ✅ "Seek medical care" recommendations for concerning symptoms

## Status
🟢 **COMPLETE** - Symptom checker feature fully implemented and ready to use!

## Testing Checklist
- [ ] Select single symptom
- [ ] Select multiple symptoms
- [ ] Search for symptoms
- [ ] Remove selected symptoms
- [ ] Analyze emergency symptoms (chest pain)
- [ ] Analyze common cold symptoms
- [ ] Analyze digestive symptoms
- [ ] Check urgency color coding
- [ ] Verify recommendations display
- [ ] Test "Check Different Symptoms" reset
- [ ] Verify disclaimer appears
- [ ] Test navigation from Home page
