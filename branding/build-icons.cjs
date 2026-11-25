// Maakt de app-icoon bronbestanden uit branding/stitchify-icon-source.webp.
// Gebruik: node branding/build-icons.cjs  (daarna: npx capacitor-assets generate --ios --android)
const path = require('path');
const sharp = require(path.join(__dirname, '..', 'node_modules', 'sharp'));

const SRC = path.join(__dirname, 'stitchify-icon-source.webp');
const ASSETS = path.join(__dirname, '..', 'assets');
const OUT = __dirname;

// Positie van het rode vlak in de bronafbeelding (1254x1254)
const BOX = { x: 82, y: 89, w: 1090, h: 1076, r: 249 };
const INSET = 10; // lichte rand van het vlak niet meenemen

(async () => {
    const meta = await sharp(SRC).metadata();
    const W = meta.width, H = meta.height;

    // 1. Masker: alleen het rode afgeronde vlak houden, zwart eruit
    const i = INSET;
    const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
        <rect x="${BOX.x + i}" y="${BOX.y + i}" width="${BOX.w - 2 * i}" height="${BOX.h - 2 * i}"
              rx="${BOX.r - i}" fill="#fff"/></svg>`;
    const mask = await sharp(Buffer.from(maskSvg)).blur(1.5).extractChannel(0).toBuffer();
    const rgb = await sharp(SRC).removeAlpha().png().toBuffer();
    const art = await sharp(rgb).joinChannel(mask).png().toBuffer();

    // 2. Achtergrond: rood verloop uit de kleuren in de vier hoeken van het vlak
    const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const px = (x, y) => [...data.slice((y * info.width + x) * 3, (y * info.width + x) * 3 + 3)];
    const corners = Buffer.from([...px(200, 200), ...px(1054, 200), ...px(200, 1054), ...px(1054, 1054)]);
    const bg = await sharp(corners, { raw: { width: 2, height: 2, channels: 3 } })
        .resize(W, H, { kernel: 'linear' }).blur(40).png().toBuffer();

    // 3. Samenvoegen en vierkant uitsnijden (full-bleed, stores ronden zelf af)
    const side = BOX.w;
    const top = Math.round(BOX.y + BOX.h / 2 - side / 2);
    const crop = { left: BOX.x, top, width: side, height: side };
    const merged = await sharp(bg).composite([{ input: art }]).png().toBuffer();
    const full = await sharp(merged).extract(crop).png().toBuffer();
    const bgSquare = await sharp(bg).extract(crop).png().toBuffer();

    const flat1024 = await sharp(full).resize(1024, 1024).flatten().removeAlpha().png().toBuffer();

    // App Store (1024x1024, geen transparantie) en Capacitor icon-only
    await sharp(flat1024).toFile(path.join(OUT, 'appstore-icon-1024.png'));
    await sharp(flat1024).toFile(path.join(ASSETS, 'icon-only.png'));
    // Play Store vermelding (512x512)
    await sharp(full).resize(512, 512).flatten().removeAlpha().png().toFile(path.join(OUT, 'playstore-icon-512.png'));

    // Android adaptive icon: achtergrond + voorgrond binnen de veilige zone
    await sharp(bgSquare).resize(1024, 1024).removeAlpha().png().toFile(path.join(ASSETS, 'icon-background.png'));
    const fg = Math.round(1024 * 0.62);
    const fgMaskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${fg}" height="${fg}">
        <rect x="18" y="18" width="${fg - 36}" height="${fg - 36}" rx="${fg * 0.2}" fill="#fff"/></svg>`;
    const fgMask = await sharp(Buffer.from(fgMaskSvg)).blur(12).extractChannel(0).toBuffer();
    const fgRgb = await sharp(full).resize(fg, fg).removeAlpha().png().toBuffer();
    const fgArt = await sharp(fgRgb).joinChannel(fgMask).png().toBuffer();
    const off = Math.round((1024 - fg) / 2);
    await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: fgArt, left: off, top: off }]).png().toFile(path.join(ASSETS, 'icon-foreground.png'));

    console.log('Klaar: assets/icon-only.png, icon-foreground.png, icon-background.png, branding/appstore-icon-1024.png, branding/playstore-icon-512.png');
})().catch(e => { console.error(e); process.exit(1); });
