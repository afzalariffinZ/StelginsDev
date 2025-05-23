import os
import requests
import google.generativeai as genai
from google.genai.types import GenerateContentConfig, HttpOptions

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any  # For Gemini parts
from datetime import timedelta
import random

from pydantic import BaseModel
from dotenv import load_dotenv
import PIL.Image  # For image handling with Gemini Vision
import io

import firebase_admin
from firebase_admin import db, credentials
import pandas as pd
import re
import json
from datetime import datetime, date
import base64
import chromadb
from chromadb.config import Settings
# For image understanding
import chromadb

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
# Load environment variables (optional, but good practice for API keys)
load_dotenv()

genai.configure(api_key="YOUR-API-KEY")

# --- Initialize Gemini Models ---
# For text-only chat
text_model = genai.GenerativeModel("gemini-2.0-flash")
chat_session = text_model.start_chat(history=[])  # Maintain chat history for context

import zipfile
import os

# Path to the zip file
zip_path = "chroma_store.zip"

# Destination folder to extract into
extract_to = "chroma_store"

# Make sure the directory exists
os.makedirs(extract_to, exist_ok=True)

# Extract the zip file
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_to)

print(f"Extracted to {extract_to}")


persist_directory = "chroma_store"


client = chromadb.PersistentClient(path=persist_directory)

embedding_function = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")


# Define a Chroma vectorstore
vectorstore = Chroma(client=client, collection_name="food_facts", embedding_function=embedding_function)


# --- FastAPI App ---

# --- CORS Middleware (allow your React Native app to connect) ---
# Replace "http://localhost:19006" or your Expo Go URL if different
# For development, "*" is often used, but be more specific in production.


# --- Pydantic Models for Request/Response ---
class ChatMessage(BaseModel):
    message: str  # Text prompt is mandatory
    image_base64: Optional[str] = None
    image_mime_type: Optional[str] = None


class AIResponse(BaseModel):
    message: str


class ImageAIResponse(BaseModel):
    message: str
    original_filename: str


class Content(BaseModel):
    food: str
    calories_kcal: str
    sugar_g: str
    fat_g: str
    sodium_g: str


class LoginRequest(BaseModel):
    email: str
    password: str


app = FastAPI()

cred = credentials.Certificate("credentials.json")
firebase_admin.initialize_app(
    cred,
    {
        "databaseURL": "https://ellm-hackathon-default-rtdb.asia-southeast1.firebasedatabase.app/"
    },
)

