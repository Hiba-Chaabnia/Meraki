# Meraki - Detailed App Concept Document

## Executive Summary

Meraki is a multi-agent AI system that guides users through the complete lifecycle of discovering, starting, and sustaining creative hobbies that nurture their soul. Unlike existing platforms that assume users already know what hobby to pursue or provide overwhelming content libraries, Meraki addresses the fundamental challenges that cause 80% of creative resolutions to fail: decision paralysis, fear of commitment, lack of personalized guidance, and isolation during the learning journey.

---

## The Problem

### Primary Pain Points

**1. Decision Paralysis**

People maintain long lists of hobbies they've "always wanted to try" but never start because:
- They don't know which hobby actually matches their personality, time constraints, and budget
- They fear choosing "wrong" and wasting time/money
- Every hobby has hundreds of beginner resources, creating overwhelming choice

**2. High-Commitment Barrier**

Traditional hobby adoption requires significant upfront investment:
- Expensive equipment purchases before knowing if you'll enjoy it
- Long-term class commitments (8-week courses)
- No way to "taste" a hobby before committing

**3. The YouTube/Social Media Trap**

While platforms like YouTube offer endless hobby tutorials, users report:
- Spending more time searching for the "right" video than practicing
- Getting lost in algorithmic rabbit holes
- No personalized guidance based on their progress
- Overwhelming choice leading to analysis paralysis

**4. Isolation and Inconsistency**

Creative practice often happens alone, leading to:
- No accountability or encouragement
- Difficulty assessing own progress
- Giving up when stuck without knowing how to move forward
- Loss of motivation after initial excitement fades

**5. The Perfectionism Problem**

Beginners often quit because:
- They judge their early work too harshly
- They compare themselves to experts on social media
- They don't receive constructive, personalized feedback
- They don't understand that struggle is normal

---

## The Solution: Meraki's Multi-Agent System

Meraki employs five specialized AI agents that work together to support users through their creative journey:

### 1. Discovery Agent

**Role:** Matches users to hobbies that fit their unique profile

**How it works:**
- Users can either enter hobbies they're curious about OR take a discovery quiz
- For users with a list: The agent ranks hobbies by fit based on:
  - Available time per week
  - Budget constraints
  - Personality indicators (prefer making vs. performing? Immediate results vs. slow process?)
  - Location (are there local resources?)
  - Learning style (structured vs. exploratory)
- For exploring users: The agent suggests 3-5 hobbies from covered categories (creative arts, crafts, gardening)

**Output:** Ranked recommendations with detailed reasoning:
- Why this hobby matches your profile
- Realistic time commitment
- Cost breakdown (initial + ongoing)
- Best ways to sample it first

**Opik Integration:**
- Tracks ranking accuracy (do users start with recommended hobby?)
- Learns personality → hobby success patterns
- Improves matching algorithm over time

---

### 2. Sampling Agent

**Role:** Facilitates low-commitment "tasting menu" experiences

**How it works:** Provides three pathways to try a hobby before committing:

**A) Try at Home (Today)**
- Generates specific "first taste" projects requiring minimal investment (<$15)
- Example: "Make a pinch pot with air-dry clay from the craft store"
- Designed to give immediate creative satisfaction
- No prior knowledge required

**B) Find Local Experiences**
- Uses Google Maps API to find:
  - One-time workshops
  - "Try it" sessions
  - Open studio hours
  - Drop-in classes
- Filters specifically for beginner-friendly, single-session options
- Shows: distance, cost, next available time, relevant reviews

**C) Curated Learning Path**
- Instead of dumping YouTube links, creates a structured path:
  - Day 1: Watch this 5-minute intro video
  - Day 2: Follow along with this 10-minute tutorial
  - Day 3: Try this specific technique
- Pre-vetted, quality content in digestible sequence

**Opik Integration:**
- Tracks which sampling method leads to highest continuation rate
- Monitors cost-to-continuation correlation
- A/B tests different home starter projects

---

### 3. Practice Agent (Multimodal)

**Role:** Analyzes user progress and provides personalized feedback

**How it works:** Users upload photos of their work (future: audio for music, video for movement)

**Multimodal Analysis:** The AI examines submissions and provides:
1. **Technical Observations:** "I see you're using wet-on-wet watercolor technique here"
2. **Progress Indicators:** "Your brush control has improved significantly since session 3"
3. **Exploration Suggestions:** "You might enjoy experimenting with masking fluid to preserve white spaces"
4. **Genuine Celebration:** "The way you captured the light here - that's showing real observation skills"

**Key Principles:**
- Specific, not generic praise
- Focuses on what's working, not critique
- Notices effort and experimentation
- Builds on demonstrated strengths

**Progress Tracking Over Time:** Analyzes submissions series to detect:
- Increasing complexity
- Consistency patterns
- Areas of experimentation vs. repetition
- Potential stuck points

