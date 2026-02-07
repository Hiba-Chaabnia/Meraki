/* ═══════════════════════════════════════════════════════
   Shared hobby metadata & placeholder content
   (will be replaced by CrewAI-generated data)
   ═══════════════════════════════════════════════════════ */

export interface HobbyMeta {
  name: string;
  color: string;
  lightColor: string;
}

export const hobbyMeta: Record<string, HobbyMeta> = {
  // Core hobbies
  watercolor: { name: "Watercolor Painting", color: "#60B5FF", lightColor: "#AFDDFF" },
  pottery: { name: "Pottery", color: "#D4845A", lightColor: "#F2DCCF" },
  knitting: { name: "Knitting", color: "#B8A9E8", lightColor: "#E8E2F7" },
  crochet: { name: "Crochet", color: "#E89DC4", lightColor: "#F7D9EB" },
  gardening: { name: "Gardening", color: "#7BC47F", lightColor: "#D4EFCF" },
  guitar: { name: "Guitar", color: "#FF9149", lightColor: "#FFECDB" },
  embroidery: { name: "Embroidery", color: "#E87DA5", lightColor: "#F9D6E3" },
  calligraphy: { name: "Calligraphy", color: "#5CC8D7", lightColor: "#C8EFF4" },
  candles: { name: "Candle Making", color: "#fdc740", lightColor: "#feeda8" },
  // Additional hobbies from discovery
  drawing: { name: "Drawing", color: "#6B7280", lightColor: "#E5E7EB" },
  photography: { name: "Photography", color: "#374151", lightColor: "#D1D5DB" },
  "creative-writing": { name: "Creative Writing", color: "#8B5CF6", lightColor: "#DDD6FE" },
  "digital-art": { name: "Digital Art", color: "#EC4899", lightColor: "#FBCFE8" },
  woodworking: { name: "Woodworking", color: "#92400E", lightColor: "#FDE68A" },
  "container-gardening": { name: "Container Gardening", color: "#059669", lightColor: "#A7F3D0" },
  "herb-garden": { name: "Herb Garden", color: "#65A30D", lightColor: "#D9F99D" },
  houseplants: { name: "Houseplants", color: "#10B981", lightColor: "#D1FAE5" },
};

export function formatSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getHobby(slug: string): HobbyMeta {
  return hobbyMeta[slug] ?? { name: formatSlug(slug), color: "#B8A9E8", lightColor: "#E8E2F7" };
}

/* ─── Project data (Try at Home) ─── */

export interface ShoppingItem {
  name: string;
  price: string;
  note?: string;
  owned?: boolean;
}

export interface ProjectStep {
  title: string;
  description: string;
  duration: string;
  tip?: string;
}

export interface ProjectData {
  title: string;
  subtitle: string;
  totalTime: string;
  totalCost: string;
  intro: string;
  shoppingList: ShoppingItem[];
  steps: ProjectStep[];
  doneMessage: string;
}

const defaultProject: ProjectData = {
  title: "Your First Mini Creation",
  subtitle: "A simple beginner project",
  totalTime: "30\u201360 minutes",
  totalCost: "Under $15",
  intro: "This project is designed for complete beginners. No experience needed \u2014 just curiosity and a willingness to have fun!",
  shoppingList: [
    { name: "Basic starter kit", price: "$8\u2013$12" },
    { name: "Scrap paper or newspaper (for workspace)", price: "Free", owned: true },
    { name: "Paper towels", price: "Free", owned: true },
  ],
  steps: [
    { title: "Set up your space", description: "Find a comfortable spot and lay down newspaper or scrap paper to protect your surface.", duration: "5 min", tip: "A kitchen table works great!" },
    { title: "Get familiar with your materials", description: "Open your supplies and spend a few minutes just touching, feeling, and exploring them. No rules yet.", duration: "5 min" },
    { title: "Follow the basic technique", description: "Start with the fundamental technique. Don\u2019t worry about perfection \u2014 focus on the process.", duration: "15\u201320 min", tip: "If it feels awkward, you\u2019re doing it right. Everyone starts here!" },
    { title: "Add your personal touch", description: "Now that you have the basics down, experiment! Try something different and make it yours.", duration: "10\u201315 min" },
    { title: "Finish and admire", description: "Step back and look at what you made. Take a photo! This is your very first piece.", duration: "5 min", tip: "It doesn\u2019t have to be perfect \u2014 it just has to be yours." },
  ],
  doneMessage: "You just made something with your own hands. That\u2019s kind of amazing, right?",
};

