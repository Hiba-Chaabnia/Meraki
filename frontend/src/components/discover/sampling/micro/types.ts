export interface MicroActivity {
  title: string;
  instruction: string;
  duration: string;
  why_it_works: string;
}

/* Default micro activities by hobby — fallback if API doesn't return one */
export const defaultActivities: Record<string, MicroActivity> = {
  pottery: {
    title: "Feel the Form",
    instruction:
      "Grab any small object near you (a mug, a fruit, a stress ball). Close your eyes and slowly run your fingers over its entire surface. Notice the curves, edges, weight, and temperature. Imagine you're memorizing its shape to recreate it from clay.",
    duration: "2-3 minutes",
    why_it_works:
      "Potters develop incredible tactile sensitivity. This exercise builds that same awareness.",
  },
  watercolor: {
    title: "See Like a Painter",
    instruction:
      "Look at the nearest window or light source. Instead of seeing 'a window', try to see it as patches of color and light. Notice: What's the lightest spot? The darkest? Can you spot at least 3 different shades?",
    duration: "2-3 minutes",
    why_it_works:
      "Watercolor is all about seeing light and shadow. This trains your eye to break down what you see.",
  },
  knitting: {
    title: "Rhythm Check",
    instruction:
      "Tap your fingers on a surface in a steady rhythm: tap-tap, tap-tap (like knit-purl, knit-purl). Try to maintain this rhythm for 60 seconds without speeding up or slowing down. Notice how your mind wanders but your hands stay steady.",
    duration: "1-2 minutes",
    why_it_works:
      "Knitting is meditative because of its rhythm. This gives you a taste of that calming repetition.",
  },
  drawing: {
    title: "Blind Contour",
    instruction:
      "Look at your non-dominant hand. Without looking at the paper, draw its outline continuously for 60 seconds. Don't lift your pen. The result will look wonky — that's perfect! The point is training your eye-hand connection.",
    duration: "1-2 minutes",
    why_it_works:
      "This classic exercise is used by professional artists to warm up and stay loose.",
  },
  photography: {
    title: "Frame the Moment",
    instruction:
      "Make a rectangle with your fingers (like a movie director). Look around your space and find 3 different 'frames' that look interesting — a corner of a bookshelf, light on a wall, an object's shadow. What makes each frame compelling?",
    duration: "2-3 minutes",
    why_it_works:
      "Photography is about seeing. Your phone camera is just a tool — your eye is the real camera.",
  },
  default: {
    title: "Mindful Observation",
    instruction:
      "Pick any object within arm's reach. Spend 2 minutes examining it as if you've never seen it before. Notice its texture, weight, how light hits it, any imperfections. Try to find 5 details you've never noticed.",
    duration: "2-3 minutes",
    why_it_works:
      "Every creative hobby starts with learning to see the world differently. This builds that skill.",
  },
};
