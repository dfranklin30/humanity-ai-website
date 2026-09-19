/**
 * "Make It With AI" — the eight-week creator club, week by week.
 *
 * This is the single source of truth for the program's sessions. Two kinds of
 * consumer read it:
 *
 *   - The PUBLIC pages (Home, Program, Curriculum, Brochure) render the
 *     `Week` fields: title, summary, topics, build.
 *   - The FACILITATOR week modules at /aiforkids/week/1..8 render the full
 *     run-sheet: prep, minute-by-minute agenda, coaching notes,
 *     differentiation, watch-outs and the prompt starter.
 *
 * The run-sheet fields are never shown to children or to the public. The
 * week module pages sit behind a facilitator session.
 *
 * Source: "Make It With AI — An 8-Week Creator Club for Grades 3–5",
 * Humanity + AI. Keep this file and that document in step.
 */

import type { ModeId } from "../studio/api";

/** Public shape — what the marketing pages render. */
export type Week = {
  n: number;
  title: string;
  summary: string;
  topics: string[];
  build: string;
};

export type AgendaBlock = {
  /** e.g. "0:05–0:15" */
  time: string;
  /** e.g. "Spark" */
  block: string;
  detail: string;
};

/** Facilitator shape — everything needed to run the hour. */
export type WeekModule = Week & {
  /** Short marketing-friendly hook, e.g. "Lights, Camera, Game!" */
  hook: string;
  bigQuestion: string;
  /** The one honest, kid-sized idea the session closes on. */
  aiTruth: string;
  kidsWill: string[];
  /** Studio modes the facilitator unlocks for this session. */
  studioModes: ModeId[];
  /** Ticket limit to set on the class for this session. null = leave as is. */
  ticketLimit: number | null;
  tools: string;
  prep: string[];
  agenda: AgendaBlock[];
  facilitatorNotes: string[];
  differentiation: string[];
  watchOuts: string[];
  promptStarter: string;
  takeHome: string;
};

const a = (time: string, block: string, detail: string): AgendaBlock => ({ time, block, detail });

