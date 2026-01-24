# NexusAI 🚀
### From Inbox to Insights: The AI-Powered Career Assistant

[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Queue-red?style=flat-square)](https://docs.bullmq.io/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini_Flash-purple?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)

NexusAI is not just a CRUD app—it's an intelligent **Application Tracking System (ATS)** for candidates. It automatically syncs with your Gmail, monitors job application emails, extracts key details (Company, Role, Status) using **LLMs**, and visualizes your progress on a real-time dashboard.

Stop manually updating spreadsheets. Let the AI do the work.

---

## 🏗️ System Architecture

NexusAI uses an **Event-Driven Architecture** to ensure the User Interface remains snappy while heavy AI processing happens in the background.

```mermaid
graph TD
    User[User] -->|Connects Gmail| Client["frontend (React/Vite)"]
    Client -->|Sync Request| API["Backend API (Express)"]
    
    subgraph Data_Pipeline [Async Data Pipeline]
        API -->|1. Add Job| Queue["Redis Queue (BullMQ)"]
        Queue -->|2. Process Job| Worker["Worker Service (Node.js)"]
    end
    
    subgraph AI_Engine [Intelligence Layer]
        Worker -->|3. Extract Data| LLM["Google Gemini / Groq"]
        LLM -->|4. JSON Output| Worker
    end
    
    Worker -->|5. Update DB| DB[(MongoDB)]
    Client <-->|6. Real-time Status| DB
```

### Key Design Decisions
1.  **Asynchronous Processing**: Email parsing and LLM inference take 2-5 seconds per email. We use **BullMQ (Redis)** to offload this to a background worker, preventing request timeouts.
2.  **Hybrid Classification**: We use a combination of RegEx (for speed) and LLMs (Google Gemini/Groq) for accuracy when detecting "Interview Invites" vs "Rejections".
3.  **JSON-Native**: The entire pipeline (Gmail API -> LLM -> MongoDB -> React) handles complex nested JSON data without rigid SQL schema migrations.

---

## 🌟 Key Features

*   **🔄 One-Click Gmail Sync**: Authenticate with Google and instantly pull all job-related emails.
*   **🧠 AI Extraction**: Automatically detects Company Name, Job Role, and Application Status (Applied/Rejected/Interview).
*   **📊 Insights Dashboard**: Visualize your acceptance rates, daily application volume, and pipeline health with Recharts.
*   **⚡ Real-Time**: Status updates reflect immediately as the worker processes the queue.
*   **🎨 Modern UI**: Built with **Shadcn UI** + **Tailwind CSS** for a premium, accessible experience.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React 18 + Vite (TypeScript)
*   **Styling**: TailwindCSS + Shadcn UI
*   **State Management**: TanStack Query (React Query)
*   **Visuals**: Recharts, Framer Motion, Lucide Icons

### Backend
*   **Runtime**: Node.js + Express
*   **Database**: MongoDB (Mongoose)
*   **Queue System**: BullMQ + Redis
*   **AI/LLM**: Google Generative AI (Gemini 1.5 Flash), Groq SDK

---

## 🚀 Getting Started

### Prerequisites
*   Node.js v18+
*   Redis (for the queue)
*   MongoDB Instance
*   Google Cloud Console Project (for Gmail API)

### 1. Clone & Install
```bash
git clone https://github.com/Pratyush426/nexusai.git
cd nexusai
```

### 2. Backend Setup
```bash
cd server
npm install
# Create .env file with:
# MONGO_URI, REDIS_URL, GOOGLE_CLIENT_ID, GEMINI_API_KEY
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

---

## 🔮 Future Roadmap
- [ ] **Resume Parsing**: Auto-tailor resumes based on job descriptions.
- [ ] **Browser Extension**: One-click "Apply & Track" from LinkedIn/Indeed.
- [ ] **Interview Prep**: AI-generated mock interview questions based on the specific job role.

---

## 📝 License
MIT License. Built with ❤️ by Pratyush.

---

## 📸 Application Previews

<div align="center">
  <img src="client/public/assets/IMG_7383.PNG" width="32%" alt="Preview 1" />
  <img src="client/public/assets/IMG_7384.PNG" width="32%" alt="Preview 2" />
  <img src="client/public/assets/IMG_7385.PNG" width="32%" alt="Preview 3" />
</div>
