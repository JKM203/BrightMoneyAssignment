CREATE TABLE loans (
  loan_id           SERIAL PRIMARY KEY,
  aadhar_id         VARCHAR(12)  NOT NULL,
  loan_amount       NUMERIC(12,2) NOT NULL,
  interest_rate     NUMERIC(5,2)  NOT NULL,    
  term_period       INTEGER       NOT NULL,     
  disbursement_date DATE          NOT NULL,
  principal_balance NUMERIC(12,2) NOT NULL,     
  status            VARCHAR(20)   NOT NULL      
);

CREATE TABLE emi_schedules (
  emi_id      SERIAL PRIMARY KEY,
  loan_id     INTEGER NOT NULL,
  billing_date DATE         NOT NULL,           
  due_date     DATE         NOT NULL,           
  amount_due   NUMERIC(12,2) NOT NULL,
  paid_amount  NUMERIC(12,2) DEFAULT 0.00,
  status       VARCHAR(20)   NOT NULL       
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  aadhar_id      VARCHAR(12)    NOT NULL UNIQUE,
  name           VARCHAR(255)   NOT NULL,
  email          VARCHAR(255)   NOT NULL UNIQUE,
  annual_income  NUMERIC(12,2)  NOT NULL CHECK (annual_income >= 0),
  credit_score   SMALLINT       CHECK (credit_score BETWEEN 300 AND 900),
  is_closed      BOOLEAN        NOT NULL DEFAULT FALSE,
  password      VARCHAR(1000)   NOT NULL,
  next_billing_date DATE NOT NULL,
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  loan_id        INTEGER NOT NULL,
  aadhar_id      VARCHAR(12) NOT NULL,
  date DATE NOT NULL,
  amount         NUMERIC(12,2) NOT NULL,
  txn_type VARCHAR(20) NOT NULL,
);