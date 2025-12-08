/**
 * Pixel Extraction Logic (Client-Side Implementation of Python Requirement)
 * 
 * This module implements the "Step 1: Pixel Extraction" workflow demanded by the user.
 * Instead of calling a Python script (which requires a backend), we execute the EXACT
 * same algorithmic logic in JavaScript using HTML5 Canvas.
 * 
 * Logic:
 * 1. Load annotated image.
 * 2. Convert to HSV.
 * 3. Extract Blue pixels (Range: H=200-280deg, S>0.59, V>0).
 * 4. Create Binary Mask (White=Blue, Black=Other).
 * 5. Dilate mask to cover edges.
 */

export const createMaskFromBlue = (imageSrc) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const maskData = new Uint8ClampedArray(data.length);

            // HSV Range (Standard 0-360, 0-1, 0-1) matching OpenCV [100, 150, 0] to [140, 255, 255]
            // OpenCV H is 0-180. So 100->200, 140->280.
            // OpenCV S,V are 0-255. So 150->0.588.
            const lowerH = 200;
            const upperH = 280;
            const lowerS = 0.58;
            const upperS = 1.0;
            const lowerV = 0.0;
            const upperV = 1.0;

            let hasBluePixels = false;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const [h, s, v] = rgbToHsv(r, g, b);

                // Check if Blue
                if (h >= lowerH && h <= upperH && s >= lowerS && s <= upperS && v >= lowerV && v <= upperV) {
                    // White (255)
                    maskData[i] = 255;
                    maskData[i + 1] = 255;
                    maskData[i + 2] = 255;
                    maskData[i + 3] = 255; // Alpha
                    hasBluePixels = true;
                } else {
                    // Black (0)
                    maskData[i] = 0;
                    maskData[i + 1] = 0;
                    maskData[i + 2] = 0;
                    maskData[i + 3] = 255; // Alpha
                }
            }

            if (!hasBluePixels) {
                console.log("No blue pixels found in image.");
                resolve(null);
                return;
            }

            // Dilation (Simple implementation)
            // We need to expand white pixels.
            // Create a new buffer for dilated data
            const dilatedData = new Uint8ClampedArray(maskData);
            const width = canvas.width;
            const height = canvas.height;
            const kernelSize = 2; // Radius (approx 5x5 kernel)

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    // If pixel is white, keep it white.
                    // If pixel is black, check neighbors.
                    if (maskData[idx] === 0) {
                        let isNeighborWhite = false;
                        // Check neighbors
                        for (let ky = -kernelSize; ky <= kernelSize; ky++) {
                            for (let kx = -kernelSize; kx <= kernelSize; kx++) {
                                const ny = y + ky;
                                const nx = x + kx;
                                if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                                    const nIdx = (ny * width + nx) * 4;
                                    if (maskData[nIdx] === 255) {
                                        isNeighborWhite = true;
                                        break;
                                    }
                                }
                            }
                            if (isNeighborWhite) break;
                        }
                        if (isNeighborWhite) {
                            dilatedData[idx] = 255;
                            dilatedData[idx + 1] = 255;
                            dilatedData[idx + 2] = 255;
                            dilatedData[idx + 3] = 255;
                        }
                    }
                }
            }

            // Put dilated data back
            const newImageData = new ImageData(dilatedData, width, height);
            ctx.putImageData(newImageData, 0, 0);

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
    });
};

// Helper: RGB to HSV
function rgbToHsv(r, g, b) {
    r /= 255, g /= 255, b /= 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if (max == min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h * 360, s, v];
}

/**
 * Creates a "Clean Plate" by punching a black hole in the image where the mask is white.
 * @param {string} imageSrc - The original image (or annotated image if original missing).
 * @param {string} maskSrc - The binary mask (White = Edit Area).
 * @returns {Promise<string>} - Data URL of the clean plate.
 */
export const createCleanPlate = (imageSrc, maskSrc) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;

        const mask = new Image();
        mask.crossOrigin = "anonymous";
        mask.src = maskSrc;

        let loadedCount = 0;
        const checkLoaded = () => {
            loadedCount++;
            if (loadedCount === 2) process();
        };

        img.onload = checkLoaded;
        mask.onload = checkLoaded;
        img.onerror = reject;
        mask.onerror = reject;

        function process() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // Draw original image
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            // Draw mask to a temp canvas to get pixel data
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = canvas.width;
            maskCanvas.height = canvas.height;
            const maskCtx = maskCanvas.getContext('2d');
            maskCtx.drawImage(mask, 0, 0, canvas.width, canvas.height); // Ensure size match
            const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height).data;

            // Iterate and punch hole
            for (let i = 0; i < data.length; i += 4) {
                // Check if mask is white (or close to white)
                // We assume binary mask, so check Red channel > 128
                if (maskData[i] > 128) {
                    // Set image pixel to Black (0, 0, 0, 255)
                    data[i] = 0;     // R
                    data[i + 1] = 0; // G
                    data[i + 2] = 0; // B
                    data[i + 3] = 255; // Alpha (Keep opaque)
                }
            }

            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        }
    });
};
