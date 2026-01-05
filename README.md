# LifeFlow 🌊

**Turn complex bureaucratic nightmares into simple, AI-guided checklists.**

LifeFlow is an intelligent web application designed to help users navigate complex real-world processes—like hospital admissions, government paperwork, or travel logistics—by converting them into clear, step-by-step interactive workflows.

## ✨ Features

- **AI-Powered Workflows**: Instantly generates tailored checklists for any goal using advanced AI models (via OpenRouter/DeepSeek).
- **Step-by-Step Guidance**: Breaks down massive tasks into manageable sub-steps with clear instructions.
- **Verified Sources**: Provides links to official government, educational, or organizational sources for credibility.
- **Interactive Progress Tracking**: Track your completion status with a visual progress bar and "check off" feature.
- **AI Verification**: Verify your completed steps by describing what you did—the AI acts as a case manager to approve or request more info.
- **Multi-Language Support**: Generate workflows in English, Hindi, Spanish, French, German, or Telugu.
- **Text-to-Speech**: Listen to the workflow instructions for better accessibility.
- **History & Management**: Save your flows automatically, view recent history, and delete old workflows.
- **Map Integration**: Visualizes the location context for your tasks (e.g., origin to destination).
- **PDF Export & Sharing**: Download your checklist as a PDF or share the link with others.

## 🛠️ Tech Stack

**Frontend**
- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS, Framer Motion (for animations)
- **State Management**: Zustand
- **Icons**: Lucide React
- **Utilities**: jsPDF (Export), SpeechSynthesis API

**Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **AI Integration**: OpenRouter API (Accessing DeepSeek R1 or similar models)

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB Atlas](https://www.mongodb.com/) account (or local MongoDB)
- [OpenRouter](https://openrouter.ai/) API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lifeflow
   ```

2. **Server Setup**
   Navigate to the server directory and install dependencies:
   ```bash
   cd server
   npm install
   ```

   Create a `.env` file in the `server` directory with the following credentials:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   OPENROUTER_API_KEY=your_openrouter_api_key
   AI_MODEL_NAME=deepseek/deepseek-r1-0528:free
   # Optional: Set to "true" to use mock data for testing without API costs
   USE_MOCK_DATA=false
   ```

   Start the backend server:
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:5000`*

3. **Client Setup**
   Open a new terminal, navigate to the client directory, and install dependencies:
   ```bash
   cd ../client
   npm install
   ```

   Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The application will optionally run on `http://localhost:3000`*

## 📖 Usage

1. Open your browser and go to `http://localhost:3000`.
2. Enter a goal in the search bar (e.g., "Renew my driver's license in New York").
3. Select your preferred language.
4. Click **Start**.
5. Follow the generated steps, check off items as you go, and use the "Verify with AI" feature to validate your progress.
6. Access your previous searches via the clock icon in the bottom right corner.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
