# FinSight - Financial Management Platform for UMKM

FinSight is a comprehensive financial management platform designed to help Indonesian UMKM (Usaha Mikro, Kecil, dan Menengah) make better business decisions through smart financial analysis, cash flow predictions, and AI-based business recommendations.

![FinSight](static/images/image.png)

## Web Deployment

The application is deployed and accessible at [FinSight Web App](https://finsight.up.railway.app/). Our platform is hosted on Railway, providing reliable and scalable cloud infrastructure for optimal performance.

## Features


- **Dashboard**: Get a quick overview of your financial health with income, expenses, current balance, and transaction counts
- **Financial Management**: Track income and expenses with categorization and transaction history
- **Cash Flow Prediction**: AI-powered prediction of next month's cash flow based on historical data
- **Business Recommendations**: Get personalized business ideas based on your capital, interests, and location
- **Feasibility Analysis**: Analyze business feasibility with ROI and Break-Even Point calculations
- **MSME Community**: Connect with other business owners to share experiences and tips
- **Financial Reports**: Generate PDF reports for any date range
- **User Profile Management**: Update your profile information and change passwords

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: HTML, CSS, JavaScript, Tailwind CSS, Chart.js
- **Authentication**: JWT-based authentication
- **Containerization**: Docker & Docker Compose
- **AI Integration**: Integration with AI services for predictions and recommendations

## Running the Application

### Option 1: Using Docker Compose (Recommended)

This is the easiest way to run the application:

```bash
# Build and start all services (web app + PostgreSQL database)
docker-compose up -d

# To view logs
docker-compose logs -f

# To stop the services
docker-compose down
```

### Option 2: Manual Setup (Local Development)

If you prefer to run without Docker:

1. Set up Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

2. Set up Database

You'll need PostgreSQL running locally. Update your .env file with correct database credentials:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/finsight_db
```

3. Run the Application

```bash
# Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Accessing the Application

Once running, open your browser and go to:
- **Application**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (only in development mode)

## Environment Configuration

Make sure to configure your .env file properly:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/finsight_db
SECRET_KEY=your-super-secret-key-generate-random-string
ENVIRONMENT=development
BASE_URL=http://localhost:8000
OPENROUTER_API_KEY=your-openrouter-api-key-here
MODEL_NAME=meta-llama/llama-4-scout:free
```

## Project Structure

```
.
├── app/                 # Main application directory
│   ├── __init__.py
│   ├── auth.py          # Authentication logic
│   ├── config.py        # Application configuration
│   ├── crud.py          # Database operations
│   ├── database.py      # Database connection setup
│   ├── main.py          # FastAPI application entry point
│   ├── models.py        # SQLAlchemy models
│   ├── schemas.py       # Pydantic schemas for request/response validation
│   └── routers/         # API route handlers
│       ├── analysis.py
│       ├── community.py
│       ├── reports.py
│       └── ...
├── static/              # Static files (CSS, JS, images)
│   ├── style.css
│   ├── images/
│   └── js/              # Frontend JavaScript modules
│       ├── api.js       # API client functions
│       ├── app.js       # Main application logic
│       ├── auth.js      # Authentication handling
│       ├── community.js # Community features
│       ├── dashboard.js # Dashboard rendering
│       └── ...
├── alembic.ini          # Database migration configuration
├── docker-compose.yml   # Docker Compose configuration
├── Dockerfile           # Docker configuration
├── finsight_db_schema.sql # Database schema
├── index.html           # Main application HTML
├── landing.html         # Landing page HTML
└── requirements.txt     # Python dependencies
```

## Key Features in Detail

### Financial Dashboard
The dashboard provides a comprehensive overview of financial health with:
- Total income and expenses
- Current balance
- Monthly transaction count
- Cash flow chart for the last 6 months
- Expense category breakdown

### Financial Management
- Add new transactions with date, type, amount, category, and description
- View transaction history with filtering and sorting
- Generate financial reports for any date range in PDF format

### Cash Flow Prediction
- AI-powered prediction of next month's income and expenses
- Insights on financial trends and recommendations

### Business Recommendations
- Get personalized business ideas based on your capital, interests, and location
- Each recommendation includes business description, required capital, profit potential, and risk level

### Feasibility Analysis
- Calculate profit, ROI, and break-even point
- AI-generated insights on business viability
- Visual chart showing projected break-even trajectory

### Community Features
- Share achievements, ask questions, or post business tips
- Like and comment on community posts
- Filter posts by category

