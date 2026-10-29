const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const cardsFile = path.join(__dirname, '..', 'src', 'data', 'tarot-cards.ts');
const targetDir = path.join(__dirname, '..', 'public', 'cards');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const content = fs.readFileSync(cardsFile, 'utf8');

// Match each tarot card object block where id is a number 0..77
const cardRegex = /\{\s*id:\s*([0-9]+),[\s\S]*?name_en:\s*['"]([^'"]+)['"][\s\S]*?rws_image_url:\s*['"]([^'"]+)['"]/g;
const cards = [];
let match;
while ((match = cardRegex.exec(content)) !== null) {
  cards.push({ id: Number(match[1]), name_en: match[2], url: match[3] });
}

console.log(`Discovered ${cards.length} cards in tarot-cards.ts`);

async function downloadAndOptimize(card, index) {
  const paddedId = String(card.id).padStart(2, '0');
  const destPath = path.join(targetDir, `card_${paddedId}.webp`);
  if (fs.existsSync(destPath)) {
    const stat = fs.statSync(destPath);
    if (stat.size > 1000) {
      console.log(`[${index + 1}/${cards.length}] Exists: card_${paddedId}.webp (${stat.size} bytes)`);
      return;
    }
  }

  try {
    const res = await fetch(card.url, {
      headers: {
        'User-Agent': 'TarotCouple/1.0 (contact@tarotcouple.com)',
      },
    });

    if (!res.ok) {
      console.error(`[${index + 1}/${cards.length}] Failed ${card.id} (${card.name_en}): HTTP ${res.status}`);
      return;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await sharp(buffer)
      .resize({ width: 360, withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toFile(destPath);

    const stat = fs.statSync(destPath);
    console.log(`[${index + 1}/${cards.length}] Saved: card_${paddedId}.webp (${stat.size} bytes)`);
  } catch (err) {
    console.error(`[${index + 1}/${cards.length}] Error downloading ${card.id}:`, err.message);
  }
}

async function run() {
  console.log(`Starting download of ${cards.length} cards...`);
  // Process in batches of 4 concurrent downloads to be polite to Wikimedia
  const batchSize = 4;
  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize);
    await Promise.all(batch.map((card, idx) => downloadAndOptimize(card, i + idx)));
    // Brief 200ms delay between batches
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log('Finished downloading all cards.');
}

run();
