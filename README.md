# RupiahKu
Your friendly financial co-pilot for Indonesian college students.

## Features
- **AI Expense Logging**: Uses Gemini 2.0 Flash Lite to categorize expenses directly from natural language input (e.g. "gojek 15k").
- **Smart Budget Warnings**: Tracks your burn rate and proactively warns when approaching budget limits.
- **Runway Forecast**: Analog-style tracking for how many days left your budget can survive.
- **Privacy First**: Fully local. No external servers receive your raw data other than the LLM categorization proxy.

## Setup Instructions

1. Install dependencies
```bash
npm install
```

2. Configure environment variables
Create a `.env` file from the example:
```bash
cp .env.example .env
```
Fill in the `GEMINI_API_KEY` in the `.env` file with your Gemini API Key.

3. Start the development server
```bash
npm run dev
```

Enjoy tracking your expenses intuitively!
