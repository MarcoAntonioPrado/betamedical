require('dotenv').config();
const bigquery = require('./bigquery');
const DS = `${process.env.BIGQUERY_PROJECT_ID}.projeto_gestacoes`;

async function q(sql) {
  const [rows] = await bigquery.query({ query: sql });
  return rows;
}

async function main() {
  console.log('\n=== All tables in dataset ===');
  const tables = await q(`
    SELECT table_name FROM \`${process.env.BIGQUERY_PROJECT_ID}.projeto_gestacoes.INFORMATION_SCHEMA.TABLES\`
    ORDER BY table_name
  `);
  console.log(tables.map(r => r.table_name));

  console.log('\n=== id_episodio_sifilis non-null count ===');
  const ep = await q(`
    SELECT
      COUNTIF(id_episodio_sifilis IS NOT NULL) AS com_episodio,
      COUNTIF(id_episodio_sifilis IS NULL)     AS sem_episodio
    FROM \`${DS}.sifilis_gestantes\`
  `);
  console.log(ep[0]);

  console.log('\n=== status_tratamento_dispensado distinct ===');
  const st = await q(`SELECT status_tratamento_dispensado, COUNT(*) as c FROM \`${DS}.sifilis_gestantes\` GROUP BY status_tratamento_dispensado ORDER BY c DESC`);
  console.log(JSON.stringify(st));

  console.log('\n=== vdrl_diagnostico_resultado distinct ===');
  const vd = await q(`SELECT vdrl_diagnostico_resultado, COUNT(*) as c FROM \`${DS}.sifilis_gestantes\` GROUP BY vdrl_diagnostico_resultado ORDER BY c DESC`);
  console.log(JSON.stringify(vd));

  console.log('\n=== sifilis_esquema_tratamento_parceiro distinct ===');
  const ep2 = await q(`SELECT sifilis_esquema_tratamento_parceiro, COUNT(*) as c FROM \`${DS}.sifilis_gestantes\` GROUP BY sifilis_esquema_tratamento_parceiro ORDER BY c DESC LIMIT 15`);
  console.log(JSON.stringify(ep2));

  console.log('\n=== sifilis_tratamento_de_parceiro distinct ===');
  const tp = await q(`SELECT sifilis_tratamento_de_parceiro, COUNT(*) as c FROM \`${DS}.sifilis_gestantes\` GROUP BY sifilis_tratamento_de_parceiro ORDER BY c DESC`);
  console.log(JSON.stringify(tp));

  console.log('\n=== Sample JOIN com linha_tempo (5 rows) ===');
  const join = await q(`
    SELECT
      lt.area_programatica AS ap,
      lt.unidade_cadastro  AS unidade,
      lt.equipe_nome       AS equipe,
      lt.nome,
      lt.IG_atual_semanas  AS ig,
      lt.dpp,
      lt.cid_alto_risco,
      sg.diagnostico_associado,
      sg.data_diagnostico_associado,
      sg.data_dispensacao_dose_1,
      sg.data_dispensacao_dose_2,
      sg.data_dispensacao_dose_3,
      sg.vdrl_diagnostico_resultado,
      sg.vdrl_acompanhamento_resultado,
      sg.sifilis_esquema_tratamento_parceiro,
      sg.sifilis_tratamento_de_parceiro,
      sg.status_tratamento_dispensado,
      sg.status_final_gestante,
      sg.id_episodio_sifilis,
      lt.fase_atual
    FROM \`${DS}.sifilis_gestantes\` sg
    JOIN \`${DS}.linha_tempo\` lt ON sg.id_gestacao = lt.id_gestacao
    WHERE lt.fase_atual = 'Gestação'
    LIMIT 5
  `);
  console.log(JSON.stringify(join, null, 2));

  console.log('\n=== Total JOIN fase Gestação ===');
  const totJoin = await q(`
    SELECT COUNT(*) as total
    FROM \`${DS}.sifilis_gestantes\` sg
    JOIN \`${DS}.linha_tempo\` lt ON sg.id_gestacao = lt.id_gestacao
    WHERE lt.fase_atual = 'Gestação'
  `);
  console.log(totJoin[0]);
}

main().catch(e => { console.error(e); process.exit(1); });
