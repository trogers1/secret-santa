import { SecretSanta } from "./secretSanta";
import { Person, Constraints } from "./types";

// Sample people
const people: Person[] = [
  { id: "taylor", name: "Taylor Rogers" },
  { id: "bob", name: "Bob Smith" },
  { id: "charlie", name: "Charlie Brown" },
  { id: "diana", name: "Diana Prince" },
  { id: "edward", name: "Edward Norton" },
  { id: "fiona", name: "Fiona Gallagher" },
];

// Define constraints
const constraints: Constraints = {
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

// Create and run Secret Santa
const secretSanta = new SecretSanta({
  people,
  constraints,
  allowSelfAssignment: false, // Important: no one should get themselves
});

try {
  secretSanta.assign();

  console.log("🎄 Secret Santa Assignments 🎄");
  console.log("=============================");
  console.log(secretSanta.getAssignmentsSummary());
  console.log("\n");

  // Generate text files for email attachments
  secretSanta.generateEmailFiles(`./secret-santa-${new Date().getFullYear()}`);

  console.log(
    "\n✅ All files created! You can now attach the .txt files to emails.",
  );
} catch (error) {
  console.error("❌ Error:", error.message);
  console.log("Try relaxing some constraints or adding more people.");
}