**Emotional Check-Ins:** After each session: "How did that feel?"
- 😊 Loved it, felt in flow
- 😌 Satisfying, made progress
- 😐 Okay, but felt stuck
- 😕 Frustrated, didn't work
- 😫 Discouraged, want to quit

Routes to appropriate agent based on response.

**Opik Integration:**
- Evaluates feedback specificity (specific vs. generic)
- Tracks encouragement-to-critique ratio
- Monitors if feedback quality correlates with user retention
- Learns which types of feedback work for different personality types

---

### 4. Challenge Agent

**Role:** Sets progressive, personalized skill-building challenges

**How it works:** Based on recent work analysis, generates the next appropriate challenge:
- Not too hard (causes frustration)
- Not too easy (causes boredom)
- Just right (flow state)

**Design Principles:**
- Slightly harder than current demonstrated level
- Builds on a strength user has shown
- Introduces ONE new element at a time
- Achievable in one practice session
- Explains WHY this will feel satisfying

**Examples:**
- **Watercolor:** "You've mastered flat washes. Now try: Paint the same subject wet-on-wet - here's why this will unlock new possibilities"
- **Pottery:** "Your pinch pots show good wall thickness. Challenge: Make one twice as large - testing your understanding of structure"
- **Writing:** "Your dialogue feels natural. Try: Write a scene with THREE characters instead of two - forcing you to manage more voices"

**Adaptive Difficulty:** Monitors challenge acceptance and completion:
- If user skips challenge: Makes next one easier
- If user breezes through: Increases difficulty
- If user repeats same challenge: Detects potential stuck point

**Opik Integration:**
- Tracks challenge acceptance vs. skip rate
- Monitors difficulty calibration accuracy
- Learns optimal progression pace per user type
- Identifies which challenge types drive most engagement

---

### 5. Motivation Agent

**Role:** Maintains consistency and recovers users from dropouts

**How it works:**

**Stall Detection:** Monitors for warning signals:
- 3+ days without activity
- Multiple "frustrated" or "discouraged" feelings in a row
- Same challenge attempted 3+ times without completion
- Decreasing session frequency over time

**Intervention Types:**

**For Perfectionism:**
- "Your first 10 tries are supposed to look awkward - here's what my own Day 10 pottery looked like"
- Shows user's actual progress over time (their Day 1 vs. now)
- Reframes "failure" as valuable data
- Suggests fun, low-pressure experiments

**For Boredom/Plateau:**
- "Let's shake things up - try this variation"
- Introduces new direction within same hobby
- Suggests combining with another interest

**For Time Crunch:**
- "Life happens. Let's scale to 10-minute sessions"
- Redesigns challenges for shorter commitment
- Maintains momentum without guilt

**For Lost Direction:**
- "Let's zoom out. Here are 3 new directions to explore"
- Helps user rediscover why they started
- Suggests trying a different aspect of the hobby

**Consistency Mechanics:**
- Streak tracking without shame: Even logging "I didn't practice but I thought about it" counts as showing up
- Gentle nudges, not guilt:
  - Day 3 missed: "Miss your pottery? No pressure"
  - Day 7 missed: "What happened? Let's problem-solve together"
  - Day 14 missed: "Want to try a 5-minute comeback experiment?"

**Opik Integration:**
- Tracks which intervention types work for which stall patterns
- Monitors re-engagement success rates
- A/B tests different nudge timings and messaging
- Learns long-term retention patterns

---

### 6. Stuck Helper (Pattern-Based)

**Role:** Simple pattern detection for when users feel directionless

**How it works:** Instead of requiring deep domain expertise, uses heuristics:

- **Pattern:** Same thing attempted 3+ times → **Suggestion:** "Let's try an easier variation first to rebuild confidence"
- **Pattern:** "Frustrated" feeling 3+ sessions in a row → **Suggestion:** "Let's remove all pressure - try a fun experiment with zero expectations"
- **Pattern:** 10+ sessions on exact same subject/technique → **Suggestion:** "You've explored this deeply. Ready to try a completely different subject?"
- **Pattern:** "Bored" feeling → **Suggestion:** "Same technique, different materials/colors/scale - what if we tried X?"

**Note:** This is intentionally kept simple (pattern → suggestion) rather than building a full expert diagnostic system. Deep domain expertise in each hobby would require significantly more development time.

**Opik Integration:**
- Tracks which patterns correlate with actual stalls
- Monitors effectiveness of pattern-based suggestions
- Identifies which unsticking strategies work best

---

## User Journey Flow

### Phase 1: Discovery (Day 0)

1. User arrives: "I want to be more creative but don't know where to start"
2. Option A: Enters list of curiosities ("pottery, watercolor, journaling")
3. Option B: Takes discovery quiz (10-15 questions about preferences, constraints)
4. Discovery Agent ranks or suggests hobbies with detailed reasoning
5. User reviews recommendations and selects one to explore

