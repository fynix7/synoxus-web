export const urlToBase64 = async (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url; // Already base64

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Error converting image to base64", e);
        return null;
    }
};
