/**
 * Walidator plików JSON dla aplikacji English Flashcards
 */

const fs = require('fs');
const path = require('path');

// Pliki JSON do walidacji
const JSON_FILES = [
  'data/categories.json',
  'data/vocabulary.json',
  'manifest.json',
  'package.json'
];

// Schematy walidacji
const SCHEMAS = {
  'categories.json': {
    required: ['version', 'categories'],
    categoryRequired: ['name', 'icon', 'description']
  },
  'vocabulary.json': {
    required: ['metadata', 'categories'],
    wordRequired: ['english', 'polish', 'type']
  },
  'manifest.json': {
    required: ['name', 'short_name', 'start_url', 'display']
  },
  'package.json': {
    required: ['name', 'version', 'description']
  }
};

function validateJSON() {
  console.log('🔍 Rozpoczynam walidację plików JSON...\n');
  
  let isValid = true;
  let totalFiles = 0;
  let validFiles = 0;

  for (const filePath of JSON_FILES) {
    totalFiles++;
    console.log(`📄 Sprawdzam: ${filePath}`);
    
    try {
      // Sprawdź czy plik istnieje
      if (!fs.existsSync(filePath)) {
        console.log(`   ❌ Plik nie istnieje`);
        isValid = false;
        continue;
      }

      // Wczytaj i parsuj JSON
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      // Waliduj strukturę
      const fileName = path.basename(filePath);
      const schema = SCHEMAS[fileName];
      
      if (schema) {
        const validation = validateSchema(data, schema, fileName);
        if (validation.isValid) {
          console.log(`   ✅ Poprawny`);
          validFiles++;
        } else {
          console.log(`   ❌ Błędy:`);
          validation.errors.forEach(error => {
            console.log(`      - ${error}`);
          });
          isValid = false;
        }
      } else {
        console.log(`   ✅ Poprawny JSON (brak schematu walidacji)`);
        validFiles++;
      }

    } catch (error) {
      console.log(`   ❌ Błąd: ${error.message}`);
      isValid = false;
    }
  }

  // Podsumowanie
  console.log(`\n📊 Podsumowanie walidacji:`);
  console.log(`   Sprawdzonych plików: ${totalFiles}`);
  console.log(`   Poprawnych: ${validFiles}`);
  console.log(`   Błędnych: ${totalFiles - validFiles}`);
  
  if (isValid) {
    console.log(`\n✅ Wszystkie pliki JSON są poprawne!`);
    process.exit(0);
  } else {
    console.log(`\n❌ Znaleziono błędy w plikach JSON!`);
    process.exit(1);
  }
}

function validateSchema(data, schema, fileName) {
  const errors = [];
  
  // Sprawdź wymagane pola główne
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data)) {
        errors.push(`Brakuje wymaganego pola: ${field}`);
      }
    }
  }

  // Specjalne walidacje dla konkretnych plików
  if (fileName === 'categories.json' && data.categories) {
    for (const [key, category] of Object.entries(data.categories)) {
      for (const field of schema.categoryRequired) {
        if (!(field in category)) {
          errors.push(`Kategoria "${key}" - brakuje pola: ${field}`);
        }
      }
    }
  }

  if (fileName === 'vocabulary.json' && data.categories) {
    for (const [catKey, category] of Object.entries(data.categories)) {
      if (category.words && Array.isArray(category.words)) {
        category.words.forEach((word, index) => {
          for (const field of schema.wordRequired) {
            if (!(field in word)) {
              errors.push(`Słowo ${index + 1} w kategorii "${catKey}" - brakuje pola: ${field}`);
            }
          }
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Uruchom walidację jeśli skrypt jest wywołany bezpośrednio
if (require.main === module) {
  validateJSON();
}

module.exports = { validateJSON };