### Phase 2: Sampling (Days 1-3)

1. User chooses a hobby to try
2. Sampling Agent provides three pathways:
   - Home starter project
   - Local experience options
   - Curated learning path
3. User selects approach and takes first action
4. User reports back: "I tried it. Here's what happened."

### Phase 3: First Practice (Days 3-14)

1. User uploads photo of first work
2. Practice Agent analyzes and celebrates specific observations
3. Emotional check-in: "How did that feel?"
4. Challenge Agent sets appropriate next step
5. User completes 3-5 sessions, building early momentum

### Phase 4: Building Consistency (Days 14-30)

1. Regular practice sessions with photo uploads
2. Progressive challenges based on demonstrated growth
3. Streak tracking (without shame)
4. Emotional patterns monitored
5. Early stall signals trigger Motivation Agent

### Phase 5: Sustained Practice (30+ days)

1. User has established habit
2. Challenges become more sophisticated
3. If plateau/stuck: Stuck Helper suggests new directions
4. If dropout: Motivation Agent re-engages
5. If mastery: System celebrates and suggests next hobby or deeper exploration

---

## Technical Architecture

### Multi-Agent Orchestration

**Central Coordinator:** Routes user actions to appropriate agent(s):
- New user → Discovery Agent
- Upload progress → Practice Agent + Challenge Agent
- Emotional check-in → Appropriate routing (Motivation/Challenge/Stuck Helper)
- Stall detected → Motivation Agent
- Pattern detected → Stuck Helper

### Opik Integration (Technical Showcase)

**Agent Performance Dashboards:**

1. **Discovery Agent Metrics:**
   - Personality → hobby matching accuracy
   - Constraint satisfaction rate
   - User satisfaction with recommendations

2. **Sampling Agent Analytics:**
   - Conversion rates by sampling method
   - Cost-to-continuation patterns
   - Local vs. online vs. home effectiveness

3. **Practice Agent Quality:**
   - Feedback specificity scores
   - User satisfaction ratings
   - Correlation between feedback quality and retention

4. **Challenge Agent Calibration:**
   - Acceptance rate by difficulty level
   - Skip patterns analysis
   - Flow state indicators

5. **Motivation Agent Effectiveness:**
   - Intervention success rates by stall type
   - Re-engagement conversion metrics
   - Long-term retention by intervention style

6. **Overall Journey Intelligence:**
   - First action → 7 days → 30 days retention funnel
   - Hobby switching patterns (seen as positive exploration)
   - Success profiles (personality types × hobby × outcomes)

**Continuous Improvement Loops:**
- Each agent learns from user responses
- A/B testing of different approaches
- Pattern recognition across user base
- Personalization refinement over time

---

## Scope & Categories

### Initial Hobby Coverage

#### Creative Arts:
* Drawing/sketching
* Watercolor painting
* Digital art
* Photography
* Creative writing

#### Crafts:
* Knitting
* Crochet
* Pottery/ceramics
* Basic woodworking

#### Gardening:
* Container gardening
* Herb gardens
* Succulents/houseplants

#### Rationale:
* At-home friendly (minimal space requirements)
* Low equipment investment possible
* Visual progress (good for photo uploads)
* Established online resources for curation
* Personal skills can be validated

#### Excluded Initially:
* Physical hobbies (fitness apps already serve this)
* Intellectual pursuits (chess, languages have dedicated platforms)
* Performance arts (require different assessment methods)
* Collecting (limited progression/learning component)

### Future Expansion
* Audio analysis for music practice
* Video analysis for movement/dance
* Social features (practice buddies, progress sharing)
* Equipment marketplace integration
* Local community connections

### Success Metrics

#### User-Level Success

**Primary:**
1. **First Action Rate:** % of users who complete initial sampling activity
2. **7-Day Retention:** % still practicing after first week
3. **30-Day Retention:** % who establish consistent practice
4. **Hobby Commitment:** % who invest in equipment/classes after sampling

**Secondary:**
1. **Multiple Hobby Exploration:** Users trying 2-3 hobbies before finding match
2. **Emotional Journey:** Progression from anxiety → confidence
3. **Consistency Without Perfection:** Days active (not necessarily perfect daily)
4. **Stall Recovery:** % of dropout risks that re-engage

#### System-Level Success

1. **Agent Performance:**
   * Discovery matching accuracy
   * Challenge acceptance rates
   * Feedback quality scores
   * Intervention effectiveness

2. **Platform Health:**
   * User satisfaction ratings
   * NPS (Net Promoter Score)
   * Session frequency
   * Upload engagement

3. **Learning & Improvement:**
   * Opik metrics trending positively
   * Personalization accuracy improving
   * Cost-per-user optimization
