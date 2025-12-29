import os
import json
import logging
import re
from fastapi import FastAPI, UploadFile, File, HTTPException
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY is missing")

genai.configure(api_key=API_KEY)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins="*",
    allow_credentials=True,
    allow_methods="*",
    allow_headers=["*"],
)

@app.get("/")
def check():
    return {"status": "ok"}

@app.post("/api/upload")
async def ImageUpload(file: UploadFile = File(...)):
    try:
        logger.info(f"Processing file: {file.filename}")
        image_bytes = await file.read()

        model = genai.GenerativeModel("gemini-2.5-flash")

        # --- STRICT SCHEMA ---
        ui_schema = {
            "type": "OBJECT",
            "properties": {
                "screen_name": {"type": "STRING"},
                "layout": {"type": "STRING", "enum": ["single-column", "two-column", "three-column"]},
                "sections": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "title": {"type": "STRING"},
                            "elements": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "type": {
                                            "type": "STRING", 
                                            "enum": ["heading", "text", "input", "button", "image", "table", "navbar", "dropdown", "textarea"]
                                        },
                                        "label": {"type": "STRING"},
                                        "placeholder": {"type": "STRING", "nullable": True},
                                        "variant": {"type": "STRING", "nullable": True}, 
                                        "position": {"type": "STRING", "enum": ["left", "center", "right"], "nullable": True},
                                        # Specific fields for tables/navbars
                                        "headers": {"type": "ARRAY", "items": {"type": "STRING"}, "nullable": True},
                                        "rows": {"type": "ARRAY", "items": {"type": "ARRAY", "items": {"type": "STRING"}}, "nullable": True},
                                        "items": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {"label": {"type": "STRING"}}}, "nullable": True}
                                    },
                                    "required": ["type", "label"]
                                }
                            }
                        },
                        "required": ["title", "elements"]
                    }
                }
            },
            "required": ["screen_name", "layout", "sections"]
        }

        # --- IMPROVED PROMPT ---
        prompt = """
        Analyze this UI sketch.
        
        CRITICAL RULES FOR LABELS:
        1. 'label' must match the VISIBLE TEXT in the sketch.
        2. If a button says "Submit", label is "Submit".
        3. DO NOT use generic descriptions like "Input Field", "Dropdown Menu", or "Text Box".
        4. If an input has no text, use an empty string "" or the placeholder text (e.g., "Username").
        
        CRITICAL RULES FOR TABLES:
        - If you see a grid with rows/columns, type is 'table'.
        - Extract headers into 'headers' array.
        - Extract data into 'rows' array.
        """

        response = model.generate_content(
            contents=[
                prompt,
                {"mime_type": file.content_type, "data": image_bytes}
            ],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=ui_schema, 
                temperature=0.0,
                max_output_tokens=2000 
            )
        )

        # Cleanup & Parse
        raw_text = response.text
        cleaned_text = raw_text.strip()
        if cleaned_text.startswith("```json"): cleaned_text = cleaned_text[7:]
        if cleaned_text.startswith("```"): cleaned_text = cleaned_text[3:]
        if cleaned_text.endswith("```"): cleaned_text = cleaned_text[:-3]
        
        parsed_json = json.loads(cleaned_text.strip())
        return {"status": "success", "ui_description": parsed_json}

    except Exception as e:
        logger.error(f"Error: {e}")
        # Fallback for JSON errors
        raise HTTPException(status_code=500, detail=str(e))