export const WEEK_MODULES: WeekModule[] = [
  {
    n: 1,
    title: "Game Makers",
    hook: "Lights, Camera, Game!",
    bigQuestion: "Can we make a real video game in ten minutes?",
    summary:
      "The club opens with the loudest possible proof that this is going to be fun: a playable video game, designed by the room, running on the projector inside of ten minutes.",
    topics: [
      "Club rules: kids are the directors",
      "Signing in to the Kids AI Studio",
      "Game design in teams — hero, goal, hazard, power-up",
      "Writing a Director's Order",
      "Iterating: asking for one specific change",
    ],
    build: "Each team ships a playable game to the class Arcade.",
    aiTruth: "AI is a fast helper that follows directions. Clear directions get better results.",
    kidsWill: [
      "Play an AI-built game the class designed together on the spot",
      "Design an original game on a Game Design Card in teams of 3–4",
      "Request one change and watch it happen instantly",
    ],
    studioModes: ["game"],
    ticketLimit: 2,
    tools:
      "Kids AI Studio in Game Maker mode, facilitator dashboard on the projector for the Spark. Kids: one Chromebook each signed in to the Studio, Game Design Cards, pencils.",
    prep: [
      "Create the class in the Studio, add each child's nickname, avatar and PIN, and confirm consent is recorded for every child — locked accounts cannot sign in.",
      "Test Game Maker with your own Spark prompt the day before and save a working backup game in case live generation fails.",
      "Unlock only Game Maker mode for this week.",
      "Print one Game Design Card per team plus spares, and a sign-in card (class code, nickname, PIN) per child.",
    ],
    agenda: [
      a("0:00–0:05", "Arcade", "Welcome, seats, club rules in one minute: “Kids are the directors. Only the facilitator types into AI outside the Studio. We are kind to work-in-progress.”"),
      a("0:05–0:15", "Spark", "Ask the room for a hero, something to catch, something to dodge and a silly rule. Type the class's answers into Game Maker on the projector. Run it. Play the first round with a volunteer at the keyboard. Then show the dashboard: “This is what I see while you work — every order and every result.” Publish the class game to the Arcade."),
      a("0:15–0:40", "Make", "Kids sign in and find the Game Maker card. Teams of 3–4 fill a Game Design Card: title, hero, goal, what to avoid, power-up, how you win, one silly rule. One teammate types the card in as the team's first Director's Order. Teams play their own game while others finish; watch the dashboard and help anyone whose request came back with a “let's try that a different way” message."),
      a("0:40–0:52", "Play & Remix", "Teams publish to the Arcade and play each other's games. Each child submits one Director's Order for a specific change (“make the stars fall faster”, “add a score counter”, “make the hero a cat”) and watches it land. Narrate two or three from the dashboard so the room sees instant iteration."),
      a("0:52–1:00", "Share + AI Truth", "Two teams share what they most want to change next week. AI Truth: clear directions get better results; fuzzy directions get fuzzy results."),
    ],
    facilitatorNotes: [
      "Keep the first game absurdly simple — catch and dodge, arrow keys, a score. Simplicity makes iteration visible.",
      "When a generated game breaks, narrate it: “AI makes mistakes too. Watch me tell it what went wrong.” Recovery is the lesson.",
      "Sign-in takes longer than you think the first time. Budget five minutes and have sign-in cards ready.",
      "If a child asks for something the AI cannot do quickly, write it on a Big Ideas poster for the passion project weeks.",
    ],
    differentiation: [
      "Grade 3: sentence stems on the Game Design Card (“My hero is a ___ who has to ___”). Pair with a 5th grader for typing.",
      "Grade 5: ask for a scoring rule or a second level in their design; invite them to write the team's change request.",
    ],
    watchOuts: [
      "Games live only in the Studio Arcade. Nothing is emailed or downloaded.",
      "Some generated games use sound — check volume before the Arcade.",
      "Remind kids: nicknames only, never real names, in any order.",
    ],
    promptStarter:
      "The player is a [HERO] who moves left and right with the arrow keys and tries to catch falling [GOOD THING] while dodging falling [BAD THING]. Show a score and three lives. Silly rule: [RULE]. Bright colors, big shapes, simple emoji or drawn shapes for the characters.",
    takeHome:
      "None. Between sessions: review the dashboard log, finish any team game that did not complete, and confirm every game is in the Arcade.",
  },
  {
    n: 2,
    title: "Story Studio",
    hook: "Comic & Storybook Makers",
    bigQuestion: "What happens when your imagination gets a super-fast illustrator?",
    summary:
      "Children write an original comic and see the difference between the parts a machine can draw in seconds and the parts only they can decide.",
    topics: [
      "Story seeds: hero, place, problem, ending",
      "Writing a four-panel comic",
      "Describing an image in words",
      "Comparing what the AI got right and what it invented",
      "Two stars and a wish",
    ],
    build: "An original four-panel comic with a cover the child described.",
    aiTruth: "AI makes things up. Great for stories; that is exactly why we check facts.",
    kidsWill: [
      "Write an original four-panel comic",
      "Describe an image in words and see the AI draw it",
      "Read a neighbor's comic and give two stars and a wish",
    ],
    studioModes: ["story", "prompt"],
    ticketLimit: 2,
    tools:
      "Kids AI Studio in Story Maker mode — script help and one approved cover image per child. Kids: a four-panel comic template, Story Seed Sheet, colored pencils for hand-drawn panels.",
    prep: [
      "Prepare a four-panel comic template (frame, speech bubble, caption box) and share a copy to each child.",
      "Unlock Story Maker and turn on the image approval gate so every cover request waits for your tap.",
      "Generate two sample cover images ahead of time in case generation is slow.",
      "Queue the team games from Week 1 in the Arcade.",
    ],
    agenda: [
      a("0:00–0:05", "Arcade", "Play the rest of last week's team games. Quick cheer for every team."),
      a("0:05–0:15", "Spark", "Collect three story seeds from the room: a hero, a place, a problem. Ask for a six-panel comic script, one sentence per panel. Read it aloud with voices. Then ask for one panel picture and compare the words to the picture — what did the AI get right, what did it invent?"),
      a("0:15–0:40", "Make", "Each child fills a Story Seed Sheet, then writes four panels: caption plus speech bubble. Each child submits one Cover Picture Order describing their cover (who or what, where, mood or colors). Approve covers from the dashboard as they arrive. Children hand-draw panels 1–4 so the story stays theirs."),
      a("0:40–0:52", "Play & Remix", "Gallery walk: read the comic to your left, leave a sticky note with two stars and a wish. Pick two volunteers' stories for read-aloud on the projector. One Director's Order each: a cover change or a title treatment."),
      a("0:52–1:00", "Share + AI Truth", "Two shares. AI Truth: it is a pattern machine, not a truth machine."),
    ],
    facilitatorNotes: [
      "Ownership matters more than polish. A hand-drawn panel next to an AI cover teaches the human/AI split better than a lecture.",
      "The approval gate means you see every image before a child does. If something is odd — extra fingers, garbled text — reject it and turn it into a laugh and a lesson.",
      "Use read-aloud for narration. No child voices are ever recorded.",
    ],
    differentiation: [
      "Grade 3: allow two panels plus a cover; scribe for children who write slowly.",
      "Grade 5: require a twist ending and dialogue in every panel; ask for a cover description with three specific details.",
    ],
    watchOuts: [
      "No child's name, face or personal details in an image description.",
      "Skip image styles that reference living artists — ask for “cartoon”, “watercolor” or “pixel art” instead.",
    ],
    promptStarter:
      "Write a six-panel comic script for children ages 8–11. Hero: [HERO]. Setting: [PLACE]. Problem: [PROBLEM]. One sentence of narration and one short line of dialogue per panel. Funny, kind and G-rated, with a satisfying ending. Then describe panel 3 as a picture in one sentence.",
    takeHome: "Children may finish coloring their panels at home. Export each comic as a PDF into the child's folder.",
  },
  {
    n: 3,
    title: "Art & Music Jam",
    hook: "Prompt Detective and the Club Anthem",
    bigQuestion: "How do the words we choose change what the AI makes?",
    summary:
      "The prompting week. Children work out for themselves why specific words matter, then write the club's anthem and compose their own eight-bar loop.",
    topics: [
      "Prompt Detective — guessing the prompt from the picture",
      "The three-details rule: who or what, where, mood",
      "Poster art for the Expo",
      "Co-writing lyrics",
      "Where the training data came from, and why artists matter",
    ],
    build: "Club poster art, a class anthem, and a personal eight-bar music loop.",
    aiTruth: "AI learned from millions of things people made. Artists matter; we give credit and never copy a real artist.",
    kidsWill: [
      "Play Prompt Detective and discover why specific words matter",
      "Write prompts for club poster art and compare results",
      "Co-write the club anthem in Music Maker and compose their own eight-bar loop",
    ],
    studioModes: ["prompt", "music"],
    ticketLimit: 2,
    tools:
      "Kids AI Studio in Prompt Craft and Music Maker modes, approval gate on for both. Speakers. Kids: a browser music sandbox with no login, Prompt Cards, Lyric Template.",
    prep: [
      "Generate three mystery images the night before with prompts of different specificity — vague, medium, very detailed — for Prompt Detective.",
      "Unlock Prompt Craft with the approval gate on.",
      "Prepare a Lyric Template with blanks: what we make, what we love, our club's name, a chant line.",
      "Check the music tool's output for lyric accuracy before playing; regenerate if anything is off.",
    ],
    agenda: [
      a("0:00–0:05", "Arcade", "Show three or four comics from last week as a slideshow while kids arrive."),
      a("0:05–0:15", "Spark", "Prompt Detective: show mystery image 1, kids guess the prompt, reveal. Repeat with the very detailed one. Which prompt gave the AI more to work with? Then take a vague prompt (“a dog”) and add one detail at a time on the projector. The room sees specificity pay off."),
      a("0:15–0:40", "Make", "Part A (12 min) Poster Prompts: each child drafts two prompts with at least three details each, then submits their favorite. Approve from the dashboard; put eight to ten on the projector and let the class star its favorites. Part B (13 min) Club Anthem: fill the Lyric Template together, vote on a style, generate two versions while each child builds an eight-bar loop."),
      a("0:40–0:52", "Play & Remix", "Listen to both anthem versions, vote, request one change — faster, add a chant, more drums. Kids share loops with a partner and remix one thing in each other's loop."),
      a("0:52–1:00", "Share + AI Truth", "Play the winning anthem once more. AI Truth: artists matter; we give credit."),
    ],
    facilitatorNotes: [
      "The three-details rule is the single most useful prompting habit for this age. Post it on the wall for the rest of the program.",
      "Save the winning poster art and the anthem — both come back in Week 8.",
      "The music sandbox is intentionally simple. Celebrate loops that are weird.",
    ],
    differentiation: [
      "Grade 3: provide a word bank of moods and places for Prompt Cards.",
      "Grade 5: ask for a prompt that includes a camera angle or an art style word, and a second verse for the anthem.",
    ],
    watchOuts: [
      "Music generators sometimes mis-sing lyrics. Preview before playing.",
      "Keep prompts free of real people, brands and copyrighted characters.",
    ],
    promptStarter:
      "Create an upbeat [STYLE] song, about 60 seconds, for an after-school kids' club called [CLUB NAME]. Lyrics: [CLASS LYRICS]. Clear sing-along chorus, kid-friendly, no slang that could be misunderstood.",
    takeHome: "None. Between sessions: post the anthem and top poster art to the club folder.",
  },
  {
    n: 4,
    title: "Choose Your Quest",
    hook: "Passion Project Launch",
    bigQuestion: "What do you love so much you'd want to make something about it?",
    summary:
      "The hinge of the program. Every child picks a path and a topic they actually care about, and walks out of the session with a working prototype.",
    topics: [
      "The five Quest paths",
      "Writing a Quest Plan",
      "Separating “what AI will help with” from “what I will do myself”",
      "The Prototype Lightning Round",
      "Starting a Fact List",
    ],
    build: "A working prototype of each child's passion project.",
    aiTruth: "AI gives a first draft in seconds. Your job is the second draft — making it yours.",
    kidsWill: [
      "Choose a Quest path and a personal topic they care about",
      "Complete a Quest Plan that separates AI's work from their own",
      "Receive a working prototype inside the session",
    ],
    studioModes: ["game", "story", "prompt", "quest"],
    ticketLimit: 1,
    tools:
      "Kids AI Studio with Game Maker, Story Maker, Prompt Craft and Quest Helper all unlocked; each child chooses one. Kids: Quest Plan sheet, Studio portfolio.",
    prep: [
      "Unlock all four modes and set the ticket limit to one for the Lightning Round.",
      "Print Quest Plans and a poster of the five Quest paths with an example of each.",
      "Put a visible timer on the projector for the Lightning Round.",
      "Decide pairing rules: solo or pairs, same Quest path.",
    ],
    agenda: [
      a("0:00–0:05", "Arcade", "Anthem plays as kids arrive. Poster art on screen."),
      a("0:05–0:15", "Spark", "Introduce the five Quest paths with a two-minute example of each: Game Maker, Story Maker, Art & Music Maker, Explorer (a fact-checked poster or quiz about something they love) and Inventor (design an invention or robot with a pitch). Emphasize: the topic must be something you love."),
      a("0:15–0:40", "Make", "Kids fill the Quest Plan — what am I making, who is it for, what will AI help with, what will I do myself, what does done look like. Approve plans quickly with a checkmark. Then the Prototype Lightning Round: one Director's Order each. Kids start playing with prototypes the moment they land."),
      a("0:40–0:52", "Play & Remix", "Kids explore their prototype, or a classmate's while waiting, and write their first improvement ticket for next week. Explorers begin a Fact List: three facts the AI stated that they will check."),
      a("0:52–1:00", "Share + AI Truth", "Three volunteers name their Quest in one sentence. AI Truth: your job is the second draft."),
    ],
    facilitatorNotes: [
      "Approve plans fast and generously. The plan will change, and that is fine.",
      "Circulate during the Lightning Round — the dashboard tells you who is stuck or who got a redirect message.",
      "Retry any prototype that fails to generate before Week 5, and tell the child exactly when to expect it.",
    ],
    differentiation: [
      "Grade 3: offer the Quest Plan as fill-in-the-blank with picture icons; suggest pairs.",
      "Grade 5: require a named audience (“for my little brother”) and a stretch feature.",
    ],
    watchOuts: [
      "Steer Explorers to topics with kid-safe sources available.",
      "Inventor sketches should not include real product brands or logos.",
    ],
    promptStarter:
      "Help a child build a first prototype for a [QUEST TYPE] about [TOPIC]. Make a simple, working first version described here: [DIRECTOR'S ORDER]. Keep it easy to change later. Explain in two sentences what you made and one idea for the next improvement.",
    takeHome: "Between sessions: finish all prototypes and post them. Send the mid-program family note with the Expo date.",
  },
  {
    n: 5,
    title: "Make It Yours",
    hook: "Build Day 1",
    bigQuestion: "How do we turn a first draft into something that feels like ours?",
    summary:
      "The first real build day. Two Director's Orders each, and everything in between is the human work — drawing, writing, level design, fact-checking.",
    topics: [
      "Specific requests beat “make it better”",
      "The human parts: art, writing, level design",
      "Fact-checking an AI claim",
      "Playtest cards: two stars and a wish",
      "Turning a wish into a ticket",
    ],
    build: "A second draft that looks and feels like the child made it.",
    aiTruth: "Be specific. The AI can't read your mind — tell it exactly what you want.",
    kidsWill: [
      "Improve their prototype through specific Director's Orders",
      "Do the human parts: drawing, writing, level design, fact-checking",
      "Give and receive two stars and a wish",
    ],
    studioModes: ["game", "story", "prompt", "quest"],
    ticketLimit: 2,
    tools:
      "Kids AI Studio, all modes, ticket limit two. Kids: their Studio portfolio, paper for design, graph paper for level layouts.",
    prep: [
      "Confirm every prototype is in its portfolio.",
      "Set the ticket limit to two per child. Keep paper tickets handy as the fallback.",
      "For Explorers, bookmark two kid-safe reference sources on the club page.",
      "Choose one prototype, with the maker's permission, for the Spark demo.",
    ],
    agenda: [
      a("0:00–0:05", "Arcade", "Kids open their prototypes and play for five minutes. Excitement is the point."),
      a("0:05–0:15", "Spark", "Take the volunteer's prototype and make three changes live with increasingly specific requests: “make it better” (watch the AI guess), then “make the enemies slower and add a score counter”, then “change the background to a night sky”. Ask which request worked best and why. Then a quick fact-check demo: the AI says something, look it up together, mark it true, false or unclear."),
      a("0:15–0:40", "Make", "Build time, two Director's Orders each. While a result generates, kids work on the human parts — draw characters and backgrounds, write dialogue, design levels on graph paper, check facts, sketch inventions. Watch the dashboard, approve images, coach vague requests."),
      a("0:40–0:52", "Play & Remix", "Partner swap: play or read each other's project for four minutes each. Fill a Playtest Card — two stars, one wish. Kids turn the wish into next week's first ticket."),
      a("0:52–1:00", "Share + AI Truth", "Two shares of “a change I made today”. AI Truth: be specific."),
    ],
    facilitatorNotes: [
      "Protect Make time. Use the dashboard to spot children who have not submitted anything and check in with them.",
      "Celebrate handmade parts loudly — kids sometimes assume the AI parts are “better”.",
      "Keep the Big Ideas poster running for requests that are too big for the club.",
    ],
    differentiation: [
      "Grade 3: help translate a wish into a ticket with sentence stems (“Please change ___ to ___ because ___”).",
      "Grade 5: ask for a ticket that includes a reason and a way to test whether it worked.",
    ],
    watchOuts: [
      "Do not let tickets become a race for the most changes. Two per session, chosen carefully.",
      "Explorers must mark every AI fact as checked before it goes on a poster.",
    ],
    promptStarter:
      "Here is the current version of the project. Make exactly this change and nothing else: [TICKET TEXT]. Keep everything else the same. Tell me in one sentence what changed.",
    takeHome: "Between sessions: review the dashboard log for anything that needs a follow-up conversation.",
  },
  {
    n: 6,
    title: "Test & Tinker",
    hook: "Build Day 2",
    bigQuestion: "How do we know if it's actually good, and actually right?",
    summary:
      "Playtesting, bug hunting, and the week's honest conversation: AI can be wrong, and it can be unfair, and both are things we can test for.",
    topics: [
      "The Bug Hunt — describing a bug precisely",
      "Playtest protocol with two classmates",
      "Acting on feedback",
      "Noticing bias in generated images",
      "Asking for what you actually want",
    ],
    build: "A tested, debugged project with a before-and-after the child can point to.",
    aiTruth: "AI can be wrong or unfair. Testing, checking and asking for what we actually want are our jobs.",
    kidsWill: [
      "Run a real playtest with two classmates and act on the feedback",
      "Find and fix a bug, with AI as the helper",
      "Notice that AI can be wrong or unfair, and ask for what they actually want",
    ],
    studioModes: ["game", "story", "prompt", "quest"],
    ticketLimit: 2,
    tools:
      "Kids AI Studio, all modes, ticket limit two. Facilitator: Prompt Craft on the projector for the fairness demo. Kids: portfolios, Playtest Cards.",
    prep: [
      "Prepare a small, obvious bug in a demo game — or use one the AI produced — for the Bug Hunt.",
      "Generate ahead of time a set of images for a neutral prompt such as “a scientist” or “a chef” and review them for the fairness discussion.",
      "Set up playtest rotation pairs so each project is tested by two different classmates.",
    ],
    agenda: [
      a("0:00–0:05", "Arcade", "Play a classmate's project, not your own."),
      a("0:05–0:15", "Spark", "Bug Hunt: play the buggy demo until the class spots the problem. Ask the AI to fix it, describing the bug precisely. Test again. Then the fairness moment: show the “a scientist” images. Who did the AI show? Who is missing? Ask again with the details the class actually wants. Keep it short and hopeful."),
      a("0:15–0:40", "Make", "Playtest protocol: two classmates each test a project for four minutes and fill a Playtest Card — what was fun, what confused you, one idea. Makers read their cards, pick the most important change and write tickets. Two Director's Orders each. Explorers finish fact-checking and add a “Checked by me” mark to every fact."),
      a("0:40–0:52", "Play & Remix", "Re-test after changes. Did the fix work? Kids record a one-line Before / After."),
      a("0:52–1:00", "Share + AI Truth", "Two shares of a bug found and fixed. AI Truth: testing and checking are our jobs."),
    ],
    facilitatorNotes: [
      "Model receiving feedback gracefully — read a Playtest Card about your own demo and say what you will change.",
      "Keep the fairness moment concrete and brief. The goal is a habit (“ask for what you actually want”), not a debate.",
      "This is the last big build day. Help kids choose one change that matters rather than five small ones.",
    ],
    differentiation: [
      "Grade 3: use a Playtest Card with smiley / neutral / confused faces plus one sentence.",
      "Grade 5: ask testers to describe the exact moment they were confused and suggest a fix.",
    ],
    watchOuts: [
      "Preview every image before the fairness demo.",
      "Feedback stays about the work, never the maker.",
    ],
    promptStarter:
      "This project has a bug: [WHAT HAPPENS AND WHAT SHOULD HAPPEN]. Find and fix only that bug. Do not change anything else. Explain the fix in one kid-friendly sentence.",
    takeHome: "Between sessions: review the dashboard log. Confirm Expo logistics and send the family invitation.",
  },
  {
    n: 7,
    title: "Showtime Prep",
    hook: "Polish & Rehearse",
    bigQuestion: "How do we show our work and give honest credit?",
    summary:
      "Projects are finished and locked. The week's real skill is presenting — and saying plainly which parts were the child's and which parts the AI helped with.",
    topics: [
      "Final polish and locking the project",
      "The Creator Card: made by me vs. made with AI help",
      "A one-minute demo",
      "Honest credit",
      "Letter to My Future Self",
    ],
    build: "A finished, locked project, a Creator Card and a rehearsed demo.",
    aiTruth: "Human + AI: AI is great at fast drafts; people decide what matters, care, and check.",
    kidsWill: [
      "Finish and lock their project",
      "Make a Creator Card that separates “made by me” from “made with AI help”",
      "Rehearse a one-minute demo and write a Letter to My Future Self",
    ],
    studioModes: ["game", "story", "prompt", "quest"],
    ticketLimit: 1,
    tools:
      "Kids AI Studio, all modes, ticket limit one. Facilitator: Prompt Craft for the Expo poster. Kids: portfolios, Creator Card, Letter sheet.",
    prep: [
      "Print Creator Cards and Letter sheets.",
      "Generate the Expo poster using the Week 3 winning art, and print it.",
      "Prepare the demo template on the projector: name or nickname, what I made, what AI helped with, what I did myself, what I'd add next.",
      "Plan the Expo room layout — one station per project, power for devices, a mic or a loud voice.",
    ],
    agenda: [
      a("0:00–0:05", "Arcade", "Free play across all projects. Kids add a sticker to a class chart for each project they tried."),
      a("0:05–0:15", "Spark", "Model a one-minute demo using the template, including an honest line like “AI wrote the first version of the code; I designed the levels and drew every character.” Then model a bad demo — mumbling, no credit — and let the room fix it."),
      a("0:15–0:40", "Make", "Final polish: one last Director's Order each, then lock all portfolios from the dashboard. Kids complete their Creator Card and rehearse with a partner, then in a group of four. Listen for clear AI credit; coach volume and eye contact."),
      a("0:40–0:52", "Play & Remix", "Letter to My Future Self: what did I make that I'm proud of, what is AI good at and what am I better at, what do I want to make next. Sealed in envelopes and returned at the Expo."),
      a("0:52–1:00", "Share + AI Truth", "Three volunteers give their full one-minute demo. AI Truth: human + AI, together."),
    ],
    facilitatorNotes: [
      "Locking projects the week before the Expo prevents last-minute panic and keeps the focus on presenting.",
      "Turn on Expo gallery mode so every locked portfolio appears in the Week 8 slideshow.",
      "Send families a reminder with time, room and what to expect.",
    ],
    differentiation: [
      "Grade 3: offer a fill-in demo card they can read from.",
      "Grade 5: ask them to include one thing that went wrong and how they fixed it.",
    ],
    watchOuts: [
      "Names on Creator Cards: first name or nickname only, per your consent forms.",
      "Confirm photo and video consent for the Expo.",
    ],
    promptStarter:
      "Design a cheerful printable poster (portrait) for a kids' Creator Expo hosted by [CLUB NAME] on [DATE] at [PLACE]. Use this artwork idea from the kids: [WINNING PROMPT]. Large friendly title text, room for the date and place, no real people, no brands.",
    takeHome: "Families receive the Expo invitation and the one-page Family Guide to AI at Home.",
  },
  {
    n: 8,
    title: "Creator Expo",
    hook: "Showcase for Families",
    bigQuestion: "What did we make, and what did we learn about working with AI?",
    summary:
      "Families come in. Every child demos, every child presents, every child is credited. This is the part they remember.",
    topics: [
      "Running a station",
      "The 30-second lightning talk",
      "Visitor feedback",
      "Certificates and letters",
      "Keep making things",
    ],
    build: "A public demo of eight weeks of work.",
    aiTruth: "You were the directors. The best things happen when people and AI work together, and people stay in charge.",
    kidsWill: [
      "Demo their project to real visitors",
      "Give a one-minute lightning talk with clear AI credit",
      "Receive a Certified AI Director certificate",
    ],
    studioModes: [],
    ticketLimit: 0,
    tools:
      "Facilitator: projector slideshow of all projects, anthem on speakers, printed Creator Cards, Visitor Feedback cards and stickers, certificates. Kids: their device open to their project.",
    prep: [
      "Set up stations 20 minutes early with each child's project loaded and Creator Card displayed.",
      "Print Visitor Feedback cards (“Something I loved”, “A question for the maker”) and put sticker sheets at each station.",
      "Load the slideshow and the anthem. Test sound.",
      "Print certificates with first names or nicknames. Have the sealed Letters ready to hand back.",
    ],
    agenda: [
      a("0:00–0:10", "Doors open", "Anthem plays. Families arrive and find their child's station. Three-minute welcome: what the club made, how kids directed the AI, and how the program kept tools age-appropriate."),
      a("0:10–0:40", "Expo walk", "Visitors move freely. Kids demo, visitors play or read and fill Visitor Feedback cards. Every visitor gets three stickers to place on projects they tried. Circulate and rescue any frozen device."),
      a("0:40–0:52", "Lightning Round", "Each child or pair gives a 30-second demo at the front: “I made ___. AI helped with ___. I did ___ myself.” Applause for everyone."),
      a("0:52–1:00", "Certificates & close", "Certified AI Director certificates, Letters to Future Self returned, group photo with consent, and a closing line: “You were the directors. Keep making things.”"),
    ],
    facilitatorNotes: [
      "Twenty kids at 30 seconds each is ten minutes. Hold the time with a visible timer and a friendly chime.",
      "Pair a shy child with a partner, or let them demo from their station instead of the front.",
      "Collect Visitor Feedback cards — they make wonderful portfolio pages and program evidence.",
    ],
    differentiation: [
      "Any child may present with a partner, read from their card, or have the facilitator ask them the three questions as an interview.",
    ],
    watchOuts: [
      "Photos and video only of children with consent on file.",
      "Lock all Studio modes during the Expo. The kids' work is the star.",
    ],
    promptStarter: "No AI use during the Expo.",
    takeHome:
      "Certificates, Letters to Future Self and the Family Guide to AI at Home. Families with sharing consent on file receive a Studio gallery link that works for 30 days.",
  },
];

