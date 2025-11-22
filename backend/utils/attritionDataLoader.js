const fs = require('fs');
const path = require('path');
const readline = require('readline');
const csv = require('csv-parser');

const PCA_DATASET_PATH = path.resolve(__dirname, '../../dataset/test.ai_model_metadata.pca.csv');
const CLEAN_DATASET_PATH = path.resolve(__dirname, '../../dataset/test.ai_model_metadata.clean.json');

const DEFAULT_LIMIT = Number(process.env.AI_ATTRITION_SAMPLE_LIMIT || 200);

let cachedSamples = null;

async function loadAttritionSamples(limit = DEFAULT_LIMIT) {
  const desired = Math.min(Math.max(limit, 1), DEFAULT_LIMIT);
  if (cachedSamples && cachedSamples.length >= desired) {
    return cachedSamples.slice(0, desired);
  }

  const pcaRows = await readPcaRows(desired);
  const metaMap = await readMetadataForKeys(new Set(pcaRows.map((row) => `${row.ten_mo_hinh}|${row.phien_ban}`)));

  cachedSamples = pcaRows.map((row) => ({
    ...row,
    metadata: metaMap.get(`${row.ten_mo_hinh}|${row.phien_ban}`) || {},
  }));

  return cachedSamples.slice(0, desired);
}

function readPcaRows(limit) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = fs.createReadStream(PCA_DATASET_PATH).pipe(csv());
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      resolve(rows);
    };

    stream.on('data', (row) => {
      if (rows.length >= limit) {
        stream.destroy();
        return;
      }

      const components = Object.keys(row)
        .filter((key) => key.startsWith('component_'))
        .sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]))
        .map((key) => Number(row[key]));

      rows.push({
        ten_mo_hinh: row.ten_mo_hinh,
        phien_ban: row.phien_ban,
        components,
      });
    });

    stream.on('close', finish);
    stream.on('end', finish);
    stream.on('error', (error) => {
      if (finished) return;
      finished = true;
      reject(error);
    });
  });
}

function readMetadataForKeys(keys) {
  return new Promise((resolve, reject) => {
    const results = new Map();
    const fileStream = fs.createReadStream(CLEAN_DATASET_PATH, { encoding: 'utf-8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      if (!line.trim()) return;
      try {
        const doc = JSON.parse(line);
        const key = `${doc.ten_mo_hinh}|${doc.phien_ban}`;
        if (keys.has(key) && !results.has(key)) {
          results.set(key, doc);
        }
        if (results.size === keys.size) {
          rl.close();
          fileStream.destroy();
        }
      } catch (error) {
        console.error('Failed to parse AI metadata line', error);
      }
    });

    rl.on('close', () => resolve(results));
    rl.on('error', reject);
  });
}

module.exports = {
  loadAttritionSamples,
};

