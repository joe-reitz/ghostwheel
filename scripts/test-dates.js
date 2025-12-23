// Quick test to show the date calculation fix

const now = new Date('2024-12-18'); // Today

// OLD WAY (buggy with setMonth):
let oldMonth = new Date();
oldMonth.setMonth(now.getMonth() - 1); // Can skip days

// NEW WAY (correct):
let newMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

console.log('Today:', now.toISOString());
console.log('Old method (setMonth):', oldMonth.toISOString());
console.log('New method (subtract 30 days):', newMonth.toISOString());

// The old method can have issues when crossing month boundaries
// The new method always goes back exactly N days







