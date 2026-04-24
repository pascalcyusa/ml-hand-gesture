
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Default to local sqlite for dev if not set
    DATABASE_URL = "sqlite:///./hand_pose.db"

print(f"Connecting to {DATABASE_URL}...")
engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as connection:
        print("Adding ai_recipe to saved_models...")
        try:
            # SQLite doesn't support IF NOT EXISTS in ALTER TABLE ADD COLUMN in older versions,
            # and SQLAlchemy/SQLite doesn't always handle it gracefully.
            # But let's try the common syntax.
            if "sqlite" in DATABASE_URL:
                connection.execute(text("ALTER TABLE saved_models ADD COLUMN ai_recipe JSON;"))
            else:
                connection.execute(text("ALTER TABLE saved_models ADD COLUMN IF NOT EXISTS ai_recipe JSON;"))
            connection.commit()
            print("Successfully added ai_recipe column.")
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("Column ai_recipe already exists.")
            else:
                print(f"Error adding ai_recipe column: {e}")

if __name__ == "__main__":
    run_migration()
