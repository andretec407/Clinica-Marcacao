import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname, join } from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";
import { pool } from "./db.js";
import {
    auth,
    requireRole,
    signToken,
    comparePassword,
    hashPassword,
} from "./auth.js";
import {
    createTicket,
    callNext,
    repeatCall,
    startTicket,
    finishTicket,
    getQueue,
} from "./queue.js";
import * as report from "./reports.js";

const app = express();

const uploadDir = join(process.cwd(), "uploads", "medical-orders");

mkdirSync(uploadDir, { recursive: true });

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
            const extension = extname(file.originalname).toLowerCase();
            cb(null, `${randomUUID()}${extension}`);
        },
    }),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const allowed = [".pdf", ".png", ".jpg", ".jpeg"];
        const extension = extname(file.originalname).toLowerCase();

        if (!allowed.includes(extension)) {
            return cb(new Error("Envie um pedido médico em PDF ou imagem."));
        }

        cb(null, true);
    },
});

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5174" }));
app.use(express.json({ limit: "100kb" }));
app.use(morgan("combined"));

// Verificação da API e do banco de dados
app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({
            status: "ok",
            database: "online",
            time: new Date().toISOString(),
        });
    } catch {
        res.status(503).json({
            status: "degraded",
            database: "offline",
        });
    }
});

// Cadastro de pacientes
app.post("/api/auth/register", async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const {
            fullName,
            cpf,
            birthDate,
            email,
            phone,
            password,
            paymentType = "PARTICULAR",
        } = req.body || {};

        if (
            typeof fullName !== "string" ||
            !fullName.trim() ||
            typeof cpf !== "string" ||
            !cpf.trim() ||
            typeof birthDate !== "string" ||
            !birthDate ||
            typeof email !== "string" ||
            !email.trim() ||
            typeof phone !== "string" ||
            !phone.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            return res.status(400).json({
                message: "Preencha todos os campos obrigatórios.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "A senha deve ter pelo menos 8 caracteres.",
            });
        }

        if (!["PARTICULAR", "CONVENIO"].includes(paymentType)) {
            return res.status(400).json({
                message: "Tipo de pagamento inválido.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedCpf = cpf.trim();
        const normalizedName = fullName.trim();
        const normalizedPhone = phone.trim();

        if (
            normalizedName.length > 120 ||
            normalizedEmail.length > 180 ||
            normalizedCpf.length > 14 ||
            normalizedPhone.length > 25
        ) {
            return res.status(400).json({
                message: "Um ou mais campos excedem o tamanho permitido.",
            });
        }

        // Validar formato da data e impedir datas inexistentes ou futuras
        const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);

        if (!dateMatch) {
            return res.status(400).json({
                message: "Informe uma data de nascimento válida.",
            });
        }

        const year = Number(dateMatch[1]);
        const month = Number(dateMatch[2]);
        const day = Number(dateMatch[3]);
        const birth = new Date(Date.UTC(year, month - 1, day));
        const today = new Date();
        const todayUTC = new Date(
            Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
        );

        if (
            birth.getUTCFullYear() !== year ||
            birth.getUTCMonth() !== month - 1 ||
            birth.getUTCDate() !== day ||
            birth > todayUTC
        ) {
            return res.status(400).json({
                message: "Informe uma data de nascimento válida.",
            });
        }

        connection = await pool.getConnection();

        // Verificar se o e-mail já existe
        const [existingEmail] = await connection.query(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [normalizedEmail],
        );

        if (existingEmail.length > 0) {
            return res.status(409).json({
                message: "Este e-mail já está cadastrado.",
            });
        }

        // Verificar se o CPF já existe
        const [existingCpf] = await connection.query(
            "SELECT user_id FROM patients WHERE cpf = ? LIMIT 1",
            [normalizedCpf],
        );

        if (existingCpf.length > 0) {
            return res.status(409).json({
                message: "Este CPF já está cadastrado.",
            });
        }

        const { randomUUID } = await import("node:crypto");
        const id = randomUUID();
        const passwordHash = await hashPassword(password);

        // Criar usuário e paciente na mesma transação
        await connection.beginTransaction();
        transactionStarted = true;

        await connection.query(
            `INSERT INTO users
                (id, name, email, password_hash, role)
             VALUES (?, ?, ?, ?, 'PACIENTE')`,
            [id, normalizedName, normalizedEmail, passwordHash],
        );

        await connection.query(
            `INSERT INTO patients
                (user_id, cpf, birth_date, phone, payment_type)
             VALUES (?, ?, ?, ?, ?)`,
            [id, normalizedCpf, birthDate, normalizedPhone, paymentType],
        );

        await connection.commit();
        transactionStarted = false;

        const user = {
            id,
            name: normalizedName,
            email: normalizedEmail,
            role: "PACIENTE",
        };

        return res.status(201).json({
            message: "Paciente cadastrado com sucesso.",
            token: signToken(user),
            user,
        });
    } catch (error) {
        if (connection && transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Erro ao desfazer cadastro:", rollbackError);
            }
        }

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Este e-mail ou CPF já está cadastrado.",
            });
        }

        console.error("Erro ao cadastrar paciente:", error);

        return res.status(500).json({
            message: "Erro interno ao cadastrar paciente.",
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Login
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                message: "E-mail e senha são obrigatórios.",
            });
        }

        const [[user]] = await pool.query(
            "SELECT * FROM users WHERE email=? AND active=1",
            [email.trim().toLowerCase()],
        );

        if (!user || !(await comparePassword(password, user.password_hash))) {
            return res.status(401).json({
                message: "Credenciais inválidas.",
            });
        }

        res.json({
            token: signToken(user),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (e) {
        console.error("Erro ao autenticar:", e);
        res.status(500).json({
            message: "Erro ao autenticar.",
        });
    }
});

