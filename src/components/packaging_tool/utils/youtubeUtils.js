export const extractYoutubeThumbnail = (url) => {
    if (!url) return null;

    // Regular expression for YouTube ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
        const videoId = match[2];
        // Return the max resolution thumbnail
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    return null;
};

export const fetchImageAsBlob = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.blob();
    } catch (error) {
        console.warn("Direct fetch failed (CORS?), falling back to URL string", error);
        return null;
    }
};
