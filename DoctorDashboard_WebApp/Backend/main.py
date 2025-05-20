
from fastapi import FastAPI,Query
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, db 
import pandas as pd
import datetime
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from fastapi import HTTPException
import random

import openai
import ast
from dotenv import load_dotenv
import os
import re
import google.generativeai as genai
import matplotlib.pyplot as plt


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend URL like ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ——— 1) Initialize Firebase Admin (do this once) ———
cred = credentials.Certificate('credentials.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://ellm-hackathon-default-rtdb.asia-southeast1.firebasedatabase.app/'
})

# ——— 2) Define request model ———
class LoginRequest(BaseModel):
    dremail: str
    password: str


@app.post("/login_doctor")
async def login_doctor(req: LoginRequest):
    # 3a) Fetch patient_table
    table_ref = db.reference('dr_table')
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
    doctor_row = df[df["Email"] == req.dremail]
    if not doctor_row.empty and req.password == "123":
        # Convert the matching row to a dictionary
        doctor_data = doctor_row.iloc[0].to_dict()
        return {"success": True, **doctor_data}
    else:
        return {"success": False}
    


class SignupRequestDoctor(BaseModel):
    email : str
    name: str
    password : str


@app.post("/signup_doctor")
async def signup_doctor(req: SignupRequestDoctor):
    table_ref = db.reference('dr_table')
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

    dr_id = int(df["DrID"].max()) + 1

    if req.email in list_email :
        return {"success":False, "message":"Registration Invalid"}
    
    new_dr = {
        "DrName":req.name,
        "Email":req.email,
        "DrID":dr_id
    }

    table_ref.push(new_dr)
    return {"success": True, "message": "Doctor registered successfully!"}


@app.get("/get_total_log_entries")
async def get_total_log_entries(drid: int = Query(...)):
    raw = db.reference("dr_table").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    df = pd.DataFrame(records)
    df = df[df["DrID"] == drid]
    patients = df.iloc[0]["PatientIDs"]
    print(patients)

    raw = db.reference("diet_logs").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    df2 = pd.DataFrame(records)
    df2 = df2[df2["PatientID"].isin(patients)]
    print(df2)
    total_diet_logs = df2.shape[0]

    raw = db.reference("steps_table").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []
    df3 = pd.DataFrame(records)
    df3 = df3[df3["PatientID"].isin(patients)]
    print(df3)
    total_exercise_logs = df3.shape[0]

    total_logs = total_diet_logs + total_exercise_logs
    
    return {"Total Log Entries":total_logs}

@app.get("/get_latest_log_entries")
async def get_latest_log_entries(drid: int = Query(...)):
    raw = db.reference("dr_table").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    df = pd.DataFrame(records)
    df = df[df["DrID"] == drid]
    patients = df.iloc[0]["PatientIDs"]
    print(patients)

    raw = db.reference("diet_logs").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    df2 = pd.DataFrame(records)
    df2 = df2[df2["PatientID"].isin(patients)]
    df2["datetime"]= pd.to_datetime(df2["datetime"])

    # Grab the 4 rows with the largest datetime values
    top4 = df2.nlargest(4, "datetime")

    #print(top4)

    raw = db.reference("patient_table").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    df3 = pd.DataFrame(records)
    df3=df3[["PatientID","PatientName"]]
    

    df_merged = pd.merge(top4,df3,how='inner')
    #print(df_merged)

    return df_merged.to_dict(orient="records")

    

    #print(df2)





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
    #print(records)
    #print(df)
    #print(df.columns)
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



class dietplaninput(BaseModel):
    patientid: int
    targetdailycalories : int
    max_fat: int
    max_sodium : int
    max_sugar : int
    Notes: str

@app.post("/post_diet_plan")
async def post_diet_plan(req: dietplaninput):
    table_ref = db.reference('diet_plan_settings')
    #raw = table_ref.get()
    new_diet_plan = {
        "PatientID":req.patientid,
        "Target_Daily_Calories":req.targetdailycalories,
        "Max_Fat":req.max_fat,
        "Max_Sodium":req.max_sodium,
        "Max_Sugar":req.max_sugar,
        "Notes": req.Notes
    }

    table_ref.push(new_diet_plan)
    return {"success": True, "message": "New Diet Plan Updated"}

