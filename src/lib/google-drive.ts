// Function to transform Google Drive URL to a direct image link
export const transformGoogleDriveUrl = (url: string): string => {
    if (!url || typeof url !== 'string' || !url.includes('drive.google.com')) {
        return url;
    }

    let fileId = null;

    // Regular expression to find the file ID from various Google Drive URL formats
    const patterns = [
        /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
        /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            fileId = match[1];
            break;
        }
    }

    if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }

    // Return the original URL if no ID is found, as it might already be in a usable format or a different host.
    return url;
};
