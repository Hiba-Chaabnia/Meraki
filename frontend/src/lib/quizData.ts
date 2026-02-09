export interface QuizSection {
  id: string;
  title: string;
  emoji: string;
}

export interface QuizQuestion {
  id: number;
  sectionId: string;
  text: string;
  type: "single" | "multi" | "text";
  options?: string[];
  maxSelections?: number;
  optional?: boolean;
  placeholder?: string;
}

export const sections: QuizSection[] = [
  {
    id: "time",
    title: "Time & Lifestyle",
    emoji: "\u23f0",
  },
  {
    id: "creative",
    title: "Creative Preferences",
    emoji: "\ud83c\udfa8",
  },
  {
    id: "learning",
    title: "Learning Style",
    emoji: "\ud83d\udcda",
  },
  {
    id: "social",
    title: "Social & Space",
    emoji: "\ud83c\udfe0",
  },
  {
    id: "budget",
    title: "Budget & Commitment",
    emoji: "\ud83d\udcb0",
  },
  {
    id: "motivation",
    title: "Motivation & Mindset",
    emoji: "\u2728",
  },
  {
    id: "sensory",
    title: "Sensory Preferences",
    emoji: "\ud83e\udde0",
  },
  {
    id: "practical",
    title: "Practical Constraints",
    emoji: "\ud83d\udee0\ufe0f",
  },
  {
    id: "reflection",
    title: "Final Reflection",
    emoji: "\ud83d\udc96",
  },
];

