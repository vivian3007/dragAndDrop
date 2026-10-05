// Cloudinary "unsigned upload" — de cloud name en preset zijn client-side bedoeld om
// publiek te zijn (net als de Firebase web-config in firebase-config.js), dus hardcoded
// hier is prima. Geen backend/signing nodig, geen Firebase Storage (dat vereist het
// betaalde Blaze-plan).
const CLOUDINARY_CLOUD_NAME = "kxx5zrnd";
const CLOUDINARY_UPLOAD_PRESET = "Stitchify";

// Groter dan dit heeft geen zin om te bewaren: de grootste weergave (de detail-popup) is
// zo'n 1000px breed, en telefoonfoto's van 4000px+ zijn al snel 5-10 MB.
const MAX_UPLOAD_DIMENSION = 2000;

// Verkleint een foto in de browser vóór het uploaden. Lukt dat niet (bv. een formaat dat de
// browser niet kan tekenen), dan gaat het origineel gewoon mee.
export async function downscaleImage(file: File): Promise<Blob> {
    if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
        return file;
    }
    try {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(bitmap.width, bitmap.height));
        if (scale === 1 && file.size < 2_000_000) {
            bitmap.close();
            return file;
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
        return blob && blob.size < file.size ? blob : file;
    } catch {
        return file;
    }
}

export async function uploadPatternImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", await downscaleImage(file));
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

// Versie van een Cloudinary-foto op de maat waarop hij getoond wordt: Cloudinary verkleint
// via de URL (`w_…`, nooit groter dan het origineel door `c_limit`) en kiest zelf het
// beste formaat en de kwaliteit voor de browser (`f_auto`, `q_auto`). Werkt ook voor al
// eerder geüploade foto's. Andere URL's blijven ongewijzigd.
export function sizedImageUrl(url: string, width: number): string {
    const marker = "/image/upload/";
    if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
    return url.replace(marker, `${marker}f_auto,q_auto,c_limit,w_${width}/`);
}
