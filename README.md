# FinCalc India 🇮🇳

> **All-in-One Financial Calculator Suite for Indian Investors, Savers, and Planners**

FinCalc India is a modern, production-grade financial web application built on the MERN stack (MongoDB, Express.js, React with Vite, Node.js) and Tailwind CSS with shadcn/ui. Tailored specifically for the Indian financial ecosystem, FinCalc India supports domestic financial instruments, regulatory guidelines (such as Section 80C and 80CCD tax ceilings), and the Indian currency numbering convention (₹ Lakhs and ₹ Crores).

---

## 🚀 Key Features & Calculator Suite

FinCalc India provides 18 financial planning tools and calculators:

1. **Systematic Investment Plan (SIP)**: Estimate maturity amounts, wealth gained, and year-by-year growth with monthly compounding.
2. **Step-Up SIP**: Factor in annual step-up percentage increases matching yearly salary increments.
3. **Lumpsum Investment**: Project wealth growth for one-time mutual fund and equity investments.
4. **Public Provident Fund (PPF)**: Calculate 15-year PPF accounts with government interest rates, annual compounding, and ₹1,50,000 annual deposit ceiling.
5. **Sukanya Samriddhi Account (SSA)**: Plan savings for girl children under the Beti Bachao Beti Padhao initiative with 21-year maturity rules.
6. **Fixed Deposit (FD)**: Accurately calculate bank FD returns with standard Indian quarterly compounding conventions and payout options.
7. **Recurring Deposit (RD)**: Monthly recurring deposits with quarterly compounding as mandated by Indian banks and post offices.
8. **Employees' Provident Fund (EPF)**: Project retirement corpus including employee contribution, employer matching (EPF/EPS split), and annual statutory interest.
9. **National Pension System (NPS)**: Plan Tier-1 NPS corpus accumulation, mandatory minimum 40% annuity purchase, and estimated monthly pension.
10. **Simple Interest**: Quick interest calculations for informal lending, short-term debt, and academic scenarios.
11. **Compound Interest**: Customizable compounding frequencies (annual, semi-annual, quarterly, monthly, daily).
12. **Inflation Calculator**: Gauge future purchasing power and required retirement corpus adjusted for Indian CPI inflation.
13. **Goal-Based Planner**: Back-calculate exact monthly SIP or lumpsum investments needed to reach specific life milestones (buying a house, child education, marriage).
14. **Loan EMI Calculator**: Detailed amortization schedule with monthly principal vs interest breakdowns for home, personal, and car loans.
15. **Gold Investment Calculator**: Estimate physical gold, Digital Gold, and Sovereign Gold Bonds (SGB) returns with coupon interest and capital appreciation.
16. **CAGR (Compound Annual Growth Rate)**: Compute annualized return of multi-year investments.
17. **XIRR (Extended Internal Rate of Return)**: Analyze irregular cash inflows and outflows for mutual funds and stock portfolios.
18. **Financial Product Comparison**: Side-by-side comparative analysis across instruments (e.g., PPF vs ELSS vs FD vs NPS) assessing returns, risk, liquidity, and taxation.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 18 with Vite
  - Tailwind CSS & shadcn/ui component architecture
  - Lucide React icons
  - Recharts for visual wealth projection graphs
- **Backend**:
  - Node.js & Express.js REST API
  - MongoDB & Mongoose ODM
  - JSON Web Tokens (JWT) & bcryptjs for authentication
  - Helmet & Morgan for API security and logging
  - Express-Validator for payload sanitization and validation
- **Dev Tooling**:
  - Concurrently for running full-stack development servers concurrently

---

## 📂 Project Structure

```text
fincalc-india/
├── package.json               # Root scripts to orchestrate client and server
├── .gitignore                 # Root gitignore
├── .env.example               # Root environment variables template
├── README.md                  # Comprehensive project documentation
├── server/
│   ├── config/
│   │   └── db.js              # Mongoose connection with retry logic
│   ├── controllers/
│   │   ├── authController.js        # Authentication & profile handlers
│   │   └── calculationController.js # Calculation CRUD & duplication handlers
│   ├── middleware/
│   │   ├── auth.js            # JWT protection middleware
│   │   ├── errorHandler.js    # Global centralized error handler
│   │   └── validate.js        # Express-validator schemas & handler
│   ├── models/
│   │   ├── Calculation.js     # User calculation history schema
│   │   └── User.js            # User profile schema with bcrypt hashing
│   ├── routes/
│   │   ├── authRoutes.js      # Auth API endpoints
│   │   └── calculationRoutes.js # Calculation API endpoints
│   ├── utils/
│   │   └── AppError.js        # Custom operational error class
│   ├── .env.example           # Server environment template
│   ├── package.json           # Server dependencies & scripts
│   └── server.js              # Express app entrypoint
└── client/                    # React + Vite frontend application
```

---

## ⚙️ Prerequisites & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Community Server running locally at `mongodb://localhost:27017` or a MongoDB Atlas URI

### 1. Installation

Clone or open the repository, then install dependencies for all packages:

```bash
cd fincalc-india
npm run install-all
```

Alternatively, install manually in each directory:
```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 2. Environment Configuration

Create `.env` inside `server/` (and root if desired):

```bash
# In server/.env
MONGODB_URI=mongodb://localhost:27017/fincalc-india
JWT_SECRET=your_jwt_secret_here_make_it_long_and_secure
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

## 💻 Running the Application

### Concurrent Development (Client + Server)
From the root directory:
```bash
npm run dev
```

### Running Server Only
```bash
npm run server
# Or: cd server && npm run dev
```
The server will start on `http://localhost:5000`.

### Running Client Only
```bash
npm run client
# Or: cd client && npm run dev
```
The client will start on `http://localhost:5173`.

---

## 📐 Calculation Assumptions & Standards

1. **Indian Currency Representation**:
   - Numbers are formatted using Indian Rupee notation (e.g., `₹1,00,000` for one lakh, `₹1,00,00,000` for one crore).
2. **Deposit Timing**:
   - SIP and recurring contributions are assumed to be deposited at the beginning or end of each investment period as chosen (default: end of period).
3. **Compounding Conventions**:
   - **SIP / Mutual Funds**: Compounded monthly using effective monthly rates $r = \frac{R}{12 \times 100}$.
   - **Bank Fixed Deposits (FD)**: Compounded quarterly ($n = 4$) per standard Indian banking practices.
   - **Recurring Deposits (RD)**: Compounded quarterly as per Indian Post Office and commercial bank rules.
   - **PPF & EPF**: Interest credited annually, with PPF interest calculated on the minimum balance between the 5th and the last day of each month.
4. **NPS Assumptions**:
   - Minimum 40% mandatory annuity purchase upon superannuation at age 60; remainder can be withdrawn tax-free as lumpsum.
5. **Loan EMI**:
   - Standard reducing balance method: $EMI = \frac{P \times r \times (1+r)^n}{(1+r)^n - 1}$.

---

## ⚖️ Financial Disclaimer

The financial calculators provided in FinCalc India are designed strictly for educational, informational, and illustrative purposes. Actual market returns, interest rates announced by the Reserve Bank of India (RBI) or Ministry of Finance, and tax liabilities under the Indian Income Tax Act (Old vs. New Tax Regime) may vary over time. Nothing in this application constitutes certified financial, legal, or investment advice. Consult a SEBI-registered Investment Adviser (RIA) or Chartered Accountant (CA) before making major financial commitments.
"# mern-financial-calculator-india" 