const hobbyProjects: Record<string, ProjectData> = {
  pottery: {
    title: "Your First Pinch Pot",
    subtitle: "A tiny bowl made entirely with your hands",
    totalTime: "45\u201360 minutes",
    totalCost: "Under $12",
    intro: "A pinch pot is the oldest pottery technique in the world. No wheel, no kiln \u2014 just your hands and some air-dry clay. Let\u2019s make a little bowl you can actually use!",
    shoppingList: [
      { name: "Air-dry clay (1 lb)", price: "$6\u2013$8" },
      { name: "Small cup of water", price: "Free", owned: true },
      { name: "Fork or toothpick (for texture)", price: "Free", owned: true },
      { name: "Newspaper (to protect surface)", price: "Free", owned: true },
      { name: "Acrylic paint (optional)", price: "$3\u2013$5" },
    ],
    steps: [
      { title: "Set up your workspace", description: "Lay newspaper on a flat surface. Keep your cup of water nearby \u2014 you\u2019ll use it to smooth cracks.", duration: "3 min", tip: "A kitchen table is perfect for this!" },
      { title: "Warm up your clay", description: "Take a golf ball-sized piece of clay and knead it in your hands for a minute. It should feel smooth and pliable, like Play-Doh.", duration: "2 min" },
      { title: "Form the ball", description: "Roll the clay into a smooth ball between your palms. Try to get it as round as possible \u2014 this is your pot\u2019s starting point.", duration: "3 min", tip: "If you see cracks, dip your finger in water and smooth them out." },
      { title: "Make the pinch", description: "Push your thumb into the center of the ball, stopping about 1cm from the bottom. Now slowly pinch and rotate \u2014 pinch, turn, pinch, turn \u2014 working your way around to open up the pot.", duration: "10\u201315 min", tip: "Go slow! Pinch gently and evenly. The walls should be about the thickness of a pencil." },
      { title: "Shape and smooth", description: "Once your pot is opened up, use your fingers and a tiny bit of water to smooth the inside and outside walls. Shape the rim however you like \u2014 wavy, straight, uneven \u2014 it\u2019s all good.", duration: "5\u201310 min" },
      { title: "Add texture (optional)", description: "Use a fork, toothpick, or your fingernail to press patterns into the outside. Dots, lines, cross-hatches \u2014 whatever feels fun.", duration: "5 min", tip: "Less is more! A few intentional marks look better than covering everything." },
      { title: "Let it dry", description: "Place your pot on a piece of newspaper and let it air dry for 24\u201348 hours. Flip it over halfway through so the bottom dries evenly.", duration: "24\u201348 hrs (passive)" },
      { title: "Paint and admire (optional)", description: "Once completely dry, paint it with acrylics if you\u2019d like. Then take a photo \u2014 you just made pottery!", duration: "10\u201315 min", tip: "This little bowl is perfect for holding rings, keys, or small treasures." },
    ],
    doneMessage: "You just made a real piece of pottery with nothing but your hands and some clay. How cool is that? This pinch pot technique is thousands of years old \u2014 and now you\u2019re part of that tradition!",
  },
  watercolor: {
    title: "Your First Watercolor Sunset",
    subtitle: "A dreamy wash of color \u2014 no drawing skills needed",
    totalTime: "30\u201345 minutes",
    totalCost: "Under $14",
    intro: "Watercolor is all about letting the paint do its thing. This sunset project uses the simplest technique \u2014 wet-on-wet \u2014 where beautiful things happen almost by accident!",
    shoppingList: [
      { name: "Student watercolor set (8+ colors)", price: "$5\u2013$8" },
      { name: "Watercolor paper (even 1 sheet works)", price: "$2\u2013$4" },
      { name: "Round brush (any size)", price: "$2\u2013$3" },
      { name: "Cup of water", price: "Free", owned: true },
      { name: "Paper towels", price: "Free", owned: true },
    ],
    steps: [
      { title: "Set up your workspace", description: "Tape your paper to a flat surface (masking tape on the edges keeps it flat). Fill a cup with clean water and lay out your paper towels.", duration: "3 min" },
      { title: "Wet the paper", description: "Using a clean wet brush, paint the entire paper with plain water. It should be shiny-wet but not puddling.", duration: "2 min", tip: "This is the secret to soft, dreamy edges!" },
      { title: "Lay down the yellow", description: "While the paper is still wet, load your brush with yellow and paint a stripe across the lower-middle area. Watch it bloom and spread \u2014 that\u2019s the magic!", duration: "3 min" },
      { title: "Add the orange and pink", description: "Without waiting, paint orange above and below the yellow, then pink/red above that. Let the colors bleed into each other naturally.", duration: "5 min", tip: "Don\u2019t overwork it. Let the water do the blending for you!" },
      { title: "Paint the sky", description: "Add purple or blue to the very top of the paper. It should blend softly into the pink layer below. This is your sky!", duration: "5 min" },
      { title: "Let it dry and admire", description: "Walk away for 15\u201320 minutes and let it dry completely. The colors will settle into something beautiful. Take a photo!", duration: "20 min (passive)", tip: "Every watercolor sunset is unique. That\u2019s the whole point!" },
    ],
    doneMessage: "You just painted a sunset! Watercolor rewards bravery and letting go of control. Notice how the colors blended on their own \u2014 that\u2019s the beauty of this medium.",
  },
  knitting: {
    title: "Your First Cozy Dishcloth",
    subtitle: "Learn one stitch, make something useful",
    totalTime: "60\u201390 minutes",
    totalCost: "Under $10",
    intro: "A dishcloth is the classic first knitting project because it\u2019s small, flat, and uses only one stitch. By the end, you\u2019ll have the rhythm down and something you can actually use!",
    shoppingList: [
      { name: "Cotton yarn (1 skein)", price: "$3\u2013$5" },
      { name: "Knitting needles (size 8/5mm)", price: "$3\u2013$5" },
      { name: "Scissors", price: "Free", owned: true },
    ],
    steps: [
      { title: "Cast on", description: "Make a slip knot and place it on one needle. Then cast on 30 stitches using the long-tail method (look up a 1-minute video if you need a visual).", duration: "10 min", tip: "Don\u2019t pull too tight! Loose stitches are much easier to work with when you\u2019re learning." },
      { title: "Learn the knit stitch", description: "Insert the right needle into the first stitch, wrap the yarn around, pull it through, and slip it off. That\u2019s it \u2014 that\u2019s the knit stitch. Repeat across the row.", duration: "15 min", tip: "It feels clumsy at first. By row 3 or 4, your hands will start to \u201cget it.\u201d" },
      { title: "Keep going!", description: "Knit every row. This creates a pattern called \u201cgarter stitch\u201d \u2014 it\u2019s squishy, reversible, and looks great. Aim for a square shape (about 30 rows).", duration: "30\u201345 min" },
      { title: "Cast off", description: "Knit 2 stitches, then pull the first one over the second. Knit 1 more, pull over again. Repeat until you have 1 stitch left, then cut the yarn and pull through.", duration: "5\u201310 min" },
      { title: "Weave in ends and admire", description: "Thread the yarn tail through a few stitches on the back to secure it, then trim. You\u2019re done \u2014 you made a dishcloth!", duration: "5 min", tip: "Use it in the kitchen, give it as a gift, or keep it as your very first knitted thing!" },
    ],
    doneMessage: "You just learned to knit! That rhythmic, meditative motion you felt? That\u2019s why knitters are obsessed. Your first piece won\u2019t be perfect \u2014 and that\u2019s what makes it special.",
  },
};

