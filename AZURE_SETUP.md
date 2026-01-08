# Azure Setup Guide for Microsoft Imagine Cup

To fully qualify for the Imagine Cup cloud requirements, this project is designed to use **Azure OpenAI** and **Azure AI Search**.

Follow these steps to create your resources and configure the application.

## 1. Create Azure OpenAI Resource

1.  Log in to the [Azure Portal](https://portal.azure.com/).
2.  Search for **Azure OpenAI** and click **Create**.
3.  **Basics**:
    *   **Subscription**: Select your Azure for Students or standard subscription.
    *   **Resource Group**: Create a new one (e.g., `LifeFlow_RG`).
    *   **Region**: Select a region (e.g., `East US`, `South India`, etc. - check model availability).
    *   **Name**: Give it a name (e.g., `lifeflow-openai-01`).
    *   **Pricing Tier**: Standard S0.
4.  Click **Next**, then **Create**.
5.  Wait for deployment to finish, then click **Go to resource**.
6.  **Get Keys**:
    *   Go to **Resource Management > Keys and Endpoint**.
    *   Copy **KEY 1** and the **Endpoint** URL.

### Deploy a Model
1.  In your Azure OpenAI resource, click **Go to Azure OpenAI Studio** (Model deployments).
2.  Click **Deployments** (left sidebar) > **Create new deployment**.
3.  **Select a model**: Choose `gpt-4o` or `gpt-35-turbo` (recommended for cost/speed).
4.  **Deployment Name**: Give it a name (e.g., `gpt-4o-deployment`). **Remember this name**, you will need it for the code.
5.  Click **Create**.

## 2. Create Azure AI Search Service

1.  Search for **AI Search** (formerly Cognitive Search) in the Azure Portal.
2.  Click **Create**.
3.  **Basics**:
    *   **Resource Group**: Use the same one as above (`LifeFlow_RG`).
    *   **Service Name**: e.g., `lifeflow-search`.
    *   **Location**: Same region as OpenAI (recommended).
    *   **Pricing Tier**: **Free** (if available) or **Basic**.
4.  Click **Review + create** > **Create**.
5.  **Get Keys**:
    *   Go to resource > **Settings > Keys**.
    *   Copy one of the **Admin keys**.
    *   Go to **Overview** and copy the **Url** (e.g., `https://lifeflow-search.search.windows.net`).

## 3. Update Environment Variables

Open `server/.env` and add the following values:

```env
# ... existing variables ...

# AZURE CONFIGURATION
AZURE_OPENAI_ENDPOINT="https://<your-resource-name>.openai.azure.com/"
AZURE_OPENAI_API_KEY="<your-key>"
AZURE_OPENAI_DEPLOYMENT_NAME="<your-deployment-name>"

AZURE_SEARCH_ENDPOINT="https://<your-search-service>.search.windows.net"
AZURE_SEARCH_KEY="<your-admin-key>"
AZURE_SEARCH_INDEX="lifeflow-index"
```

## 4. Verification

Once these keys are added, restart the server (`npm run dev` in `server/`).
The application will automatically prioritize Azure services. If Azure fails or keys are missing, it will seamlessly fall back to the OpenRouter/Mock implementation.
