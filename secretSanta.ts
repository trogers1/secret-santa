import * as fs from "fs";
import * as path from "path";
import { Person, Assignment, Constraints, SecretSantaConfig } from "./types";

export class SecretSanta {
  private assignments: Assignment[] = [];
  private people: Person[];
  private constraints: Constraints;

  constructor(config: SecretSantaConfig) {
    this.people = [...config.people];
    this.constraints = config.constraints || { illegalPairings: [] };
  }

  // Public method that should be called by users
  public assign(): Assignment[] {
    if (this.people.length < 2) {
      throw new Error("Need at least 2 people for Secret Santa");
    }

    // Use the matching algorithm
    this.assignments = this.generateAssignmentWithMatching();
    return this.assignments;
  }

  private generateAssignmentWithMatching(): Assignment[] {
    // First, check if assignment is theoretically possible
    // Note: For large groups, consider commenting this out due to performance
    if (this.people.length <= 10) {
      // Only run Hall's check for small groups
      if (!this.isAssignmentPossible()) {
        throw new Error(
          "No possible assignment exists with current constraints",
        );
      }
    }

    // Use recursive backtracking with optimization
    const assignment = this.findMatching([]);
    if (!assignment) {
      throw new Error("Unable to generate valid assignment");
    }
    return assignment;
  }

  private isAssignmentPossible(): boolean {
    // Check Hall's condition for bipartite matching
    // For every subset of givers, the number of available receivers must be ≥ subset size

    const n = this.people.length;

    // Generate all subsets (exponential time - only for small n)
    // We limit to checking subsets up to size 4 for performance
    const maxSubsetSize = Math.min(4, Math.floor(n / 2));

    for (let subsetSize = 1; subsetSize <= maxSubsetSize; subsetSize++) {
      // Generate combinations of size subsetSize
      const combinations = this.getCombinations(n, subsetSize);

      for (const giverIndices of combinations) {
        // Find all valid receivers for these givers
        const receiverSet = new Set<number>();
        for (const giverIdx of giverIndices) {
          for (let receiverIdx = 0; receiverIdx < n; receiverIdx++) {
            if (
              this.isValidPairing(
                this.people[giverIdx].id,
                this.people[receiverIdx].id,
              )
            ) {
              receiverSet.add(receiverIdx);
            }
          }
        }

        // Check Hall's condition
        if (receiverSet.size < giverIndices.length) {
          return false; // No perfect matching possible
        }
      }
    }

    return true;
  }

  private getCombinations(n: number, k: number): number[][] {
    const result: number[][] = [];

    function backtrack(start: number, current: number[]) {
      if (current.length === k) {
        result.push([...current]);
        return;
      }

      for (let i = start; i < n; i++) {
        current.push(i);
        backtrack(i + 1, current);
        current.pop();
      }
    }

    backtrack(0, []);
    return result;
  }

  private isValidPairing(giverId: string, receiverId: string): boolean {
    // Check self-assignment
    if (giverId === receiverId) {
      return false;
    }

    // Check illegal pairings
    if (this.isIllegalPairing(giverId, receiverId)) {
      return false;
    }

    // Check group constraints
    if (
      this.constraints.groups &&
      this.isWithinSameGroup(giverId, receiverId)
    ) {
      return false;
    }

    return true;
  }

  private isIllegalPairing(giverId: string, receiverId: string): boolean {
    return this.constraints.illegalPairings.some(
      ([g, r]) =>
        (g === giverId && r === receiverId) ||
        (g === receiverId && r === giverId),
    );
  }

  private isWithinSameGroup(personId1: string, personId2: string): boolean {
    if (!this.constraints.groups) return false;

    for (const group of this.constraints.groups) {
      if (group.includes(personId1) && group.includes(personId2)) {
        return true;
      }
    }
    return false;
  }

  private findMatching(currentAssignments: Assignment[]): Assignment[] | null {
    const giverIdx = currentAssignments.length;

    if (giverIdx === this.people.length) {
      return currentAssignments; // Found complete matching
    }

    // Get already assigned receivers
    const assignedReceivers = new Set(
      currentAssignments.map((a) =>
        this.people.findIndex((p) => p.id === a.receiverId),
      ),
    );

    // Try receivers in random order to avoid bias
    const receiverIndices = Array.from(
      { length: this.people.length },
      (_, i) => i,
    );

    // Fisher-Yates shuffle for randomness
    for (let i = receiverIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [receiverIndices[i], receiverIndices[j]] = [
        receiverIndices[j],
        receiverIndices[i],
      ];
    }

    for (const receiverIdx of receiverIndices) {
      // Skip if receiver already assigned
      if (assignedReceivers.has(receiverIdx)) continue;

      // Check if valid pairing
      if (
        !this.isValidPairing(
          this.people[giverIdx].id,
          this.people[receiverIdx].id,
        )
      ) {
        continue;
      }

      // Make assignment and recurse
      const assignment: Assignment = {
        giverId: this.people[giverIdx].id,
        receiverId: this.people[receiverIdx].id,
      };

      const result = this.findMatching([...currentAssignments, assignment]);

      if (result) {
        return result;
      }
    }

    return null; // No valid matching found
  }

  public generateEmailFiles(
    outputDir: string = "./secret-santa-assignments",
  ): void {
    if (this.assignments.length === 0) {
      throw new Error("No assignments made yet. Run assign() first.");
    }

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const assignment of this.assignments) {
      const giver = this.people.find((p) => p.id === assignment.giverId);
      const receiver = this.people.find((p) => p.id === assignment.receiverId);

      if (!giver || !receiver) {
        console.warn(
          `Warning: Could not find person for assignment ${JSON.stringify(assignment)}`,
        );
        continue;
      }

      const content = this.generateEmailContent(giver, receiver);
      const filename = path.join(outputDir, `${giver.id}_assignment.txt`);

      fs.writeFileSync(filename, content, "utf8");
      console.log(`Created assignment file for ${giver.name}: ${filename}`);
    }

    // Create a master file for verification (optional, delete after use)
    this.createMasterFile(outputDir);
  }

  private generateEmailContent(giver: Person, receiver: Person): string {
    return `🎅 SECRET SANTA ASSIGNMENT 🎅

Hello ${giver.name}!

Your Secret Santa assignment is:

🎁 **${receiver.name}** 🎁

Remember, this is a secret! Don't tell anyone who you have.

Gift exchange details:
- Budget: $25
- Date: December 25th

Happy gifting!`;
  }

  private createMasterFile(outputDir: string): void {
    const masterContent = this.assignments
      .map((assignment) => {
        const giver = this.people.find((p) => p.id === assignment.giverId);
        const receiver = this.people.find(
          (p) => p.id === assignment.receiverId,
        );
        return `${giver?.name} (${giver?.email}) → ${receiver?.name}`;
      })
      .join("\n");

    const filename = path.join(outputDir, "MASTER_ASSIGNMENTS.txt");
    fs.writeFileSync(filename, masterContent, "utf8");
    console.log(
      `\nMaster file created (delete this after emails are sent): ${filename}`,
    );
  }

  public getAssignmentsSummary(): string {
    if (this.assignments.length === 0) {
      return "No assignments made yet.";
    }

    return this.assignments
      .map((a) => {
        const giver = this.people.find((p) => p.id === a.giverId);
        const receiver = this.people.find((p) => p.id === a.receiverId);
        return `${giver?.name} → ${receiver?.name}`;
      })
      .join("\n");
  }
}