@app.put("/update_diet_plan")
async def upsert_diet_plan(req: dietplaninput):
    ref = db.reference('diet_plan_settings')

    # 1) Pull down all entries
    all_plans = ref.get() or {}

    # 2) Find the key for this patient, if it exists
    matching_key = None
    for key, plan in all_plans.items():
        # plan might be None if someone deleted it; guard against that
        if isinstance(plan, dict) and plan.get("PatientID") == req.patientid:
            matching_key = key
            break

    # 3) Prepare the data you want to write
    data_to_write = {
        "PatientID": req.patientid,
        "Target_Daily_Calories": req.targetdailycalories,
        "Max_Fat": req.max_fat,
        "Max_Sodium": req.max_sodium,
        "Max_Sugar": req.max_sugar,
        "Notes": req.Notes
    }

    # 4) Update if found, otherwise push new
    try:
        if matching_key:
            ref.child(matching_key).update(data_to_write)
            return {"success": True, "message": "Diet plan updated for patient"}
        else:
            ref.push(data_to_write)
            return {"success": True, "message": "Diet plan created for patient"}
    except Exception as e:
        # Wrap any Firebase errors in a 500
        raise HTTPException(status_code=500, detail=f"Firebase error: {e}")

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
    return df.to_dict(orient="records")



@app.get("/get_patient_dr")
async def get_patient_by_drid(drid: int = Query(...)):
    raw = db.reference("dr_table").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    df = pd.DataFrame(records)
    df = df[df["DrID"] == drid]
    patients = df.iloc[0]["PatientIDs"]

    raw2 = db.reference("patient_table").get()

    if isinstance(raw2, dict):
        records2 = list(raw2.values())
    elif isinstance(raw2, list):
        records2 = raw2
    else:
        records2 = []


    df2 = pd.DataFrame(records2)
    df2 = df2[df2["PatientID"].isin(patients)]

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
            latest_log_arr.append(latest_log_exercise) 

    df2["Last_Activity"]=latest_log_diet

    return df2.to_dict(orient="records")


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


@app.get("/get_average_nutrients")
async def get_average_nutrients(patientid: int = Query(...)):
    raw = db.reference("diet_logs").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    df = pd.DataFrame(records)
    df['datetime'] = pd.to_datetime(df['datetime'])
    df['date'] = df['datetime'].dt.date
    df = df[df["PatientID"] == patientid]

    days = len(df["date"].unique())

    print(days)

    avg_calorie = df["calorie_intake"].sum()/days
    avg_fat = df["fat_intake"].sum()/days
    avg_sodium = df["sodium_intake"].sum()/days
    avg_sugar = df["sugar_intake"].sum()/days

    result = {
    "avg_calorie(kcal)": round(float(avg_calorie),2) if not pd.isna(avg_calorie) else 0.0,
    "avg_fat(g)"       : round(float(avg_fat), 2)     if not pd.isna(avg_fat)     else 0.0,
    "avg_sodium(g)"    : round(float(avg_sodium), 2)  if not pd.isna(avg_sodium)  else 0.0,
    "avg_sugar(g)"     : round(float(avg_sugar), 2)   if not pd.isna(avg_sugar)   else 0.0,
    }

    return result

@app.get("/get_nutrient_trend")
async def get_nutrient_trend(patientid: int = Query(...)):
    raw = db.reference("diet_logs").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []
    df = pd.DataFrame(records)
    df = df[df["PatientID"] == patientid]
    df['datetime'] = pd.to_datetime(df['datetime'])
    df['date'] = df['datetime'].dt.date
    print(df)
    grouped_by_df = df.groupby('date')[[
    'sodium_intake',
    'sugar_intake',
    'fat_intake',
    'calorie_intake'
    ]].mean()

    trend = grouped_by_df.reset_index().to_dict(orient='records')

    return {
        "patientid": patientid,
        "trend": trend
    }



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


