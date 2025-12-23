# 1of10 Scout Service

This service uses a headless Chrome browser with the 1of10 extension to scrape YouTube outliers.

## Setup

1.  **Download the Extension**:
    Run the helper script to download and unpack the 1of10 extension:
    ```bash
    python download_extension.py
    ```
    This will create a `1of10_ext` directory.

2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    python -m playwright install chromium
    ```

## Usage (Local)

Run the script directly with Python:

```bash
python main.py "https://www.youtube.com/@ChannelName"
```

The results will be saved to `outliers.json` in the current directory.

## Docker Usage (For Cloud/Linux)

If you are deploying to a Linux server:

```bash
docker build -t scout_v2 .
docker run --rm -v $(pwd)/outliers.json:/app/outliers.json scout_v2 "https://www.youtube.com/@ChannelName"
```
