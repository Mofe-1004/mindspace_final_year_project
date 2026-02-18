# Claude.md - Mental Health Sentiment Analysis Platform

## Project Overview

A web-based NLP sentiment analysis platform designed for Nigerian university students to track their emotional wellbeing through text submissions in English and Nigerian Pidgin.

**Core Purpose:** Provide empathetic, non-diagnostic emotional reflection and support for university students, with optional counselor oversight for institutional mental health awareness.

**Target Users:**
- University students (primary users)
- Registered counselors (administrative/monitoring access)

---

## What This System Does

### For Students:
1. Submit text entries about their day/feelings in English or Nigerian Pidgin
2. Receive empathetic reflection (e.g., "You sound stressed" - NOT diagnostic)
3. Get categorized into emotional states (positive, neutral, negative, at-risk, etc.)
4. Receive Bible verse encouragement
5. Optional: Request counselor contact information
6. View personal emotional trends over time
7. Delete their records anytime

### For Counselors:
1. View anonymized aggregate reports of student mental health trends
2. Access rolling trend data (updates continuously as submissions come in)
3. Gain institutional awareness without accessing individual student identities

---

## Technical Stack

### Current Considerations (Help Me Decide!)
The tech stack is not finalized. Claude should help evaluate and recommend optimal choices.

**ML/NLP Models:**
- **NaijaBERT** or **AfriBERTa** - for Nigerian Pidgin and English understanding
- **MentalBERT** - for mental health sentiment analysis
- Open to alternative or complementary models

**Backend:**
- Python (for ML model integration, NLP processing)
- Possibly Node.js (for API/server logic)
- Need guidance on optimal architecture

**Frontend:**
- React (likely choice)
- Need guidance on state management, routing, etc.

**Database:**
- TBD - needs to handle sensitive data securely
- Must support anonymization for counselor reports
- Must allow complete data deletion (student request)

**Infrastructure:**
- TBD - cloud hosting, deployment strategy
- Real-time processing required (<5 seconds response time)

---

## Key Requirements & Constraints

### Functional Requirements
1. **Registration:** Students can only register with school email addresses
2. **Response Time:** Analysis and feedback must be delivered within ~5 seconds
3. **Privacy:** Student data must be anonymized for counselor access
4. **Data Control:** Students can delete all their records at any time
5. **Emotional Trends:** Students see visualization of their emotional states over time
6. **Counselor Dashboard:** Rolling trends that update continuously (not weekly batches)

### Non-Functional Requirements
1. **Privacy & Security:** Treat all data as highly sensitive mental health information
2. **Empathy First:** All system responses must be supportive, never clinical/diagnostic
3. **Cultural Sensitivity:** Must handle Nigerian Pidgin authentically and respectfully
4. **Accessibility:** Should be usable by students with varying tech literacy

### Constraints
- Must handle bilingual input (English + Nigerian Pidgin)
- Bible verses as encouragement mechanism (faith-based support)
- No formal compliance requirements yet, but build with privacy best practices
- University context (students only, school email validation)

---

## How Claude Should Help

### Primary Assistance Areas
1. ✅ **Tech Stack Decisions** - Help evaluate and recommend optimal technologies
2. ✅ **Architecture & Best Practices** - Suggest scalable, secure, maintainable patterns
3. ✅ **Code Review** - Review and improve existing code
4. ✅ **Debugging** - Help identify and fix issues

### Communication Preferences
- **Explanation Style:** Detailed explanations with reasoning
- **Instruction Format:** Step-by-step instructions
- **Code Presentation:** Explain first, then provide code
- **Avoid:** Just dumping code without context

### Code Change Presentation
When suggesting changes:
1. Explain the reasoning/problem first
2. Describe the solution approach
3. Then provide the code
4. Highlight any trade-offs or considerations

### Permission & Collaboration
- **Always ask before making changes** - Don't assume I want to implement something immediately
- **Present options** - When there are multiple valid approaches, present them and ask which I prefer
- **Confirm understanding** - If my request is ambiguous, ask clarifying questions before proceeding
- **Get approval for major decisions** - Architecture changes, new dependencies, database schema changes, etc. should be discussed and approved first
- **Iterative approach** - For large changes, break them into steps and check in between
- **Respect my choices** - If I choose an approach you wouldn't recommend, explain the trade-offs but respect my decision

---

## Coding Standards & Practices

### General Principles
- **Security First:** Encrypt sensitive data, sanitize inputs, implement proper auth
- **Privacy by Design:** Anonymization should be built-in, not added later
- **Accessibility:** Follow WCAG guidelines where applicable
- **Code Quality:** Clear naming, comments for complex logic, DRY principles
- **Testing:** Write tests for critical paths (especially NLP processing and data anonymization)

### Python Guidelines
- Follow PEP 8 style guide
- Type hints where beneficial
- Clear error handling (especially for ML model failures)
- Document ML model inputs/outputs clearly

### JavaScript/TypeScript Guidelines
- Prefer TypeScript for type safety
- Use modern ES6+ features
- Consistent async/await patterns
- Component-based architecture (React)

### API Design
- RESTful conventions
- Clear endpoint naming
- Proper HTTP status codes
- Rate limiting for text submissions (prevent abuse)

### Database
- Never store raw sensitive text longer than necessary
- Implement proper indexing for trend queries
- Ensure complete data deletion is actually complete (no orphaned records)

### Error Handling
- **ML Model Failures:** If NLP models fail to process text, provide graceful fallback (e.g., "We're having trouble processing your submission right now, please try again")
- **User-Facing Errors:** Never expose technical stack traces - show friendly, actionable messages
- **Logging:** Log errors comprehensively for debugging, but sanitize any sensitive data from logs
- **Validation Errors:** Clear feedback on what went wrong (e.g., "Please use your school email address")
- **Timeout Handling:** If processing takes >5 seconds, inform user and allow retry
- **Data Deletion Errors:** If deletion fails, ensure user is notified and can retry
- **Counselor Dashboard Errors:** If trend data can't load, show clear message without exposing student data
- **Bible Verse API Failures:** Have fallback verses stored locally in case external API is down

---

## Important Context & Considerations

### Mental Health Sensitivity
- This system touches vulnerable students during difficult times
- Language should always be supportive, never judgmental
- Categorization (positive/negative/at-risk) should be handled carefully
- "At-risk" categorization may need human counselor notification (discuss ethics)

### Cultural Context
- Nigerian Pidgin is a legitimate language, not "broken English"
- Bible verses are culturally appropriate for the target audience
- School counselors play important institutional roles in Nigerian universities

### Privacy Ethics
- Students must trust the system with sensitive information
- Anonymization must be robust (no re-identification possible)
- Counselors see patterns, not individuals
- Consider: What happens if a student is flagged as "at-risk"? Automated alerts?

### Technical Challenges to Solve
1. How to effectively combine NaijaBERT + MentalBERT?
2. Real-time inference with BERT models (<5 sec constraint)
3. Secure storage and anonymization strategy
4. Email verification system for school emails
5. Trend visualization that's meaningful and actionable
6. Bible verse selection algorithm (contextual? random? categorized?)

---

## Questions Claude Should Help Answer

As we build this project, help me figure out:

1. **Architecture:** Microservices vs monolith? Separate Python ML service + Node API?
2. **Model Deployment:** How to serve BERT models efficiently for real-time inference?
3. **Database Schema:** How to structure data for privacy + trends + deletions?
4. **Authentication:** Best practices for school email verification and session management?
5. **Anonymization:** What level of anonymization is truly safe for counselor reports?
6. **Scalability:** If this grows to thousands of students, what bottlenecks might emerge?
7. **Bible Verse API:** Use existing API or create custom database? How to match verses to sentiment?

---

## Project Status

🚧 **Early Stage** - Tech stack not finalized, architecture being designed

**Next Steps:**
- Finalize tech stack decisions
- Design system architecture
- Set up development environment
- Build MVP with core flow (submit → analyze → reflect → verse)

---

## Notes for Claude

- I'm still learning and deciding on many technical aspects - guide me with recommendations
- Explain trade-offs when suggesting technologies or approaches
- Flag potential issues early (especially privacy, security, performance)
- This is a meaningful project for student wellbeing - help me build it responsibly
- Don't assume I know all the technical details - explain as you go
- If you see a better approach than what I'm asking for, speak up!

---

**Last Updated:** February 8, 2026
