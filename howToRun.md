## Option 1: Using Docker Compose (Recommended)

This is the easiest way since your project includes docker-compose.yml:

```bash
# Build and start all services (web app + PostgreSQL database)
docker-compose up -d

# To view logs
docker-compose logs -f

# To stop the services
docker-compose down
```

## Option 2: Manual Setup (Local Development)

If you prefer to run without Docker:

### 1. Set up Python Environment

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

### 2. Set up Database

You'll need PostgreSQL running locally. Update your .env file with correct database credentials:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/finsight_db
```

### 3. Run the Application

```bash
# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
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

## Default Login Credentials

Based on your index.html, the default login credentials are:
- **Email**: user@finsight.com  
- **Password**: password123

You can either register a new account or create a user in the database with these credentials.

## Troubleshooting

If you encounter issues:

```bash
# Rebuild Docker containers without cache
docker-compose build --no-cache

# Check container logs
docker-compose logs web
docker-compose logs db

# Access database container
docker exec -it finsight_db bash
```

The Docker Compose setup will automatically create the database tables using the schema from finsight_db_schema.sql.