/** The public curriculum view — what the marketing pages render. */
export const CURRICULUM: Week[] = WEEK_MODULES.map(({ n, title, summary, topics, build }) => ({
  n,
  title,
  summary,
  topics,
  build,
}));

export function weekModule(n: number): WeekModule | undefined {
  return WEEK_MODULES.find((w) => w.n === n);
}

/** The repeating 60-minute rhythm, shown on the Program page and every week module. */
export const SESSION_RHYTHM: { time: string; block: string; detail: string }[] = [
  { time: "0:00–0:05", block: "Arcade", detail: "Kids arrive and play last week's creations. Attendance, projector on." },
  { time: "0:05–0:15", block: "Spark", detail: "Facilitator demo. Children direct out loud; something appears on the big screen in minutes. Prompting is taught by example." },
  { time: "0:15–0:40", block: "Make", detail: "Children create on their own devices. The facilitator watches the dashboard, approves images and coaches vague requests." },
  { time: "0:40–0:52", block: "Play & Remix", detail: "Kids try each other's work, request one change, and see it happen. Two stars and a wish." },
  { time: "0:52–1:00", block: "Share Circle + AI Truth", detail: "Two or three quick shares, the week's one-minute AI Truth, and cleanup." },
];

export const PROGRAM_PRINCIPLES: { title: string; body: string }[] = [
  { title: "Kids are the directors", body: "Children make every creative decision. AI never chooses the idea, the topic or the ending." },
  { title: "Make, play, remix", body: "Every session produces something playable inside the first 15 minutes. The rest of the hour is playing with it and changing it." },
  { title: "Guarded, not open", body: "Children use AI only inside the Kids AI Studio, one module at a time, under a facilitator's eyes. Consumer AI tools stay on the facilitator's screen." },
  { title: "One AI Truth per week", body: "Each session ends with one honest, kid-sized idea about how AI works or where it falls short." },
  { title: "Human parts stay human", body: "Voice, handwriting, choices, feelings and fact-checking are done by kids, on purpose." },
];
