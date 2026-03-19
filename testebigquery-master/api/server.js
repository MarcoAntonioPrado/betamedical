require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bigquery = require('./bigquery');

const app = express();
const PORT = process.env.PORT || 3000;
const DS = `${process.env.BIGQUERY_PROJECT_ID}.projeto_gestacoes`;

app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev
    'http://localhost:4173', // Vite preview
    'http://localhost:3000',
  ],
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Utilitário ───────────────────────────────────────────────────────────────
async function query(sql) {
  const [rows] = await bigquery.query({ query: sql });
  return rows;
}

// ── KPIs principais ──────────────────────────────────────────────────────────
app.get('/api/resumo', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        COUNT(*)                                             AS total_gestacoes,
        COUNTIF(fase_atual = 'Gestação')                    AS ativas,
        ROUND(AVG(idade_gestante), 1)                       AS media_idade,
        (SELECT COUNT(*) FROM \`${DS}.sifilis_gestantes\`)   AS com_sifilis,
        COUNTIF(hiv = 1)                                    AS com_hiv,
        COUNTIF(hipertensao_total > 0)                      AS com_hipertensao,
        COUNTIF(diabetes_total > 0)                         AS com_diabetes,
        COUNTIF(obito_indicador = TRUE)                     AS obitos,
        ROUND(AVG(total_consultas_prenatal), 1)             AS media_consultas,
        COUNTIF(mais_de_30_sem_atd = 'sim')                 AS sem_atd_30_dias
      FROM \`${DS}.linha_tempo\`
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Faixa etária ─────────────────────────────────────────────────────────────
app.get('/api/faixa-etaria', async (req, res) => {
  try {
    const rows = await query(`
      SELECT faixa_etaria AS faixa, COUNT(*) AS total
      FROM \`${DS}.linha_tempo\`
      WHERE faixa_etaria IS NOT NULL
      GROUP BY faixa_etaria
      ORDER BY faixa_etaria
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Raça / cor ───────────────────────────────────────────────────────────────
app.get('/api/raca', async (req, res) => {
  try {
    const rows = await query(`
      SELECT raca, COUNT(*) AS total
      FROM \`${DS}.linha_tempo\`
      WHERE raca IS NOT NULL
      GROUP BY raca
      ORDER BY total DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Fase atual da gestação ───────────────────────────────────────────────────
app.get('/api/fase-atual', async (req, res) => {
  try {
    const rows = await query(`
      SELECT fase_atual, COUNT(*) AS total
      FROM \`${DS}.gestacoes\`
      WHERE fase_atual IS NOT NULL
      GROUP BY fase_atual
      ORDER BY total DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Área Programática ────────────────────────────────────────────────────────
app.get('/api/area-programatica', async (req, res) => {
  try {
    const rows = await query(`
      SELECT area_programatica, COUNT(*) AS total
      FROM \`${DS}.linha_tempo\`
      WHERE area_programatica IS NOT NULL
      GROUP BY area_programatica
      ORDER BY total DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Condições de saúde ───────────────────────────────────────────────────────
app.get('/api/condicoes-saude', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        COUNTIF(hipertensao_total > 0)   AS hipertensao,
        COUNTIF(diabetes_total > 0)      AS diabetes,
        COUNTIF(sifilis = 1)             AS sifilis,
        COUNTIF(hiv = 1)                 AS hiv,
        COUNTIF(tuberculose = 1)         AS tuberculose,
        COUNTIF(tem_obesidade = 1)       AS obesidade,
        COUNTIF(obito_indicador = TRUE)  AS obito
      FROM \`${DS}.linha_tempo\`
    `);
    const r = rows[0];
    res.json([
      { label: 'Hipertensão',  total: Number(r.hipertensao) },
      { label: 'Diabetes',     total: Number(r.diabetes) },
      { label: 'Sífilis',      total: Number(r.sifilis) },
      { label: 'HIV',          total: Number(r.hiv) },
      { label: 'Tuberculose',  total: Number(r.tuberculose) },
      { label: 'Obesidade',    total: Number(r.obesidade) },
      { label: 'Óbito',        total: Number(r.obito) },
    ]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Categorias de risco ──────────────────────────────────────────────────────
app.get('/api/categorias-risco', async (req, res) => {
  try {
    const rows = await query(`
      SELECT categoria_risco, COUNT(*) AS total
      FROM \`${DS}.categorias_risco_desconcatenadas\`
      WHERE categoria_risco IS NOT NULL
      GROUP BY categoria_risco
      ORDER BY total DESC
      LIMIT 15
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Evolução mensal de gestações iniciadas ───────────────────────────────────
app.get('/api/evolucao-mensal', async (req, res) => {
  try {
    const rows = await query(`
      SELECT FORMAT_DATE('%Y-%m', data_inicio) AS mes, COUNT(*) AS total
      FROM \`${DS}.gestacoes\`
      WHERE data_inicio >= DATE_SUB(CURRENT_DATE(), INTERVAL 24 MONTH)
        AND data_inicio IS NOT NULL
      GROUP BY mes
      ORDER BY mes
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Tipo de parto ────────────────────────────────────────────────────────────
app.get('/api/tipo-parto', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        COALESCE(tipo_parto, 'Não informado') AS tipo,
        COUNT(*) AS total
      FROM \`${DS}.linha_tempo\`
      GROUP BY tipo
      ORDER BY total DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Consultas pré-natal: distribuição ───────────────────────────────────────
app.get('/api/consultas-prenatal', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        CASE
          WHEN total_consultas_prenatal = 0 THEN '0'
          WHEN total_consultas_prenatal BETWEEN 1 AND 3 THEN '1–3'
          WHEN total_consultas_prenatal BETWEEN 4 AND 6 THEN '4–6'
          WHEN total_consultas_prenatal BETWEEN 7 AND 9 THEN '7–9'
          ELSE '10+'
        END AS faixa_consultas,
        COUNT(*) AS total
      FROM \`${DS}.linha_tempo\`
      GROUP BY faixa_consultas
      ORDER BY faixa_consultas
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Status tratamento sífilis ────────────────────────────────────────────────
app.get('/api/sifilis', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        COALESCE(status_final_gestante, 'Não informado') AS status_gestante,
        COALESCE(status_parceiro, 'Não informado')       AS status_parceiro,
        COUNT(*) AS total
      FROM \`${DS}.sifilis_gestantes\`
      GROUP BY status_gestante, status_parceiro
      ORDER BY total DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Adequação AAS ────────────────────────────────────────────────────────────
app.get('/api/adequacao-aas', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        COALESCE(adequacao_aas_pe, 'Sem indicação') AS adequacao,
        COUNT(*) AS total
      FROM \`${DS}.linha_tempo\`
      GROUP BY adequacao
      ORDER BY total DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Encaminhamentos ──────────────────────────────────────────────────────────
app.get('/api/encaminhamentos', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        COALESCE(houve_encaminhamento, 'Não informado') AS houve,
        COUNT(*) AS total
      FROM \`${DS}.encaminhamentos\`
      GROUP BY houve
      ORDER BY total DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Motivos de emergência ─────────────────────────────────────────────────────
app.get('/api/motivos-emergencia', async (req, res) => {
  try {
    const rows = await query(`
      SELECT motivo_atendimento, COUNT(*) AS total
      FROM \`${DS}.consultas_emergenciais\`
      WHERE motivo_atendimento IS NOT NULL
      GROUP BY motivo_atendimento
      ORDER BY total DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Overview KPIs (Visão Geral) ───────────────────────────────────────────────
app.get('/api/overview-kpis', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        COUNTIF(fase_atual = 'Gestação')                                         AS em_acompanhamento,
        COUNTIF(fase_atual = 'Gestação' AND idade_gestante < 18)                 AS adolescentes,
        COUNTIF(fase_atual = 'Gestação' AND idade_gestante >= 35)                AS adultas_35_mais,
        ROUND(SAFE_DIVIDE(
          COUNTIF(fase_atual = 'Gestação' AND diabetes_total > 0),
          COUNTIF(fase_atual = 'Gestação')) * 100, 1)                            AS pct_diabetes,
        ROUND(SAFE_DIVIDE(
          COUNTIF(fase_atual = 'Gestação' AND hipertensao_total > 0),
          COUNTIF(fase_atual = 'Gestação')) * 100, 1)                            AS pct_hipertensao
      FROM \`${DS}.linha_tempo\`
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Prescrições (ácido fólico, carbonato de cálcio) ──────────────────────────
app.get('/api/prescricoes', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        ROUND(SAFE_DIVIDE(
          COUNTIF(fase_atual = 'Gestação' AND prescricao_acido_folico = 'sim'),
          COUNTIF(fase_atual = 'Gestação')) * 100, 2)  AS pct_acido_folico,
        ROUND(SAFE_DIVIDE(
          COUNTIF(fase_atual = 'Gestação' AND prescricao_carbonato_calcio = 'sim'),
          COUNTIF(fase_atual = 'Gestação')) * 100, 1)  AS pct_carbonato_calcio
      FROM \`${DS}.linha_tempo\`
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Saúde Bucal ───────────────────────────────────────────────────────────────
app.get('/api/saude-bucal', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        ROUND(SAFE_DIVIDE(
          COUNTIF(fase_atual = 'Gestação' AND total_consultas_saude_bucal > 0),
          COUNTIF(fase_atual = 'Gestação')) * 100, 2)  AS pct_consulta_bucal
      FROM \`${DS}.linha_tempo\`
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Vacina VSR (vírus sincicial respiratório) ─────────────────────────────────
app.get('/api/vacina-vsr', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        ROUND(SAFE_DIVIDE(
          COUNTIF(fase_atual = 'Gestação' AND vacina_sincicial_aplicada = 1),
          COUNTIF(fase_atual = 'Gestação')) * 100, 1)  AS pct_vacina_vsr
      FROM \`${DS}.linha_tempo\`
    `);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Trimestres das gestações ativas ───────────────────────────────────────────
app.get('/api/trimestres', async (req, res) => {
  try {
    const rows = await query(`
      SELECT trimestre, COUNT(*) AS total
      FROM \`${DS}.linha_tempo\`
      WHERE fase_atual = 'Gestação'
        AND trimestre IS NOT NULL
      GROUP BY trimestre
      ORDER BY trimestre
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Raça × Faixa Etária (cross-tab) ──────────────────────────────────────────
app.get('/api/raca-faixa-etaria', async (req, res) => {
  try {
    const rows = await query(`
      SELECT faixa_etaria, raca, COUNT(*) AS total
      FROM \`${DS}.linha_tempo\`
      WHERE faixa_etaria IS NOT NULL
        AND raca IS NOT NULL
        AND fase_atual = 'Gestação'
      GROUP BY faixa_etaria, raca
      ORDER BY faixa_etaria, raca
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Sífilis: KPIs principais ─────────────────────────────────────────────────
app.get('/api/sifilis-kpis', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        COUNT(DISTINCT id_gestacao)                                          AS total,
        COUNTIF(diagnostico_associado = 'Sim')                              AS com_diagnostico,
        COUNTIF(diagnostico_associado = 'Não')                              AS sem_diagnostico,
        COUNTIF(vdrl_diagnostico_resultado IS NOT NULL)                     AS vdrl_diagnostico,
        COUNTIF(vdrl_acompanhamento_resultado IS NOT NULL)                  AS vdrl_acompanhamento,
        COUNTIF(status_tratamento_dispensado = 'Completo (3+ doses)')       AS tx_gestante_completo,
        COUNTIF(sifilis_tratamento_de_parceiro = 'Efetuado')                AS tx_parceria_efetuado
      FROM \`${DS}.sifilis_gestantes\`
    `);
    const r = rows[0];
    const tot = Number(r.total);
    res.json({
      total:               tot,
      com_diagnostico:     Number(r.com_diagnostico),
      sem_diagnostico:     Number(r.sem_diagnostico),
      vdrl_diagnostico:    Number(r.vdrl_diagnostico),
      vdrl_acompanhamento: Number(r.vdrl_acompanhamento),
      tx_gestante_completo:     Number(r.tx_gestante_completo),
      pct_tx_gestante:          tot > 0 ? +(Number(r.tx_gestante_completo) / tot * 100).toFixed(1) : 0,
      tx_parceria_efetuado:     Number(r.tx_parceria_efetuado),
      pct_tx_parceria:          tot > 0 ? +(Number(r.tx_parceria_efetuado) / tot * 100).toFixed(1) : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Sífilis: Trimestre do início do tratamento ────────────────────────────────
app.get('/api/sifilis-trimestre', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        CASE
          WHEN ig_inicio_tratamento_semanas <= 12 THEN '1º trimestre'
          WHEN ig_inicio_tratamento_semanas <= 27 THEN '2º trimestre'
          ELSE '3º trimestre'
        END AS trimestre,
        COUNT(*) AS total
      FROM \`${DS}.sifilis_gestantes\`
      WHERE ig_inicio_tratamento_semanas IS NOT NULL
      GROUP BY trimestre
      ORDER BY trimestre
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Sífilis: Status do tratamento no PEP ─────────────────────────────────────
app.get('/api/sifilis-status-tratamento', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        CASE
          WHEN status_tratamento_dispensado = 'Completo (3+ doses)'        THEN 'Adequado'
          WHEN status_tratamento_dispensado LIKE 'Em curso%'                THEN 'Em tratamento'
          ELSE 'Inadequado'
        END AS status_pep,
        COUNT(*) AS total
      FROM \`${DS}.sifilis_gestantes\`
      GROUP BY status_pep
      ORDER BY total DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Sífilis: Raça/cor ─────────────────────────────────────────────────────────
app.get('/api/sifilis-raca', async (req, res) => {
  try {
    const rows = await query(`
      SELECT lt.raca, COUNT(*) AS total
      FROM \`${DS}.sifilis_gestantes\` sg
      JOIN \`${DS}.linha_tempo\` lt ON sg.id_gestacao = lt.id_gestacao
      WHERE lt.raca IS NOT NULL
      GROUP BY lt.raca
      ORDER BY total DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Sífilis: Distribuição por AP ──────────────────────────────────────────────
app.get('/api/sifilis-ap', async (req, res) => {
  try {
    const rows = await query(`
      SELECT lt.area_programatica AS ap, COUNT(*) AS total
      FROM \`${DS}.sifilis_gestantes\` sg
      JOIN \`${DS}.linha_tempo\` lt ON sg.id_gestacao = lt.id_gestacao
      WHERE lt.area_programatica IS NOT NULL
      GROUP BY lt.area_programatica
      ORDER BY CAST(lt.area_programatica AS INT64)
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── HAS / Hipertensão ────────────────────────────────────────────────────────
app.get('/api/has-kpis', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        -- totais
        COUNTIF(hipertensao_total > 0)                                              AS cid_ativo,
        COUNTIF(provavel_hipertensa_sem_diagnostico = 1)                            AS provavel_has,
        -- CID ativo: metricas operacionais
        COUNTIF(hipertensao_total > 0 AND tem_encaminhamento_has = 1)               AS com_encaminhamento,
        COUNTIF(hipertensao_total > 0 AND tem_aparelho_pa_dispensado = 1)           AS com_aparelho_pa,
        COUNTIF(hipertensao_total > 0 AND mais_de_30_sem_atd = 'sim')               AS sem_atd_30_dias,
        -- PA controlada (CID ativo com medicao)
        COUNTIF(hipertensao_total > 0 AND ultima_pa_controlada = 1)                 AS pa_controlada,
        COUNTIF(hipertensao_total > 0 AND ultima_pa_controlada = 0)                 AS pa_alterada,
        -- Prescricoes (CID ativo)
        COUNTIF(hipertensao_total > 0 AND prescricao_carbonato_calcio = 'sim')      AS carbonato_calcio,
        COUNTIF(hipertensao_total > 0 AND tem_prescricao_aas = 1)                   AS aas,
        -- Provavel HAS: metricas de alerta
        COUNTIF(provavel_hipertensa_sem_diagnostico = 1 AND tem_anti_hipertensivo = 1)      AS anti_hipertensivo,
        COUNTIF(provavel_hipertensa_sem_diagnostico = 1 AND tem_encaminhamento_has = 1)     AS encaminhada_ar,
        COUNTIF(provavel_hipertensa_sem_diagnostico = 1 AND tem_aparelho_pa_dispensado = 1) AS aparelho_pa_prov,
        COUNTIF(provavel_hipertensa_sem_diagnostico = 1 AND qtd_pas_alteradas >= 2)         AS duas_pa_alt,
        COUNTIF(provavel_hipertensa_sem_diagnostico = 1 AND teve_pa_grave = 1)              AS pa_grave
      FROM \`${DS}.linha_tempo\`
      WHERE fase_atual = 'Gestação'
        AND (hipertensao_total > 0 OR provavel_hipertensa_sem_diagnostico = 1)
    `);
    const r = rows[0];
    const total = Number(r.cid_ativo) + Number(r.provavel_has);
    const paTotal = Number(r.pa_controlada) + Number(r.pa_alterada);
    const cidAtivo = Number(r.cid_ativo);
    res.json({
      ...r,
      total,
      pct_pa_controlada: paTotal > 0 ? ((r.pa_controlada / paTotal) * 100).toFixed(1) : '0.0',
      pct_pa_alterada:   paTotal > 0 ? ((r.pa_alterada   / paTotal) * 100).toFixed(1) : '0.0',
      pct_carbonato:     cidAtivo > 0 ? ((r.carbonato_calcio / cidAtivo) * 100).toFixed(1) : '0.0',
      pct_aas:           cidAtivo > 0 ? ((r.aas             / cidAtivo) * 100).toFixed(1) : '0.0',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/has-ap', async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        area_programatica AS ap,
        COUNTIF(hipertensao_total > 0)                   AS cid_ativo,
        COUNTIF(provavel_hipertensa_sem_diagnostico = 1) AS provavel_has
      FROM \`${DS}.linha_tempo\`
      WHERE fase_atual = 'Gestação'
        AND area_programatica IS NOT NULL
        AND (hipertensao_total > 0 OR provavel_hipertensa_sem_diagnostico = 1)
      GROUP BY area_programatica
      ORDER BY CAST(area_programatica AS FLOAT64)
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── HAS Listagem ─────────────────────────────────────────────────────────────
app.get('/api/has-listagem-filters', async (req, res) => {
  try {
    const base = `FROM \`${DS}.linha_tempo\` WHERE fase_atual = 'Gesta\u00e7\u00e3o' AND (hipertensao_total > 0 OR provavel_hipertensa_sem_diagnostico = 1)`;
    const [aps, unidades, equipes] = await Promise.all([
      query(`SELECT DISTINCT area_programatica AS v ${base} AND area_programatica IS NOT NULL ORDER BY CAST(area_programatica AS FLOAT64)`),
      query(`SELECT DISTINCT unidade_cadastro AS v ${base} AND unidade_cadastro IS NOT NULL ORDER BY unidade_cadastro LIMIT 400`),
      query(`SELECT DISTINCT equipe_nome AS v ${base} AND equipe_nome IS NOT NULL ORDER BY equipe_nome LIMIT 400`),
    ]);
    res.json({ aps: aps.map(r => r.v), unidades: unidades.map(r => r.v), equipes: equipes.map(r => r.v) });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/has-listagem', async (req, res) => {
  try {
    const { ap, unidade, equipe, nome, status_has, encaminhada, prescricao_aas, anti_hipertensivo, aparelho_pa, page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conds = [`fase_atual = 'Gesta\u00e7\u00e3o'`, `(hipertensao_total > 0 OR provavel_hipertensa_sem_diagnostico = 1)`];
    if (ap)               conds.push(`area_programatica = '${ap.replace(/'/g,"''")}'`);
    if (unidade)          conds.push(`unidade_cadastro = '${unidade.replace(/'/g,"''")}'`);
    if (equipe)           conds.push(`equipe_nome = '${equipe.replace(/'/g,"''")}'`);
    if (nome)             conds.push(`LOWER(nome) LIKE LOWER('%${nome.replace(/'/g,"''").replace(/%/g,"\\%")}%')`);
    if (status_has === 'cid')      conds.push(`hipertensao_total > 0`);
    if (status_has === 'provavel') conds.push(`provavel_hipertensa_sem_diagnostico = 1`);
    if (encaminhada === 'sim')  conds.push(`tem_encaminhamento_has = 1`);
    if (encaminhada === 'nao')  conds.push(`tem_encaminhamento_has = 0`);
    if (prescricao_aas === 'sim') conds.push(`tem_prescricao_aas = 1`);
    if (prescricao_aas === 'nao') conds.push(`tem_prescricao_aas = 0`);
    if (anti_hipertensivo === 'sim') conds.push(`tem_anti_hipertensivo = 1`);
    if (anti_hipertensivo === 'nao') conds.push(`tem_anti_hipertensivo = 0`);
    if (aparelho_pa === 'sim') conds.push(`tem_aparelho_pa_dispensado = 1`);
    if (aparelho_pa === 'nao') conds.push(`tem_aparelho_pa_dispensado = 0`);
    const where = `WHERE ${conds.join(' AND ')}`;
    const [totRows, rows] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM \`${DS}.linha_tempo\` ${where}`),
      query(`
        SELECT
          area_programatica AS ap, unidade_cadastro AS unidade, equipe_nome AS equipe,
          nome, idade_gestante AS idade, IG_atual_semanas AS ig,
          hipertensao_total, provavel_hipertensa_sem_diagnostico,
          tem_encaminhamento_has, tem_prescricao_aas,
          prescricao_carbonato_calcio, prescricao_acido_folico,
          tem_aparelho_pa_dispensado, tem_anti_hipertensivo,
          max_pressao_sistolica AS pas_max, max_pressao_diastolica AS pad_max,
          ultima_pa_controlada, teve_pa_grave, mais_de_30_sem_atd,
          dpp
        FROM \`${DS}.linha_tempo\` ${where}
        ORDER BY nome
        LIMIT ${Number(limit)} OFFSET ${offset}
      `),
    ]);
    res.json({ total: Number(totRows[0].total), page: Number(page), limit: Number(limit), rows });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ── Alto Risco: KPIs dashboard ──────────────────────────────────────────────
app.get('/api/alto-risco-kpis', async (req, res) => {
  try {
    const base = `WHERE categorias_risco IS NOT NULL AND categorias_risco != ''`;
    const [kpiRows, catRows, apRows] = await Promise.all([
      query(`
        SELECT
          COUNT(*)                                                     AS total,
          COUNTIF(houve_encaminhamento = 'Sim')                        AS encaminhada_sim,
          COUNTIF(COALESCE(houve_encaminhamento,'') != 'Sim')          AS encaminhada_nao,
          COUNTIF(REGEXP_CONTAINS(COALESCE(deve_encaminhar,''),'Sim')) AS deve_sim
        FROM \`${DS}.linha_tempo\` ${base}
      `),
      query(`
        SELECT categoria_risco, COUNT(*) AS n
        FROM \`${DS}.categorias_risco_desconcatenadas\`
        WHERE categoria_risco IS NOT NULL
        GROUP BY categoria_risco ORDER BY n DESC LIMIT 10
      `),
      query(`
        SELECT area_programatica AS ap, COUNT(*) AS n
        FROM \`${DS}.linha_tempo\` ${base}
        AND area_programatica IS NOT NULL
        GROUP BY area_programatica
        ORDER BY CAST(area_programatica AS FLOAT64)
      `),
    ]);
    const r = kpiRows[0];
    const total = Number(r.total);
    const enc   = Number(r.encaminhada_sim);
    const deve  = Number(r.deve_sim);
    res.json({
      total,
      encaminhada_sim: enc,
      encaminhada_nao: Number(r.encaminhada_nao),
      pct_enc: total > 0 ? ((enc / total) * 100).toFixed(1) : '0.0',
      deve_sim: deve,
      pendente: Math.max(0, deve - enc),
      categorias: catRows,
      por_ap: apRows,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ── Alto Risco: filtros ───────────────────────────────────────────────────────
app.get('/api/alto-risco-filters', async (req, res) => {
  try {
    const [aps, unidades, equipes, categorias] = await Promise.all([
      query(`
        SELECT DISTINCT area_programatica AS v FROM \`${DS}.linha_tempo\`
        WHERE area_programatica IS NOT NULL AND categorias_risco IS NOT NULL AND categorias_risco != ''
        ORDER BY CAST(area_programatica AS FLOAT64)
      `),
      query(`
        SELECT DISTINCT unidade_cadastro AS v FROM \`${DS}.linha_tempo\`
        WHERE unidade_cadastro IS NOT NULL AND categorias_risco IS NOT NULL AND categorias_risco != ''
        ORDER BY unidade_cadastro LIMIT 400
      `),
      query(`
        SELECT DISTINCT equipe_nome AS v FROM \`${DS}.linha_tempo\`
        WHERE equipe_nome IS NOT NULL AND categorias_risco IS NOT NULL AND categorias_risco != ''
        ORDER BY equipe_nome LIMIT 400
      `),
      query(`
        SELECT DISTINCT categoria_risco AS v FROM \`${DS}.categorias_risco_desconcatenadas\`
        WHERE categoria_risco IS NOT NULL ORDER BY categoria_risco
      `),
    ]);
    res.json({
      aps:       aps.map(r => r.v),
      unidades:  unidades.map(r => r.v),
      equipes:   equipes.map(r => r.v),
      categorias: categorias.map(r => r.v),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Alto Risco: tabela paginada ───────────────────────────────────────────────
app.get('/api/alto-risco', async (req, res) => {
  try {
    const {
      ap, unidade, equipe, nome, categoria,
      deve_encaminhar, encaminhada, cpf,
      page = '1', limit = '100',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 100));
    const offset   = (pageNum - 1) * limitNum;

    // Sanitize text inputs (strip SQL special chars)
    const sanitize = (s) => s ? String(s).replace(/['"\\;%_]/g, '') : null;

    const conditions = ["(lt.categorias_risco IS NOT NULL AND lt.categorias_risco != '')"];
    const params = {};

    if (ap) { conditions.push('lt.area_programatica = @ap'); params.ap = ap; }
    if (unidade) { conditions.push('lt.unidade_cadastro = @unidade'); params.unidade = unidade; }
    if (equipe)  { conditions.push('lt.equipe_nome = @equipe');       params.equipe  = equipe; }
    if (nome) {
      const s = sanitize(nome);
      if (s) { conditions.push('LOWER(lt.nome) LIKE @nome'); params.nome = `%${s.toLowerCase()}%`; }
    }
    if (cpf) {
      const s = sanitize(cpf);
      if (s) { conditions.push('LOWER(lt.cpf) LIKE @cpf'); params.cpf = `%${s}%`; }
    }
    if (categoria) {
      conditions.push(`EXISTS(
        SELECT 1 FROM \`${DS}.categorias_risco_desconcatenadas\` crd
        WHERE crd.id_gestacao = lt.id_gestacao AND crd.categoria_risco = @categoria
      )`);
      params.categoria = categoria;
    }
    if (deve_encaminhar && deve_encaminhar !== 'Todos') {
      conditions.push('REGEXP_CONTAINS(COALESCE(lt.deve_encaminhar, \'\'), @deve_enc)');
      params.deve_enc = deve_encaminhar;
    }
    if (encaminhada && encaminhada !== 'Todos') {
      conditions.push('lt.houve_encaminhamento = @encaminhada');
      params.encaminhada = encaminhada;
    }

    const where = conditions.join(' AND ');

    const countSql = `SELECT COUNT(*) AS total FROM \`${DS}.linha_tempo\` lt WHERE ${where}`;
    const dataSql  = `
      SELECT
        lt.area_programatica      AS ap,
        lt.unidade_cadastro       AS unidade,
        lt.equipe_nome            AS equipe,
        lt.nome,
        lt.cpf,
        lt.idade_gestante         AS idade,
        lt.IG_atual_semanas       AS ig,
        lt.categorias_risco       AS categoria_risco,
        lt.deve_encaminhar,
        lt.houve_encaminhamento   AS encaminhada,
        lt.origem_encaminhamento  AS origem,
        lt.ser_estado_solicitacao AS status_sisreg,
        lt.ser_recurso_solicitado AS procedimento_sisreg
      FROM \`${DS}.linha_tempo\` lt
      WHERE ${where}
      ORDER BY lt.nome
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [[countRows], [dataRows]] = await Promise.all([
      bigquery.query({ query: countSql, params }),
      bigquery.query({ query: dataSql,  params }),
    ]);

    const total = Number(countRows[0].total);
    res.json({
      rows:  dataRows,
      total,
      page:  pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Sífilis: Listagem nominal – filtros ──────────────────────────────────────
app.get('/api/sifilis-listagem-filters', async (req, res) => {
  try {
    const [aps, unidades, equipes, statusList] = await Promise.all([
      query(`
        SELECT DISTINCT lt.area_programatica AS v
        FROM \`${DS}.sifilis_gestantes\` sg
        JOIN \`${DS}.linha_tempo\` lt ON sg.id_gestacao = lt.id_gestacao
        WHERE lt.area_programatica IS NOT NULL
        ORDER BY CAST(v AS FLOAT64)
      `),
      query(`
        SELECT DISTINCT lt.unidade_cadastro AS v
        FROM \`${DS}.sifilis_gestantes\` sg
        JOIN \`${DS}.linha_tempo\` lt ON sg.id_gestacao = lt.id_gestacao
        WHERE lt.unidade_cadastro IS NOT NULL
        ORDER BY v LIMIT 400
      `),
      query(`
        SELECT DISTINCT lt.equipe_nome AS v
        FROM \`${DS}.sifilis_gestantes\` sg
        JOIN \`${DS}.linha_tempo\` lt ON sg.id_gestacao = lt.id_gestacao
        WHERE lt.equipe_nome IS NOT NULL
        ORDER BY v LIMIT 400
      `),
      query(`
        SELECT DISTINCT status_tratamento_dispensado AS v
        FROM \`${DS}.sifilis_gestantes\`
        WHERE status_tratamento_dispensado IS NOT NULL
        ORDER BY v
      `),
    ]);
    res.json({
      aps:       aps.map(r => r.v),
      unidades:  unidades.map(r => r.v),
      equipes:   equipes.map(r => r.v),
      statusList: statusList.map(r => r.v),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Sífilis: Listagem nominal paginada ────────────────────────────────────────
app.get('/api/sifilis-listagem', async (req, res) => {
  try {
    const {
      ap, unidade, equipe, nome, cid_ativo, notificada, status_tx,
      tab, // 'em-dia' | 'janela' | 'atrasado'
      page = '1', limit = '100',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 100));
    const offset   = (pageNum - 1) * limitNum;

    const sanitize = s => s ? String(s).replace(/['"\\;%]/g, '') : null;

    const conditions = ['1=1'];
    const params = {};

    if (ap)      { conditions.push('lt.area_programatica = @ap');      params.ap = ap; }
    if (unidade) { conditions.push('lt.unidade_cadastro = @unidade');  params.unidade = unidade; }
    if (equipe)  { conditions.push('lt.equipe_nome = @equipe');        params.equipe = equipe; }
    if (nome) {
      const s = sanitize(nome);
      if (s) { conditions.push('LOWER(lt.nome) LIKE @nome'); params.nome = `%${s.toLowerCase()}%`; }
    }
    if (cid_ativo === 'Sim') { conditions.push("sg.diagnostico_associado = 'Sim'"); }
    if (cid_ativo === 'Não') { conditions.push("sg.diagnostico_associado = 'Não'"); }
    if (notificada === 'Sim') { conditions.push('sg.id_episodio_sifilis IS NOT NULL'); }
    if (notificada === 'Não') { conditions.push('sg.id_episodio_sifilis IS NULL'); }
    if (status_tx) { conditions.push('sg.status_tratamento_dispensado = @status_tx'); params.status_tx = status_tx; }

    // Tab filter
    if (tab === 'em-dia') {
      conditions.push("sg.status_final_gestante = 'Cuidado Adequado (Gestante)'");
    } else if (tab === 'janela') {
      conditions.push("sg.status_final_gestante = 'ACOMPANHAR: Tratamento em Curso'");
    } else if (tab === 'atrasado') {
      conditions.push("sg.status_final_gestante NOT IN ('Cuidado Adequado (Gestante)', 'ACOMPANHAR: Tratamento em Curso')");
    }

    const where = conditions.join(' AND ');

    const base = `
      FROM \`${DS}.sifilis_gestantes\` sg
      JOIN \`${DS}.linha_tempo\` lt ON sg.id_gestacao = lt.id_gestacao
      WHERE ${where}
    `;

    const countSql = `SELECT COUNT(*) AS total ${base}`;
    const dataSql  = `
      SELECT
        lt.area_programatica             AS ap,
        lt.unidade_cadastro              AS unidade,
        lt.equipe_nome                   AS equipe,
        lt.nome,
        lt.IG_atual_semanas              AS ig,
        lt.dpp,
        sg.diagnostico_associado         AS cid_ativo,
        sg.data_diagnostico_associado    AS data_diagnostico,
        sg.data_dispensacao_dose_1       AS d1,
        sg.data_dispensacao_dose_2       AS d2,
        sg.data_dispensacao_dose_3       AS d3,
        lt.dpp                           AS dpp,
        sg.vdrl_diagnostico_resultado    AS vdrl_diag,
        sg.vdrl_acompanhamento_resultado AS vdrl_acomp,
        sg.sifilis_esquema_tratamento_parceiro AS esquema_parceria,
        sg.sifilis_tratamento_de_parceiro      AS trat_parceiro,
        CASE
          WHEN sg.id_episodio_sifilis IS NOT NULL THEN 'SIM'
          ELSE 'NOTIFICAR!'
        END                              AS notificada,
        sg.status_tratamento_dispensado  AS status_tx,
        sg.status_final_gestante         AS status_final,
        sg.numero_doses_dispensadas      AS num_doses
      ${base}
      ORDER BY lt.nome
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [[countRows], [dataRows]] = await Promise.all([
      bigquery.query({ query: countSql, params }),
      bigquery.query({ query: dataSql,  params }),
    ]);

    const total = Number(countRows[0].total);
    res.json({
      rows:  dataRows,
      total,
      page:  pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── Gestantes: Listagem Nominal ──────────────────────────────────────────────
app.get('/api/gestantes-listagem-filters', async (req, res) => {
  try {
    const base = `FROM \`${DS}.linha_tempo\` WHERE fase_atual = 'Gesta\u00e7\u00e3o'`;
    const [aps, unidades, equipes, categorias] = await Promise.all([
      query(`SELECT DISTINCT area_programatica AS v ${base} AND area_programatica IS NOT NULL ORDER BY CAST(area_programatica AS FLOAT64)`),
      query(`SELECT DISTINCT unidade_cadastro AS v ${base} AND unidade_cadastro IS NOT NULL ORDER BY unidade_cadastro LIMIT 500`),
      query(`SELECT DISTINCT equipe_nome AS v ${base} AND equipe_nome IS NOT NULL ORDER BY equipe_nome LIMIT 500`),
      query(`SELECT DISTINCT categoria_risco AS v FROM \`${DS}.categorias_risco_desconcatenadas\` WHERE categoria_risco IS NOT NULL ORDER BY categoria_risco`),
    ]);
    res.json({
      aps: aps.map(r => r.v),
      unidades: unidades.map(r => r.v),
      equipes: equipes.map(r => r.v),
      categorias: categorias.map(r => r.v),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/gestantes-listagem', async (req, res) => {
  try {
    const { ap, unidade, equipe, nome, categoria, acido_folico, carbonato_calcio, aas, page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conds = [`lt.fase_atual = 'Gesta\u00e7\u00e3o'`];
    if (ap)       conds.push(`lt.area_programatica = '${ap.replace(/'/g,"''")}'`);
    if (unidade)  conds.push(`lt.unidade_cadastro = '${unidade.replace(/'/g,"''")}'`);
    if (equipe)   conds.push(`lt.equipe_nome = '${equipe.replace(/'/g,"''")}'`);
    if (nome)     conds.push(`LOWER(lt.nome) LIKE LOWER('%${nome.replace(/'/g,"''").replace(/%/g,'').replace(/_/g,'')}%')`);
    if (categoria) conds.push(`EXISTS(SELECT 1 FROM \`${DS}.categorias_risco_desconcatenadas\` crd WHERE crd.id_gestacao = lt.id_gestacao AND crd.categoria_risco = '${categoria.replace(/'/g,"''")}')`);
    if (acido_folico === 'sim') conds.push(`lt.prescricao_acido_folico = 'sim'`);
    if (acido_folico === 'nao') conds.push(`lt.prescricao_acido_folico != 'sim'`);
    if (carbonato_calcio === 'sim') conds.push(`lt.prescricao_carbonato_calcio = 'sim'`);
    if (carbonato_calcio === 'nao') conds.push(`lt.prescricao_carbonato_calcio != 'sim'`);
    if (aas === 'sim') conds.push(`lt.tem_prescricao_aas = 1`);
    if (aas === 'nao') conds.push(`lt.tem_prescricao_aas = 0`);
    const where = `WHERE ${conds.join(' AND ')}`;
    const [totRows, rows] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM \`${DS}.linha_tempo\` lt ${where}`),
      query(`
        SELECT
          lt.area_programatica AS ap, lt.unidade_cadastro AS unidade, lt.equipe_nome AS equipe,
          lt.nome, lt.idade_gestante AS idade, lt.IG_atual_semanas AS ig,
          lt.mais_de_30_sem_atd, lt.dias_desde_ultima_consulta,
          lt.categorias_risco, lt.deve_encaminhar,
          lt.max_pressao_sistolica AS pas_max, lt.max_pressao_diastolica AS pad_max,
          lt.prescricao_acido_folico, lt.prescricao_carbonato_calcio, lt.tem_prescricao_aas,
          lt.total_visitas_acs, lt.total_consultas_prenatal, lt.total_consultas_saude_bucal,
          lt.Urg_Emrg AS atd_emergencia, lt.dpp
        FROM \`${DS}.linha_tempo\` lt ${where}
        ORDER BY lt.nome
        LIMIT ${Number(limit)} OFFSET ${offset}
      `),
    ]);
    res.json({ total: Number(totRows[0].total), page: Number(page), limit: Number(limit), rows });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ── Root ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
