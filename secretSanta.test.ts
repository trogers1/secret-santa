// test/secretSanta.vitest.test.ts
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { SecretSanta } from "./secretSanta";
import { Person, Constraints } from "./types";
import * as fs from "fs";
import * as path from "path";

// Mock file system operations
vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return {
    ...actual,
    // You can add specific mocks here if needed
  };
});

// Test data
const testPeople: Person[] = [
  { id: "alice", name: "Alice", email: "alice@test.com" },
  { id: "bob", name: "Bob", email: "bob@test.com" },
  { id: "charlie", name: "Charlie", email: "charlie@test.com" },
  { id: "diana", name: "Diana", email: "diana@test.com" },
  { id: "edward", name: "Edward", email: "edward@test.com" },
  { id: "fiona", name: "Fiona", email: "fiona@test.com" },
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

  // Note: Some tests that were problematic in the Jest version should be fixed
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
        allowSelfAssignment: false,
      });

      // This should throw an error after max attempts
      expect(() => secretSanta.assign()).toThrow(
        "Could not find valid assignment",
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

    test("should allow self-assignment when configured", () => {
      const people = testPeople.slice(0, 3);
      const secretSanta = new SecretSanta({
        people,
        allowSelfAssignment: true,
      });

      const assignments = secretSanta.assign();
      expect(assignments).toHaveLength(3);
    });

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

    test("should work with overlapping groups", () => {
      const people = testPeople.slice(0, 5);
      const constraints: Constraints = {
        illegalPairings: [],
        groups: [
          ["alice", "bob", "charlie"],
          ["charlie", "diana", "edward"],
        ],
      };

      const secretSanta = new SecretSanta({ people, constraints });

      expect(() => secretSanta.assign()).not.toThrow();
    });
  });

  describe("Randomness and Distribution", () => {
    test("should produce different assignments on multiple runs", () => {
      const people = testPeople.slice(0, 5);
      const secretSanta1 = new SecretSanta({ people });
      const secretSanta2 = new SecretSanta({ people });

      const assignments1 = secretSanta1.assign();
      const assignments2 = secretSanta2.assign();

      // Different runs should produce different assignments
      expect(assignments1).not.toEqual(assignments2);
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

  describe("Performance and Large Groups", () => {
    test("should handle large group efficiently", () => {
      const largeGroup: Person[] = [];
      for (let i = 0; i < 50; i++) {
        largeGroup.push({
          id: `person_${i}`,
          name: `Person ${i}`,
          email: `person${i}@test.com`,
        });
      }

      const secretSanta = new SecretSanta({ people: largeGroup });

      // Performance assertion with Vitest
      expect(() => {
        const assignments = secretSanta.assign();
        expect(assignments).toHaveLength(50);
      }).toCompleteWithin(1000); // Vitest-specific matcher
    });

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

      expect(() => secretSanta.assign()).not.toThrow();
    });
  });

  describe("Mocking and Spies", () => {
    test("should call fs.writeFileSync for each person", () => {
      const people = testPeople.slice(0, 2);
      const secretSanta = new SecretSanta({ people });
      secretSanta.assign();

      const writeFileSyncSpy = vi.spyOn(fs, "writeFileSync");

      secretSanta.generateEmailFiles(testOutputDir);

      expect(writeFileSyncSpy).toHaveBeenCalledTimes(3); // 2 assignments + 1 master

      writeFileSyncSpy.mockRestore();
    });

    test("should handle fs errors gracefully", () => {
      const people = testPeople.slice(0, 2);
      const secretSanta = new SecretSanta({ people });
      secretSanta.assign();

      vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
        throw new Error("Disk full");
      });

      expect(() => secretSanta.generateEmailFiles(testOutputDir)).toThrow(
        "Disk full",
      );

      vi.restoreAllMocks();
    });
  });

  describe("Snapshot Testing", () => {
    test("email content should match snapshot", () => {
      const people = testPeople.slice(0, 2);
      const secretSanta = new SecretSanta({ people });
      secretSanta.assign();

      // Get the private method via type assertion
      const assignments = (secretSanta as any).assignments;
      const giver = people.find((p) => p.id === assignments[0].giverId);
      const receiver = people.find((p) => p.id === assignments[0].receiverId);

      // Use private method (not recommended, but for testing)
      const content = (secretSanta as any).generateEmailContent(
        giver!,
        receiver!,
      );

      expect(content).toMatchSnapshot();
    });

    test("master file format should match snapshot", () => {
      const people = testPeople.slice(0, 3);
      const secretSanta = new SecretSanta({ people });
      secretSanta.assign();
      secretSanta.generateEmailFiles(testOutputDir);

      const masterContent = fs.readFileSync(
        path.join(testOutputDir, "MASTER_ASSIGNMENTS.txt"),
        "utf8",
      );

      expect(masterContent).toMatchSnapshot();
    });
  });
});
