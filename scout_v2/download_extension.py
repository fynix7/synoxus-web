import requests
import zipfile
import os
import io

# 1of10 Extension ID
EXT_ID = "gkfdnmclhbgbidnpmimfdobgjpeblckn"
DOWNLOAD_URL = f"https://clients2.google.com/service/update2/crx?response=redirect&prodversion=98.0.4758.102&acceptformat=crx2,crx3&x=id%3D{EXT_ID}%26uc"
OUTPUT_DIR = "1of10_ext"

def download_extension():
    print(f"Downloading extension {EXT_ID}...")
    try:
        response = requests.get(DOWNLOAD_URL)
        response.raise_for_status()
        
        print("Download complete. Unpacking...")
        
        if not os.path.exists(OUTPUT_DIR):
            os.makedirs(OUTPUT_DIR)
            
        try:
            with zipfile.ZipFile(io.BytesIO(response.content)) as z:
                z.extractall(OUTPUT_DIR)
            print(f"✅ Extension unpacked to {OUTPUT_DIR}")
        except zipfile.BadZipFile:
            print("❌ Error: Downloaded file is not a valid zip/crx. Google might be blocking direct CRX downloads.")
            print("Please manually download the extension using a CRX downloader and extract it to '1of10_ext'.")
            
    except Exception as e:
        print(f"❌ Error downloading extension: {e}")

if __name__ == "__main__":
    download_extension()
