
import os
from supabase import create_client

url = "https://ulwjlqmccxfmxieapopy.supabase.co"
key = "sb_publishable_nCcf-klL6pTn9UueRR6TlQ_eMPbUsk8"
supabase = create_client(url, key)

try:
    # Fetch one row to see structure
    response = supabase.table("os_channels").select("*").limit(1).execute()
    if response.data:
        print("Columns found:", response.data[0].keys())
    else:
        print("Table is empty, cannot infer columns easily.")
except Exception as e:
    print(e)