export function getProjectData(slug: string): ProjectData {
  return hobbyProjects[slug] ?? defaultProject;
}

/* ─── Local spots data ─── */

export interface LocalSpot {
  id: string;
  name: string;
  type: "Workshop" | "Studio" | "Class" | "Open Session";
  description: string;
  distance: string;
  price: string;
  rating: number;
  reviewCount: number;
  beginnerFriendly: boolean;
  nextDate: string;
}

const defaultSpots: LocalSpot[] = [
  {
    id: "1",
    name: "The Creative Corner Studio",
    type: "Workshop",
    description: "A welcoming beginner workshop where you\u2019ll learn the basics in a relaxed, no-pressure environment. All materials included.",
    distance: "2.3 mi",
    price: "$35\u2013$45",
    rating: 4.8,
    reviewCount: 124,
    beginnerFriendly: true,
    nextDate: "This Saturday, 10am",
  },
  {
    id: "2",
    name: "Maker\u2019s Space Community Hub",
    type: "Open Session",
    description: "Drop in and create at your own pace. Friendly staff on hand to help beginners. Bring your own materials or buy on-site.",
    distance: "3.7 mi",
    price: "$15/session",
    rating: 4.6,
    reviewCount: 89,
    beginnerFriendly: true,
    nextDate: "Every Wed & Fri, 6pm",
  },
  {
    id: "3",
    name: "Artisan Academy",
    type: "Class",
    description: "A structured 2-hour intro class taught by a professional artist. Small groups mean plenty of personal attention.",
    distance: "5.1 mi",
    price: "$55",
    rating: 4.9,
    reviewCount: 203,
    beginnerFriendly: true,
    nextDate: "Next Tuesday, 7pm",
  },
  {
    id: "4",
    name: "Weekend Craft Collective",
    type: "Workshop",
    description: "Monthly themed workshops for all skill levels. Great community vibe and all materials provided.",
    distance: "4.2 mi",
    price: "$40",
    rating: 4.5,
    reviewCount: 67,
    beginnerFriendly: true,
    nextDate: "Feb 15, 2pm",
  },
];

