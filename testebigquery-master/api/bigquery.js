const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery({
  projectId: process.env.BIGQUERY_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Testa a conexão ao iniciar (opcional: descomente para debug)
// bigquery.getDatasets().then(() => console.log('BigQuery conectado ✓')).catch(console.error);

module.exports = bigquery;