origins = [
    "http://localhost:8081",  # Your React Native web app development server
    "http://localhost",  # Sometimes useful if accessing from localhost without port
    # Add any other origins you need (e.g., your deployed frontend URL)
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or restrict to your frontend's origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- API Endpoints ---
@app.get("/")
async def root():
    return {"message": "Gemini Chatbot API is running!"}


@app.post("/chat", response_model=AIResponse)
async def handle_chat(chat_message: ChatMessage, patientid:int):
    try:
        raw = db.reference("patient_table").get()
        if isinstance(raw, dict):
            records = list(raw.values())
        elif isinstance(raw, list):
            records = raw
        else:
            records = []

        df = pd.DataFrame(records)
        df=df[df["PatientID"]==patientid]
        #print(df)

        patient_info_dict = df.to_dict(orient='records')

        raw = db.reference("diet_plan_settings").get()
        if isinstance(raw, dict):
            records = list(raw.values())
        elif isinstance(raw, list):
            records = raw
        else:
            records = []

        df2 = pd.DataFrame(records)
        df2=df2[df2["PatientID"]==patientid]
        #print(df2)

        food_limit_dict = df2.to_dict(orient='records')

        todays_diet_log = await get_today_diet_log(patientid)

        #print("Yipppppppppppeeeeeeeeeeee")

        print(f"Received message: '{chat_message.message}'")
        if chat_message.image_base64 and chat_message.image_mime_type:
            print(
                f"Received image of type: {chat_message.image_mime_type} (length: {len(chat_message.image_base64)})"
            )

        # Prepare content for Gemini
        # Content can be a list of parts (text, image)
        content_parts: List[Any] = []

        # Text part is mandatory
        content_parts.append(
            "Persona: You are a medical assistant AI who only answers medical/dietary based questions. " \
            "Your mission is to educate everyone of different backgrounds and language on medical/dietary. " \
            "You are not to explain about anything irrelevant. And you must NOT use bullet points or bold text." \
            "If the user ask about food, focus on Malaysian food. Then if the user ask on what to eat, reply it based on the user's current health and make it easy for them to understand what they can eat and specify the portion(such as you can eat half plate of rice) " \
            "Do not make your response too lengthy. Simplify but also keep the important detail in your response and ensure that it is easily understandable. " \
            "If the user speaks in their own native language, make sure to reply in their language as well" \
        )
        content_parts.append(
            f"""
            This is some information about the user : {patient_info_dict},
            ----------------------------------------
            And this is some limits the doctor has set for the patient for his/her daily meals: {food_limit_dict}
            -----------------------------------------
            And this is the some of the patient's realtime information for today : {todays_diet_log}
            """
        )

        content_parts.append(
            chat_message.message
        )  # Gemini SDK can often infer this is text

        # Image part (optional)
        if chat_message.image_base64 and chat_message.image_mime_type:
            try:
                image_bytes = base64.b64decode(chat_message.image_base64)
                image_part = {
                    "mime_type": chat_message.image_mime_type,
                    "data": image_bytes,
                }
                content_parts.append(image_part)
            except base64.binascii.Error as b64_error:
                print(f"Error decoding base64 image: {b64_error}")
                raise HTTPException(
                    status_code=400, detail="Invalid base64 image data."
                )
            except Exception as img_e:  # Catch other potential errors with image data
                print(f"Error processing image part: {img_e}")
                raise HTTPException(
                    status_code=400, detail="Could not process image data."
                )

        print(f"Sending to Gemini, content_parts count: {len(content_parts)}")
        # Example structure of content_parts:
        # ["Describe this image.", {"mime_type": "image/jpeg", "data": <bytes>}]
        # or just ["Tell me a joke."]

        # Send message to Gemini and get response
        # The `chat_session.send_message` can take a list of parts directly
        response = chat_session.send_message(content_parts)

        # If you were using gemini-pro-vision for a one-off:
        # response = model_vision.generate_content(content_parts)

        print(f"Gemini response: {response.text}")
        return AIResponse(message=response.text)

    except Exception as e:
        print(f"Error during chat: {e}")
        # Check for specific Gemini API errors, like safety blocks
        # The structure of error feedback can vary.
        # For newer models/SDK versions, check response.prompt_feedback
        if hasattr(response, "prompt_feedback") and response.prompt_feedback:
            for rating in response.prompt_feedback.safety_ratings:
                if rating.blocked:  # Or check rating.category and rating.probability
                    block_reason = rating.category  # Simplified
                    print(f"Content blocked by Gemini due to: {block_reason}")
                    # Return a more specific message to the user
                    # The exact way to get block_reason might differ slightly based on SDK version
                    return AIResponse(
                        message=f"Content blocked by AI: {block_reason}. Please revise your prompt or image."
                    )

        # General error
        detail_message = f"Error processing chat: {str(e)}"
        if hasattr(e, "message"):  # For some google API errors
            detail_message = e.message

        raise HTTPException(status_code=500, detail=detail_message)


@app.post("/upload-image")
async def upload_image(
    patientid: int = Form(...),  # MODIFIED: Receive patientid as Form data
    file: UploadFile = File(...),
):
    try:
        IMGUR_CLIENT_ID = (
            "a88f57f1c0bc4fd"  # Keep this secure, ideally from env variables
        )
        IMGUR_UPLOAD_ENDPOINT = "https://api.imgur.com/3/image"

        contents = await file.read()
        print(f"Received file size: {len(contents)} bytes")

        img = PIL.Image.open(io.BytesIO(contents))

        # Enhanced prompt for more robust JSON
        prompt = f"""
            1. Persona: You are nutritionist that help to analyze the food items in the image.
            2. Identify the dish and list out all of its common potential ingredients.  
            3. If it's a common food item, like cream cheese, chocolate, etc. Then, just consider them as an ingredient.  
            4. If multiple distinct food items are clearly visible and separable, list the dominant one or a combined estimate.
            5. Your Respond should be in json format that have keys called Food_Name and Ingredients where the value for the key Ingredients is an array of strings the ingredient list along with its gram measurement seperated with commas, no unnecessary texts. For example:
            Milk 100g, Chicken 80g, etc.
            This is an example of the json file
             5. The json file should be in the following format:
            {{
              "Food_Name": "string",
              "Ingredients": array_of_ingredients with measurements in grams  
            }}
            6.If the image does not contain food, return a JSON with null or 0 values for nutrients put the Food_Name as "Not A Food Item".

            YOU SHOULD RETURN A JSON FILE AND NOTHING ELSE
        """

        prompt_parts = [prompt, img]

        print(f"Sending prompt to Gemini for patient: {patientid}")
        gemini_response = text_model.generate_content(
            prompt_parts
        )  # Use a different variable name
        answer1 = gemini_response.text.strip()  # Strip whitespace

        # Clean up potential markdown code blocks
        answer1 = re.sub(r"^```json\s*", "", answer1, flags=re.MULTILINE)
        answer1 = re.sub(r"\s*```$", "", answer1, flags=re.MULTILINE)
        answer1 = answer1.strip()

        print(f"Raw Gemini response text: {answer1}")

        answer1_json = json.loads(answer1)


        # Parse the ingredient list
        ingredients = answer1.split(',')
        parsed_ingredients = []
        print(f"Raw Gemini response text: {ingredients}")
        # Initialize ChromaDB client with existing database


        context_rag = ""

        for i in ingredients :
            results = vectorstore.similarity_search(i,k=1)
            print(results[0].page_content)
            

            context_rag += results[0].page_content + "/n"

        print(f"Parsed ingredients with matches and nutrition: {context_rag}")

        final_prompt = f"""
        1. Given the list of ingredients and their weight measurement, calculate the sum of all nutrient content for the food (calorie, fat, sugars , sodium)
        2. List of ingredients: {answer1}
        3. Here are some additional information :
        {context_rag}

        ONLY USE THIS INFORMATION IF IT IS NECESSARY, IF IT IS NOT NECESSARY DONT USE IT

        4. From the sum of the nutrients content, compile them to a single json file.
        5. The json file should be in the following format:
        {{
              "Food": "string",
              "calories(kcal)": float_or_int,
              "fat(g)": float_or_int,
              "sodium(g)": float_or_int,
              "sugar(g)": float_or_int
            }}
        7. RESPOND ONLY WITH JSON FILE AND NOTHING ELSE
        """

        
        gemini_response = text_model.generate_content(
            final_prompt
        )  # Use a different variable name
        answer2 = gemini_response.text.strip()  

        # Clean up the response by removing markdown code block formatting
        answer2 = answer2.replace('```json', '').replace('```', '').strip()

        try:
            answer_json = json.loads(answer2)
        except json.JSONDecodeError as e:
            print(f"JSONDecodeError: {e}. Gemini response was: {answer2}")
            raise HTTPException(
                status_code=500,
                detail=f"AI model returned invalid JSON. Response: {answer2}",
            )
        

        print(f"Parsed Gemini JSON: {answer_json}")

        # Validate expected keys from Gemini (optional but good practice)
        expected_keys = ["Food", "calories(kcal)", "fat(g)", "sodium(g)", "sugar(g)"]
        for key in expected_keys:
            if key not in answer_json:
                print(f"Warning: Key '{key}' missing in Gemini response. Using None/0.")
                # Provide default if a key is missing to avoid KeyError later
                if "kcal" in key or "(g)" in key:
                    answer_json[key] = 0  # Default to 0 for numerical values
                else:
                    answer_json[key] = "N/A"  # Default for string values

        print("Uploading to Imgur...")
        headers = {"Authorization": f"Client-ID {IMGUR_CLIENT_ID}"}
        imgur_resp = requests.post(  # Use a different variable name
            IMGUR_UPLOAD_ENDPOINT, headers=headers, files={"image": contents}
        )
        imgur_resp.raise_for_status()  # Will raise an exception for 4XX/5XX status
        image_link = imgur_resp.json()["data"]["link"]
        answer_json["image_link"] = image_link
        print(f"Imgur link: {image_link}")


        return answer_json  # This is what React Native receives

    except requests.exceptions.RequestException as e:
        print(f"Imgur API request error: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Error communicating with Image Hosting service: {str(e)}",
        )
    except PIL.UnidentifiedImageError:
        print("Error: Cannot identify image file.")
        raise HTTPException(status_code=400, detail="Invalid or corrupted image file.")
    except Exception as e:
        print(f"Error during image processing: {e}")
        # Check for Gemini-specific blocking if applicable
        if (
            hasattr(e, "prompt_feedback")
            and hasattr(e.prompt_feedback, "block_reason")
            and e.prompt_feedback.block_reason
        ):
            # For this, you'd need a Pydantic model for the error response, or just return a dict
            # return {"message": f"Content blocked: {e.prompt_feedback.block_reason.name}", "original_filename": file.filename or "unknown"}
            raise HTTPException(
                status_code=400,
                detail=f"Content blocked by AI: {e.prompt_feedback.block_reason.name}",
            )
        raise HTTPException(status_code=500, detail=f"{str(e)}")
    
class insert_logs_request(BaseModel):
    patientid:int
    Food_name: str
    Calorie_kcal:float
    Fat_g: float
    Sugar_g :float
    Sodium_g :float
    image_link:str

@app.post("/insert_logs")
async def insert_logs(req: insert_logs_request):
    try:
        now = datetime.now()
        dt_string = now.strftime("%Y-%m-%d %H:%M:%S")

        table_ref = db.reference("diet_logs")

        new_diet_log = {
            "PatientID": req.patientid,
            "calorie_intake":req.Calorie_kcal ,  # Use .get for safety
            "datetime": dt_string,
            "fat_intake": req.Fat_g,
            "imagelink": req.image_link,
            "notes": req.Food_name,
            "sodium_intake": req.Sodium_g,
            "sugar_intake": req.Sugar_g,
        }

        print(f"Saving to Firebase: {new_diet_log}")
        table_ref.push(new_diet_log)
        return {"Status":"Successful"}
    except:
        return {"Status":"Error"}

    
@app.post("/upload-image-and-Name")
async def upload_image_Name(
    FoodName: str = Form(...),
    patientid: int = Form(...),  # MODIFIED: Receive patientid as Form data
    file: UploadFile = File(...),
):
    try:
        IMGUR_CLIENT_ID = (
            "a88f57f1c0bc4fd"  # Keep this secure, ideally from env variables
        )
        IMGUR_UPLOAD_ENDPOINT = "https://api.imgur.com/3/image"

        contents = await file.read()
        print(f"Received file size: {len(contents)} bytes")

        img = PIL.Image.open(io.BytesIO(contents))

        # Enhanced prompt for more robust JSON
        prompt = f"""
            1. Persona: You are nutritionist that help to analyze the food items in the image.
            2. Identify the dish and list out all of its common potential ingredients.  
            3. If it's a common food item, like cream cheese, chocolate, etc. Then, just consider them as an ingredient.  

            4. Respond with ONLY the ingredient list along with its gram measurement seperated with commas, no unnecessary texts. For example:
            Milk 100g, Chicken 80g, etc.

            5. If multiple distinct food items are clearly visible and separable, list the dominant one or a combined estimate.
            6. The Name of the food in the picture is {FoodName}
            7. If the image does not contain food, return a JSON with null or 0 values for nutrients and "Not a food item" for "Food" .
        """

        prompt_parts = [prompt, img]

        print(f"Sending prompt to Gemini for patient: {patientid}")
        gemini_response = text_model.generate_content(
            prompt_parts
        )  # Use a different variable name
        answer1 = gemini_response.text.strip()  # Strip whitespace

        # Clean up potential markdown code blocks
        answer1 = re.sub(r"^```json\s*", "", answer1, flags=re.MULTILINE)
        answer1 = re.sub(r"\s*```$", "", answer1, flags=re.MULTILINE)
        answer1 = answer1.strip()

        print(f"Raw Gemini response text: {answer1}")
        

        # Parse the ingredient list
        ingredients = answer1.split(',')
        parsed_ingredients = []
        print(f"Raw Gemini response text: {ingredients}")
        # Initialize ChromaDB client with existing database


        context_rag = ""

        for i in ingredients :
            results = vectorstore.similarity_search(i,k=1)
            print(results[0].page_content)
            

            context_rag += results[0].page_content + "/n"

        
        print(f"Parsed ingredients with matches and nutrition: {context_rag}")

        final_prompt = f"""
        1. Given the list of ingredients and their weight measurement, calculate the sum of all nutrient content for the food (calorie, fat, sugars , sodium)
        2. List of ingredients: {answer1}
        3. Here are some additional information :
        {context_rag}

        ONLY USE THIS INFORMATION IF IT IS NECESSARY, IF IT IS NOT NECESSARY DONT USE IT

        4. From the sum of the nutrients content, compile them to a single json file.
        5. The json file should be in the following format:
        {{
              "Food": {FoodName},
              "calories(kcal)": float_or_int,
              "fat(g)": float_or_int,
              "sodium(g)": float_or_int,
              "sugar(g)": float_or_int
            }}
        7. RESPOND ONLY WITH JSON FILE AND NOTHING ELSE
        """

        gemini_response = text_model.generate_content(
            final_prompt
        )  # Use a different variable name
        answer2 = gemini_response.text.strip()  

        # Clean up the response by removing markdown code block formatting
        answer2 = answer2.replace('```json', '').replace('```', '').strip()

        try:
            answer_json = json.loads(answer2)
        except json.JSONDecodeError as e:
            print(f"JSONDecodeError: {e}. Gemini response was: {answer2}")
            raise HTTPException(
                status_code=500,
                detail=f"AI model returned invalid JSON. Response: {answer2}",
            )
        


        print(f"Parsed Gemini JSON: {answer_json}")

        # Validate expected keys from Gemini (optional but good practice)
        expected_keys = ["Food", "calories(kcal)", "fat(g)", "sodium(g)", "sugar(g)"]
        for key in expected_keys:
            if key not in answer_json:
                print(f"Warning: Key '{key}' missing in Gemini response. Using None/0.")
                # Provide default if a key is missing to avoid KeyError later
                if "kcal" in key or "(g)" in key:
                    answer_json[key] = 0  # Default to 0 for numerical values
                else:
                    answer_json[key] = "N/A"  # Default for string values

        print("Uploading to Imgur...")
        headers = {"Authorization": f"Client-ID {IMGUR_CLIENT_ID}"}
        imgur_resp = requests.post(  # Use a different variable name
            IMGUR_UPLOAD_ENDPOINT, headers=headers, files={"image": contents}
        )
        imgur_resp.raise_for_status()  # Will raise an exception for 4XX/5XX status
        image_link = imgur_resp.json()["data"]["link"]
        answer_json["image_link"] = image_link
        print(f"Imgur link: {image_link}")


        return answer_json  # This is what React Native receives

    except requests.exceptions.RequestException as e:
        print(f"Imgur API request error: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Error communicating with Image Hosting service: {str(e)}",
        )
    except PIL.UnidentifiedImageError:
        print("Error: Cannot identify image file.")
        raise HTTPException(status_code=400, detail="Invalid or corrupted image file.")
    except Exception as e:
        print(f"Error during image processing: {e}")
        # Check for Gemini-specific blocking if applicable
        if (
            hasattr(e, "prompt_feedback")
            and hasattr(e.prompt_feedback, "block_reason")
            and e.prompt_feedback.block_reason
        ):
            # For this, you'd need a Pydantic model for the error response, or just return a dict
            # return {"message": f"Content blocked: {e.prompt_feedback.block_reason.name}", "original_filename": file.filename or "unknown"}
            raise HTTPException(
                status_code=400,
                detail=f"Content blocked by AI: {e.prompt_feedback.block_reason.name}",
            )
        raise HTTPException(status_code=500, detail=f"{str(e)}")
    

@app.post("/upload_image_and_ask", response_model=ImageAIResponse)
async def upload_image_and_ask(prompt: str, file: UploadFile = File(...)):
    try:
        print(f"Received image: {file.filename}, prompt: {prompt}")
        contents = await file.read()

        # Prepare image for Gemini Vision
        img = PIL.Image.open(io.BytesIO(contents))

        prompt_parts = [prompt, img]

        response = text_model.generate_content(
            prompt_parts,
            generation_config={
                "response_mime_type": "application/json",
            },
        )

        print(f"Gemini vision response: {response.text}")
        return ImageAIResponse(message=response.text, original_filename=file.filename)
    except Exception as e:
        print(f"Error during image processing: {e}")
        if hasattr(e, "prompt_feedback") and e.prompt_feedback.block_reason:
            return ImageAIResponse(
                message=f"Content blocked: {e.prompt_feedback.block_reason.name}",
                original_filename=file.filename or "unknown",
            )
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


# --- (Optional) Endpoint to reset chat history ---
@app.post("/reset-chat")
async def reset_chat_history():
    global chat_session
    chat_session = text_model.start_chat(history=[])
    return {"message": "Chat history has been reset."}


@app.get("/get-data")
async def get_data():
    try:
        patient_ref = db.reference("patient_intake")

        all_intakes = patient_ref.get()

        return all_intakes

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing get_data: {str(e)}"
        )


