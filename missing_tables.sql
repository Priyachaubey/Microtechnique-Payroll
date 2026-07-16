CREATE TABLE IF NOT EXISTS t_departments (
    departmentid SERIAL PRIMARY KEY,
    spaceid INT,
    name VARCHAR(255),
    adminid INT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_assets (
    assetid SERIAL PRIMARY KEY,
    spaceid INT,
    name VARCHAR(255),
    type VARCHAR(100),
    serial_number VARCHAR(100),
    assigned_empid INT,
    assigned_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Available',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_compliance_settings (
    settingid SERIAL PRIMARY KEY,
    spaceid INT,
    pf_percentage NUMERIC(5,2),
    esi_percentage NUMERIC(5,2),
    pt_amount NUMERIC(10,2),
    tds_percentage NUMERIC(5,2),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_compliance_filings (
    filingid SERIAL PRIMARY KEY,
    spaceid INT,
    type VARCHAR(50),
    month INT,
    year INT,
    amount NUMERIC(10,2),
    duedate TIMESTAMP,
    fileddate TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pending',
    challan_number VARCHAR(100),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_jobs (
    jobid SERIAL PRIMARY KEY,
    spaceid INT,
    title VARCHAR(255),
    description TEXT,
    department VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Open',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_applications (
    appid SERIAL PRIMARY KEY,
    jobid INT,
    candidate_name VARCHAR(255),
    email VARCHAR(255),
    resume_url TEXT,
    status VARCHAR(50) DEFAULT 'Applied',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_reimbursements (
    claimid SERIAL PRIMARY KEY,
    empid INT,
    spaceid INT,
    type VARCHAR(100),
    amount NUMERIC(10,2),
    description TEXT,
    receipt_url TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    approvedby INT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_tickets (
    ticketid SERIAL PRIMARY KEY,
    spaceid INT,
    empid INT,
    subject VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'Open',
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_ticket_replies (
    replyid SERIAL PRIMARY KEY,
    ticketid INT,
    sender_empid INT,
    message TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
