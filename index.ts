import { constraints, details, people } from "./input";
import { SecretSanta } from "./secretSanta";

// Create and run Secret Santa
const secretSanta = new SecretSanta({
  details,
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
