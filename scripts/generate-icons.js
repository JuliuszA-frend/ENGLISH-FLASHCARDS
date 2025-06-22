/**
 * Generator ikon PWA dla aplikacji English Flashcards
 */

const fs = require('fs');
const path = require('path');

// Rozmiary ikon do wygenerowania
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// Dodatkowe ikony
const ADDITIONAL_ICONS = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 }
];

// SVG template dla ikony
const SVG_TEMPLATE = (size, backgroundColor = '#1e3a8a') => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.1}" fill="url(#grad)"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-size="${size * 0.5}" font-family="Arial, sans-serif" fill="white">🇬🇧</text>
  <text x="50%" y="${size * 0.8}" dominant-baseline="middle" text-anchor="middle" 
        font-size="${size * 0.12}" font-family="Arial, sans-serif" fill="white" opacity="0.9">EN</text>
</svg>`;

// Maskable SVG template
const MASKABLE_SVG_TEMPLATE = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="rgba(255,255,255,0.1)"/>
  <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" 
        font-size="${size * 0.35}" font-family="Arial, sans-serif" fill="white">🇬🇧</text>
  <text x="50%" y="${size * 0.75}" dominant-baseline="middle" text-anchor="middle" 
        font-size="${size * 0.08}" font-family="Arial, sans-serif" fill="white" 
        opacity="0.8">ENGLISH B1/B2</text>
</svg>`;

function generateIcons() {
  console.log('🎨 Rozpoczynam generowanie ikon PWA...\n');

  // Stwórz folder icons jeśli nie istnieje
  const iconsDir = 'icons';
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log(`📁 Utworzono folder: ${iconsDir}`);
  }

  let generatedCount = 0;

  // Generuj główne ikony PWA
  for (const icon of ICON_SIZES) {
    try {
      const svgContent = SVG_TEMPLATE(icon.size);
      const svgPath = path.join(iconsDir, `temp-${icon.name}.svg`);
      const iconPath = path.join(iconsDir, icon.name);

      // Zapisz tymczasowy SVG
      fs.writeFileSync(svgPath, svgContent);
      
      // W rzeczywistej implementacji tutaj byłaby konwersja SVG → PNG
      // Na potrzeby przykładu kopiujemy SVG jako "PNG"
      fs.copyFileSync(svgPath, iconPath.replace('.png', '.svg'));
      fs.unlinkSync(svgPath);

      console.log(`✅ Wygenerowano: ${icon.name} (${icon.size}x${icon.size})`);
      generatedCount++;

    } catch (error) {
      console.log(`❌ Błąd generowania ${icon.name}: ${error.message}`);
    }
  }

  // Generuj maskable ikony
  for (const icon of ICON_SIZES) {
    try {
      const svgContent = MASKABLE_SVG_TEMPLATE(icon.size);
      const maskableName = icon.name.replace('.png', '-maskable.svg');
      const maskablePath = path.join(iconsDir, maskableName);

      fs.writeFileSync(maskablePath, svgContent);
      console.log(`✅ Wygenerowano: ${maskableName} (maskable)`);
      generatedCount++;

    } catch (error) {
      console.log(`❌ Błąd generowania maskable ${icon.name}: ${error.message}`);
    }
  }

  // Generuj dodatkowe ikony
  for (const icon of ADDITIONAL_ICONS) {
    try {
      const svgContent = SVG_TEMPLATE(icon.size);
      const iconPath = path.join(iconsDir, icon.name.replace('.png', '.svg'));

      fs.writeFileSync(iconPath, svgContent);
      console.log(`✅ Wygenerowano: ${icon.name} (${icon.size}x${icon.size})`);
      generatedCount++;

    } catch (error) {
      console.log(`❌ Błąd generowania ${icon.name}: ${error.message}`);
    }
  }

  // Generuj favicon.ico (jako SVG)
  try {
    const faviconSvg = SVG_TEMPLATE(32);
    fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSvg);
    console.log(`✅ Wygenerowano: favicon.svg`);
    generatedCount++;
  } catch (error) {
    console.log(`❌ Błąd generowania favicon: ${error.message}`);
  }

  // Generuj ikony shortcut
  const shortcuts = [
    { name: 'shortcut-flashcards.svg', emoji: '📚', color: '#1e3a8a' },
    { name: 'shortcut-quiz.svg', emoji: '🎯', color: '#059669' },
    { name: 'shortcut-stats.svg', emoji: '📊', color: '#7c3aed' }
  ];

  for (const shortcut of shortcuts) {
    try {
      const shortcutSvg = `
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" rx="20" fill="${shortcut.color}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-size="48" font-family="Arial, sans-serif">${shortcut.emoji}</text>
</svg>`;

      fs.writeFileSync(path.join(iconsDir, shortcut.name), shortcutSvg);
      console.log(`✅ Wygenerowano: ${shortcut.name}`);
      generatedCount++;

    } catch (error) {
      console.log(`❌ Błąd generowania ${shortcut.name}: ${error.message}`);
    }
  }

  // Stwórz README dla ikon
  const iconReadme = `# Ikony aplikacji English Flashcards B1/B2

## Wygenerowane ikony:

### Główne ikony PWA:
${ICON_SIZES.map(icon => `- ${icon.name} (${icon.size}x${icon.size}px)`).join('\n')}

### Maskable ikony:
${ICON_SIZES.map(icon => `- ${icon.name.replace('.png', '-maskable.svg')} (${icon.size}x${icon.size}px)`).join('\n')}

### Dodatkowe ikony:
${ADDITIONAL_ICONS.map(icon => `- ${icon.name} (${icon.size}x${icon.size}px)`).join('\n')}
- favicon.svg (32x32px)

### Ikony shortcuts:
${shortcuts.map(s => `- ${s.name} (96x96px)`).join('\n')}

## Uwagi:
- Ikony zostały wygenerowane jako pliki SVG
- W produkcji należy skonwertować je do formatu PNG
- Użyj narzędzi jak ImageMagick lub online converters
- Zachowaj odpowiednie rozmiary i jakość

## Konwersja do PNG:
\`\`\`bash
# Przykład konwersji z SVG do PNG
convert icon-192x192.svg -resize 192x192 icon-192x192.png
\`\`\`
`;

  fs.writeFileSync(path.join(iconsDir, 'README.md'), iconReadme);

  console.log(`\n📊 Podsumowanie generowania ikon:`);
  console.log(`   Wygenerowanych ikon: ${generatedCount}`);
  console.log(`   Lokalizacja: ./${iconsDir}/`);
  console.log(`\n💡 Pamiętaj: Skonwertuj pliki SVG do PNG dla lepszej kompatybilności!`);
}

// Uruchom generator jeśli skrypt jest wywołany bezpośrednio
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons };