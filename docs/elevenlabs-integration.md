I’m building a Smart AI Places Finder web app for discovering places in Ghana using natural language. I want you to implement a **conversational AI onboarding feature** using the ElevenLabs React SDK.

### Here’s what I want:

When the app is opened for the first time, a **popover or modal appears** with an **AI agent avatar** that welcomes the user using ElevenLabs voice synthesis.

1. The AI greets the user and explains briefly what the app does.
2. The AI then **asks the user if they would like a short guided tour** of the homepage.
3. If the user says “Yes”:
    - The app will walk the user through a series of steps with voice narration using pre-defined voice prompts from ElevenLabs.
    - Each step corresponds to a **flag** like:
      - `show-landing-search-input`
      - `explain-how-search-works`
      - `show-featured-places`
      - `show-trending-places`
      - `show-contribute-banner`
      - `end-tour`

4. Each flag has a corresponding action:
    - For example, scroll to a section, highlight a UI component, or animate a transition.
    - When a flag is triggered, play the matching ElevenLabs voice clip or dynamic audio response.
    - Wait for the narration to finish (`onAudioEnd`) before moving to the next step.

### What to include:
- State management (to track tour state and steps)
- Local storage or cookie to track if user has already seen the tour
- UI component for the agent popover or assistant (small avatar, chat bubble, or side pop-up)
- Support for both **user input (“Yes, show me” / “No thanks”)** and **auto-play tour mode**
- Use the ElevenLabs **React SDK** and best practices for streaming or pre-generated audio
- Optional: graceful fallback to subtitles or text if audio fails

Make it modular so I can later add more tour steps for other pages.

This is for the **landing page tour only**, covering:
- The main search input and how it works
- The Featured Places section
- The Trending Places section
- The “Contribute a Place” banner
- Ending with: “Now try exploring yourself!”

Build it cleanly using React, TailwindCSS (with shadcn/ui), and follow ElevenLabs conversational AI docs.

Helpful links:
- https://elevenlabs.io/docs/conversational-ai/quickstart
- https://elevenlabs.io/docs/conversational-ai/libraries/react
- https://elevenlabs.io/docs/conversational-ai/best-practices/prompting-guide
