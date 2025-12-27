#!/usr/bin/env python3
"""
Fix missing thumbnails in Supabase database
Reconstructs thumbnail URLs from video IDs for any outliers with empty/missing thumbnails
"""

from supabase import create_client, Client

# Hardcoded Supabase credentials
SUPABASE_URL = "https://ulwjlqmccxfmxieapopy.supabase.co"
SUPABASE_KEY = "sb_publishable_nCcf-klL6pTn9UueRR6TlQ_eMPbUsk8"

def fix_missing_thumbnails():
    print("🔧 Fixing missing thumbnails...")
    
    # Connect to Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Get all outliers
    response = supabase.table('os_outliers').select('*').execute()
    outliers = response.data
    
    print(f"Found {len(outliers)} total outliers")
    
    fixed_count = 0
    
    for outlier in outliers:
        video_id = outlier.get('video_id')
        thumbnail = outlier.get('thumbnail', '')
        
        # Check if thumbnail is missing or empty
        if not thumbnail or thumbnail.strip() == '' or 'placeholder' in thumbnail.lower():
            # Construct thumbnail URL from video ID
            new_thumbnail = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
            
            # Update in Supabase
            supabase.table('os_outliers').update({
                'thumbnail': new_thumbnail
            }).eq('video_id', video_id).execute()
            
            print(f"✅ Fixed: {outlier.get('title', 'Unknown')[:50]}...")
            fixed_count += 1
    
    print(f"\n🎉 Done! Fixed {fixed_count} thumbnails")

if __name__ == "__main__":
    fix_missing_thumbnails()
