# LifeFlow 🌊

**Turn complex bureaucratic nightmares into simple, AI-guided checklists.**

LifeFlow is an intelligent web application designed to help users navigate complex real-world processes—like hospital admissions, government paperwork, or travel logistics—by converting them into clear, step-by-step interactive workflows.

---

## 🏆 Imagine Cup Implementation

This project leverages the power of the **Microsoft Azure Ecosystem** to deliver intelligent results:

1.  **Advanced AI Intelligence**: Powers the core intelligence using top-tier models (DeepSeek/GPT-4o) via **OpenRouter** to break down goals into logical steps and verify user actions.
2.  **Azure AI Search (Hybrid Strategy)**:
    *   **Primary**: Queries a private Azure Search Index for curated, high-confidence administrative guides.
    *   **Fallback (Smart):** Automatically switches to **Bing Web Search API** if the private index lacks data, ensuring users always get genuine, real-world links.

---

## ✨ Key Features

### 🧠 Intelligent Workflows
- **AI-Generated Plans**: Instantly creates tailored checklists for any goal (e.g., "How to get a driving license in India").
- **Real-Time Verification**: The AI acts as a case manager. Describe what you did, and it will approve or request more details.

### 🎮 3D Gamification & Visuals
- **Interactive 3D Badges**: Beautiful, rotatable 3D rewards (built with `Three.js` and `@react-three/fiber`) for completing milestones.
- **Dynamic Loading**: "Architecting Your Flow" 3D visualizations while you wait.
- **Glassmorphism UI**: A premium, modern interface with smooth animations (`Framer Motion`).

### 🔍 Genuine Sources (Hybrid Search)
- **Trustworthy Links**: Every step is backed by a verified source.
- **Smart Switch**: Uses local government data (Azure Index) when available, or live web results (Bing) for niche queries.

### 📄 Professional Tools
- **PDF Export**: Generate a professionally branded, multi-page PDF checklist of your workflow to take offline.
- **Voice Guidance**: Text-to-Speech integration listens to your questions and reads out steps.
- **Multi-Language**: Full support for English, Hindi, Spanish, French, German, and Telugu.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS, PostCSS
- **3D Graphics**: Three.js, React Three Fiber, React Three Drei
- **Animations**: Framer Motion
- **State**: Zustand

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB Atlas (Mongoose) - *Stores User Profiles & Workflow History*
- **Search**: Azure AI Search + Bing Web Search API
- **AI**: OpenRouter API (DeepSeek R1 / GPT-4o)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB Atlas](https://www.mongodb.com/) (Connection String)
- **API Keys**: Azure OpenAI, Azure Search, and (Optional) Bing Search.

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/lifeflow.git
    cd lifeflow
    ```

2.  **Server Setup**
    ```bash
    cd server
    npm install
    ```
    Create a `.env` file in the `server` directory:
    ```env
    PORT=5000
    MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/lifeflow
    
    # AI Service (OpenRouter)
    OPENROUTER_API_KEY=your_key_here
    AI_MODEL_NAME=gpt-4o
    
    # Azure AI Search (Architecture Requirement 1)
    AZURE_SEARCH_ENDPOINT=https://<your-service>.search.windows.net
    AZURE_SEARCH_KEY=your_admin_key
    AZURE_SEARCH_INDEX=lifeflow-index
    
    # Bing Search (Architecture Requirement 2 - Fallback)
    BING_SEARCH_API_KEY=your_bing_key
    
    # Testing
    USE_MOCK_DATA=false
    ```
    Start the server:
    ```bash
    npm run dev
    ```

3.  **Client Setup**
    ```bash
    cd ../client
    npm install
    npm run dev
    ```

4.  **Access the App**
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
