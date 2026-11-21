/**
 * Demo content. Dates are relative to the moment the seed runs, so the catalog
 * always has upcoming events. Venues are real places in Kazakhstan; artists,
 * companies and programmes are fictional.
 */
import type { Category } from "../src/generated/prisma/enums";

export type CoverStyle =
  | "rings"
  | "sunburst"
  | "arches"
  | "halftone"
  | "grid"
  | "stripes"
  | "bauhaus"
  | "waves"
  | "confetti"
  | "orbit"
  | "bars"
  | "petals";

export type Palette = { bg: string; a: string; b: string; c: string };

export const PALETTES = {
  graphiteLime: { bg: "#17181a", a: "#c8f53c", b: "#f3f2ee", c: "#3a3c40" },
  cobaltCream: { bg: "#2440d6", a: "#f3ecdc", b: "#c8f53c", c: "#13207a" },
  vermilion: { bg: "#ff4f2b", a: "#17181a", b: "#ffd9c9", c: "#c8f53c" },
  creamInk: { bg: "#efe8d8", a: "#17181a", b: "#ff4f2b", c: "#c8f53c" },
  plum: { bg: "#2e1838", a: "#ff7ab6", b: "#ffd36b", c: "#5b2f6e" },
  forest: { bg: "#0f3326", a: "#c8f53c", b: "#e6f2d5", c: "#1d5a43" },
  ochre: { bg: "#e9a417", a: "#17181a", b: "#fff3d6", c: "#2440d6" },
  sky: { bg: "#a9d8ff", a: "#14206e", b: "#ffffff", c: "#ff4f2b" },
  night: { bg: "#0b0c1a", a: "#7d8cff", b: "#c8f53c", c: "#1f2147" },
  sand: { bg: "#d9c7a7", a: "#3a2618", b: "#f6efe2", c: "#b0412a" },
} satisfies Record<string, Palette>;

export type SeedTicketType = {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  /**
   * Tickets sold through generated demo orders from extra visitors. Every one of them
   * is a real Order + Ticket row, so organizer stats stay consistent with inventory.
   */
  presold?: number;
  maxPerOrder?: number;
};

export type SeedEvent = {
  key: string;
  organizer: "steppe" | "stage" | "nomad";
  title: string;
  summary: string;
  description: string;
  category: Category;
  city: string;
  venueName: string;
  venueAddress: string;
  /** Days from seed time; negative = past. */
  startInDays: number;
  startTime: string; // HH:MM Kazakhstan time
  durationHours: number;
  featured?: boolean;
  draft?: boolean;
  cover: { style: CoverStyle; palette: keyof typeof PALETTES };
  ticketTypes: SeedTicketType[];
  program: { time: string; title: string; description?: string }[];
};

export const ORGANIZERS = {
  steppe: {
    email: "organizer@eventhub.kz",
    name: "Steppe Sound Agency",
    bio: "Independent promoter behind Almaty's open-air season, jazz club nights and electronic shows in Astana.",
  },
  stage: {
    email: "stage@eventhub.kz",
    name: "Qazaq Stage Collective",
    bio: "Theatre producers and comedy bookers touring Kazakhstan since 2015.",
  },
  nomad: {
    email: "nomad@eventhub.kz",
    name: "Nomad Tech Events",
    bio: "Conferences, meetups and hands-on workshops for the Central Asian tech community.",
  },
} as const;

export const DEMO_VISITOR = {
  email: "visitor@eventhub.kz",
  name: "Aruzhan Sadykova",
  phone: "+77012345678",
  city: "almaty",
};

export const EXTRA_VISITORS = [
  { email: "dias.n@example.kz", name: "Dias Nurlanov" },
  { email: "madina.k@example.kz", name: "Madina Karimova" },
  { email: "timur.a@example.kz", name: "Timur Abenov" },
  { email: "aigerim.s@example.kz", name: "Aigerim Seitkali" },
  { email: "nikita.v@example.kz", name: "Nikita Volkov" },
  { email: "zarina.b@example.kz", name: "Zarina Bekova" },
];

