CREATE DATABASE IF NOT EXISTS nassau_tickets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nassau_tickets;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ATENDENTE','GESTOR') NOT NULL DEFAULT 'ATENDENTE',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

ALTER TABLE users MODIFY role ENUM('PACIENTE','ATENDENTE','GESTOR','ADMINISTRADOR') NOT NULL DEFAULT 'ATENDENTE';

CREATE TABLE IF NOT EXISTS queue_control (
  id TINYINT PRIMARY KEY,
  last_type ENUM('SP','SE','SG') NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
INSERT IGNORE INTO queue_control (id,last_type) VALUES (1,NULL);

CREATE TABLE IF NOT EXISTS ticket_sequences (
  issue_date DATE NOT NULL,
  type ENUM('SP','SE','SG') NOT NULL,
  next_sequence SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY(issue_date,type)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tickets (
  id CHAR(36) PRIMARY KEY,
  number VARCHAR(20) NOT NULL UNIQUE,
  type ENUM('SP','SE','SG') NOT NULL,
  sequence_number SMALLINT UNSIGNED NOT NULL,
  issue_date DATE NOT NULL,
  status ENUM('EMITIDA','AGUARDANDO','CHAMADA','CHAMADA_NOVAMENTE','EM_ATENDIMENTO','ATENDIDA','NAO_COMPARECEU') NOT NULL,
  issued_at DATETIME NOT NULL,
  first_call_at DATETIME NULL,
  second_call_at DATETIME NULL,
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  counter SMALLINT UNSIGNED NULL,
  attendant_id CHAR(36) NULL,
  call_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ticket_queue(status,type,issued_at),
  INDEX idx_ticket_date(issue_date),
  CONSTRAINT fk_ticket_attendant FOREIGN KEY(attendant_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id CHAR(36) NULL,
  actor_user_id CHAR(36) NULL,
  counter SMALLINT UNSIGNED NULL,
  action VARCHAR(40) NOT NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSON NULL,
  INDEX idx_audit_ticket(ticket_id),
  INDEX idx_audit_date(occurred_at),
  CONSTRAINT fk_audit_ticket FOREIGN KEY(ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_user FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS patients (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  full_name VARCHAR(160) NOT NULL,
  cpf CHAR(11) NOT NULL UNIQUE,
  birth_date DATE NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  payment_type ENUM('CONVENIO','PARTICULAR') NOT NULL DEFAULT 'PARTICULAR',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_patient_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointment_sequence (
  id TINYINT PRIMARY KEY,
  next_value INT UNSIGNED NOT NULL DEFAULT 1023
) ENGINE=InnoDB;
INSERT IGNORE INTO appointment_sequence(id,next_value) VALUES(1,1023);

CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) PRIMARY KEY,
  ticket_number VARCHAR(20) NOT NULL UNIQUE,
  patient_id CHAR(36) NOT NULL,
  exams JSON NOT NULL,
  desired_date DATE NOT NULL,
  desired_time TIME NOT NULL,
  payment_type ENUM('CONVENIO','PARTICULAR') NOT NULL,
  notes TEXT NULL,
  staff_note TEXT NULL,
  document_path VARCHAR(255) NULL,
  status ENUM('SOLICITADO','AGUARDANDO_CONFIRMACAO','AGENDADO','NA_ESPERA','CHAMADO','EM_ATENDIMENTO','EM_COLETA','COLETA_REALIZADA','ATENDIMENTO_FINALIZADO','CONCLUIDO','FALTOU','CANCELADO') NOT NULL DEFAULT 'SOLICITADO',
  attendant_id CHAR(36) NULL,
  confirmed_at DATETIME NULL,
  arrived_at DATETIME NULL,
  started_at DATETIME NULL,
  collection_started_at DATETIME NULL,
  collection_finished_at DATETIME NULL,
  finished_at DATETIME NULL,
  exited_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_appointment_queue(status,arrived_at),
  INDEX idx_appointment_date(desired_date,desired_time),
  INDEX idx_appointment_attendant(attendant_id,status),
  CONSTRAINT fk_appointment_patient FOREIGN KEY(patient_id) REFERENCES patients(id),
  CONSTRAINT fk_appointment_attendant FOREIGN KEY(attendant_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointment_events (
  id CHAR(36) PRIMARY KEY,
  appointment_id CHAR(36) NOT NULL,
  actor_user_id CHAR(36) NULL,
  status VARCHAR(40) NOT NULL,
  note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_appointment_event(appointment_id,created_at),
  CONSTRAINT fk_appointment_event_appointment FOREIGN KEY(appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointment_event_actor FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  appointment_id CHAR(36) NULL,
  title VARCHAR(120) NOT NULL,
  message VARCHAR(500) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notification_user(user_id,is_read,created_at),
  CONSTRAINT fk_notification_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_appointment FOREIGN KEY(appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
) ENGINE=InnoDB;
