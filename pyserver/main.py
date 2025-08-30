from fastapi import FastAPI
from routes import notes

app = FastAPI(title="Notes Service")

# health check
@app.get("/ping")
def ping():
    return {"message": "pong"}

# include notes routes
app.include_router(notes.router, prefix="/notes")
