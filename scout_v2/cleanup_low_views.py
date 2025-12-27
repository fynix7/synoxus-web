import os
from supabase import create_client, Client

SUPABASE_URL = "https://ulwjlqmccxfmxieapopy.supabase.co"
SUPABASE_KEY = "sb_publishable_nCcf-klL6pTn9UueRR6TlQ_eMPbUsk8"

def cleanup():
    print("🧹 Starting cleanup of low-view videos (< 5000 views)...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Delete videos with views < 5000
        response = supabase.table('os_outliers').delete().lt('views', 5000).execute()
        
        deleted_count = len(response.data) if response.data else 0
        print(f"✅ Deleted {deleted_count} videos with less than 5000 views.")
        
    except Exception as e:
        print(f"❌ Error deleting videos: {e}")

if __name__ == "__main__":
    cleanup()
