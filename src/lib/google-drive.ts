
// Function to transform Google Drive URL to a direct image link
export const transformGoogleDriveUrl = (url: string): string => {
    if (!url || !url.includes('drive.google.com')) {
        return url;
    }
    const match = url.match(/file\/d\/([^/]+)/);
    if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
};