export function getLocalSpots(_slug: string): LocalSpot[] {
  return defaultSpots;
}

/* ─── Journey data (7-Day Path) ─── */

export interface JourneyDay {
  day: number;
  title: string;
  description: string;
  duration: string;
  contentTags: ("Video" | "Read" | "Exercise" | "Reflection")[];
}

const defaultJourney: JourneyDay[] = [
  { day: 1, title: "Meet Your Materials", description: "Get to know the basic tools and materials. Watch a short intro video and do a simple hands-on warm-up.", duration: "15 min", contentTags: ["Video", "Exercise"] },
  { day: 2, title: "Your First Technique", description: "Learn the most fundamental technique with a guided exercise. Focus on the feel, not perfection.", duration: "20 min", contentTags: ["Video", "Exercise"] },
  { day: 3, title: "Practice Makes Progress", description: "Repeat yesterday\u2019s technique with a small twist. Read about common beginner mistakes and how to embrace them.", duration: "20 min", contentTags: ["Exercise", "Read"] },
  { day: 4, title: "Level Up", description: "Learn a second technique that builds on what you already know. Combine it with what you learned on Day 2.", duration: "25 min", contentTags: ["Video", "Exercise"] },
  { day: 5, title: "Creative Play", description: "No rules today! Experiment freely with what you\u2019ve learned. Try combining techniques in ways that feel fun.", duration: "20 min", contentTags: ["Exercise", "Reflection"] },
  { day: 6, title: "Mini Project", description: "Put everything together into a small project. Follow along with a guided video or go your own way.", duration: "30 min", contentTags: ["Video", "Exercise"] },
  { day: 7, title: "Reflect & Celebrate", description: "Look at how far you\u2019ve come! Reflect on what you loved, journal about your experience, and plan your next steps.", duration: "15 min", contentTags: ["Reflection", "Read"] },
];