// Emissão de senhas
app.post("/api/tickets", async (req, res) => {
    try {
        const ticket = await createTicket(req.body?.type);
        res.status(201).json({ ticket });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
});

// Consulta da fila
app.get("/api/queue", async (req, res) => {
    try {
        res.json(await getQueue());
    } catch (e) {
        res.status(503).json({
            message: "Fila indisponível.",
            detail: e.message,
        });
    }
});

// Chamar próxima senha
app.post(
    "/api/calls/next",
    auth,
    requireRole("ATENDENTE"),
    async (req, res) => {
        try {
            res.json({
                ticket: await callNext(req.user.sub, Number(req.body?.counter)),
            });
        } catch (e) {
            res.status(409).json({ message: e.message });
        }
    },
);

// Repetir chamada
app.post(
    "/api/calls/:id/repeat",
    auth,
    requireRole("ATENDENTE"),
    async (req, res) => {
        try {
            res.json({
                ticket: await repeatCall(req.user.sub, req.params.id),
            });
        } catch (e) {
            res.status(409).json({ message: e.message });
        }
    },
);

// Iniciar atendimento de senha
app.post(
    "/api/tickets/:id/start",
    auth,
    requireRole("ATENDENTE"),
    async (req, res) => {
        try {
            res.json({
                ticket: await startTicket(req.user.sub, req.params.id),
            });
        } catch (e) {
            res.status(409).json({ message: e.message });
        }
    },
);

// Finalizar atendimento de senha
app.post(
    "/api/tickets/:id/finish",
    auth,
    requireRole("ATENDENTE"),
    async (req, res) => {
        try {
            res.json({
                ticket: await finishTicket(req.user.sub, req.params.id),
            });
        } catch (e) {
            res.status(409).json({ message: e.message });
        }
    },
);

// Resumo dos relatórios
app.get(
    "/api/reports/summary",
    auth,
    requireRole("ATENDENTE"),
    async (req, res) => {
        try {
            res.json(
                await report.summary(
                    req.query.period === "month" ? "month" : "day",
                ),
            );
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    },
);

// Relatório de senhas
app.get(
    "/api/reports/tickets",
    auth,
    requireRole("ATENDENTE"),
    async (req, res) => {
        try {
            res.json({ tickets: await report.tickets() });
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    },
);

// Auditoria
app.get(
    "/api/reports/audit",
    auth,
    requireRole("ATENDENTE"),
    async (req, res) => {
        try {
            res.json({ audit: await report.audit() });
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    },
);

// Listar usuários
app.get("/api/users", auth, requireRole("ATENDENTE"), async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT id, name, email, role, active, created_at
                 FROM users
                 ORDER BY name`,
        );

        res.json({ users });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Criar usuário atendente
app.post("/api/users", auth, requireRole("ATENDENTE"), async (req, res) => {
    try {
        const { name, email, password, role = "ATENDENTE" } = req.body || {};

        if (
            !name?.trim() ||
            !email?.trim() ||
            !password ||
            !["ATENDENTE"].includes(role)
        ) {
            return res.status(400).json({
                message: "Dados de usuário inválidos.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "A senha deve ter pelo menos 8 caracteres.",
            });
        }

        const id = (await import("node:crypto")).randomUUID();
        const normalizedEmail = email.trim().toLowerCase();

        await pool.query(
            `INSERT INTO users
                    (id, name, email, password_hash, role)
                 VALUES (?, ?, ?, ?, ?)`,
            [
                id,
                name.trim(),
                normalizedEmail,
                await hashPassword(password),
                role,
            ],
        );

        res.status(201).json({
            id,
            name: name.trim(),
            email: normalizedEmail,
            role,
        });
    } catch (e) {
        res.status(400).json({
            message:
                e.code === "ER_DUP_ENTRY" ? "E-mail já cadastrado." : e.message,
        });
    }
});

// Tratamento de erros inesperados
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        message: "Erro interno do servidor.",
    });
});

/* CRIAR AGENDAMENTO */
app.post(
    "/api/appointments",
    auth,
    requireRole("PACIENTE"),
    upload.single("medicalOrder"),
    async (req, res, next) => {
        try {
            const patientUserId = req.user?.sub || req.user?.id;

            if (!patientUserId) {
                return res.status(401).json({
                    message:
                        "Não foi possível identificar o paciente autenticado.",
                });
            }

            let { exams, desiredDate, desiredTime, notes, paymentType } =
                req.body;

            // O frontend envia os exames como JSON dentro do FormData.
            if (typeof exams === "string") {
                try {
                    exams = JSON.parse(exams);
                } catch {
                    return res.status(400).json({
                        message: "A lista de exames é inválida.",
                    });
                }
            }

            if (!Array.isArray(exams) || exams.length === 0) {
                return res.status(400).json({
                    message: "Selecione pelo menos um exame.",
                });
            }

            exams = exams
                .filter((exam) => typeof exam === "string")
                .map((exam) => exam.trim())
                .filter(Boolean);

            if (exams.length === 0) {
                return res.status(400).json({
                    message: "A lista de exames é inválida.",
                });
            }

            if (
                typeof desiredDate !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(desiredDate) ||
                typeof desiredTime !== "string" ||
                !/^\d{2}:\d{2}(?::\d{2})?$/.test(desiredTime)
            ) {
                return res.status(400).json({
                    message: "Informe uma data e um horário válidos.",
                });
            }

            if (!["PARTICULAR", "CONVENIO"].includes(paymentType)) {
                paymentType = "PARTICULAR";
            }

            const id = randomUUID();

            const medicalOrderPath = req.file
                ? `uploads/medical-orders/${req.file.filename}`
                : null;

            await pool.execute(
                `INSERT INTO appointments (
          id,
          patient_user_id,
          exams,
          desired_date,
          desired_time,
          status,
          payment_type,
          notes,
          medical_order_path
        ) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?, ?, ?)`,
                [
                    id,
                    patientUserId,
                    JSON.stringify(exams),
                    desiredDate,
                    desiredTime,
                    paymentType,
                    notes?.trim() || null,
                    medicalOrderPath,
                ],
            );

            return res.status(201).json({
                message: "Solicitação criada com sucesso.",
                appointment: {
                    id,
                    exams,
                    desired_date: desiredDate,
                    desired_time: desiredTime,
                    status: "PENDENTE",
                    payment_type: paymentType,
                    notes: notes?.trim() || null,
                },
            });
        } catch (error) {
            next(error);
        }
    },
);

/* LISTAR AGENDAMENTOS DO PACIENTE LOGADO */
app.get(
    "/api/appointments/mine",
    auth,
    requireRole("PACIENTE"),
    async (req, res, next) => {
        try {
            const patientUserId = req.user?.sub || req.user?.id;

            if (!patientUserId) {
                return res.status(401).json({
                    message:
                        "Não foi possível identificar o paciente autenticado.",
                });
            }

            const [rows] = await pool.execute(
                `SELECT
          id,
          exams,
          DATE_FORMAT(desired_date, '%Y-%m-%d') AS desired_date,
          TIME_FORMAT(desired_time, '%H:%i') AS desired_time,
          status,
          payment_type,
          notes,
          ticket_id,
          created_at
        FROM appointments
        WHERE patient_user_id = ?
        ORDER BY created_at DESC`,
                [patientUserId],
            );

            const appointments = rows.map((item) => ({
                ...item,
                exams:
                    typeof item.exams === "string"
                        ? JSON.parse(item.exams)
                        : item.exams,
            }));

            return res.json({ appointments });
        } catch (error) {
            next(error);
        }
    },
);

/* NOTIFICAÇÕES DO PACIENTE */
app.get(
    "/api/patient/notifications",
    auth,
    requireRole("PACIENTE"),
    async (_req, res) => {
        // Resposta temporária: nenhuma tabela de notificações foi confirmada.
        return res.json({ notifications: [] });
    },
);

const port = Number(process.env.PORT || 3000);
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        message: "Erro interno do servidor.",
    });
});
app.listen(port, () => {
    console.log(`nassauTickets API em http://localhost:${port}`);
});