@app.post("/login_patient")
async def login_patient(req: LoginRequest):

    # 3a) Fetch patient_table
    table_ref = db.reference("patient_table")
    raw = table_ref.get()

    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    # 3) Turn into DataFrame
    df = pd.DataFrame(records)

    # 3) Check if doctor exists and password is correct
    patient_row = df[df["Email"] == req.email]
    if not patient_row.empty and req.password == "123":
        # Convert the matching row to a dictionary
        patient_data = patient_row.iloc[0].to_dict()
        return {"success": True, **patient_data}
    else:
        return {"success": False}


class SignUpPatient(BaseModel):
    age: int
    email: str
    name: str
    password: str
    dateofbirth: str


@app.post("/signup_pat")
async def signup_pat(req: SignUpPatient):
    table_ref = db.reference("patient_table")
    raw = table_ref.get()

    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    # 3) Turn into DataFrame
    df = pd.DataFrame(records)
    list_email = df["Email"].tolist()

    pat_id = int(df["PatientID"].max()) + 1

    if req.email in list_email:
        return {"success": False, "message": "Registration Invalid"}

    new_pat = {
        "Age": req.age,
        "DateOfBirth": req.dateofbirth,
        "Email": req.email,
        "HealthCondition": "",
        "PatientName": req.name,
        "PatientID": pat_id,
        "patient_status": "",
    }

    table_ref.push(new_pat)
    return {"success": True, "message": "Patient registered successfully!", "patientId": pat_id}


