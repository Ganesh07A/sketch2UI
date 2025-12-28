import  os
import json
from fastapi import FastAPI,UploadFile, File, HTTPException
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

API_KEY =os.getenv("GEMINI_API_KEY")
if not API_KEY: 
    raise ValueError("GEMINI_API_KEY is missing in environment variables")

genai.configure(api_key=API_KEY)
app = FastAPI()

# CORS - Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins="*",
    allow_credentials = True,
    allow_methods = "*",
    allow_headers= ["*"],
)

@app.get("/")

def check():
    return {"status":"ok"}

@app.post("/api/upload")

async def ImageUpload(file: UploadFile = File(...)):

    try:
        image_bytes = await file.read()


        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt="""
You are an expert UI analyst. The user has uploaded a HAND-DRAWN UI SKETCH.

🎯 Task
Convert the hand-drawn UI sketch into a structured UI description JSON.

⚠️ Output rules
- Output PURE JSON only
- No Markdown
- No explanations
- No text outside JSON
- Do not invent elements that are not clearly present in the sketch
- Prefer concise, meaningful component mapping
- STRICTLY follow the schema

🧩 Schema (STRICT — do not change)
{
  "screen_name": "string",
  "layout": "single-column | two-column | three-column",
  "sections": [
    {
      "title": "string",
      "elements": [
        {
          "type": "heading | subheading | text | input | textarea | select | number | button | table | icon | image | navbar",
          "label": "string",
          "value": "string | number | null",
          "options": ["array of strings - for select"],
          "headers": ["for table"],
          "rows": [["for table"]],
          "placeholder": "optional",
          "icon": "optional",
          "src": "optional for image",
          "alt": "optional for image",
          "size": "small | medium | large",
          "position": "left | right | center",
          "brand": "for navbar",
          "items": [
            { "label": "string", "variant": "primary | secondary" }
          ],
          "col_span": 1
        }
      ]
    }
  ]
}

🧠 Interpretation rules
- large text at top → heading
- slightly smaller emphasized text → subheading
- boxed single-line text → input
- boxed multi-line region → textarea
- box with ↓ arrow → select dropdown
- + / − or steppers → number input
- row of buttons at top → navbar
- repeated rectangle grid → table
- image placeholder box or mountain icon → image
- small pictograms → icon
- grouped UI controls → form section

🧭 Layout inference
- one main vertical column → "single-column"
- left content + right panel/form → "two-column"
- dense grid of cards/widgets → "three-column"

🧭 Navbar detection rules
- if buttons/text are horizontally aligned at the top of the page
- treat them as ONE element:
{
  "type": "navbar",
  "brand": "text near top-left or title",
  "items": [
    { "label": "...", "variant": "primary|secondary" }
  ]
}
Do NOT emit multiple separate buttons for navbar elements.

🖼 Image rules
- rectangular placeholder with X, mountain, or picture icon → image
- do NOT hallucinate a real image src
- use:
  "src": null
  "alt": textual description
- infer relative size (small / medium / large)
- infer position alignment (left / right / center)

🪄 Table rules
If the sketch shows:
- columns and rows
- labeled headers
- or aligned numeric/text grids

Output:
{
 "type": "table",
 "headers": [...],
 "rows": [...]
}

📐 Spacing & grouping inference
- visually grouped items belong in the same section
- aligned blocks suggest columns
- margin boxes imply card or panel groups

📌 Final constraint
Return ONLY valid JSON.
No comments.
No prose.
No trailing commas.

"""

        response = model.generate_content(
            contents=[
                prompt,
                {
                    "mime_type": file.content_type,
                    "data": image_bytes,
                }
            ]
        )
        ai_text = response.text
        print("GEMINI REPONSE:\n ", ai_text)

        try:  #validate JSON
            parsed = json.loads(ai_text)
            print("PARSED JSON:\n", parsed)
        except Exception: 
             # fallback: try to extract JSON section if model added extra words
            try:
                start = ai_text.index("{")
                end = ai_text.rindex("}") + 1
                parsed = json.loads(ai_text[start:end])
            except Exception: 
                raise HTTPException(
                    status_code=500,
                    detail="Gemini did not return valid JSON"
                )
        return {
            "status": "success",
            "filename": file.filename,
            "ui_description": parsed
        }
    except Exception as e:
        # raise HTTPException(
        #     status_code=500,
        #     detail=str(e)
        # )   
        print("server error: ", e)    

