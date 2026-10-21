import { pool } from "./db.js";

async function testarConexao() {
    try {
        const [rows] = await pool.query(`
      SELECT
        DATABASE() AS banco,
        VERSION() AS versao,
        1 AS teste
    `);

        console.log("✅ Conexão realizada com sucesso!");
        console.log("Banco:", rows[0].banco);
        console.log("Versão MySQL:", rows[0].versao);
        console.log("Teste:", rows[0].teste);
    } catch (erro) {
        console.error("❌ Erro ao conectar:");
        console.error("Código:", erro.code);
        console.error("Mensagem:", erro.message);
    } finally {
        await pool.end();
    }
}

testarConexao();
