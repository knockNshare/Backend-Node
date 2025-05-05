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
csv_file_path = "Quartier_Paris.csv"  # Update the path as needed

# Step 2: Read and insert quartiers
with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
    # Use a semi-colon delimiter
    reader = csv.DictReader(csvfile, delimiter=';')

    for row in reader:
        try:
            # Extract the quartier name
            quartier_name = row["L_QU"] if "L_QU" in row else None
            # Extract the arrondissement code (C_AR)
            arrondissement_code = row["C_AR"] if "C_AR" in row else None

            if quartier_name and arrondissement_code:
                # Create the city_id by concatenating '751' with the arrondissement code
                city_id = f"751{arrondissement_code.zfill(2)}"  # zfill ensures a 2-digit arrondissement code

                # Insert quartier data into quartiers table, linking to the generated city_id
                cursor.execute(
                    "INSERT INTO quartiers (city_id, name) VALUES (%s, %s)",
                    (city_id, quartier_name)
                )
                print(f"Inserting quartier {quartier_name} linked to city ID {city_id}")

        except ValueError as e:
            print(f"Skipping row due to error: {e}")
        except KeyError as e:
            print(f"Skipping row due to missing column: {e}")

# Commit and close
conn.commit()
cursor.close()
conn.close()
