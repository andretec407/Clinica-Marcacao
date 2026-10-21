
CREATE DATABASE IF NOT EXISTS nassau_tickets
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nassau_tickets;

-- 1. Usuários e atendentes
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('PACIENTE', 'ATENDENTE') NOT NULL DEFAULT 'ATENDENTE',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Dados complementares dos pacientes
CREATE TABLE IF NOT EXISTS patients (
  user_id CHAR(36) PRIMARY KEY,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  birth_date DATE NOT NULL,
  phone VARCHAR(25) NOT NULL,
  payment_type ENUM('PARTICULAR', 'CONVENIO')
    NOT NULL DEFAULT 'PARTICULAR',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_patients_user
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 3. Sequência diária de senhas por tipo
CREATE TABLE IF NOT EXISTS ticket_sequences (
  issue_date DATE NOT NULL,
  type ENUM('SP', 'SE', 'SG') NOT NULL,
  next_sequence INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (issue_date, type)
) ENGINE=InnoDB;

-- 4. Senhas emitidas e atendimentos
CREATE TABLE IF NOT EXISTS tickets (
  id CHAR(36) PRIMARY KEY,
  number VARCHAR(30) NOT NULL UNIQUE,
  type ENUM('SP', 'SE', 'SG') NOT NULL,
  sequence_number INT UNSIGNED NOT NULL,
  issue_date DATE NOT NULL,
  status ENUM(
    'AGUARDANDO',
    'CHAMADA',
    'CHAMADA_NOVAMENTE',
    'EM_ATENDIMENTO',
    'ATENDIDA',
    'NAO_COMPARECEU'
  ) NOT NULL DEFAULT 'AGUARDANDO',
  issued_at DATETIME NOT NULL,
  first_call_at DATETIME NULL,
  second_call_at DATETIME NULL,
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  call_count INT UNSIGNED NOT NULL DEFAULT 0,
  counter INT UNSIGNED NULL,
  attendant_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_tickets_queue (status, type, issued_at),
  INDEX idx_tickets_issue_date (issue_date),
  INDEX idx_tickets_first_call (first_call_at),
  INDEX idx_tickets_attendant (attendant_id, status),

  CONSTRAINT fk_tickets_attendant
    FOREIGN KEY (attendant_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 5. Controle de alternância dos tipos de senha
CREATE TABLE IF NOT EXISTS queue_control (
  id TINYINT UNSIGNED PRIMARY KEY,
  last_type ENUM('SP', 'SE', 'SG') NOT NULL DEFAULT 'SG'
) ENGINE=InnoDB;

INSERT INTO queue_control (id, last_type)
VALUES (1, 'SG')
ON DUPLICATE KEY UPDATE id = VALUES(id);

-- 6. Auditoria de operações
CREATE TABLE IF NOT EXISTS audit_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id CHAR(36) NULL,
  actor_user_id CHAR(36) NULL,
  counter INT UNSIGNED NULL,
  action VARCHAR(60) NOT NULL,
  metadata JSON NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_audit_occurred_at (occurred_at),
  INDEX idx_audit_ticket (ticket_id),

  CONSTRAINT fk_audit_ticket
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  CONSTRAINT fk_audit_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 7. Solicitações de exames e agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) PRIMARY KEY,
  patient_user_id CHAR(36) NOT NULL,
  ticket_id CHAR(36) NULL,
  exams JSON NOT NULL,
  desired_date DATE NOT NULL,
  desired_time TIME NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'PENDENTE',
  payment_type ENUM('PARTICULAR', 'CONVENIO')
    NOT NULL DEFAULT 'PARTICULAR',
  notes TEXT NULL,
  medical_order_path VARCHAR(500) NULL,
  confirmed_date DATE NULL,
  confirmed_time TIME NULL,
  staff_note TEXT NULL,
  arrived_at DATETIME NULL,
  started_at DATETIME NULL,
  collection_started_at DATETIME NULL,
  collection_finished_at DATETIME NULL,
  finished_at DATETIME NULL,
  exited_at DATETIME NULL,
  no_show_at DATETIME NULL,
  cancellation_note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_appointments_patient (patient_user_id, created_at),
  INDEX idx_appointments_schedule (desired_date, desired_time),
  INDEX idx_appointments_status (status),

  CONSTRAINT fk_appointments_patient
    FOREIGN KEY (patient_user_id) REFERENCES users(id),
  CONSTRAINT fk_appointments_ticket
    FOREIGN KEY (ticket_id) REFERENCES tickets(id)
) ENGINE=InnoDB;

-- 8. Notificações dos pacientes
CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  patient_user_id CHAR(36) NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_notifications_patient (patient_user_id, created_at),

  CONSTRAINT fk_notifications_patient
    FOREIGN KEY (patient_user_id) REFERENCES users(id)
) ENGINE=InnoDB;
