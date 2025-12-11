import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { SecretSanta } from "./secretSanta";
import { Person, Constraints } from "./types";
import * as fs from "fs";
import * as path from "path";

// Test data
const testPeople: Person[] = [
  { id: "alice", name: "Alice", email: "alice@test.com" },
  { id: "bob", name: "Bob", email: "bob@test.com" },
  { id: "charlie", name: "Charlie", email: "charlie@test.com" },
  { id: "diana", name: "Diana", email: "diana@test.com" },
  { id: "edward", name: "Edward", email: "edward@test.com" },
  { id: "fiona", name: "Fiona", email: "fiona@test.com" },
  { id: "shrek", name: "Shrek", email: "shrek@test.com" },
  { id: "donkey", name: "donkey", email: "donkey@test.com" },
  { id: "puss", name: "Puss in Boots", email: "puss@test.com" },
];

describe("SecretSanta Edge Case Tests", () => {
  const testOutputDir = "./test-assignments";

  beforeEach(() => {
    // Clean up any existing test files
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true });
    }
    vi.restoreAllMocks();
  });

  describe("Basic Functionality", () => {
    test("should assign everyone correctly with 2 people", () => {
      const people = testPeople.slice(0, 2);
      const secretSanta = new SecretSanta({ people });
      const assignments = secretSanta.assign();

      expect(assignments).toHaveLength(2);
      expect(assignments[0].giverId).not.toBe(assignments[0].receiverId);
      expect(assignments[1].giverId).not.toBe(assignments[1].receiverId);
    });

    test("should throw error with only 1 person", () => {
      const people = testPeople.slice(0, 1);
      const secretSanta = new SecretSanta({ people });

      expect(() => secretSanta.assign()).toThrow(
        "Need at least 2 people for Secret Santa",
      );
    });

    test("should throw error with 0 people", () => {
      const secretSanta = new SecretSanta({ people: [] });

      expect(() => secretSanta.assign()).toThrow(
        "Need at least 2 people for Secret Santa",
      );
    });
  });

  describe("Constraint Edge Cases", () => {
    test("should handle complete illegal pairings (impossible scenario)", () => {
      // Create a scenario where all possible pairings are illegal
      // For 3 people, this means everyone is paired illegally with everyone else
      const people = testPeople.slice(0, 3);
      const constraints: Constraints = {
        illegalPairings: [
          ["alice", "bob"],
          ["alice", "charlie"],
          ["bob", "charlie"],
        ],
      };

      const secretSanta = new SecretSanta({
        people,
        constraints,
        // Note: removed allowSelfAssignment since constructor doesn't accept it
      });

      // This should throw an error because no valid assignment exists
      expect(() => secretSanta.assign()).toThrow(
        "No possible assignment exists with current constraints", // Updated error message
      );
    });

    test("should handle bidirectional illegal pairings", () => {
      const people = testPeople.slice(0, 4);
      const constraints: Constraints = {
        illegalPairings: [
          ["alice", "bob"],
          ["charlie", "diana"],
        ],
      };

      const secretSanta = new SecretSanta({ people, constraints });

      // Should succeed with other valid permutations
      const assignments = secretSanta.assign();
      expect(assignments).toHaveLength(4);

      // Verify illegal pairings are avoided
      assignments.forEach((assignment) => {
        expect(
          constraints.illegalPairings.some(
            ([g, r]) => g === assignment.giverId && r === assignment.receiverId,
          ),
        ).toBe(false);
      });
    });

    // REMOVED: allowSelfAssignment tests since it's not supported
    // test("should allow self-assignment when configured", () => { ... })

    test("should prevent self-assignment by default", () => {
      const people = testPeople.slice(0, 3);
      const secretSanta = new SecretSanta({ people });

      const assignments = secretSanta.assign();

      assignments.forEach((assignment) => {
        expect(assignment.giverId).not.toBe(assignment.receiverId);
      });
    });

    test("should handle group constraints effectively", () => {
      const people = testPeople.slice(0, 6);
      const constraints: Constraints = {
        illegalPairings: [],
        groups: [
          ["alice", "bob", "charlie"],
          ["diana", "edward", "fiona"],
        ],
      };

      const secretSanta = new SecretSanta({ people, constraints });
      const assignments = secretSanta.assign();

      assignments.forEach((assignment) => {
        const giverGroup = constraints.groups?.find((g) =>
          g.includes(assignment.giverId),
        );
        const receiverGroup = constraints.groups?.find((g) =>
          g.includes(assignment.receiverId),
        );

        expect(giverGroup).not.toBe(receiverGroup);
      });
    });

    test("should work with overlapping groups when possible", () => {
      // Use people where the overlapping person has someone outside all their groups
      const people = [
        { id: "a", name: "A", email: "a@test.com" },
        { id: "b", name: "B", email: "b@test.com" },
        { id: "c", name: "C", email: "c@test.com" }, // In both groups
        { id: "d", name: "D", email: "d@test.com" },
        { id: "e", name: "E", email: "e@test.com" },
        { id: "f", name: "F", email: "f@test.com" }, // Not in any group
      ];

      const constraints: Constraints = {
        illegalPairings: [],
        groups: [
          ["a", "b", "c"], // Group 1
          ["c", "d", "e"], // Group 2 (overlaps via 'c')
          // 'f' is not in any group, so 'c' can give to 'f'
        ],
      };

      const secretSanta = new SecretSanta({ people, constraints });

      // This should work because 'c' can give to 'f'
      expect(() => secretSanta.assign()).not.toThrow();

      const assignments = secretSanta.assign();

      // Verify 'c' is assigned to 'f' (or someone not in their groups)
      const charliesAssignment = assignments.find((a) => a.giverId === "c");
      const receiverId = charliesAssignment!.receiverId;
      expect(["f"]).toContain(receiverId); // 'c' should give to 'f'
    });
  });

  describe("Algorithm-Specific Tests", () => {
    test("should detect impossible assignment via Hall's condition", () => {
      // Create an impossible scenario
      const people = testPeople.slice(0, 3);
      const constraints: Constraints = {
        illegalPairings: [
          ["alice", "bob"],
          ["alice", "charlie"],
          ["bob", "charlie"],
        ],
      };

      const secretSanta = new SecretSanta({ people, constraints });

      // This should fail fast due to Hall's condition check
      expect(() => secretSanta.assign()).toThrow(
        "No possible assignment exists with current constraints",
      );
    });

    test("should handle large number of constraints", () => {
      const people = testPeople.slice(0, 8);
      // Create many constraints but leave at least one valid solution
      const constraints: Constraints = {
        illegalPairings: [
          ["alice", "bob"],
          ["charlie", "diana"],
          ["edward", "fiona"],
        ],
        groups: [
          ["alice", "charlie", "edward"],
          ["bob", "diana", "fiona"],
        ],
      };

      const secretSanta = new SecretSanta({ people, constraints });

      expect(() => {
        const assignments = secretSanta.assign();
        expect(assignments).toHaveLength(8);

        // Verify constraints are respected
        assignments.forEach((assignment) => {
          expect(assignment.giverId).not.toBe(assignment.receiverId);

          // Check illegal pairings
          const isIllegal = constraints.illegalPairings.some(
            ([g, r]) => g === assignment.giverId && r === assignment.receiverId,
          );
          expect(isIllegal).toBe(false);
        });
      }).not.toThrow();
    });

    test("should produce valid assignments even with complex constraints", () => {
      const people = testPeople.slice(0, 6);
      const constraints: Constraints = {
        illegalPairings: [
          ["alice", "bob"],
          ["bob", "charlie"],
          ["diana", "edward"],
        ],
        groups: [
          ["alice", "bob", "charlie"], // Can't assign within this group
          ["diana", "edward", "fiona"], // Can't assign within this group
        ],
      };

      const secretSanta = new SecretSanta({ people, constraints });
      const assignments = secretSanta.assign();

      // Basic validation
      expect(assignments).toHaveLength(6);

      const giverIds = new Set(assignments.map((a) => a.giverId));
      const receiverIds = new Set(assignments.map((a) => a.receiverId));

      expect(giverIds.size).toBe(6);
      expect(receiverIds.size).toBe(6);

      // No self-assignments
      assignments.forEach((assignment) => {
        expect(assignment.giverId).not.toBe(assignment.receiverId);
      });
    });
  });

  describe("Randomness and Distribution", () => {
    test("should produce different assignments on multiple runs", () => {
      const people = testPeople.slice(0, 5);
      const assignmentsSet = new Set<string>();

      // Run multiple times
      for (let i = 0; i < 10; i++) {
        const secretSanta = new SecretSanta({ people });
        const assignments = secretSanta.assign();
        const assignmentString = JSON.stringify(
          assignments.sort((a, b) => a.giverId.localeCompare(b.giverId)),
        );
        assignmentsSet.add(assignmentString);
      }

      // With 5 people, we should see different assignments
      // Note: Small chance of duplicates, but very unlikely
      expect(assignmentsSet.size).toBeGreaterThan(1);
    });

    test("should ensure everyone gives and receives exactly once", () => {
      const people = testPeople.slice(0, 4);
      const secretSanta = new SecretSanta({ people });
      const assignments = secretSanta.assign();

      const giverIds = assignments.map((a) => a.giverId);
      const receiverIds = assignments.map((a) => a.receiverId);

      expect(new Set(giverIds).size).toBe(people.length);
      people.forEach((person) => {
        expect(giverIds).toContain(person.id);
      });

      expect(new Set(receiverIds).size).toBe(people.length);
      people.forEach((person) => {
        expect(receiverIds).toContain(person.id);
      });
    });
  });

  describe("File Generation Edge Cases", () => {
    test("should throw error when generating files before assignment", () => {
      const secretSanta = new SecretSanta({ people: testPeople.slice(0, 3) });

      expect(() => secretSanta.generateEmailFiles(testOutputDir)).toThrow(
        "No assignments made yet",
      );
    });

    test("should create correct number of files", () => {
      const people = testPeople.slice(0, 3);
      const secretSanta = new SecretSanta({ people });
      secretSanta.assign();

      secretSanta.generateEmailFiles(testOutputDir);

      const files = fs.readdirSync(testOutputDir);
      expect(files).toHaveLength(4);

      people.forEach((person) => {
        const expectedFile = path.join(
          testOutputDir,
          `${person.id}_assignment.txt`,
        );
        expect(fs.existsSync(expectedFile)).toBe(true);
      });

      const masterFile = path.join(testOutputDir, "MASTER_ASSIGNMENTS.txt");
      expect(fs.existsSync(masterFile)).toBe(true);
    });

    test("should handle special characters in names", () => {
      const specialPeople: Person[] = [
        { id: "john_doe", name: "John O'Connor-Doe", email: "john@test.com" },
        { id: "maria", name: "María García", email: "maria@test.com" },
        { id: "chen", name: "陈先生", email: "chen@test.com" },
      ];

      const secretSanta = new SecretSanta({ people: specialPeople });
      secretSanta.assign();
      secretSanta.generateEmailFiles(testOutputDir);

      specialPeople.forEach((person) => {
        const expectedFile = path.join(
          testOutputDir,
          `${person.id}_assignment.txt`,
        );
        expect(fs.existsSync(expectedFile)).toBe(true);

        const content = fs.readFileSync(expectedFile, "utf8");
        expect(content).toContain(person.name);
      });
    });

    test("should handle non-existent output directory", () => {
      const secretSanta = new SecretSanta({ people: testPeople.slice(0, 2) });
      secretSanta.assign();

      const deepDir = "./deeply/nested/test/directory";
      expect(() => secretSanta.generateEmailFiles(deepDir)).not.toThrow();

      expect(fs.existsSync(deepDir)).toBe(true);

      // Clean up
      fs.rmSync("./deeply", { recursive: true });
    });
  });

  describe("Performance Tests", () => {
    test("should handle many constraints efficiently", () => {
      const people = testPeople.slice(0, 10);

      const illegalPairings: Array<[string, string]> = [];
      for (let i = 0; i < people.length; i++) {
        for (let j = i + 1; j < Math.min(people.length, i + 3); j++) {
          illegalPairings.push([people[i].id, people[j].id]);
        }
      }

      const constraints: Constraints = { illegalPairings };
      const secretSanta = new SecretSanta({ people, constraints });

      // Time the operation
      const startTime = performance.now();
      expect(() => secretSanta.assign()).not.toThrow();
      const endTime = performance.now();

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // 1 second
    });

    test("should handle maximum constraints scenario", () => {
      // Worst-case scenario: many constraints but still solvable
      const people = testPeople.slice(0, 8);

      // Create constraints that still allow a solution
      const constraints: Constraints = {
        illegalPairings: [
          ["alice", "bob"],
          ["alice", "charlie"],
          ["bob", "charlie"],
          ["diana", "edward"],
          ["diana", "fiona"],
        ],
        groups: [
          ["alice", "diana"], // Small groups
          ["bob", "edward"],
          ["charlie", "fiona"],
        ],
      };

      const secretSanta = new SecretSanta({ people, constraints });

      expect(() => {
        const assignments = secretSanta.assign();
        expect(assignments).toHaveLength(8);
      }).not.toThrow();
    });
  });

  describe("Filesystem I/O", () => {
    test("should create a file for each person", () => {
      const secretSanta = new SecretSanta({ people: testPeople });
      secretSanta.assign();

      // Instead of spying, just verify the files were created
      secretSanta.generateEmailFiles(testOutputDir);

      const files = fs.readdirSync(testOutputDir);
      expect(files).toHaveLength(testPeople.length + 1); // 2 assignment files + 1 master

      // Verify file contents
      testPeople.forEach((person) => {
        const filePath = path.join(
          testOutputDir,
          `${person.id}_assignment.txt`,
        );
        const content = fs.readFileSync(filePath, "utf8");
        expect(content).toContain(person.name);
      });
    });
  });

  describe("Error Cases", () => {
    test("should handle missing people in assignments gracefully", () => {
      const people = testPeople.slice(0, 3);
      const secretSanta = new SecretSanta({ people });

      // Simulate corrupted state (shouldn't happen in normal use)
      (secretSanta as any).assignments = [
        { giverId: "missing1", receiverId: "missing2" },
      ];

      // Should not throw when generating summary
      const summary = secretSanta.getAssignmentsSummary();
      expect(summary).toBe("undefined → undefined");
    });

    test("should handle empty assignments summary", () => {
      const secretSanta = new SecretSanta({ people: testPeople.slice(0, 3) });
      const summary = secretSanta.getAssignmentsSummary();
      expect(summary).toBe("No assignments made yet.");
    });
  });
});
