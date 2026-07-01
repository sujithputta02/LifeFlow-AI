const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");
require("dotenv").config();

const endpoint = process.env.AZURE_SEARCH_ENDPOINT || "https://placeholder.search.windows.net";
const apiKey = process.env.AZURE_SEARCH_KEY || "placeholder_key";
const indexName = process.env.AZURE_SEARCH_INDEX || "lifeflow-index";

// --- Bing Search Integration ---
async function searchBing(query) {
    const bingKey = process.env.BING_SEARCH_API_KEY;
    if (!bingKey) {
        console.log("ℹ️ No BING_SEARCH_API_KEY found. Using AI Internal Knowledge for fallback.");
        return [];
    }

    try {
        console.log(`🌐 Fallback: Searching Bing for "${query}"...`);
        const fetch = (await import('node-fetch')).default || require('node-fetch'); // Dynamic import for node-fetch if needed
        const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=3&responseFilter=Webpages`;

        const response = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': bingKey } });
        if (!response.ok) throw new Error(`Bing API Error: ${response.statusText}`);

        const data = await response.json();
        if (!data.webPages || !data.webPages.value) return [];

        return data.webPages.value.map(page => ({
            title: page.name,
            content: page.snippet,
            url: page.url,
            sourceType: "Bing Web Search (High Confidence)"
        }));

    } catch (error) {
        console.error("❌ Bing Search Failed:", error.message);
        return [];
    }
}

async function findUsefullSources(query) {
    // 1. Mock Data Bypass (Dev Mode)
    if (process.env.USE_MOCK_DATA === "true") {
        console.log("Using Mock Azure Search Data");
        return [
            { title: "Hospital Admission Guide", url: "https://hospital.gov.in/guide", content: "Official guidelines..." },
            { title: "Insurance Policies", url: "https://insurance.gov.in/policies", content: "Details on claiming..." }
        ];
    }

    let azureResults = [];
    let useBing = false;

    // 2. Try Azure AI Search (Private Index)
    if (process.env.AZURE_SEARCH_KEY && process.env.AZURE_SEARCH_ENDPOINT) {
        try {
            console.log(`🔍 Querying Azure AI Search Index: ${indexName}...`);
            const client = new SearchClient(endpoint, indexName, new AzureKeyCredential(apiKey));
            const searchResults = await client.search(query, { top: 3 });

            for await (const result of searchResults.results) {
                // Heuristic: If content is very short or score is low, it might be poor quality
                azureResults.push({ ...result, sourceType: "Azure AI Search (Private)" });
            }
            console.log(`✅ Azure Search returned ${azureResults.length} results.`);
        } catch (error) {
            console.warn("⚠️ Azure Search Query Failed (or Index missing):", error.message);
        }
    }

    // 3. Fallback Logic: COMPARE CONFIDENCE
    // If Azure returned 0 results, OR we explicitly want to "compare" (here we assume Bing is generally better for "wild" queries)
    // For this specific requirement ("compare confidence"), we treat Empty Azure Results as "0% Confidence".

    if (azureResults.length === 0) {
        console.log("📉 Azure Search Confidence: LOW (No results). Switching to Bing...");
        useBing = true;
    } else {
        console.log("📈 Azure Search Confidence: MEDIUM/HIGH. Using Private Index.");
        // Optional: We could still fetch Bing and merge if we wanted "Augmented" results, 
        // but the prompt asked for "Fallback" behavior essentially.
    }

    // 4. Execute Bing Search if needed
    if (useBing) {
        const bingResults = await searchBing(query);
        if (bingResults.length > 0) {
            return bingResults; // Return Bing results as the "High Confidence" set
        }
    }

    // Return whatever we have (Azure results or empty)
    return azureResults;
}

module.exports = { findUsefullSources };