export const questions: QuizQuestion[] = [
  // ── TIME & LIFESTYLE ──
  {
    id: 1,
    sectionId: "time",
    text: "Available weekly creative time?",
    type: "single",
    options: [
      "Less than 1 hour",
      "1–3 hours",
      "3–5 hours",
      "5–10 hours",
      "10+ hours",
    ],
  },
  {
    id: 2,
    sectionId: "time",
    text: "When do you usually practice?",
    type: "multi",
    options: [
      "Early morning",
      "Lunch breaks or short pockets",
      "Evenings",
      "Weekends (longer blocks)",
      "Whenever inspiration hits",
    ],
  },
  {
    id: 3,
    sectionId: "time",
    text: "Do you prefer hobbies that…",
    type: "single",
    options: [
      "Are easy to pause and resume",
      "Require dedicated focus sessions",
      "No preference",
    ],
  },

  // ── CREATIVE PREFERENCES ──
  {
    id: 4,
    sectionId: "creative",
    text: "What type of creating appeals most?",
    type: "single",
    options: [
      "Making physical objects",
      "Creating visual art",
      "Performing or sound-based expression",
      "Writing or verbal expression",
      "Growing or nurturing living things",
    ],
  },
  {
    id: 5,
    sectionId: "creative",
    text: "What feels more satisfying?",
    type: "single",
    options: [
      "Following clear instructions",
      "Free experimentation",
      "Structure with room to improvise",
    ],
  },
  {
    id: 6,
    sectionId: "creative",
    text: "How do you feel about mess?",
    type: "single",
    options: [
      "Love it — part of the fun",
      "Okay if cleanup is manageable",
      "Prefer clean, contained activities",
      "Depends on the situation",
    ],
  },

  // ── LEARNING STYLE ──
  {
    id: 7,
    sectionId: "learning",
    text: "How do you prefer to learn?",
    type: "single",
    options: [
      "Watch first, then try",
      "Read step-by-step instructions",
      "Learn by doing",
      "A combination",
    ],
  },
  {
    id: 8,
    sectionId: "learning",
    text: "How do you feel about mistakes?",
    type: "single",
    options: [
      "They help me learn",
      "I accept them but try to avoid them",
      "They frustrate me",
      "I need encouragement",
    ],
  },

  // ── SOCIAL & SPACE ──
  {
    id: 9,
    sectionId: "social",
    text: "Where would you practice?",
    type: "multi",
    options: [
      "At home, with a dedicated space",
      "At home, packs away easily",
      "Studio or community space",
      "Outdoors",
      "Anywhere works",
    ],
  },
  {
    id: 10,
    sectionId: "social",
    text: "How do you like learning with others?",
    type: "single",
    options: [
      "Group classes or shared practice",
      "Solo, but sharing progress",
      "Completely solo",
      "Depends on the hobby",
    ],
  },

  // ── BUDGET & COMMITMENT ──
  {
    id: 11,
    sectionId: "budget",
    text: "Comfortable initial spend?",
    type: "single",
    options: [
      "Under $25",
      "$25–$75",
      "$75–$150",
      "$150–$300",
      "$300+",
    ],
  },
  {
    id: 12,
    sectionId: "budget",
    text: "How do you feel about ongoing costs?",
    type: "single",
    options: [
      "Prefer one-time purchases",
      "Okay with occasional refills",
      "Fine with regular costs",
      "Not a concern",
    ],
  },
  {
    id: 13,
    sectionId: "budget",
    text: "Before committing, you prefer to…",
    type: "single",
    options: [
      "Try it once at home",
      "Take a workshop or class",
      "Research and watch tutorials",
      "Jump right in",
    ],
  },

  // ── MOTIVATION & MINDSET ──
  {
    id: 14,
    sectionId: "motivation",
    text: "What do you want from a creative hobby?",
    type: "multi",
    maxSelections: 3,
    options: [
      "Stress relief and mindfulness",
      "A sense of accomplishment",
      "Self-expression",
      "Learning new skills",
      "Making gifts or useful items",
      "Community connection",
    ],
  },
  {
    id: 15,
    sectionId: "motivation",
    text: "Which resonates most?",
    type: "multi",
    options: [
      "I want to make beautiful things",
      "I want to understand how things work",
      "I want to express myself",
      "I want to create with my hands",
      "I want to nurture something",
    ],
  },
  {
    id: 16,
    sectionId: "motivation",
    text: "How do you handle a learning curve?",
    type: "single",
    options: [
      "I embrace it",
      "I need early wins",
      "I need visible progress",
      "I struggle with perfectionism",
    ],
  },

  // ── SENSORY PREFERENCES ──
  {
    id: 17,
    sectionId: "sensory",
    text: "Which experience sounds best?",
    type: "multi",
    options: [
      "Smells of materials",
      "Sounds and rhythm",
      "Hands-on texture",
      "Visual focus",
      "Repetitive, meditative motion",
    ],
  },
  {
    id: 18,
    sectionId: "sensory",
    text: "Which senses do you want to engage?",
    type: "multi",
    options: [
      "Hands / touch",
      "Eyes / visuals",
      "Whole body / movement",
      "Mind / imagination",
      "A mix",
    ],
  },

  // ── PRACTICAL CONSTRAINTS ──
  {
    id: 19,
    sectionId: "practical",
    text: "Any physical constraints?",
    type: "multi",
    options: [
      "Need seated activities",
      "Prefer movement",
      "Limited hand dexterity",
      "Need quiet activities",
      "No constraints",
    ],
  },
  {
    id: 20,
    sectionId: "practical",
    text: "Seasonal preference?",
    type: "single",
    options: [
      "Indoor year-round",
      "Outdoor warm-weather",
      "Seasonal variety",
      "No preference",
    ],
  },

  // ── FINAL REFLECTION ──
  {
    id: 21,
    sectionId: "reflection",
    text: "Any hobby you’ve always wanted to try?",
    type: "text",
    optional: true,
    placeholder: "Pottery, watercolor, guitar, gardening…",
  },
  {
    id: 22,
    sectionId: "reflection",
    text: "What's held you back before?",
    type: "multi",
    options: [
      "Not sure what to choose",
      "Concerned about cost",
      "Fear of not being good",
      "Not enough time",
      "Didn't know where to start",
      "Tried and quit"
    ],
  },
];


export function getSectionForQuestion(questionId: number): QuizSection {
  const q = questions.find((q) => q.id === questionId)!;
  return sections.find((s) => s.id === q.sectionId)!;
}

export function getQuestionNumberInSection(questionId: number): {
  current: number;
  total: number;
} {
  const q = questions.find((q) => q.id === questionId)!;
  const sectionQuestions = questions.filter(
    (sq) => sq.sectionId === q.sectionId
  );
  return {
    current: sectionQuestions.findIndex((sq) => sq.id === questionId) + 1,
    total: sectionQuestions.length,
  };
}
