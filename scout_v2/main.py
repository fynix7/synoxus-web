import asyncio
import os
import sys
import json
import time
from playwright.async_api import async_playwright
from supabase import create_client, Client

# Configuration
EXTENSION_PATH = os.path.abspath("./1of10_ext")
USER_DATA_DIR = os.path.abspath("./user_data")

# Supabase Config (Hardcoded for local script simplicity, or load from env)
SUPABASE_URL = "https://ulwjlqmccxfmxieapopy.supabase.co"
SUPABASE_KEY = "sb_publishable_nCcf-klL6pTn9UueRR6TlQ_eMPbUsk8"

async def run(channel_url):
    print(f"🚀 Starting Scout for: {channel_url}")
    
    if not os.path.exists(EXTENSION_PATH):
        print(f"❌ Extension not found at {EXTENSION_PATH}")
        print("Please ensure the '1of10_ext' folder exists and contains the unpacked extension.")
        sys.exit(1)

    async with async_playwright() as p:
        # Launch Chrome with extension
        context = await p.chromium.launch_persistent_context(
            USER_DATA_DIR,
            headless=False, # We set this to False but use --headless=new arg below to support extensions invisibly
            args=[
                f"--disable-extensions-except={EXTENSION_PATH}",
                f"--load-extension={EXTENSION_PATH}",
                "--headless=new", # This enables the new headless mode that supports extensions
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--window-size=1920,1080"
            ],
            viewport={"width": 1920, "height": 1080}
        )

        page = await context.new_page()
        
        try:
            # Navigate to channel videos
            target_url = channel_url
            if not target_url.endswith('/videos'):
                target_url = target_url.rstrip('/') + '/videos'
            
            print(f"Navigating to {target_url}...")
            await page.goto(target_url, wait_until="networkidle")
            
            # Scroll loop to trigger extension
            print("Scrolling to load videos and trigger extension...")
            for i in range(8):
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                print(f"Scroll {i+1}/8...")
                await asyncio.sleep(2) # Wait for extension to inject
            
            # Wait a bit more for final injection
            await asyncio.sleep(3)

            # Extract Data
            print("Extracting outliers...")
            
            outliers = await page.evaluate("""() => {
                const results = [];
                const videoElements = document.querySelectorAll('ytd-rich-item-renderer');
                
                videoElements.forEach(el => {
                    const titleEl = el.querySelector('#video-title');
                    const thumbnailEl = el.querySelector('ytd-thumbnail img');
                    const linkEl = el.querySelector('a#video-title-link');
                    const metadataLine = el.querySelector('#metadata-line');
                    
                    // Extract Views
                    let views = 0;
                    let viewCountText = "";
                    if (metadataLine) {
                        const spans = metadataLine.querySelectorAll('span');
                        for (const span of spans) {
                            if (span.innerText.includes('views')) {
                                viewCountText = span.innerText;
                                const num = parseFloat(viewCountText.replace(/[^0-9.]/g, ''));
                                const multiplier = viewCountText.toUpperCase().includes('K') ? 1000 : 
                                                   viewCountText.toUpperCase().includes('M') ? 1000000 : 1;
                                views = Math.round(num * multiplier);
                                break;
                            }
                        }
                    }

                    // Extract Thumbnail (handle lazy load)
                    let thumbnail = "";
                    if (thumbnailEl) {
                        thumbnail = thumbnailEl.src;
                        if (!thumbnail || thumbnail.includes('data:image')) {
                            // Try to find a better source if it's a placeholder
                            // Sometimes YouTube puts the real url in other attributes
                        }
                    }

                    // Look for 1of10 multiplier
                    const allText = el.innerText;
                    const multiplierMatch = allText.match(/(\\d+\\.\\d+)x/);
                    
                    if (multiplierMatch) {
                        const multiplier = parseFloat(multiplierMatch[1]);
                        
                        if (multiplier > 1.5) {
                            // Extract video ID
                            let videoId = "";
                            if (linkEl && linkEl.href) {
                                const urlObj = new URL(linkEl.href);
                                videoId = urlObj.searchParams.get("v");
                            }

                            results.push({
                                video_id: videoId,
                                title: titleEl ? titleEl.innerText : '',
                                url: linkEl ? linkEl.href : '',
                                thumbnail: thumbnail,
                                views: views,
                                outlier_score: multiplier,
                                channel_url: window.location.href
                            });
                        }
                    }
                });
                
                return results;
            }""")
            
            print(f"✅ Found {len(outliers)} outliers (> 1.5x)")
            
            # Output JSON
            print(json.dumps(outliers, indent=2))
            
            # Save to file
            with open("outliers.json", "w") as f:
                json.dump(outliers, f, indent=2)

            # Push to Supabase
            if len(outliers) > 0:
                print("Pushing to Supabase...")
                supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
                
                # 1. Get or Create Channel ID
                channel_id = None
                try:
                    # Upsert channel and get ID
                    # We assume the URL is unique
                    chan_res = supabase.table("os_channels").upsert(
                        {"url": channel_url, "last_scouted": time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())},
                        on_conflict="url"
                    ).select().execute()
                    
                    if chan_res.data and len(chan_res.data) > 0:
                        channel_id = chan_res.data[0]['id']
                        print(f"✅ Linked to Channel ID: {channel_id}")
                except Exception as c_err:
                    print(f"⚠️ Could not sync channel: {c_err}")

                # 2. Insert Outliers
                data_to_insert = []
                for o in outliers:
                    if o['video_id']: # Ensure valid video ID
                        record = {
                            "video_id": o['video_id'],
                            "title": o['title'],
                            "views": o['views'],
                            "thumbnail": o['thumbnail'],
                            "outlier_score": o['outlier_score'],
                            "scouted_at": time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
                        }
                        if channel_id:
                            record["channel_id"] = channel_id
                            
                        data_to_insert.append(record)
                
                if data_to_insert:
                    try:
                        response = supabase.table("os_outliers").upsert(data_to_insert, on_conflict="video_id").execute()
                        print(f"✅ Successfully saved {len(data_to_insert)} outliers to Supabase!")
                    except Exception as db_err:
                        print(f"❌ Database Error: {db_err}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
        finally:
            await context.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <channel_url>")
        sys.exit(1)
    
    asyncio.run(run(sys.argv[1]))
