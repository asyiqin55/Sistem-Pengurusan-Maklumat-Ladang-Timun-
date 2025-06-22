-- Disable RLS on all existing tables and create new tables without RLS
-- This migration removes all Row Level Security policies and creates clean tables

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS "PresetTask" CASCADE;
DROP TABLE IF EXISTS "Attendance" CASCADE;
DROP TABLE IF EXISTS "Settings" CASCADE;
DROP TABLE IF EXISTS "Report" CASCADE;
DROP TABLE IF EXISTS "Expense" CASCADE;
DROP TABLE IF EXISTS "Sale" CASCADE;
DROP TABLE IF EXISTS "Task" CASCADE;
DROP TABLE IF EXISTS "Staff" CASCADE;
DROP TABLE IF EXISTS "Crop" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Create User table
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL, -- admin, staff, worker
  status VARCHAR(50) DEFAULT 'active' NOT NULL, -- active, inactive
  "lastLogin" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Crop table
CREATE TABLE "Crop" (
  id SERIAL PRIMARY KEY,
  "plotId" VARCHAR(255) UNIQUE NOT NULL,
  length DECIMAL,
  width DECIMAL,
  "expectedHarvestDate" TIMESTAMP,
  "cropType" VARCHAR(255) NOT NULL, -- e.g., "Tomato", "Cucumber"
  status VARCHAR(50) NOT NULL, -- active, harvested, failed
  "plantingDate" TIMESTAMP NOT NULL,
  "expectedYield" VARCHAR(255),
  "actualYield" VARCHAR(255),
  "userId" INTEGER REFERENCES "User"(id),
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Staff table
CREATE TABLE "Staff" (
  id SERIAL PRIMARY KEY,
  "staffId" VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  "idNumber" VARCHAR(255) UNIQUE NOT NULL,
  gender VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  salary DECIMAL NOT NULL,
  status VARCHAR(50) DEFAULT 'active' NOT NULL, -- active, inactive, terminated
  "joinDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "userId" INTEGER UNIQUE REFERENCES "User"(id),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Task table
CREATE TABLE "Task" (
  id SERIAL PRIMARY KEY,
  "taskId" VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "userId" INTEGER NOT NULL REFERENCES "User"(id),
  "cropId" INTEGER REFERENCES "Crop"(id),
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL, -- pending, in-progress, completed, cancelled
  priority VARCHAR(50) DEFAULT 'medium' NOT NULL, -- low, medium, high
  notes TEXT,
  attachments JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Sale table
CREATE TABLE "Sale" (
  id SERIAL PRIMARY KEY,
  "saleId" VARCHAR(255) UNIQUE NOT NULL,
  "cropId" INTEGER NOT NULL REFERENCES "Crop"(id),
  date TIMESTAMP NOT NULL,
  quantity DECIMAL NOT NULL,
  "pricePerKg" DECIMAL NOT NULL,
  "totalAmount" DECIMAL NOT NULL,
  "paymentType" VARCHAR(50) NOT NULL, -- cash, bank transfer, credit
  status VARCHAR(50) NOT NULL, -- completed, pending, cancelled
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Expense table
CREATE TABLE "Expense" (
  id SERIAL PRIMARY KEY,
  "expenseId" VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(255) NOT NULL, -- fertilizer, pesticide, equipment, labor, other
  amount DECIMAL NOT NULL,
  date TIMESTAMP NOT NULL,
  description TEXT,
  "cropId" INTEGER REFERENCES "Crop"(id),
  "paymentType" VARCHAR(50) NOT NULL, -- cash, bank transfer, credit
  status VARCHAR(50) NOT NULL, -- paid, pending, cancelled
  receipt VARCHAR(255),
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Report table
CREATE TABLE "Report" (
  id SERIAL PRIMARY KEY,
  "reportId" VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- sales, harvest, financial, inventory
  "dateRange" JSONB NOT NULL, -- { startDate: "", endDate: "" }
  data JSONB NOT NULL,
  "generatedBy" INTEGER NOT NULL, -- User ID who generated the report
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Settings table
CREATE TABLE "Settings" (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- system, notification, payment, other
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Attendance table
CREATE TABLE "Attendance" (
  id VARCHAR(255) PRIMARY KEY, -- cuid equivalent
  "staffId" INTEGER NOT NULL REFERENCES "Staff"(id),
  "punchInTime" TIMESTAMP NOT NULL,
  "punchOutTime" TIMESTAMP,
  date DATE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE("staffId", date)
);

-- Create PresetTask table
CREATE TABLE "PresetTask" (
  id SERIAL PRIMARY KEY,
  "taskId" VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_user_username ON "User"(username);
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);
CREATE INDEX idx_user_status ON "User"(status);

CREATE INDEX idx_crop_plotid ON "Crop"("plotId");
CREATE INDEX idx_crop_status ON "Crop"(status);
CREATE INDEX idx_crop_userid ON "Crop"("userId");

CREATE INDEX idx_staff_staffid ON "Staff"("staffId");
CREATE INDEX idx_staff_email ON "Staff"(email);
CREATE INDEX idx_staff_status ON "Staff"(status);

CREATE INDEX idx_task_taskid ON "Task"("taskId");
CREATE INDEX idx_task_userid ON "Task"("userId");
CREATE INDEX idx_task_cropid ON "Task"("cropId");
CREATE INDEX idx_task_status ON "Task"(status);

CREATE INDEX idx_sale_saleid ON "Sale"("saleId");
CREATE INDEX idx_sale_cropid ON "Sale"("cropId");
CREATE INDEX idx_sale_date ON "Sale"(date);

CREATE INDEX idx_expense_expenseid ON "Expense"("expenseId");
CREATE INDEX idx_expense_cropid ON "Expense"("cropId");
CREATE INDEX idx_expense_category ON "Expense"(category);

CREATE INDEX idx_report_reportid ON "Report"("reportId");
CREATE INDEX idx_report_type ON "Report"(type);

CREATE INDEX idx_settings_key ON "Settings"(key);
CREATE INDEX idx_settings_category ON "Settings"(category);

CREATE INDEX idx_attendance_staffid ON "Attendance"("staffId");
CREATE INDEX idx_attendance_date ON "Attendance"(date);

CREATE INDEX idx_preset_task_taskid ON "PresetTask"("taskId");

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updatedAt
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crop_updated_at BEFORE UPDATE ON "Crop" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON "Staff" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_updated_at BEFORE UPDATE ON "Task" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sale_updated_at BEFORE UPDATE ON "Sale" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_updated_at BEFORE UPDATE ON "Expense" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_updated_at BEFORE UPDATE ON "Report" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON "Settings" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON "Attendance" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_preset_task_updated_at BEFORE UPDATE ON "PresetTask" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();