@app.get("/get_diet_logs")
async def get_diet_logs(patientid: int = Query(...)):
    raw = db.reference("diet_logs").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    df = pd.DataFrame(records)
    df = df[df["PatientID"] == patientid]
    # print(records)
    # print(df)
    # print(df.columns)
    return df.to_dict(orient="records")


@app.get("/get_exercise_logs")
async def get_exercise_logs(patientid: int = Query(...)):
    raw = db.reference("exercise").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []
    df = pd.DataFrame(records)
    df = df[df["PatientID"] == patientid]
    return df.to_dict(orient="records")


@app.get("/get_diet_plan")
async def get_diet_plan(patientid: int = Query(...)):
    raw = db.reference("diet_plan_settings").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    df = pd.DataFrame(records)
    df = df[df["PatientID"] == patientid]

    # Return only the first record (or empty dict if none found)
    result = df.to_dict(orient="records")
    return result[0] if result else {}


@app.get("/get_today_diet_log")
async def get_today_diet_log(patientid: int = Query(...)):
    # 1) Fetch raw logs
    raw = db.reference("diet_logs").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    # 2) Build DataFrame and filter by patient
    df = pd.DataFrame(records)
    df = df[df["PatientID"] == patientid]

    # 3) Today's date
    now = datetime.now()
    todays_date = now.date()

    # 4) Convert and extract date column
    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
    df["date"] = df["datetime"].dt.date

    # 5) Filter to only today's entries
    today_df = df[df["date"] == todays_date]

    # 6) Sum totals (coerce NaN to 0)
    total_calorie = int(today_df["calorie_intake"].sum() or 0)
    total_fat = float(today_df["fat_intake"].sum() or 0.0)
    total_sodium = float(today_df["sodium_intake"].sum() or 0.0)
    total_sugar = float(today_df["sugar_intake"].sum() or 0.0)

    # 7) Return as JSON
    return {
        "patientid": patientid,
        "date": str(todays_date),
        "total_calorie": total_calorie,
        "total_fat": round(total_fat, 2),
        "total_sodium": round(total_sodium, 2),
        "total_sugar": round(total_sugar, 2),
    }


