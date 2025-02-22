import csv
import os
import mysql.connector
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database credentials
db_host = os.getenv("DB_HOST")
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_name = os.getenv("DB_NAME")

# Connect to MySQL
conn = mysql.connector.connect(
    host=db_host,
    user=db_user,
    password=db_password,
    database=db_name
)
cursor = conn.cursor()

# CSV file path for quartiers
csv_file_path = "Quartier_Nanterre.csv"  # Update the path as needed

# Step 1: Directly use Nanterre's city_id = 92000
city_id = 92050

# Step 2: Read and insert quartiers
with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
    # Use a semi-colon delimiter
    reader = csv.DictReader(csvfile, delimiter=';')
    
    for row in reader:
        try:
            quartier_name = row["NOM"] if "NOM" in row else None

            if quartier_name:
                # Insert quartier data into quartiers table
                cursor.execute(
                    "INSERT INTO quartiers (city_id, name) VALUES (%s, %s)",
                    (city_id, quartier_name)
                )
                print(f"Inserting quartier {quartier_name} linked to Nanterre (City ID: {city_id})")

        except ValueError as e:
            print(f"Skipping row due to error: {e}")

# Commit and close
conn.commit()
cursor.close()
conn.close()