@app.get("/get_steps")
async def get_steps(patientid: int = Query(...)):
    raw = db.reference("steps_table").get()
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []
    df = pd.DataFrame(records)
    df = df[df["PatientID"] == patientid]

    df["Calories_Burned"] = df["NumberOfSteps"].apply(estimate_calories_burned)

    # Create Total_Distance column
    df["Total_Distance_km"] = df["NumberOfSteps"].apply(estimate_distance_km)

    # Now df has your two new columns
    return df.to_dict(orient="records")


def get_df(table_name:str, dr_id:int):
    table_ref = db.reference(table_name)
    raw = table_ref.get()
    # 2) Normalize into a list of dicts
    if isinstance(raw, dict):
        records = list(raw.values())
    elif isinstance(raw, list):
        records = raw
    else:
        records = []

    # 3) Turn into DataFrame
    df = pd.DataFrame(records)
    
    if (table_name == "dr_table"):
        df = df[df["DrID"]==dr_id]
    else:
        table_ref = db.reference("dr_table")
        raw = table_ref.get()
        if isinstance(raw, dict):
            records = list(raw.values())
        elif isinstance(raw, list):
            records = raw
        else:
            records = []
        dr_table = pd.DataFrame(records)
        dr_table = dr_table[dr_table["DrID"]==dr_id]
        patients = dr_table.iloc[0]["PatientIDs"]
        patients = [x for x in patients if x is not None]
        df = df[df["PatientID"].isin(patients)]

        
    return df

FORBIDDEN_NAMES = { "sys", "subprocess", "shutil", "__import__"}

def is_code_safe(code: str) -> bool:
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        print("Syntax error in code:", e)
        return False

    for node in ast.walk(tree):
        # Check for dangerous imports
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            names = [alias.name for alias in node.names]
            if any(name.split('.')[0] in FORBIDDEN_NAMES for name in names):
                print(f"Found forbidden import in code: {names}")
                return False

        # Check for dangerous function calls
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in {"eval", "exec", "__import__"}:
                print(f"Found dangerous function call: {node.func.id}")
                return False

    return True

def get_ai_reply(query):
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": query}
        ],
        temperature=0.7
    )

    return response.choices[0].message.content


