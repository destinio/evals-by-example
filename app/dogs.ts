/**
 * Seed data: four dogs and the day each of them had.
 *
 * These four are the test set for everything in `learn/`, and three of them are
 * traps for a report writer:
 *
 *   Bella  an ordinary good day — the control, and the easy case
 *   Rufus  ate nothing, never played, hid under a bench — does the model invent cheer?
 *   Nacho  medication + snapped at another dog — do both facts reach the owner clearly?
 *   Mochi  busy day, many numbers — does the model add them up correctly?
 *
 * Used once, to fill an empty database. After that the live logs are in SQLite and
 * are edited from the Front desk screen.
 */
export type DayLog = {
  name: string;
  breed: string;
  emoji: string;
  stay: string;
  meals: { time: string; offered_g: number; eaten_g: number }[];
  naps: { start: string; minutes: number }[];
  play: { activity: string; minutes: number; with: string }[];
  potty: number;
  meds: { name: string; dose: string; time: string }[];
  incidents: string[];
  other_dogs_present: string[];
};

export const seedDogs: Record<string, DayLog> = {
  // An ordinary good day. This one should be easy for any prompt.
  bella: {
    name: "Bella",
    breed: "beagle",
    emoji: "🐶",
    stay: "8:05am–5:15pm",
    meals: [{ time: "12:00", offered_g: 150, eaten_g: 150 }],
    naps: [{ start: "10:20", minutes: 40 }],
    play: [
      { activity: "fetch in the yard", minutes: 25, with: "staff" },
      { activity: "wrestling", minutes: 15, with: "Mochi" },
    ],
    potty: 3,
    meds: [],
    incidents: [],
    other_dogs_present: ["Mochi", "Biscuit"],
  },

  // A quiet, sad little day with almost nothing logged.
  rufus: {
    name: "Rufus",
    breed: "greyhound",
    emoji: "🐕",
    stay: "9:30am–3:00pm",
    meals: [{ time: "12:00", offered_g: 200, eaten_g: 0 }],
    naps: [{ start: "9:45", minutes: 180 }],
    play: [],
    potty: 1,
    meds: [],
    incidents: ["hid under the bench most of the morning"],
    other_dogs_present: ["Bella", "Mochi"],
  },

  // Medication plus an incident. Both of these must reach the owner.
  nacho: {
    name: "Nacho",
    breed: "chihuahua mix",
    emoji: "🌮",
    stay: "7:50am–6:00pm",
    meals: [{ time: "12:00", offered_g: 80, eaten_g: 60 }],
    naps: [{ start: "13:00", minutes: 65 }],
    play: [{ activity: "puzzle feeder", minutes: 10, with: "staff" }],
    potty: 4,
    meds: [{ name: "carprofen", dose: "25mg", time: "12:05" }],
    incidents: ["snapped at Biscuit over a toy at 2:15pm, separated, no injuries"],
    other_dogs_present: ["Biscuit", "Mochi"],
  },

  // The social butterfly — a busy log with lots of numbers to get wrong.
  mochi: {
    name: "Mochi",
    breed: "corgi",
    emoji: "🍡",
    stay: "8:30am–5:45pm",
    meals: [
      { time: "12:00", offered_g: 120, eaten_g: 120 },
      { time: "15:30", offered_g: 30, eaten_g: 30 },
    ],
    naps: [
      { start: "11:15", minutes: 25 },
      { start: "14:40", minutes: 35 },
    ],
    play: [
      { activity: "wrestling", minutes: 15, with: "Bella" },
      { activity: "tug of war", minutes: 20, with: "staff" },
      { activity: "yard zoomies", minutes: 30, with: "Biscuit" },
    ],
    potty: 5,
    meds: [],
    incidents: [],
    other_dogs_present: ["Bella", "Biscuit", "Nacho"],
  },
};
