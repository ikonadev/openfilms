const fs = require('fs');
const fetch = require('cross-fetch');
const path = require('path');

const FILTER_LIST_URLS = [
  'https://raw.githubusercontent.com/Zalexanninev15/NoADS_RU/main/ads_list_extended.txt',
];

async function run() {
  console.log('Downloading filters...');
  let combined = '';
  for (const url of FILTER_LIST_URLS) {
    try {
      console.log(`Downloading: ${url}`);
      const response = await fetch(url);
      const text = await response.text();
      combined += text + '\n\n';
    } catch (e) {
      console.error(`Error downloading ${url}:`, e);
    }
  }

  const outputPath = path.join(__dirname, 'src', 'main', 'filters.txt');
  fs.writeFileSync(outputPath, combined, 'utf-8');
  console.log('Successfully saved to src/main/filters.txt');
}

run();