const hobbyJourneys: Record<string, JourneyDay[]> = {
  pottery: [
    { day: 1, title: "Meet Your Clay", description: "Unbox your air-dry clay, learn about different types of clay, and do a simple kneading warm-up to feel the material.", duration: "15 min", contentTags: ["Video", "Exercise"] },
    { day: 2, title: "The Pinch Pot", description: "Learn the pinch pot technique \u2014 the oldest form of pottery. Make your first small bowl using only your hands.", duration: "25 min", contentTags: ["Video", "Exercise"] },
    { day: 3, title: "Coil Building Basics", description: "Roll clay into coils and stack them to build a small cup. Practice smoothing and blending coils together.", duration: "25 min", contentTags: ["Video", "Exercise"] },
    { day: 4, title: "Textures & Patterns", description: "Explore carving, stamping, and pressing textures into clay. Use everyday objects like forks, leaves, and fabric.", duration: "20 min", contentTags: ["Exercise", "Read"] },
    { day: 5, title: "Slab Building", description: "Roll clay flat and cut shapes to construct a small tray or plate. Learn about joining techniques.", duration: "30 min", contentTags: ["Video", "Exercise"] },
    { day: 6, title: "Your Signature Piece", description: "Combine everything you\u2019ve learned to make a piece that\u2019s uniquely yours. Pinch, coil, slab, texture \u2014 your choice!", duration: "30 min", contentTags: ["Exercise", "Reflection"] },
    { day: 7, title: "Finishing & Reflection", description: "Learn about painting and sealing air-dry clay. Reflect on your week and explore what\u2019s next on your pottery journey.", duration: "20 min", contentTags: ["Video", "Read", "Reflection"] },
  ],
  watercolor: [
    { day: 1, title: "Meet Your Paints", description: "Set up your workspace, learn about your color palette, and do a simple color mixing exercise.", duration: "15 min", contentTags: ["Video", "Exercise"] },
    { day: 2, title: "Wet-on-Wet Magic", description: "Learn the wet-on-wet technique. Paint a simple sunset and watch the colors blend on their own.", duration: "20 min", contentTags: ["Video", "Exercise"] },
    { day: 3, title: "Wet-on-Dry Control", description: "Practice painting with more control using the wet-on-dry technique. Paint simple shapes and leaves.", duration: "20 min", contentTags: ["Video", "Exercise"] },
    { day: 4, title: "Layering & Depth", description: "Learn how to build layers (glazing) to create depth. Paint a series of overlapping transparent washes.", duration: "25 min", contentTags: ["Exercise", "Read"] },
    { day: 5, title: "Fun with Textures", description: "Experiment with salt, plastic wrap, and splattering to create unexpected textures.", duration: "20 min", contentTags: ["Exercise", "Reflection"] },
    { day: 6, title: "Paint a Simple Scene", description: "Combine everything into a small landscape or floral painting. Follow a guided tutorial or go freestyle!", duration: "30 min", contentTags: ["Video", "Exercise"] },
    { day: 7, title: "Your Style & Next Steps", description: "Reflect on which techniques you loved most. Start developing your own style and explore resources for continuing.", duration: "15 min", contentTags: ["Read", "Reflection"] },
  ],
  knitting: [
    { day: 1, title: "Yarn & Needles 101", description: "Learn about different yarn weights and needle sizes. Practice holding yarn and needles comfortably.", duration: "15 min", contentTags: ["Video", "Exercise"] },
    { day: 2, title: "Cast On & Knit Stitch", description: "Learn to cast on stitches and practice the knit stitch. Make your first few rows of garter stitch.", duration: "25 min", contentTags: ["Video", "Exercise"] },
    { day: 3, title: "Finding Your Rhythm", description: "Continue practicing the knit stitch. Focus on consistent tension and finding a comfortable rhythm.", duration: "20 min", contentTags: ["Exercise", "Read"] },
    { day: 4, title: "The Purl Stitch", description: "Learn the second fundamental stitch. Practice alternating knit and purl rows to create stockinette.", duration: "25 min", contentTags: ["Video", "Exercise"] },
    { day: 5, title: "Reading Your Knitting", description: "Learn to identify knit and purl stitches in your fabric. Practice fixing simple mistakes.", duration: "20 min", contentTags: ["Read", "Exercise"] },
    { day: 6, title: "Cast Off & Finish", description: "Learn to cast off and weave in ends. Complete your first finished piece \u2014 a dishcloth or small swatch.", duration: "25 min", contentTags: ["Video", "Exercise"] },
    { day: 7, title: "What\u2019s Next?", description: "Explore pattern reading basics, discover free beginner patterns, and plan your next project.", duration: "15 min", contentTags: ["Read", "Reflection"] },
  ],
};

export function getJourneyData(slug: string): JourneyDay[] {
  return hobbyJourneys[slug] ?? defaultJourney;
}
