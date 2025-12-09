// secretSanta.ts
import * as fs from "fs";
import * as path from "path";
import { Person, Assignment, Constraints, SecretSantaConfig } from "./types";

export class SecretSanta {
  private assignments: Assignment[] = [];
  private people: Person[];
  private constraints: Constraints;
  private allowSelfAssignment: boolean;

  constructor(config: SecretSantaConfig) {
    this.people = [...config.people];
    this.constraints = config.constraints || { illegalPairings: [] };
    this.allowSelfAssignment = config.allowSelfAssignment || false;
  }

  public assign(): Assignment[] {
    if (this.people.length < 2) {
      throw new Error("Need at least 2 people for Secret Santa");
    }

    let attempts = 0;
    const maxAttempts = 1000;
    let validAssignment = false;

    while (!validAssignment && attempts < maxAttempts) {
      this.assignments = this.generateAssignment();
      validAssignment = this.validateAssignment();
      attempts++;
    }

    if (!validAssignment) {
      throw new Error("Could not find valid assignment with given constraints");
    }

    return this.assignments;
  }

  private generateAssignment(): Assignment[] {
    const shuffledReceivers = this.shuffleArray([...this.people]);
    const assignments: Assignment[] = [];

    for (let i = 0; i < this.people.length; i++) {
      const giver = this.people[i];
      const receiver = shuffledReceivers[i];
      assignments.push({ giverId: giver.id, receiverId: receiver.id });
    }

    return assignments;
  }

  private validateAssignment(): boolean {
    for (const assignment of this.assignments) {
      // Check self-assignment
      if (
        !this.allowSelfAssignment &&
        assignment.giverId === assignment.receiverId
      ) {
        return false;
      }

      // Check illegal pairings
      if (this.isIllegalPairing(assignment.giverId, assignment.receiverId)) {
        return false;
      }

      // Check group constraints if defined
      if (this.constraints.groups) {
        if (this.isWithinSameGroup(assignment.giverId, assignment.receiverId)) {
          return false;
        }
      }
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

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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

      if (!giver || !receiver) continue;

      const content = this.generateEmailContent(giver, receiver);
      const filename = path.join(outputDir, `${giver.id}_assignment.txt`);

      fs.writeFileSync(filename, content, "utf8");
      console.log(`Created assignment file for ${giver.name}: ${filename}`);
    }

    // Create a master file for verification (optional, delete after use)
    this.createMasterFile(outputDir);
  }

  private generateEmailContent(giver: Person, receiver: Person): string {
    return `
🎅 SECRET SANTA ASSIGNMENT 🎅

Hello ${giver.name}!

Your Secret Santa assignment is:

🎁 **${receiver.name}** 🎁

Remember, this is a secret! Don't tell anyone who you have.

Gift exchange details:
- Budget: $25
- Date: December 20th
- Location: Office Party

If you need gift ideas or have questions, please contact the organizer.

Happy gifting!

---
This is an automated message. Please do not reply.
    `.trim();
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
    return this.assignments
      .map((a) => {
        const giver = this.people.find((p) => p.id === a.giverId);
        const receiver = this.people.find((p) => p.id === a.receiverId);
        return `${giver?.name} → ${receiver?.name}`;
      })
      .join("\n");
  }
}
