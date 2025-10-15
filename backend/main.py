from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message" : "Hey there"}

@app.get("/search")
def search(q: str):
    message = ""
    if q == "1":
        message = "You searched for 1"
    elif q == "2":
        message = "You searched for 2" 
        
    return {"query": q, "results": message}
