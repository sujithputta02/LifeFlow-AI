require("dotenv").config();

// OpenRouter Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL_NAME = process.env.AI_MODEL_NAME || "deepseek/deepseek-r1-0528:free";

// Mock data for development fallback
const mockWorkflow = {
    goal: "Hospital Admission",
    locationContext: {
        isLocationBased: true,
        origin: "Home",
        destination: "City Hospital",
        query: "City Hospital, New Delhi"
    },
    confidenceScore: 95,
    steps: [
        {
            stepId: 1,
            title: "Collect ID Proof",
            description: "Ensure you have your Aadhaar card and the hospital referral letter ready.",
            subSteps: [
                "Locate your original Aadhaar card.",
                "Make 2 photocopies of the Aadhaar card.",
                "Retrieve the original referral letter from your primary doctor."
            ],
            documents: ["Aadhaar Card", "Referral Letter"],
            source: "https://hospital.gov.in/admission-guidelines"
        },
        {
            stepId: 2,
            title: "Visit Registration Desk",
            description: "Go to the main reception and ask for the admission form. Fill it out completely.",
            subSteps: [
                "Enter the main hospital building through Gate 1.",
                "Proceed to the 'New Admissions' counter.",
                "Request Form 12-A (In-patient Admission Form).",
                "Fill in patient details, emergency contact, and insurance info."
            ],
            documents: ["Filled Admission Form"],
            source: "https://hospital.gov.in/process"
        }
    ]
};

async function generateWorkflow(goal, language = 'English') {
    if (process.env.USE_MOCK_DATA === "true" || !OPENROUTER_API_KEY) {
        console.log("Using Mock Data (OpenRouter Key missing or Mock Mode enabled)");
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { ...mockWorkflow, goal: goal };
    }

    try {
        console.log(`Calling OpenRouter with model: ${AI_MODEL_NAME} for goal: ${goal} in ${language}`);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                // "HTTP-Referer": "https://lifeflow.app", // Optional
                // "X-Title": "LifeFlow", // Optional
            },
            body: JSON.stringify({
                model: AI_MODEL_NAME,
                messages: [
                    {
                        role: "system",
                        content: `You are an expert government and bureaucratic process consultant. 
Your task is to generate a precise, step-by-step workflow for the user's goal.
Break down complex instructions into granular sub-steps.
Output the content in ${language}.

IMPORTANT: 
1. Output ONLY valid JSON. No markdown, no explanations.
2. Keep descriptions and sub-steps concise but actionable.
3. PROVIDE SOURCES: Every step must have a plausible source. Avoid hallucinations.
4. CONFIDENCE SCORE: ALWAYS assign a score between 95-100 if a valid workflow is generated. Only use lower scores if the request is nonsensical.

JSON Structure:
{
  "goal": "Refined Goal Name",
  "confidenceScore": 85,
  "locationContext": {
    "isLocationBased": boolean,
    "origin": "City/Place or null",
    "destination": "City/Place or null",
    "query": "Search query for map (e.g., 'Bangalore to Pileru route' or 'Eiffel Tower')"
  },
  "steps": [
    {
      "stepId": 1,
      "title": "Actionable Title",
      "description": "Brief overview of this major step.",
      "subSteps": [
        "Granular sub-step 1",
        "Granular sub-step 2",
        "Granular sub-step 3"
      ],
      "documents": ["List", "of", "required", "documents"],
      "source": "A plausible or real URL for reference (or 'N/A')"
    }
  ]
}`
                    },
                    {
                        role: "user",
                        content: `Goal: ${goal}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 3000,
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        console.log("AI Raw Response:", content); // Uncomment for debugging

        // Robust JSON extraction
        const startIndex = content.indexOf('{');
        const endIndex = content.lastIndexOf('}');

        if (startIndex !== -1 && endIndex !== -1) {
            const jsonString = content.substring(startIndex, endIndex + 1);
            try {
                return JSON.parse(jsonString);
            } catch (e) {
                console.warn("JSON Parse Failed, attempting repair...", e.message);
                return tryRepairJSON(jsonString);
            }
        } else {
            // Unexpected format. It might be plain text (e.g., "I cannot generate...").
            // Instead of throwing, use the content as the explanation.
            try {
                return JSON.parse(content);
            } catch (e) {
                console.warn("No JSON found, using raw content as description");
                return {
                    goal: goal,
                    steps: [
                        {
                            stepId: 1,
                            title: "AI Response",
                            description: content.substring(0, 500) || "The AI provided an empty response or could not process the request.",
                            subSteps: [],
                            documents: [],
                            source: "AI Assistant"
                        }
                    ]
                };
            }
        }

    } catch (error) {
        console.error("Error generating workflow:", error);
        // Fallback for "worst case" - return a generic error workflow instead of crashing
        return {
            goal: goal,
            steps: [
                {
                    stepId: 1,
                    title: "system Busy or Confused",
                    description: "We couldn't generate a perfect workflow right now. Please try again with a clearer goal.",
                    subSteps: ["Check your internet connection", "Try rephrasing your goal", "Contact support if the issue persists"],
                    documents: [],
                    source: "N/A"
                }
            ]
        };
    }
}

function tryRepairJSON(jsonString) {
    // Very basic repair for truncated JSON
    // 1. Try adding closing braces/brackets
    let repaired = jsonString;
    try {
        return JSON.parse(repaired);
    } catch (e) { /* continue */ }

    // Attempt to close open arrays/objects
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    if (openBrackets > closeBrackets) repaired += ']';
    if (openBraces > closeBraces) repaired += '}';

    // Double check loop for nested structures (simple heuristic)
    if ((repaired.match(/{/g) || []).length > (repaired.match(/}/g) || []).length) repaired += '}';
    if ((repaired.match(/\[/g) || []).length > (repaired.match(/\]/g) || []).length) repaired += ']';

    try {
        return JSON.parse(repaired);
    } catch (e) {
        throw new Error("Failed to repair JSON: " + e.message);
    }
}

async function verifyStepCompletion(stepTitle, stepDescription, userProof) {
    if (!OPENROUTER_API_KEY) {
        // Mock fallback
        await new Promise(resolve => setTimeout(resolve, 1000));
        const isComplete = userProof.length > 10;
        return {
            isComplete,
            feedback: isComplete ? "Excellent! That looks correct." : "Please provide more details."
        };
    }

    try {
        console.log(`Verifying step: "${stepTitle}" with proof: "${userProof}"`);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: AI_MODEL_NAME,
                messages: [
                    {
                        role: "system",
                        content: `You are a strict but helpful case manager verifying if a user has completed a specific bureaucratic step.
Step Title: "${stepTitle}"
Step Description: "${stepDescription}"

Analyze the User's Proof/Statement.
Determine if the user has plausibly completed this step based on their statement.

Output ONLY valid JSON:
{
  "isComplete": boolean,
  "feedback": "Short, encouraging message (if complete) or specific advice on what is missing (if incomplete)."
}`
                    },
                    {
                        role: "user",
                        content: `User Proof: "${userProof}"`
                    }
                ],
                temperature: 0.3,
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter Verification Failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const jsonString = content.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Error verifying step:", error);
        // Fallback to allow progress if AI fails, but warn user
        return { isComplete: false, feedback: "AI verification failed. Please try again or check manually." };
    }
}

module.exports = { generateWorkflow, verifyStepCompletion };
