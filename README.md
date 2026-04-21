# ML Hand Gesture 🖐️✨

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TensorFlow.js](https://img.shields.io/badge/ML-TensorFlow.js-FF6F00?logo=tensorflow)](https://www.tensorflow.org/js)
[![MediaPipe](https://img.shields.io/badge/Vision-MediaPipe-0078D4?logo=google)](https://mediapipe.dev/)
[![Gemini](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-4285F4?logo=googlegemini)](https://deepmind.google/technologies/gemini/)
[![GCP](https://img.shields.io/badge/Cloud-Google%20Cloud%20Run-4285F4?logo=googlecloud)](https://cloud.google.com/run)

**ML Hand Gesture** is a browser-native platform for training custom hand gesture models in seconds and using them to control real-world hardware and interactive software. No cloud uploads, no latency, 100% privacy.

---

## 🚀 The Problem: The "Cloud Latency" Barrier in AI Interaction
Most modern AI tools require sending data to a server for inference. For interactive experiences—like playing a virtual piano or controlling a robotic motor—even 200ms of latency feels "broken." Furthermore, privacy concerns often prevent users from sharing camera feeds with cloud providers.

**ML Hand Gesture solves this by bringing the entire ML lifecycle—Training and Inference—directly into the browser.**

---

## 💡 Solution Overview: Train, Connect, Control

ML Hand Gesture provides a seamless "Zero-to-Hero" workflow for custom AI interaction:

1.  **Local Training (MLP):** Users capture hand landmarks via webcam. A Neural Network (Multi-Layer Perceptron) is trained *instantly* in-browser using TensorFlow.js.
2.  **AI-on-AI Synthesis:** Once trained, a cloud LLM (Gemini 2.0 Flash) analyzes the class names and predicts the "Gesture Recipe"—suggesting creative use cases and naming the interaction style.
3.  **Real-Time Control:** Use your custom gestures to:
    *   **Play Music:** Trigger a low-latency Web Audio piano.
    *   **Control Hardware:** Drive LEGO Spike Prime motors via Web Bluetooth (BLE).
4.  **Community Sharing:** Save models and gesture mappings to a serverless PostgreSQL cloud (Neon) to share with others.

---

## 🧠 AI Integration & Architecture

### The "Edge-to-Cloud" Pipeline
| Component | Technology | Role | Why? |
| :--- | :--- | :--- | :--- |
| **Vision** | MediaPipe | Hand Landmark Detection | Extract 21 3D points at 60fps. |
| **Local Inference** | TensorFlow.js | Custom MLP Classifier | Sub-10ms gesture recognition. |
| **Logic/Auth** | FastAPI | Python Backend | Secure session and model metadata. |
| **Synthesis** | Gemini 2.0 | LLM Recipe Generation | Contextualize the "why" of the gesture. |

### Design Tradeoffs
*   **Edge vs. Cloud:** We chose **Client-Side MLP** over Cloud CNNs. While CNNs are more robust, the landmark-based MLP is 100x faster for real-time interaction and requires zero server-side GPU costs.
*   **Stateless vs. Statefull:** The backend is entirely **Stateless (Docker on Cloud Run)**, allowing it to scale from zero to infinity without managing persistent VMs.

---

## 🤖 The "Agentic" Build: AI as a Force Multiplier

This project was built using a "Director-Level" development approach, orchestrating multiple specialized AI agents:

*   **GitHub Copilot (The Logic Pair):** Handled the complex state machine for **Web Bluetooth (BLE)**. BLE logic is notoriously difficult to debug; Copilot helped iterate through 7 versions of the hub-connection handshake in minutes.
*   **Google Jules (The Architect):** Managed a massive multi-file refactor to migrate the backend to **GCP Cloud Run** and implemented the entire **JWT/SendGrid password reset flow** simultaneously across 5 files.
*   **Devin AI (The Documentarian):** Acted as an autonomous SWE to generate the project's **Internal Wiki** (`AGENTS.md`) and verified the consistency of the folder structure.

> **Key Learning:** Using agents shifted my role from "syntax-writer" to "system-reviewer." I focused on high-level constraints (like model serialization formats) while the agents handled the boilerplate implementation.

---

## 🛠️ Getting Started

### 1. Prerequisites
*   **Bun** (Required for Frontend)
*   **Python 3.10+**
*   **Google API Key** (for AI Recipe generation)

### 2. Setup
```bash
# Clone the repo
git clone https://github.com/your-username/ml-hand-gesture.git
cd ml-hand-gesture

# Setup Backend
cd backend
pip install -r requirements.txt
cp .env.example .env # Add your GEMINI_API_KEY and DATABASE_URL
python main.py

# Setup Frontend (New Terminal)
cd ../frontend
bun install
bun run dev
```

---

## 🛡️ Testing & Error Handling
*   **Hardware Robustness:** The `useSpikeDevice` hook implements a robust "Heartbeat" and "Retry" logic to handle BLE disconnections without crashing the UI.
*   **Fail-Safe Inference:** If the webcam fails or landmarks are lost, the prediction engine gracefully enters a "Wait" state rather than outputting garbage data.
*   **Input Validation:** Pydantic models on the backend ensure that malformed model weights cannot be saved to the database.

---

## 🔮 Future Improvements
*   **Multi-Hand Interaction:** Extend the MLP to recognize two-handed gestures for more complex MIDI control.
*   **Gesture Recording:** Record sequences of gestures to create "Action Macros."
*   **Unity/VST Integration:** Export trained models as a bridge to professional music production software.

---

© All Rights Reserved Pascal Cyusa. 2026
