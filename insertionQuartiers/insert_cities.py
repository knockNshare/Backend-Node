import mysql.connector
import csv
import os
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

# CSV file path
csv_file_path = "insertionQuartiers/Communes.csv"

# Set to track communes we've already inserted
processed_communes = set()
print(f'Processed_communes',processed_communes)
# Read and insert data
with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        # Print the row being read
        try:
            # Extract the required fields
            id = int(row["code_commune_INSEE"]) if row["code_commune_INSEE"] else None
            code_postal = int(row["code_postal"]) if row["code_postal"] else None
            name = row["nom_commune_postal"] if row["nom_commune_postal"] else None
            latitude = float(row["latitude"]) if row["latitude"] and row["latitude"] != '' else None
            longitude = float(row["longitude"]) if row["longitude"] and row["longitude"] != '' else None
            if id is not None:
            # Check if this commune has already been processed
                if id not in processed_communes:
                    cursor.execute(
                        "INSERT INTO cities (id, code_postal, name, latitude, longitude) VALUES (%s, %s, %s, %s, %s)",
                        (id, code_postal, name, latitude, longitude)
                    )
                    # Mark the commune as processed
                    processed_communes.add(id)
                else:
                    print(f"Skipping duplicate commune: {name} (ID: {id})")
            else:
                print(f"Skipping row with missing or invalid 'id': {row}")
        except ValueError as e:
            print(f"Skipping row due to error: {e}")

# Commit and close
conn.commit()
cursor.close()
conn.close()
