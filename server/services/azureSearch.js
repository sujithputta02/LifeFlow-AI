const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");
require("dotenv").config();

const endpoint = process.env.AZURE_SEARCH_ENDPOINT || "https://placeholder.search.windows.net";
const apiKey = process.env.AZURE_SEARCH_KEY || "placeholder_key";
const indexName = process.env.AZURE_SEARCH_INDEX || "lifeflow-index";

async function findUsefullSources(query) {
    if (process.env.USE_MOCK_DATA === "true" || !process.env.AZURE_SEARCH_KEY) {
        console.log("Using Mock Azure Search Data");
        return [
            { title: "Hospital Admission Guide", url: "https://hospital.gov.in/guide", content: "Official guidelines for admission..." },
            { title: "Insurance Policies", url: "https://insurance.gov.in/policies", content: "Details on claiming insurance..." }
        ];
    }

    const client = new SearchClient(endpoint, indexName, new AzureKeyCredential(apiKey));

    try {
        const searchResults = await client.search(query, { top: 3 });
        const results = [];
        for await (const result of searchResults.results) {
            results.push(result);
        }
        return results;

    } catch (error) {
        // Build Index if it doesn't exist
        if (error.code === "ResourceNotFound" || error.statusCode === 404) {
            console.log("⚠️ Index not found. Attempting to create index...");
            try {
                const { SearchIndexClient } = require("@azure/search-documents");
                const indexClient = new SearchIndexClient(endpoint, new AzureKeyCredential(apiKey));

                const index = {
                    name: indexName,
                    fields: [
                        { name: "id", type: "Edm.String", key: true },
                        { name: "title", type: "Edm.String", searchable: true },
                        { name: "content", type: "Edm.String", searchable: true },
                        { name: "url", type: "Edm.String" }
                    ]
                };

                await indexClient.createIndex(index);
                console.log("✅ Index created successfully.");

                // Seed initial data
                console.log("🌱 Seeding initial data...");
                const { SearchClient } = require("@azure/search-documents");
                const searchClient = new SearchClient(endpoint, indexName, new AzureKeyCredential(apiKey));

                const documents = [
                    {
                        id: "1",
                        title: "Hospital Admission Guidelines",
                        content: "To get admitted to a government hospital in India, you typically need an Aadhaar card and a referral letter. Visit the registration desk, fill out Form 12-A, and submit it with photocopies of your ID.",
                        url: "https://health.gov.in/admission"
                    },
                    {
                        id: "2",
                        title: "Driving License Application",
                        content: "Apply for a Learner's License first. Visit the Parivahan website, fill the application, upload documents (Proof of Age, Address), and book a slot for the test.",
                        url: "https://parivahan.gov.in/dl"
                    }
                ];

                await searchClient.uploadDocuments(documents);
                console.log("✅ Initial data seeded successfully. Retrying search...");

                // Retry search
                const searchResults = await client.search(query, { top: 3 });
                const results = [];
                for await (const result of searchResults.results) {
                    results.push(result);
                }
                return results;

            } catch (createError) {
                console.error("❌ Failed to create/search index:", createError.message);
                return [];
            }
        }

        console.error("Error calling Azure Cognitive Search:", error);
        return [];
    }
}

module.exports = { findUsefullSources };
