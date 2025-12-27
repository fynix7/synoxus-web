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

# Supabase Config
SUPABASE_URL = "https://ulwjlqmccxfmxieapopy.supabase.co"
SUPABASE_KEY = "sb_publishable_nCcf-klL6pTn9UueRR6TlQ_eMPbUsk8"

async def run(channel_urls):
    if isinstance(channel_urls, str):
        channel_urls = [channel_urls]

    print(f"🚀 Starting Batch Scout for {len(channel_urls)} channels")
    
    if not os.path.exists(EXTENSION_PATH):
        print(f"❌ Extension not found at {EXTENSION_PATH}")
        return

    async with async_playwright() as p:
        # Launch browser ONCE
        context = await p.chromium.launch_persistent_context(
            USER_DATA_DIR,
            headless=False, # Must be false for extension
            args=[
                f"--disable-extensions-except={EXTENSION_PATH}",
                f"--load-extension={EXTENSION_PATH}",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ],
            viewport={"width": 1920, "height": 1080}
        )
        
        try:
            total_outliers = 0
            
            for index, channel_url in enumerate(channel_urls):
                channel_url = channel_url.strip()
                if not channel_url: continue

                print(f"📺 Processing ({index + 1}/{len(channel_urls)}): {channel_url}")
                
                page = await context.new_page()
                
                try:
                    # Navigate to videos page
                    target_url = channel_url
                    if not target_url.endswith('/videos'):
                        target_url = target_url.rstrip('/') + '/videos'
                    target_url += '?view=0&sort=dd&shelf_id=0' # Newest first

                    await page.goto(target_url, wait_until="domcontentloaded")
                    
                    # Wait for video grid
                    try:
                        await page.wait_for_selector('ytd-rich-item-renderer', timeout=15000)
                    except:
                        print(f"⚠️ Timeout waiting for videos on {channel_url}")
                        await page.close()
                        continue

                    # Robust scrolling to load full channel
                    last_height = await page.evaluate("document.documentElement.scrollHeight")
                    scroll_attempts = 0
                    max_scrolls = 50 # Allow up to 50 scrolls (approx 100s)
                    
                    while scroll_attempts < max_scrolls:
                        await page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)")
                        await asyncio.sleep(2) # Wait for load
                        
                        new_height = await page.evaluate("document.documentElement.scrollHeight")
                        if new_height == last_height:
                            # Try one more time with a small delay just in case
                            await asyncio.sleep(2)
                            new_height = await page.evaluate("document.documentElement.scrollHeight")
                            if new_height == last_height:
                                break # Reached bottom
                        
                        last_height = new_height
                        scroll_attempts += 1

                    # Wait for 1of10 extension to load
                    await asyncio.sleep(3)

                    # Extract Channel Info
                    channel_info = await page.evaluate("""
                        () => {
                            try {
                                const header = document.querySelector("ytd-channel-header-renderer");
                                const nameEl = header ? header.querySelector("#text") : null;
                                const imgEl = header ? header.querySelector("#img") : null;
                                return {
                                    name: nameEl ? nameEl.innerText : "",
                                    avatar_url: imgEl ? imgEl.src : ""
                                };
                            } catch (e) {
                                return { name: "", avatar_url: "" };
                            }
                        }
                    """)
                    
                    # Upsert Channel
                    channel_id = None
                    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
                    
                    if channel_info['name']:
                        try:
                            # Try upsert with avatar_url
                            res = supabase.table("os_channels").upsert({
                                "url": channel_url,
                                "name": channel_info['name'],
                                "avatar_url": channel_info['avatar_url'],
                                "last_scouted": "now()"
                            }, on_conflict="url").execute()
                            if res.data:
                                channel_id = res.data[0]['id']
                        except Exception as e:
                            print(f"⚠️ Channel Upsert Error (trying without avatar): {e}")
                            try:
                                res = supabase.table("os_channels").upsert({
                                    "url": channel_url,
                                    "name": channel_info['name'],
                                    "last_scouted": "now()"
                                }, on_conflict="url").execute()
                                if res.data:
                                    channel_id = res.data[0]['id']
                            except Exception as e2:
                                print(f"❌ Channel Upsert Failed: {e2}")

                    # Extract Data
                    outliers = await page.evaluate("""
                        () => {
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

                                // Extract Date
                                let publishedAt = null;
                                if (metadataLine) {
                                    const spans = metadataLine.querySelectorAll('span');
                                    for (const span of spans) {
                                        if (span.innerText.includes('ago')) {
                                            const timeText = span.innerText;
                                            const now = new Date();
                                            const num = parseInt(timeText.match(/\\d+/)?.[0] || "0");
                                            
                                            if (timeText.includes('hour')) now.setHours(now.getHours() - num);
                                            else if (timeText.includes('day')) now.setDate(now.getDate() - num);
                                            else if (timeText.includes('week')) now.setDate(now.getDate() - num * 7);
                                            else if (timeText.includes('month')) now.setMonth(now.getMonth() - num);
                                            else if (timeText.includes('year')) now.setFullYear(now.getFullYear() - num);
                                            
                                            publishedAt = now.toISOString();
                                            break;
                                        }
                                    }
                                }

                                // Extract Thumbnail
                                let thumbnail = "";
                                if (thumbnailEl) {
                                    thumbnail = thumbnailEl.src || thumbnailEl.getAttribute('data-src') || "";
                                }
                                
                                if (!thumbnail || thumbnail.includes('data:image') || thumbnail.includes('spacer')) {
                                    if (linkEl && linkEl.href) {
                                        const urlObj = new URL(linkEl.href);
                                        const videoId = urlObj.searchParams.get("v");
                                        if (videoId) {
                                            thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                                        }
                                    }
                                }

                                // Look for 1of10 multiplier
                                const allText = el.innerText;
                                const multiplierMatch = allText.match(/(\\d+\\.\\d+)x/);
                                
                                if (multiplierMatch) {
                                    const multiplier = parseFloat(multiplierMatch[1]);
                                    
                                    if (multiplier > 1.5 && views >= 5000) {
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
                                            channel_url: window.location.href,
                                            published_at: publishedAt
                                        });
                                    }
                                }
                            });
                            
                            return results;
                        }
                    """)
                    
                    print(f"✅ Found {len(outliers)} outliers on {channel_url}")
                    
                    # Save to Supabase
                    if outliers:
                        data_to_insert = []
                        for o in outliers:
                            if o['video_id']:
                                o['channel_id'] = channel_id # Add channel_id
                                data_to_insert.append(o)
                        
                        if data_to_insert:
                            try:
                                response = supabase.table("os_outliers").upsert(data_to_insert, on_conflict="video_id").execute()
                                print(f"💾 Saved {len(data_to_insert)} to DB")
                                total_outliers += len(data_to_insert)
                            except Exception as db_err:
                                print(f"❌ Database Error: {db_err}")

                except Exception as e:
                    print(f"❌ Error processing {channel_url}: {e}")
                finally:
                    await page.close()
                    # Small delay between tabs
                    await asyncio.sleep(1)
                    
        except Exception as e:
            print(f"❌ Critical Batch Error: {e}")
        finally:
            await context.close()
            print("💤 Waiting 3s for browser process to exit...")
            await asyncio.sleep(3)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <channel_url_or_comma_separated_list>")
        sys.exit(1)
    
    # Handle comma-separated list from command line
    urls = sys.argv[1].split(',')
    asyncio.run(run(urls))
