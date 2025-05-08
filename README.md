# 🌾 AgriRisk Assessment System

A modern, multilingual, region-aware agricultural risk assessment platform for 🇮🇳 India, tailored for **farmers**, **NGOs**, **policymakers**, and **agri-analysts**. It offers dynamic risk scoring, regional alerts, scheme info, AI chatbot support, and interactive maps — all in a responsive, multilingual UI.

---

## 🚀 Key Features

* ✅ **Credit Risk Assessment** by crop and region (XGBoost-powered)
* 🌦️ **Real-time News & Alerts** (weather, market trends, government schemes)
* 📄 **Downloadable PDF Reports** for offline access
* 🤖 **AI Chatbot Assistant** using LangChain + GROQ
* 🌐 **Multilingual UI** — English + major Indian languages (via i18next)
* 🗽️ **Dynamic Risk Map** with Leaflet.js (color-coded per region)
* 📱 **Responsive, Accessible UI** (screen-reader & keyboard friendly)

---

## 🧰 Tech Stack

| Layer        | Tools & Libraries                                          |
| ------------ | ---------------------------------------------------------- |
| **Frontend** | React, Vite, Material-UI, React-Leaflet, Chart.js, i18next |
| **Backend**  | Flask, Flask-JWT, Flask-CORS, LangChain, GROQ, NewsAPI     |
| **ML Model** | XGBoost (credit risk scoring)                              |
| **Other**    | BeautifulSoup (scraping), html2pdf (report generation)     |

---

## ⚡ Quick Start

### 🔁 1. Clone the Repository

```bash
git clone https://github.com/ddv2311/agri-risk-assessment.git
cd agri-risk-assessment
```

### 🪪 2. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env  # Fill in your API keys
python app.py
```

### 💻 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

* 🔗 Frontend: [http://localhost:5173](http://localhost:5173)
* 🔗 Backend: [http://localhost:5000](http://localhost:5000)

---

## 🔐 Environment Variables (`backend/.env`)

```env
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=your_secret
JWT_SECRET_KEY=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
NEWSAPI_KEY=your_newsapi_key  # Optional
```

---

## 📱 UI Pages & Navigation

| Page                 | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `/risk-assessment`   | Enter crop, region, and scenario to get a risk score     |
| `/results`           | View or download a detailed risk report (PDF)            |
| `/news-alerts`       | Weather, market, and scheme updates by region            |
| `/risk-map`          | Interactive region-wise risk visualization               |
| **Chatbot (widget)** | Ask agri-queries, get risk explanations, crop tips, etc. |

---

## 🧪 Backend API Endpoints

| Method | Endpoint               | Description                       |
| ------ | ---------------------- | --------------------------------- |
| POST   | `/api/risk-assessment` | Run credit risk prediction        |
| GET    | `/api/historical-risk` | Fetch historical risk trends      |
| GET    | `/api/region-news`     | Get localized agri news           |
| GET    | `/api/news`            | News by category                  |
| GET    | `/api/region-risk`     | Risk data for map rendering       |
| POST   | `/api/chatbot`         | Ask AI chatbot (LangChain + GROQ) |

---

## 📝 Developer Notes

* 💼 Modular backend and frontend code — easy to extend and maintain
* 🌍 To add new languages: drop a JSON file in `frontend/src/locales/` and register it in `i18n.ts`
* 🪪 To test or mock features (news, risk map), use included fallback/mock data
* 🛉 `.coverage` indicates test coverage — contribute new tests if possible!

---

## 🤝 Contributing

Contributions are welcome! Please:

* Fork the repo
* Create a feature branch
* Open a pull request with a clear description

Also feel free to open an issue for bugs, feature requests, or feedback!

---


## 🙌 Acknowledgements

Thanks to:

* OpenWeatherMap, Agmarknet, and data.gov.in for public data access
* LangChain and GROQ for conversational AI support
* All open-source contributors & farmers inspiring digital solutions!
