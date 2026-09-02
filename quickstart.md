
## Quickstart

Follow these steps to set up the environment and run the prototype locally.

### 1. Clone the Repository
```bash
git clone https://github.com/ommahajan0208/GangZero.git
cd GangZero
```

### 2. Backend Setup (Python Environment)
Navigate to the backend directory, create a virtual environment, and install dependencies
```bash
cd backend
python -m venv venv
```
Activate the virtual environment
- On Windows `venv\Scripts\activate`
- On macOS and Linux `source venv/bin/activate`

Install the required packages
```bash
pip install -r requirements.txt
```

Start the FastAPI server
```bash
uvicorn main:app --reload
```

### 3. Frontend Setup (Node.js Environment)
Open a new terminal window, navigate to the frontend directory, and install dependencies
```bash
cd frontend
npm install
```

Start the development server
```bash
npm run dev
```

### 4. Environment Variables
If you need to configure custom API keys or database endpoints, copy the example environment file in the backend directory and update it
```bash
cp .env.example .env
```