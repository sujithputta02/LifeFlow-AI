const { generateWorkflow } = require('./services/azureOpenAI');

// Mock function for testing logic
function tryRepairJSON(jsonString) {
    let repaired = jsonString.trim();

    // 1. Remove <think>...</think> blocks (DeepSeek R1 specific)
    repaired = repaired.replace(/<think>[\s\S]*?<\/think>/gi, "");

    // 2. Remove markdown code blocks if present
    if (repaired.includes("```")) {
        repaired = repaired.replace(/```json/gi, "").replace(/```/g, "");
    }

    // 3. Extract JSON object if stuck amidst text
    const firstBrace = repaired.indexOf('{');
    const lastBrace = repaired.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        repaired = repaired.substring(firstBrace, lastBrace + 1);
    }

    try {
        return JSON.parse(repaired);
    } catch (e) { /* continue */ }

    // 4. Attempt to fix common JSON syntax errors
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

    try {
        return JSON.parse(repaired);
    } catch (e) { /* continue */ }

    // 5. Attempt to close open arrays/objects
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    if (openBrackets > closeBrackets) repaired += ']'.repeat(openBrackets - closeBrackets);
    if (openBraces > closeBraces) repaired += '}'.repeat(openBraces - closeBraces);

    try {
        return JSON.parse(repaired);
    } catch (e) {
        throw new Error("Failed to repair JSON: " + e.message);
    }
}

const testCases = [
    {
        name: "Standard JSON",
        input: '{"key": "value"}',
        shouldPass: true
    },
    {
        name: "DeepSeek Think Block",
        input: '<think>This is a thought process...</think>{"key": "value"}',
        shouldPass: true
    },
    {
        name: "Markdown Parsing",
        input: 'Here is the JSON:\n```json\n{"key": "value"}\n```',
        shouldPass: true
    },
    {
        name: "Trailing Comma",
        input: '{"key": "value",}',
        shouldPass: true,
        expected: { key: "value" }
    },
    {
        name: "Text surrounding JSON",
        input: 'Sure, here is your JSON: {"key": "value"} Hope this helps!',
        shouldPass: true
    }
];

console.log("Running JSON Repair Tests...");
let passed = 0;
for (const test of testCases) {
    try {
        const result = tryRepairJSON(test.input);
        console.log(`✅ Test '${test.name}' PASSED`);
        passed++;
    } catch (e) {
        console.error(`❌ Test '${test.name}' FAILED: ${e.message}`);
    }
}

if (passed === testCases.length) {
    console.log("ALL TESTS PASSED");
} else {
    console.log(`${passed}/${testCases.length} Passed`);
}
