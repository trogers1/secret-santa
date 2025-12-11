import { Constraints, Person } from "./types";

// TODO: Update people
export const people: Person[] = [
  { id: "taylor", name: "Taylor Rogers" },
  { id: "bob", name: "Bob Smith" },
  { id: "charlie", name: "Charlie Brown" },
  { id: "diana", name: "Diana Prince" },
  { id: "edward", name: "Edward Norton" },
  { id: "fiona", name: "Fiona Gallagher" },
];

// TODO: Update exchange details
export const details = `
- Budget: $25
- Date: December 25th
`;

// Optional: Define constraints
export const constraints: Constraints = {
  // Illegal pairings (e.g., spouses, roommates)
  illegalPairings: [
    ["alice", "bob"], // Alice cannot give to Bob
    ["charlie", "diana"], // Charlie cannot give to Diana
  ],
  // Groups (e.g., families, departments)
  groups: [
    ["alice", "charlie", "edward"], // Family group
    ["bob", "diana", "fiona"], // Office department
  ],
};