@app.get("/get_nutrient_trend_phone_week")
async def get_nutrient_trend_phone_week(patientid: int = Query(...)):
    # 1) Fetch raw diet logs
    raw = db.reference("diet_logs").get() or {}
    records = list(raw.values()) if isinstance(raw, dict) else raw

    # 2) Build DataFrame and filter by patient
    df = pd.DataFrame(records)
    df = df[df["PatientID"] == patientid]
    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
    df["day"] = df["datetime"].dt.day_name()
    df["date"] = df["datetime"].dt.date

    # 3) Compute date range: from 6 days ago up to today
    today = datetime.now().date()
    seven_days_ago = today - timedelta(days=6)

    # 4) Filter DataFrame to the past 7 days
    mask = (df["date"] >= seven_days_ago) & (df["date"] <= today)
    week_df = df.loc[mask]

    # 5) Group by date and sum each nutrient
    grouped = (
        week_df.groupby("date")[
            ["sodium_intake", "sugar_intake", "fat_intake", "calorie_intake"]
        ]
        .sum()
        .round(2)
        .reset_index()
    )

    # 6) Add day name column
    grouped["day"] = pd.to_datetime(grouped["date"]).dt.day_name()

    # 7) Convert to list-of-dicts for JSON
    trend_list = grouped.to_dict(orient="records")

    return {
        "patientid": patientid,
        "from": str(seven_days_ago),
        "to": str(today),
        "trend": trend_list,
    }