export const EVENTS: SeedEvent[] = [
  {
    key: "steppe-echoes-festival",
    organizer: "steppe",
    title: "Steppe Echoes Festival",
    summary:
      "Two days of indie, ethno-electronic and folk-rock under the mountains, with 14 acts on two stages.",
    description:
      "Steppe Echoes returns to the Medeu valley for its fourth edition. Expect a main stage of guitar-driven headliners, a forest stage for ethno-electronic and late-night DJ sets, and a food court run by Almaty's best street-food crews.\n\nThe festival has a heated amphitheatre for the evening sets and free shuttle buses from Dostyk Plaza every 20 minutes. Children under 7 enter free with an adult ticket.\n\nTickets are valid for both days. Re-entry is allowed with a wristband issued at the entrance.",
    category: "FESTIVAL",
    city: "almaty",
    venueName: "Medeu Open Air",
    venueAddress: "Gornaya St 465, Almaty",
    startInDays: 24,
    startTime: "14:00",
    durationHours: 32,
    featured: true,
    cover: { style: "sunburst", palette: "vermilion" },
    ticketTypes: [
      {
        name: "Early bird",
        description: "Limited first release",
        price: 14900,
        quantity: 300,
        presold: 300,
      },
      {
        name: "General admission",
        description: "Both days, standing",
        price: 19900,
        quantity: 2000,
        presold: 380,
      },
      {
        name: "Amphitheatre seat",
        description: "Reserved seat for evening sets",
        price: 29900,
        quantity: 400,
        presold: 150,
      },
      {
        name: "VIP lounge",
        description: "Lounge access, fast lane, merch pack",
        price: 59900,
        quantity: 80,
        presold: 41,
        maxPerOrder: 4,
      },
    ],
    program: [
      { time: "14:00", title: "Gates open", description: "Shuttles start from Dostyk Plaza" },
      { time: "15:30", title: "Forest stage: Kökjiek" },
      { time: "18:00", title: "Main stage: The Saryarka Lines" },
      { time: "20:30", title: "Headliner: Aspan Orchestra" },
      { time: "23:00", title: "Late-night DJ set" },
    ],
  },
  {
    key: "aidyn-quartet-midnight-jazz",
    organizer: "steppe",
    title: "Aidyn Quartet: Midnight Jazz",
    summary: "An intimate late set of modal jazz and reworked Kazakh standards in a 120-seat room.",
    description:
      "Pianist Aidyn Serikov brings his quartet back home after a European tour. The programme mixes originals from the new album 'Kök Tóbe' with reimagined Kazakh songs from the 1960s.\n\nSeating is cabaret-style at small tables; the bar stays open throughout. Doors open one hour before the set.",
    category: "CONCERT",
    city: "almaty",
    venueName: "Kazakhconcert Chamber Hall",
    venueAddress: "Abylai Khan Ave 83, Almaty",
    startInDays: 6,
    startTime: "21:00",
    durationHours: 2.5,
    featured: true,
    cover: { style: "waves", palette: "night" },
    ticketTypes: [
      { name: "Table seat", price: 12000, quantity: 100, presold: 88 },
      {
        name: "Front table",
        description: "First two rows, welcome drink",
        price: 22000,
        quantity: 20,
        presold: 20,
        maxPerOrder: 4,
      },
    ],
    program: [
      { time: "20:00", title: "Doors & bar" },
      { time: "21:00", title: "Set I: Kök Tóbe" },
      { time: "22:00", title: "Intermission" },
      { time: "22:20", title: "Set II: Standards reimagined" },
    ],
  },
  {
    key: "neon-steppe-electronic-live",
    organizer: "steppe",
    title: "Neon Steppe: Electronic Live",
    summary: "Audio-visual show with modular synths, live drums and a 270° projection dome.",
    description:
      "Neon Steppe is a one-night audiovisual journey through Central Asian electronic music. Three live acts perform inside a projection dome built for the show, with visuals generated in real time from the music.\n\nThe floor is standing only. Earplugs are available for free at the bar.",
    category: "CONCERT",
    city: "astana",
    venueName: "Barys Arena, Hall B",
    venueAddress: "Turan Ave 57, Astana",
    startInDays: 12,
    startTime: "20:00",
    durationHours: 5,
    featured: true,
    cover: { style: "orbit", palette: "graphiteLime" },
    ticketTypes: [
      { name: "Dance floor", price: 15000, quantity: 1200, presold: 430 },
      {
        name: "Balcony",
        description: "Seated view over the dome",
        price: 24000,
        quantity: 200,
        presold: 64,
      },
    ],
    program: [
      { time: "20:00", title: "Doors" },
      { time: "21:00", title: "Live: Tengri Modular" },
      { time: "22:15", title: "Live: Ulytau Drums" },
      { time: "23:30", title: "Headline A/V set: Neon Steppe" },
    ],
  },
  {
    key: "hamlet-a-new-reading",
    organizer: "stage",
    title: "Hamlet. A New Reading",
    summary: "A stripped-down, two-hour Hamlet set in a contemporary Almaty apartment block.",
    description:
      "Director Gulnar Aitova moves Shakespeare's tragedy into a Soviet-era apartment block, where the walls are thin and everyone is listening. Performed in Russian with English and Kazakh surtitles.\n\nRecommended for ages 16+. Latecomers are admitted at the intermission only.",
    category: "THEATRE",
    city: "almaty",
    venueName: "Auezov Drama Theatre",
    venueAddress: "Abai Ave 103, Almaty",
    startInDays: 9,
    startTime: "19:00",
    durationHours: 2.5,
    cover: { style: "arches", palette: "plum" },
    ticketTypes: [
      { name: "Balcony", price: 5000, quantity: 180, presold: 96 },
      { name: "Stalls", price: 9000, quantity: 300, presold: 210 },
      { name: "Premium stalls", description: "Rows 1–5", price: 15000, quantity: 60, presold: 55 },
    ],
    program: [
      { time: "19:00", title: "Act I" },
      { time: "20:10", title: "Intermission" },
      { time: "20:30", title: "Act II" },
    ],
  },
  {
    key: "swan-lake-astana-opera",
    organizer: "stage",
    title: "Swan Lake",
    summary: "Tchaikovsky's classic in a full-length production with live orchestra.",
    description:
      "The full four-act production of Swan Lake with the house orchestra and corps de ballet. A guest principal pair dances Odette/Odile and Prince Siegfried.\n\nDress code: smart. The theatre opens 45 minutes before the performance; the cloakroom is free.",
    category: "THEATRE",
    city: "astana",
    venueName: "Astana Opera",
    venueAddress: "Kunayev St 1, Astana",
    startInDays: 30,
    startTime: "19:00",
    durationHours: 3,
    featured: true,
    cover: { style: "petals", palette: "cobaltCream" },
    ticketTypes: [
      { name: "Gallery", price: 8000, quantity: 250, presold: 140 },
      { name: "Parterre", price: 18000, quantity: 500, presold: 318 },
      {
        name: "Box seat",
        description: "Private box for up to 4",
        price: 35000,
        quantity: 48,
        presold: 30,
        maxPerOrder: 4,
      },
    ],
    program: [
      { time: "19:00", title: "Acts I–II" },
      { time: "20:20", title: "Intermission" },
      { time: "20:45", title: "Acts III–IV" },
    ],
  },
  {
    key: "open-mic-winter-roast",
    organizer: "stage",
    title: "Open Mic: Winter Roast",
    summary:
      "Eight comics, ten minutes each, one brutal roast battle to close the night. English set.",
    description:
      "Almaty's longest-running English-language open mic hosts its winter roast. Eight comedians get ten minutes each, then the two crowd favourites go head-to-head in a roast battle.\n\nThe show contains strong language. 18+ only, ID is checked at the door.",
    category: "STANDUP",
    city: "almaty",
    venueName: "Dom Kino Bar",
    venueAddress: "Tole Bi St 59, Almaty",
    startInDays: 3,
    startTime: "20:00",
    durationHours: 2,
    cover: { style: "halftone", palette: "ochre" },
    ticketTypes: [
      { name: "Standard", price: 6000, quantity: 150, presold: 71 },
      {
        name: "Front row",
        description: "You will be roasted",
        price: 9000,
        quantity: 12,
        presold: 9,
        maxPerOrder: 2,
      },
    ],
    program: [
      { time: "20:00", title: "Opening: host warm-up" },
      { time: "20:15", title: "Eight sets" },
      { time: "21:40", title: "Roast battle final" },
    ],
  },
  {
    key: "qazaq-comedy-tour-shymkent",
    organizer: "stage",
    title: "Qazaq Comedy Tour",
    summary: "The country's biggest stand-up tour stops in Shymkent with four headliners.",
    description:
      "Four headliners, one night, two languages. The Qazaq Comedy Tour brings its arena show to Shymkent with sets in Kazakh and Russian about family, traffic and everything in between.\n\nAll seats are reserved. The show runs about two hours with a short break.",
    category: "STANDUP",
    city: "shymkent",
    venueName: "Shymkent Palace of Culture",
    venueAddress: "Tauke Khan Ave 30, Shymkent",
    startInDays: 15,
    startTime: "19:30",
    durationHours: 2,
    cover: { style: "confetti", palette: "creamInk" },
    ticketTypes: [
      { name: "Standard", price: 7000, quantity: 800, presold: 380 },
      { name: "Premium", description: "Rows 1–8", price: 14000, quantity: 120, presold: 70 },
    ],
    program: [
      { time: "19:30", title: "Headliner sets I–II" },
      { time: "20:30", title: "Break" },
      { time: "20:45", title: "Headliner sets III–IV" },
    ],
  },
  {
    key: "astana-product-summit",
    organizer: "nomad",
    title: "Astana Product Summit",
    summary: "Product, design and growth leaders from Central Asia's fastest-growing startups.",
    description:
      "One day, three tracks: product management, product design and growth. Speakers from regional startups share real roadmaps, failed experiments and hiring playbooks.\n\nThe ticket includes lunch, coffee breaks and access to the recordings. Talks are in English and Russian with simultaneous translation.",
    category: "CONFERENCE",
    city: "astana",
    venueName: "Astana Hub",
    venueAddress: "Mangilik El Ave 55/8, Astana",
    startInDays: 18,
    startTime: "09:30",
    durationHours: 9,
    featured: true,
    cover: { style: "grid", palette: "cobaltCream" },
    ticketTypes: [
      { name: "Standard", price: 45000, quantity: 600, presold: 210 },
      {
        name: "Student",
        description: "Valid student ID required at entry",
        price: 15000,
        quantity: 100,
        presold: 62,
      },
      {
        name: "Business",
        description: "Front seating, speaker dinner",
        price: 120000,
        quantity: 40,
        presold: 12,
        maxPerOrder: 3,
      },
    ],
    program: [
      { time: "09:30", title: "Registration & coffee" },
      { time: "10:00", title: "Keynote: Building for 20 million users" },
      { time: "11:30", title: "Three parallel tracks" },
      { time: "13:30", title: "Lunch" },
      { time: "17:30", title: "Founders panel & networking" },
    ],
  },
  {
    key: "frontend-kazakhstan-meetup",
    organizer: "nomad",
    title: "Frontend Kazakhstan Meetup #18",
    summary: "Talks on React Server Components, design systems and web performance budgets.",
    description:
      "The monthly meetup for frontend engineers. This edition: migrating a banking app to the App Router, maintaining a design system across five products, and a live session on measuring Core Web Vitals in production.\n\nPizza and drinks after the talks.",
    category: "CONFERENCE",
    city: "almaty",
    venueName: "SmArt.Point",
    venueAddress: "Baizakov St 280, Almaty",
    startInDays: 10,
    startTime: "18:30",
    durationHours: 3,
    cover: { style: "bars", palette: "graphiteLime" },
    ticketTypes: [{ name: "Attendee", price: 2000, quantity: 150, presold: 93 }],
    program: [
      { time: "18:30", title: "Doors & networking" },
      { time: "19:00", title: "RSC in a banking app" },
      { time: "19:40", title: "One design system, five products" },
      { time: "20:20", title: "Web Vitals live clinic" },
    ],
  },
  {
    key: "almaty-winter-run",
    organizer: "steppe",
    title: "Almaty Winter Run",
    summary:
      "5 km and 10 km routes along the Esentai embankment. Finisher medal and hot tea included.",
    description:
      "A friendly winter race for all levels. Both routes are fully closed to traffic and timed with chips. Every finisher gets a medal, hot tea and a bowl of baursaks at the finish village.\n\nStart packs are issued the day before at the Esentai Mall atrium.",
    category: "SPORT",
    city: "almaty",
    venueName: "Esentai Embankment",
    venueAddress: "Al-Farabi Ave 77/8, Almaty",
    startInDays: 20,
    startTime: "10:00",
    durationHours: 4,
    cover: { style: "stripes", palette: "sky" },
    ticketTypes: [
      { name: "5 km", price: 9000, quantity: 1500, presold: 290 },
      { name: "10 km", price: 12000, quantity: 1000, presold: 230 },
    ],
    program: [
      { time: "09:00", title: "Finish village opens" },
      { time: "10:00", title: "10 km start" },
      { time: "10:20", title: "5 km start" },
      { time: "12:30", title: "Awards" },
    ],
  },
  {
    key: "futsal-cup-final",
    organizer: "steppe",
    title: "Futsal Cup Final",
    summary:
      "The national futsal cup final — two-time champions against this season's surprise team.",
    description:
      "The best two futsal teams of the season meet in Almaty for the cup final. Expect a packed arena, drums and a half-time show.\n\nChildren under 5 enter free on a parent's lap.",
    category: "SPORT",
    city: "almaty",
    venueName: "Almaty Arena",
    venueAddress: "Momyshuly St 1, Almaty",
    startInDays: 5,
    startTime: "18:00",
    durationHours: 2,
    cover: { style: "rings", palette: "forest" },
    ticketTypes: [
      { name: "Upper tier", price: 3000, quantity: 3000, presold: 640 },
      { name: "Lower tier", price: 6000, quantity: 2000, presold: 410 },
    ],
    program: [
      { time: "17:00", title: "Doors" },
      { time: "18:00", title: "Kick-off" },
      { time: "18:45", title: "Half-time show" },
    ],
  },
  {
    key: "data-ai-workshop-karaganda",
    organizer: "nomad",
    title: "Data & AI Workshop: Your First Model",
    summary:
      "A hands-on Saturday: clean a real dataset, train a model and ship it as a tiny web app.",
    description:
      "Bring a laptop — we'll provide everything else. In six hours you'll go from a messy CSV of Karaganda air-quality data to a deployed prediction app.\n\nNo prior machine learning experience needed; basic Python helps. Groups are limited to 30 people so mentors can help everyone.",
    category: "WORKSHOP",
    city: "karaganda",
    venueName: "Karaganda Technical University, Lab 4",
    venueAddress: "Nursultan Nazarbayev Ave 56, Karaganda",
    startInDays: 8,
    startTime: "10:00",
    durationHours: 6,
    cover: { style: "grid", palette: "forest" },
    ticketTypes: [
      {
        name: "Participant",
        description: "Lunch included",
        price: 18000,
        quantity: 30,
        presold: 22,
        maxPerOrder: 2,
      },
    ],
    program: [
      { time: "10:00", title: "Data cleaning with pandas" },
      { time: "12:00", title: "Training & evaluating" },
      { time: "13:00", title: "Lunch" },
      { time: "14:00", title: "Shipping the model" },
    ],
  },
  {
    key: "lines-of-the-steppe-exhibition",
    organizer: "stage",
    title: "Lines of the Steppe",
    summary: "Contemporary Kazakh artists reinterpret ornament, textile and landscape. 60+ works.",
    description:
      "A six-week exhibition bringing together painters, textile artists and digital creators who work with traditional ornament. The show includes a room-sized felt installation and an interactive projection piece.\n\nYour ticket is valid for one visit on any day during the exhibition run. Free guided tours start every Saturday at 15:00.",
    category: "EXHIBITION",
    city: "almaty",
    venueName: "Kasteyev State Museum of Arts",
    venueAddress: "Satpayev St 30a, Almaty",
    startInDays: 2,
    startTime: "10:00",
    durationHours: 24 * 40,
    cover: { style: "bauhaus", palette: "creamInk" },
    ticketTypes: [
      { name: "Adult", price: 3000, quantity: 5000, presold: 260 },
      { name: "Student / senior", price: 1500, quantity: 2000, presold: 230 },
    ],
    program: [
      { time: "10:00", title: "Daily opening" },
      { time: "15:00", title: "Saturday guided tour" },
      { time: "19:00", title: "Last entry" },
    ],
  },
  {
    key: "caspian-design-week",
    organizer: "nomad",
    title: "Caspian Design Week",
    summary:
      "Industrial, graphic and interior design from the Caspian region, with talks and a makers' market.",
    description:
      "A week of exhibitions and talks on the Aktau seafront. Studios from Kazakhstan, Azerbaijan and Uzbekistan show furniture, type design and product prototypes. The weekend makers' market is free with any ticket.\n\nTickets give access to all exhibition spaces for the selected pass.",
    category: "EXHIBITION",
    city: "aktau",
    venueName: "Aktau Seaside Pavilion",
    venueAddress: "14th Microdistrict, Aktau",
    startInDays: 27,
    startTime: "11:00",
    durationHours: 24 * 6 + 8,
    cover: { style: "waves", palette: "sand" },
    ticketTypes: [
      { name: "Day pass", price: 4000, quantity: 1500, presold: 120 },
      {
        name: "Week pass",
        description: "Includes all talks",
        price: 12000,
        quantity: 300,
        presold: 45,
      },
    ],
    program: [
      { time: "11:00", title: "Pavilions open" },
      { time: "16:00", title: "Daily talk" },
      { time: "19:00", title: "Close" },
    ],
  },
  {
    key: "little-explorers-science-show",
    organizer: "nomad",
    title: "Little Explorers Science Show",
    summary:
      "Explosions (safe ones), liquid nitrogen ice cream and a giant bubble finale for ages 5–12.",
    description:
      "A 75-minute interactive science show where kids are invited on stage to help with the experiments. Every child gets a take-home experiment kit.\n\nAdults need a ticket too. The hall has a buggy park and a family room.",
    category: "KIDS",
    city: "astana",
    venueName: "Khan Shatyr, Event Hall",
    venueAddress: "Turan Ave 37, Astana",
    startInDays: 7,
    startTime: "12:00",
    durationHours: 1.5,
    cover: { style: "confetti", palette: "sky" },
    ticketTypes: [
      {
        name: "Child",
        description: "Includes experiment kit",
        price: 5000,
        quantity: 200,
        presold: 120,
      },
      { name: "Adult", price: 3500, quantity: 200, presold: 104 },
    ],
    program: [
      { time: "12:00", title: "Show starts" },
      { time: "13:15", title: "Giant bubble finale" },
    ],
  },
  {
    key: "pottery-weekend-masterclass",
    organizer: "stage",
    title: "Pottery Weekend Masterclass",
    summary:
      "Learn to centre clay and throw your first bowl on the wheel. Firing and glazing included.",
    description:
      "A relaxed three-hour session in a sunny studio. You'll learn wedging, centring and throwing, and leave two pieces to be fired and glazed — they're ready for pickup ten days later.\n\nAprons and all materials are provided. Wear clothes you don't mind getting dirty.",
    category: "WORKSHOP",
    city: "almaty",
    venueName: "Glina Studio",
    venueAddress: "Zhibek Zholy Ave 50, Almaty",
    startInDays: 4,
    startTime: "11:00",
    durationHours: 3,
    cover: { style: "rings", palette: "sand" },
    ticketTypes: [{ name: "Wheel seat", price: 16000, quantity: 10, presold: 7, maxPerOrder: 2 }],
    program: [
      { time: "11:00", title: "Wedging & centring" },
      { time: "12:00", title: "Throwing a bowl" },
      { time: "13:30", title: "Trimming demo" },
    ],
  },
  {
    key: "shymkent-street-food-fest",
    organizer: "steppe",
    title: "Shymkent Street Food & Music Fest",
    summary:
      "Forty food trucks, two music stages and a plov championship in Shymkent's central park.",
    description:
      "The south's biggest food festival is back. Forty trucks and stalls, a live plov championship judged by the audience, and two stages with local bands from noon until late.\n\nEntry tickets include three tasting tokens.",
    category: "FESTIVAL",
    city: "shymkent",
    venueName: "Shymkent Central Park",
    venueAddress: "Kazybek Bi St, Shymkent",
    startInDays: 35,
    startTime: "12:00",
    durationHours: 10,
    cover: { style: "sunburst", palette: "ochre" },
    ticketTypes: [
      { name: "Entry + 3 tokens", price: 5000, quantity: 4000, presold: 310 },
      {
        name: "Family pack",
        description: "2 adults + 2 kids, 10 tokens",
        price: 14000,
        quantity: 500,
        presold: 95,
        maxPerOrder: 2,
      },
    ],
    program: [
      { time: "12:00", title: "Gates open" },
      { time: "15:00", title: "Plov championship" },
      { time: "19:00", title: "Evening concert" },
    ],
  },
  {
    key: "atyrau-winter-chamber-music",
    organizer: "steppe",
    title: "Winter Chamber Music Evening",
    summary: "A string quartet and kobyz soloist perform Borodin, Tlendiev and new commissions.",
    description:
      "An evening of chamber music by candlelight. The quartet pairs Borodin's String Quartet No. 2 with works by Nurgisa Tlendiev arranged for strings and kobyz, plus a world premiere by a young Atyrau composer.",
    category: "CONCERT",
    city: "atyrau",
    venueName: "Atyrau Philharmonic",
    venueAddress: "Satpayev Ave 7, Atyrau",
    startInDays: 14,
    startTime: "19:00",
    durationHours: 2,
    cover: { style: "petals", palette: "plum" },
    ticketTypes: [{ name: "Seat", price: 6000, quantity: 350, presold: 140 }],
    program: [
      { time: "19:00", title: "Borodin: Quartet No. 2" },
      { time: "19:45", title: "Interval" },
      { time: "20:05", title: "Tlendiev arrangements & premiere" },
    ],
  },
  // ── Past events (visitor history and organizer stats) ──
  {
    key: "autumn-indie-showcase",
    organizer: "steppe",
    title: "Autumn Indie Showcase",
    summary: "Five new Almaty bands, one stage, and the best sound system in town.",
    description:
      "An evening showcase for emerging Almaty indie bands, curated by Steppe Sound Agency.",
    category: "CONCERT",
    city: "almaty",
    venueName: "Kazakhconcert Chamber Hall",
    venueAddress: "Abylai Khan Ave 83, Almaty",
    startInDays: -20,
    startTime: "19:00",
    durationHours: 4,
    cover: { style: "bars", palette: "vermilion" },
    ticketTypes: [{ name: "Standing", price: 5000, quantity: 300, presold: 240 }],
    program: [{ time: "19:00", title: "Five bands" }],
  },
  {
    key: "astana-startup-night",
    organizer: "nomad",
    title: "Astana Startup Night",
    summary: "Pitches, demos and a founders' mixer.",
    description: "Ten early-stage startups pitched to a panel of investors, followed by drinks.",
    category: "CONFERENCE",
    city: "astana",
    venueName: "Astana Hub",
    venueAddress: "Mangilik El Ave 55/8, Astana",
    startInDays: -45,
    startTime: "18:00",
    durationHours: 4,
    cover: { style: "orbit", palette: "cobaltCream" },
    ticketTypes: [{ name: "Guest", price: 3000, quantity: 200, presold: 180 }],
    program: [{ time: "18:00", title: "Pitches" }],
  },
  // ── Draft (visible only to its organizer) ──
  {
    key: "rooftop-sessions",
    organizer: "steppe",
    title: "Rooftop Sessions: Spring Opening",
    summary: "Sunset acoustic sets on a rooftop overlooking the city. Lineup to be announced.",
    description:
      "The rooftop season opener. Three acoustic acts, a cocktail bar and the best view of the mountains in Almaty. This event is still a draft — only the organizer can see it.",
    category: "CONCERT",
    city: "almaty",
    venueName: "Rooftop Terrace, Esentai Tower",
    venueAddress: "Al-Farabi Ave 77/7, Almaty",
    startInDays: 140,
    startTime: "18:30",
    durationHours: 4,
    draft: true,
    cover: { style: "halftone", palette: "forest" },
    ticketTypes: [{ name: "Standing", price: 18000, quantity: 120 }],
    program: [],
  },
];
