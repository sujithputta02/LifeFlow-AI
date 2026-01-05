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

    try {
        const client = new SearchClient(endpoint, indexName, new AzureKeyCredential(apiKey));
        const searchResults = await client.search(query, { top: 3 });

        const results = [];
        for await (const result of searchResults.results) {
            results.push(result);
        }
        return results;

    } catch (error) {
        console.error("Error calling Azure Cognitive Search:", error);
        // Return empty or fallback
        return [];
    }
}

module.exports = { findUsefullSources };
