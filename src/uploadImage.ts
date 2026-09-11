// Cloudinary "unsigned upload" — de cloud name en preset zijn client-side bedoeld om
// publiek te zijn (net als de Firebase web-config in firebase-config.js), dus hardcoded
// hier is prima. Geen backend/signing nodig, geen Firebase Storage (dat vereist het
// betaalde Blaze-plan).
const CLOUDINARY_CLOUD_NAME = "kxx5zrnd";
const CLOUDINARY_UPLOAD_PRESET = "Stitchify";

export async function uploadPatternImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
    );

    if (!response.ok) {
        throw new Error(`Cloudinary upload mislukt: ${response.status}`);
    }

    const data = await response.json();
    return data.secure_url;
}