@app.get("/get_patient_by_id")
async def get_patient_by_id(id: int = Query(...)):
    raw = db.reference("patient_table").get()

    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    df = pd.DataFrame(records)
    df=df[df["PatientID"]==id]
 

    df2=df.copy()

    latest_log_arr = []
    for i in range (len(df2)):
        patient_id = df2.iloc[i]["PatientID"]
        diet_log = db.reference('diet_logs')
        raw = diet_log.get()
        # 2) Normalize into a list of dicts
        if isinstance(raw, dict):
            records = list(raw.values())
        elif isinstance(raw, list):
            records = raw
        else:
            records = []

        # 3) Turn into DataFrame
        df_dietlog = pd.DataFrame(records)
        df_dietlog = df_dietlog[df_dietlog["PatientID"]==patient_id]
        df_dietlog["datetime"]= pd.to_datetime(df_dietlog["datetime"])
        latest_log_diet  = df_dietlog["datetime"].max()

        exercise_log = db.reference('exercise')
        raw = exercise_log.get()
        # 2) Normalize into a list of dicts
        if isinstance(raw, dict):
            records = list(raw.values())
        elif isinstance(raw, list):
            records = raw
        else:
            records = []

        df_exerciselog = pd.DataFrame(records)
        df_exerciselog = df_exerciselog[df_exerciselog["PatientID"]==patient_id]
        df_exerciselog["Datetime"]= pd.to_datetime(df_exerciselog["Datetime"])
        latest_log_exercise  = df_exerciselog["Datetime"].max()

        if(latest_log_diet>latest_log_exercise):
            latest_log_arr.append(latest_log_diet)
        else:
            latest_log_arr.append(latest_log_diet) 

    df2["Last Activity"]=latest_log_arr


    if df2.empty:
        return {"error": "Patient not found"}
    return df2.iloc[0].to_dict()