@app.post("/chat_bot_dr")
def chat_bot_dr(dr_id:int, question:str):
    # Load API key from custom env file
    load_dotenv(dotenv_path="api_keys.env")
    api_key = os.getenv("OPENAI_API_KEY")


    # Check if API key was loaded
    if not api_key:
        raise ValueError("openai not found in api_keys.env")

    prompt = f"""
    You are an assistant that will answer questions based on a dataset, A doctor will ask  you a question regarding it's data
    and your job is to write a python code to answer that question here are the tables


    table name : "patient_table" (this is the table showing the info for each patient)
    the columns are:
    Age                 int64 
    DateOfBirth        object
    Email              object
    HealthCondition    object
    PatientID           int64
    PatientName        object
    patient_status     object (here the status has only 3 possible values which is "warning","stable" and "urgent")


    table name : "diet_plan_settings" (this is a table where the doctor will set out the daily nutrition limits and targets for each patient )
    the columns are:
    Max_Fat                   int64
    Max_Sodium                int64
    Max_Sugar                 int64
    Notes                    object
    PatientID                 int64
    Target_Daily_Calories     int64


    table name : "diet_logs" 
    (this table will contain the diet logs for each patient, before the patient eats and consume food, he/she will take a picture of the food and the
    nutritions such as calorie_intake(kcal),fat_intake(g),sodium_intake(g),sugar_intake(g) will be recorded in this table)
    the columns are:
    PatientID           int64
    calorie_intake      int64 (in kcal)
    datetime           object (the date and time the patient eat the food)
    fat_intake        float64 (in gram)
    imagelink          object (an imgur link to the photo of the food taken)
    notes              object (the name of the food taken)
    sodium_intake     float64 (in gram)
    sugar_intake      float64 (in gram)


    table name : "steps_table"
    (this table will contain the daily number of steps that have been taken by each patient, its like a steps log, for each day a new row will be added showing the steps for each patient)
    Date             object
    NumberOfSteps     int64
    PatientID         int64


    to access these tables just call the function get_df(table_name,dr_id) and this function will return a pandas dataframe
    the dr_id is always {dr_id}

    the table_name is which table you want to access

    for example if you want to access table diet_logs then you just need to do
    diet_logs_table = get_df("diet_logs:,{dr_id})
    the function get_df is already initialize so dont make your own version of that function (THIS IS VERY IMPORTANT)

    
    the question that you need to answer is : {question}

    the output of your python code should be stored in a variable called final_answer (This final_answer  CANNOT BE A SENTENCE because we cant perform data analysis using a sentence),
    but if the question cannot be answered by a single value and needs a graph, draw the graph using matplotlib and store the plt object in a variable called final_graph and store the graph in graph.png and store the dictionary version of the graph in final_answer

    summary :
    If the question can be answered directly without any graph , put the final output in a variable called final_answer and set final_graph as None
    If the question needs a graph to answer it, draw a graph using matplotlib and store the plt object in a variable called final_graph and store the graph in graph.png (This part is very important) and store the dictonary version of the graph in the variable final_answer, make sure this dictionary version is easy to understand cuz im gonna pass this variable to another llm

    your response should only be python code and NOTHING ELSE

    dont hallucinate and answer the question directly and precisely

    today is 2025-05-8 (May 8th)


    """

    response = get_ai_reply(prompt)
    code = response
    code = re.sub(r'```python', '', code)
    code = re.sub(r'```', '', code)

    Final_Output = "An error occured"
    Final_Graph = None



    # Remove code block markers
    code = re.sub(r'```python', '', code)
    code = re.sub(r'```', '', code)

    with open("logs.txt", "w",encoding = "utf-8") as f:
        f.write(code)


    exec_globals={}
    try:
        if is_code_safe(code):
            exec_globals["get_df"] = get_df
            exec(code,exec_globals)
            Final_Output = exec_globals.get('final_answer')
            Final_Graph = exec_globals.get('final_graph')
        else:
            print("There is something wrong")
    except Exception as e:
        print(f"Error: {e}")

    api_key = os.getenv("GEMINI_API_KEY")


    # Check if API key was loaded
    if not api_key:
        raise ValueError("openai not found in api_keys.env")

    # Configure the Gemini API
    genai.configure(api_key=api_key)

    # Use the Gemini Pro model (text-only)
    model = genai.GenerativeModel("gemini-2.0-flash")

    prompt2 = f"""
    Based on the final output which is this :{Final_Output},
    provide a proper answer to this question which is : {question}
    make sure your answer is direct and dont add anything unnecessary
    """
    response_gemini = model.generate_content(prompt2)

    # If no graph, return JSON only

    client_id = os.getenv("IMGUR_CLIENT_ID")
    
    ada_graph = False
    try:
        if Final_Graph != None :
            ada_graph = True
            # Your Imgur Client ID
            IMGUR_CLIENT_ID = client_id  # 👈 Your real Client ID
            # Path to your local image file
            image_path = 'graph.png'  # 👈 Replace with your image file
            # Set headers
            headers = {
                'Authorization': f'Client-ID {IMGUR_CLIENT_ID}'
            }
            with open(image_path, 'rb') as img_file:
                response = requests.post(
                    'https://api.imgur.com/3/image',
                    headers=headers,
                    files={'image': img_file}
                )
            if response.status_code == 200:
                image_url = response.json()['data']['link']
                print("✅ Image uploaded successfully!")
                print("Image URL:", image_url)
            else:
                print("❌ Upload failed:", response.json())
                ada_graph = False
    except :
        ada_graph = False
        


    if ada_graph == False:
        response_json ={
            "text_response" : response_gemini.text,
            "graph_present": ada_graph
        }
    else :
        response_json ={
            "text_response" : response_gemini.text,
            "graph_present": ada_graph,
            "image_link":image_url
        }

    
    return response_json










    
    



    
