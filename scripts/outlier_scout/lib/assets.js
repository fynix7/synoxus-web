import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';

export async function processAssets(outliers) {
    console.log(`Processing assets for ${outliers.length} outliers...`);

    for (const outlier of outliers) {
        try {
            // Download image
            const response = await axios({
                url: outlier.thumbnail_url,
                responseType: 'arraybuffer'
            });

            // Convert to WebP Base64
            const buffer = await sharp(response.data)
                .resize(320, 180) // Resize for efficiency
                .webp({ quality: 80 })
                .toBuffer();

            const base64 = `data:image/webp;base64,${buffer.toString('base64')}`;

            // Assign Base64 string to local_webp_path (which is now just the image data)
            outlier.local_webp_path = base64;

        } catch (e) {
            console.warn(`Failed to process asset for ${outlier.video_id}: ${e.message}`);
            // Fallback to original URL if processing fails
            outlier.local_webp_path = outlier.thumbnail_url;
        }
    }
}
