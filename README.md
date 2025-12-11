# 🎄 Secret Santa Assignment System

A robust, privacy-focused Secret Santa assignment system written in TypeScript, designed to run seamlessly with [Bun.sh](https://bun.sh). This system ensures fair and secret gift assignments while respecting complex constraints like illegal pairings and group restrictions.

## ✨ Features

- **Privacy First**: Organizer never sees the assignments - each person gets their own file
- **Complex Constraints**: Support for illegal pairings and group restrictions
- **Guaranteed Validity**: Uses Hall's marriage theorem to verify assignments are possible
- **Email Ready**: Generates individual text files ready to attach to emails
- **Zero Configuration**: Works out of the box with Bun.sh

## 📋 Prerequisites

- [Bun.sh](https://bun.sh) installed (v1.0.0 or higher)
- Node.js (optional, Bun includes its own runtime)

## 🚀 Quick Start

### 1. Clone or create the project

```bash
# Clone this repository
git clone git@github.com:trogers1/secret-santa.git
cd secret-santa


```

### 2. Update the necessary files

**[index.ts](./index.ts):** Update the people array to match your actual participants:

```ts
const people: Person[] = [
  { id: "alice", name: "Alice Johnson", email: "alice@example.com" },
  { id: "bob", name: "Bob Smith", email: "bob@example.com" },
  // Add your people...
];
```

### 3. Install dependencies

```bash
bun install
```

### 4. Run the example

```bash
bun run index.ts
```

## 📁 Project Structure

```
secret-santa/
├── types.ts            # TypeScript interfaces
├── secretSanta.ts      # Main Secret Santa class
├── secretSanta.test.ts # Secret Santa class test file 
├── index.ts            # Example/entry point
├── package.json        # Bun project configuration
└── README.md           # This file
```

## 🎯 Usage

### Basic Example

```typescript
import { SecretSanta } from "./secretSanta";
import { Person } from "./types";

const people: Person[] = [
  { id: "alice", name: "Alice Johnson", email: "alice@example.com" },
  { id: "bob", name: "Bob Smith", email: "bob@example.com" },
  // Add more people...
];

const secretSanta = new SecretSanta({ people });

// Generate assignments
secretSanta.assign();

// Create individual assignment files
secretSanta.generateEmailFiles(`./secret-santa-${new Date().getFullYear()}`);

// See summary (optional - for organizer only)
console.log(secretSanta.getAssignmentsSummary());
```

## 🔧 Configuration

### Person Object
```typescript
{
  id: "unique_id",      // Unique identifier (used for constraints)
  name: "Full Name",    // Person's name (appears in emails)
}
```

### Constraints
- **illegalPairings**: Array of `[giverId, receiverId]` pairs that are not allowed
- **groups**: Array of arrays containing person IDs who shouldn't be assigned within their group

### Output Directory
By default, files are saved to `./secret-santa-assignments/`. You can customize this:

```typescript
// Use current year
secretSanta.generateEmailFiles(`./secret-santa-${new Date().getFullYear()}`);

// Custom directory
secretSanta.generateEmailFiles("./my-custom-folder");
```

## 📤 Output Files

The system generates:
- **Individual assignment files**: `{person-id}_assignment.txt` (one per participant)
- **Master file**: `MASTER_ASSIGNMENTS.txt` (for organizer verification - delete after sending!)

### Example assignment file:
```
🎅 SECRET SANTA ASSIGNMENT 🎅

Hello Taylor Rogers!

Your Secret Santa assignment is:

🎁 **Bob Smith** 🎁

Remember, this is a secret! Don't tell anyone who you have.

Gift exchange details:
- Budget: $25
- Date: December 25th

Happy gifting!
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run tests
bun run test
```

## ⚠️ Error Handling

The system will throw descriptive errors for:
- **Insufficient people**: Need at least 2 participants
- **Impossible constraints**: No valid assignment exists
- **Missing assignments**: Trying to generate files before assigning
- **File system errors**: Disk full, permission issues, etc.

## 🚨 Common Issues & Solutions

### "No possible assignment exists"
This means your constraints are too restrictive. Try:
1. Removing some illegal pairings
2. Making groups smaller
3. Adding more participants

### "Need at least 2 people"
Add more participants to your people array.

### Files not created
Check:
1. You called `assign()` before `generateEmailFiles()`
2. You have write permissions to the output directory
3. The output directory path is valid

## 📝 Customization

### Modify Email Template
Edit the `generateEmailContent()` method in `secretSanta.ts`:

```typescript
private generateEmailContent(giver: Person, receiver: Person): string {
  return `🎅 YOUR COMPANY Secret Santa ${new Date().getFullYear()} 🎅

Hi ${giver.name},

You've been assigned to get a gift for: ${receiver.name}

Details:
- Budget: £20
- Date: Dec 20th, 2024
- Party: Office at 6 PM

Please keep this secret!
`;
}
```

## 📄 License

MIT License - feel free to use, modify, and distribute!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🎅 Happy Gifting!

May your Secret Santa exchange be merry, secret, and constraint-free! 🎁

