require('dotenv').config();
const bigquery = require('./bigquery');
const DS = `${process.env.BIGQUERY_PROJECT_ID}.projeto_gestacoes`;

async function q(sql) {
  const [rows] = await bigquery.query({ query: sql });
  return rows;
}

async function main() {
  console.log('\n=== Schema: sifilis_gestantes ===');
  const schema = await q(`
    SELECT column_name, data_type
    FROM \`${process.env.BIGQUERY_PROJECT_ID}.projeto_gestacoes.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name = 'sifilis_gestantes'
    ORDER BY ordinal_position
  `);
  schema.forEach(r => console.log(r.column_name, '-', r.data_type));

  console.log('\n=== Sample 3 rows sifilis_gestantes ===');
  const sample = await q(`SELECT * FROM \`${DS}.sifilis_gestantes\` LIMIT 3`);
  console.log(JSON.stringify(sample, null, 2));

  console.log('\n=== Total rows ===');
  const tot = await q(`SELECT COUNT(*) as total FROM \`${DS}.sifilis_gestantes\``);
  console.log(tot[0]);

  console.log('\n=== status_final_gestante distinct ===');
  const sf = await q(`SELECT status_final_gestante, COUNT(*) as c FROM \`${DS}.sifilis_gestantes\` GROUP BY status_final_gestante ORDER BY c DESC`);
  console.log(JSON.stringify(sf));

  console.log('\n=== diagnostico_associado distinct ===');
  const da = await q(`SELECT diagnostico_associado, COUNT(*) as c FROM \`${DS}.sifilis_gestantes\` GROUP BY diagnostico_associado ORDER BY c DESC`);
  console.log(JSON.stringify(da));
}

main().catch(e => { console.error(e); process.exit(1); });
