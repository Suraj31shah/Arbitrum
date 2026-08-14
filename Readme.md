<div align="center">
  <img src="./frontend/public/commitx_logo.png" alt="CommitX Logo" width="120" />
  <h1>CommitX</h1>
  <p><strong>Decentralized Accountability Protocol Powered by AI & Arbitrum</strong></p>
</div>

---

## 🚀 What is CommitX?

**CommitX** is a revolutionary accountability platform that gamifies personal and professional goals by putting real money on the line. Users connect their Web3 wallets, commit to a task, and lock up a cryptocurrency stake (ETH) on the **Arbitrum Sepolia** network via our smart contracts. 

If you achieve your goal before the deadline, you get your stake back—plus an equal share of the ETH from anyone who failed the challenge. If you fail, you lose your stake. If everyone fails, the entire prize pool is donated to a designated charity. No central authority, no middlemen—just pure, relentless accountability.

---

## 🛠️ Key Features

- 💰 **Web3 Staking**: Put your ETH on the line using our secure smart contract deployed on Arbitrum Sepolia.
- 🤖 **AI-Powered Verification**: Proofs are autonomously verified by Google's cutting-edge **Gemini 2.5 Flash** AI model, which rigorously analyzes images, PDFs, and text to determine if you met your goal.
- 🔌 **Automated Integrations**: Sync your commitments directly with 3rd-party platforms. CommitX pulls real-time telemetry from **GitHub**, **Todoist**, **Google Fit**, and **Notion** to deterministically verify your success without manual proof submission.
- 🎁 **Charity Fallback**: If a challenge concludes and *zero* participants succeed, the locked ETH isn't lost—it is programmatically transferred to a verified Charity wallet address.
- 🌙 **Modern UI**: A sleek, fully responsive, dark-mode-first React frontend designed for a seamless user experience.

---

## 🏗️ Technology Stack

### **Frontend**
- **React.js** (Vite)
- **React Router v6** (Client-side routing)
- **Ethers.js v6** (Web3 integration & Smart Contract interaction)
- **CSS3 / Vanilla CSS** (Custom dynamic glassmorphism and modern UI components)

### **Backend**
- **Node.js & Express.js** (REST API)
- **MongoDB & Mongoose** (Database)
- **Passport.js** (OAuth2 handling for integrations)
- **connect-mongo** (Persistent MongoDB-backed Express sessions)
- **@google/genai** (Google Gemini API for AI Verification)

### **Blockchain**
- **Arbitrum Sepolia Testnet**
- **Solidity** (Smart Contracts)
- **MetaMask** (Wallet Provider)

---

## 🔗 OAuth & Integrations

CommitX allows users to link their favorite productivity and health apps to automate the verification process:
1. **GitHub**: Auto-fetches your commit history (both public and private) to verify coding challenges.
2. **Todoist**: Pulls your completed tasks to ensure you're crushing your daily to-do lists.
3. **Google Fit / Health**: Extracts step counts, calories burned, and workout durations for fitness goals.
4. **Notion**: Tracks pages read or written for studying and productivity goals.

*Note: All integrations are securely authorized via OAuth2, and access tokens are encrypted and stored in MongoDB.*

---

## 🧠 The AI Verification Engine

When a user submits manual proof (like a screenshot or a document), it is processed by our `aiService`. 
- We utilize **Gemini 2.5 Flash**, passing the challenge parameters, the user's proof description, and base64-encoded files.
- The AI acts as a strict judge, analyzing the evidence against the original goal.
- It returns a deterministic JSON response containing a confidence score, a definitive pass/fail boolean, and constructive feedback on the provided evidence.

---

## ⚙️ Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- MetaMask Extension (configured with Arbitrum Sepolia RPC)

### 1. Clone the Repository
```bash
git clone https://github.com/Suraj31shah/Arbitrum.git
cd Arbitrum
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=...
SESSION_SECRET=your_super_secret_session_key
FRONTEND_URL=http://localhost:5173

# AI & Blockchain
GEMINI_API_KEY=your_gemini_api_key
PRIVATE_KEY=your_admin_wallet_private_key
RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
CHARITY_WALLET_ADDRESS=...

# Integrations (OAuth Client IDs & Secrets)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
TODOIST_CLIENT_ID=...
TODOIST_CLIENT_SECRET=...
NOTION_CLIENT_ID=...
NOTION_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000
```
Start the Vite development server:
```bash
npm run dev
```

---

## 📜 Smart Contract Flow

The core logic is handled by our deployed Solidity contract (`0xEe4A913659e1d3F8d3bB67302a82B1f2eFAe3281`):
1. **`joinChallenge()`**: Users call this `payable` function, passing the backend-generated Challenge ID and depositing the required ETH.
2. **`resolveChallenge()`**: Once the deadline passes, the backend triggers this function. It passes the addresses of the users who were successfully verified by the AI/Integrations. The contract splits the total prize pool among the winners, or sends it to the charity address if the winners array is empty.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Suraj31shah/Arbitrum/issues) if you want to contribute.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