def estimate_calories_burned(steps: int) -> float:
    # Base calories burned
    base_rate = 0.05  # kcal per step
    base_cal = steps * base_rate

    # Add a random variation of ±10%
    variation = random.uniform(-0.1, 0.1)  # ±10%
    calories = base_cal * (1 + variation)
    # Round to two decimals and ensure non-negative
    return round(max(calories, 0), 2)


def estimate_distance_km(steps: int) -> float:
    base_stride_km = 0.00078  # kilometers per step
    base_distance = steps * base_stride_km

    # Add a random variation of ±10%
    variation = random.uniform(-0.1, 0.1)  # ±10%
    distance_km = base_distance * (1 + variation)

    # Round to three decimals and ensure non-negative
    return round(max(distance_km, 0), 3)

@app.get("/get_steps_phone")
async def get_steps_phone(patientid: int = Query(...)):
    raw = db.reference("steps_table").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []
    df = pd.DataFrame(records)
    df = df[df["PatientID"] == patientid]
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df['day'] = df['Date'].dt.day_name()
    

    df["Calories_Burned"] = df["NumberOfSteps"].apply(estimate_calories_burned)

    # Create Total_Distance column
    df["Total_Distance_km"] = df["NumberOfSteps"].apply(estimate_distance_km)

    # Now df has your two new columns
    return df.to_dict(orient="records")
