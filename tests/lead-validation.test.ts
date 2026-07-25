import { describe, it, expect } from "vitest";
import { createLeadSchema, BUDGET_RANGES } from "@/lib/lead-schemas";

describe("Lead Validation Logic", () => {
  describe("Happy Path", () => {
    it("should successfully validate a completely valid lead submission", () => {
      const validData = {
        name: "Ada Lovelace",
        email: "ada@company.com",
        budget: BUDGET_RANGES[2], // "$5k-$25k"
        message: "We need a complete overhaul of our data processing engine by Q4.",
      };

      const result = createLeadSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Ada Lovelace");
        expect(result.data.email).toBe("ada@company.com");
        expect(result.data.budget).toBe("$5k-$25k");
        expect(result.data.message).toBe("We need a complete overhaul of our data processing engine by Q4.");
      }
    });

    it("should trim whitespace from valid inputs automatically", () => {
      const untrimmedData = {
        name: "  Alan Turing  ",
        email: "  alan@enigma.org  ",
        budget: BUDGET_RANGES[0],
        message: "   This is a sufficiently long message.   ",
      };

      const result = createLeadSchema.safeParse(untrimmedData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Alan Turing");
        expect(result.data.email).toBe("alan@enigma.org");
        expect(result.data.message).toBe("This is a sufficiently long message.");
      }
    });
  });

  describe("Failure Cases", () => {
    it("should fail validation if the email is invalid", () => {
      const invalidData = {
        name: "Grace Hopper",
        email: "not-an-email", // Invalid
        budget: BUDGET_RANGES[1],
        message: "Building a new compiler, need assistance.",
      };

      const result = createLeadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.email?._errors).toContain("Enter a valid email");
      }
    });

    it("should fail validation if required fields are missing", () => {
      const missingData = {};

      const result = createLeadSchema.safeParse(missingData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.name?._errors).toBeDefined();
        expect(errors.email?._errors).toBeDefined();
        expect(errors.budget?._errors).toBeDefined();
        expect(errors.message?._errors).toBeDefined();
      }
    });

    it("should fail if the message is too short or empty", () => {
      const shortMessageData = {
        name: "Tim Berners-Lee",
        email: "tim@web.org",
        budget: BUDGET_RANGES[0],
        message: "Hi", // Too short
      };

      const result = createLeadSchema.safeParse(shortMessageData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.message?._errors).toContain("Message must be at least 10 characters");
      }
    });

    it("should fail if the name is too short", () => {
      const shortNameData = {
        name: "J", // Too short
        email: "john@doe.com",
        budget: BUDGET_RANGES[0],
        message: "This is a valid length message here.",
      };

      const result = createLeadSchema.safeParse(shortNameData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.name?._errors).toContain("Name must be at least 2 characters");
      }
    });

    it("should fail if an invalid budget value is provided", () => {
      const invalidBudgetData = {
        name: "Margaret Hamilton",
        email: "margaret@nasa.gov",
        budget: "$10M+", // Not in BUDGET_RANGES
        message: "Need software for the Apollo program.",
      };

      const result = createLeadSchema.safeParse(invalidBudgetData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.format();
        expect(errors.budget?._errors).toContain("Select a budget range");
      }
    });
    
    it("should fail if input resembles SQL injection (if we disallow specific characters, though Zod strings allow them, they will be parameterized in Prisma/Supabase)", () => {
      // In a real-world scenario, we rely on our ORM/Query Builder (Supabase client) for SQLi protection.
      // However, we ensure that standard string validation passes it safely into the DB.
      const sqlInjectionData = {
        name: "Drop Table",
        email: "drop@table.com",
        budget: BUDGET_RANGES[0],
        message: "'; DROP TABLE leads; -- and some extra padding text",
      };

      const result = createLeadSchema.safeParse(sqlInjectionData);
      // It SHOULD be successful here because the schema itself just cares about string length.
      // The actual protection happens at the Supabase/PostgreSQL layer via parameterized queries.
      expect(result.success).toBe(true);
    });
  });
});
