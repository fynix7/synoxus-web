#!/usr/bin/env python3
"""
Cleanup database: Remove duplicates and fix ALL thumbnails
"""

from supabase import create_client, Client

# Hardcoded Supabase credentials
SUPABASE_URL = "https://ulwjlqmccxfmxieapopy.supabase.co"
SUPABASE_KEY = "sb_publishable_nCcf-klL6pTn9UueRR6TlQ_eMPbUsk8"

def cleanup_database():
    print("🧹 Cleaning up database...")
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Get all outliers
    response = supabase.table('os_outliers').select('*').execute()
    outliers = response.data
    
    print(f"Found {len(outliers)} total outliers")
    
    # Track seen videos and duplicates
    seen = {}
    duplicates_to_delete = []
    fixed_thumbnails = 0
    
    for outlier in outliers:
        video_id = outlier.get('video_id')
        title = outlier.get('title', '')
        score = outlier.get('outlier_score', 0)
        thumbnail = outlier.get('thumbnail', '')
        
        # Fix thumbnail if missing/broken
        if not thumbnail or thumbnail.strip() == '' or 'placeholder' in thumbnail.lower() or 'data:image' in thumbnail:
            new_thumbnail = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
            supabase.table('os_outliers').update({
                'thumbnail': new_thumbnail
            }).eq('video_id', video_id).execute()
            fixed_thumbnails += 1
        
        # Check for duplicates (same video_id OR same title+score within ±0.2)
        key = f"{title.lower()}_{round(score * 5)}"  # Round to 0.2 precision
        
        if video_id in seen:
            # Exact video_id duplicate
            duplicates_to_delete.append(video_id)
            print(f"❌ Duplicate video_id: {title[:50]}...")
        elif key in seen:
            # Similar title and score (within ±0.2)
            if abs(seen[key]['score'] - score) <= 0.2:
                duplicates_to_delete.append(video_id)
                print(f"❌ Duplicate (similar): {title[:50]}...")
            else:
                seen[key] = {'video_id': video_id, 'score': score}
        else:
            seen[key] = {'video_id': video_id, 'score': score}
    
    # Delete duplicates
    for video_id in duplicates_to_delete:
        supabase.table('os_outliers').delete().eq('video_id', video_id).execute()
    
    print(f"\n✅ Fixed {fixed_thumbnails} thumbnails")
    print(f"✅ Removed {len(duplicates_to_delete)} duplicates")
    print(f"✅ {len(seen)} unique outliers remaining")

if __name__ == "__main__":
    cleanup_database()
