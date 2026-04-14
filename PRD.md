Below is a **clean, investor-ready + execution-ready Product Requirements Document (PRD)** for your **Food Truck Safety & Compliance App (MVP)**.
It’s written so **design, engineering, and business** can all align from Day 1.

---

# **Product Requirements Document (PRD)**

## **Branch Clarification**

This branch is implemented with **Expo + Firebase**, not **Supabase/Vercel**.

Some items described below, especially **offline-first behavior** and parts of the broader **MVP feature set**, should be treated as **aspirational or post-MVP** rather than fully implemented branch reality.

For the authoritative branch-level scope and current implementation status, refer to **`BRANCH_PRODUCT_REFINEMENT_GUIDE.md` Sections 8-9**.

## **Food Truck Safety & Compliance App (MVP)**

---

## **1. Product Overview**

### **Product Name (Working)**

Food Truck Safety & Compliance App

### **Product Vision**

Enable food truck operators to **stay inspection-ready every day** by replacing manual, error-prone compliance processes with a **simple, mobile-first digital system**.

### **Problem Statement**

Food truck operators struggle with:

* Complex OSHA & food safety regulations
* Manual paperwork and forgotten logs
* Poor inspection readiness
* High risk of fines, penalties, or shutdowns

### **Solution**

A **mobile-first compliance platform** that:

* Automates safety checklists
* Logs incidents and maintenance
* Tracks certifications and renewals
* Provides instant inspection-ready reports
* Gives owners real-time compliance visibility

---

## **2. Goals & Success Metrics**

### **Primary Goals**

* Reduce compliance friction for food truck operators
* Improve daily checklist completion
* Increase inspection readiness confidence
* Prevent fines, violations, and shutdowns

### **MVP Success Metrics (KPIs)**

* Daily Active Users (DAU)
* Checklist completion rate
* Incidents & maintenance logs per truck
* % of trucks inspection-ready at any time
* Average compliance score improvement over 30 days
* % users opting into public visibility (post-MVP signal)

---

## **3. Target Users & Personas**

### **Primary Users**

1. **Food Truck Owner / Manager**

   * Oversees compliance
   * Prepares for inspections
   * Manages staff and documents

2. **Food Truck Staff / Operator**

   * Completes daily safety checks
   * Logs incidents quickly
   * Needs minimal friction

### **Secondary (Future)**

3. **Regulators / Auditors**

   * Read-only access
   * Inspection verification

---

## **4. Assumptions & Constraints**

### **Assumptions**

* Most users operate in low-connectivity environments
* Mobile usage > desktop usage
* Compliance requirements vary by truck type
* Speed and simplicity are critical for adoption

### **Constraints**

* MVP scope limited to essential compliance needs
* No regulator integration in MVP
* Offline support required
* Regulatory mapping limited to core OSHA & food safety standards

---

## **5. In-Scope vs Out-of-Scope**

### **In Scope (MVP)**

* Digital checklists
* Incident & maintenance logging
* Role-based access
* Compliance scoring
* Certification tracking
* Inspection-ready reports
* Privacy & public visibility controls

### **Out of Scope (Post-MVP)**

* Public compliance map
* Regulator dashboards
* Advanced analytics
* Multi-region regulatory engines

---

## **6. Functional Requirements**

---

### **6.1 Authentication & Roles**

**Users can:**

* Sign up using email/phone
* Log in securely
* Be assigned roles:

  * Owner (full access)
  * Staff (limited access)

**Owner permissions:**

* View all logs and reports
* Manage staff
* Control public visibility
* Export inspection reports

**Staff permissions:**

* Complete checklists
* Log incidents
* View assigned tasks

---

### **6.2 Truck Setup & Configuration**

**Owner can configure:**

* Truck name and type
* Truck category (street food, BBQ, dessert, etc.)
* Permits and license details
* Location (optional)

**System behavior:**

* Auto-assign relevant compliance checklists based on truck type

---

### **6.3 Digital Compliance Checklists**

**Checklist Types:**

* Daily
* Weekly
* Monthly

**Features:**

* Pre-filled checklist items based on truck category
* Simple checkbox/toggle UI
* Optional notes per item
* Optional photo upload
* Auto-timestamp and user attribution

**Validation Rules:**

* Incomplete critical items reduce compliance score
* Missed checklists trigger dashboard warnings

---

### **6.4 Incident & Maintenance Logging**

**Incident Types:**

* Food safety
* Equipment failure
* Injury/accident
* Other

**Incident Fields:**

* Type
* Description
* Date/time (auto)
* Severity (minor/moderate/severe)
* Optional media upload

**Maintenance Tasks (Owner):**

* Create tasks linked to incidents
* Assign to staff
* Track completion status

---

### **6.5 Compliance Scoring System**

**Score Inputs:**

* Checklist completion rate
* Severity and frequency of incidents
* Overdue certifications
* Maintenance backlog

**Score Output:**

* Numerical score (0–100)
* Status indicator:

  * Green (Good)
  * Yellow (At Risk)
  * Red (Non-Compliant)

**Dashboard Insights:**

* Key risk areas
* Actionable improvement tips

---

### **6.6 Inspection Readiness & Reporting**

**Features:**

* Inspection Mode toggle
* Date-range filters
* View:

  * Completed checklists
  * Incident history
  * Certifications
* Export to PDF
* Shareable secure report link

---

### **6.7 Training & Certification Tracking**

**Trackable Items:**

* Food handler permits
* Fire safety certifications
* Vehicle/truck licenses

**Features:**

* Upload document or photo
* Set expiration dates
* Auto reminders
* Status tags:

  * Active
  * Expiring Soon
  * Expired

---

### **6.8 Privacy & Public Visibility Controls**

**Owner controls:**

* Whether truck appears publicly
* Whether compliance score is visible

**System requirements:**

* Clear explanation of visibility impact
* Default: private
* Explicit user consent required

---

## **7. Non-Functional Requirements**

### **Performance**

* Checklist load time < 2 seconds
* Works best online during MVP (offline-first is post-MVP)
* Sync within 5 seconds after reconnect when connectivity is available

### **Security**

* Firestore security rules
* Encrypted sensitive fields
* Secure media storage
* Audit logs for changes

### **Availability**

* 99% uptime target
* Graceful offline degradation

---

## **8. Technical Requirements**

### **Frontend**

* React Native (mobile-first)
* Responsive for tablets
* Online-first architecture for MVP (offline enhancements post-MVP)

### **Backend**

* Firebase Firestore
* Firebase Auth
* Firebase Storage
* Audit logging enabled

### **Hosting**

* Expo/EAS mobile distribution (dashboard/admin hosting TBD post-MVP)

---

## **9. Analytics & Tracking**

Track:

* Checklist starts vs completions
* Incident logs per truck
* Certification uploads
* Compliance score changes
* Feature usage frequency

---

## **10. MVP Development Milestones**

### **Sprint 1**

* Auth & roles
* Truck setup
* Daily checklists

### **Sprint 2**

* Incident logging
* Owner dashboard
* Compliance score logic

### **Sprint 3**

* Certification tracking
* Inspection reports
* Privacy controls
* Online sync hardening (offline sync moved to post-MVP)

---

## **11. Risks & Mitigations**

| Risk                    | Mitigation                       |
| ----------------------- | -------------------------------- |
| Low daily usage         | Minimize checklist friction      |
| Regulatory misalignment | Start with common OSHA standards |
| Offline sync issues     | Conflict-resolution rules        |
| Data privacy concerns   | Explicit consent + defaults      |

---

## **12. Open Questions (Pre-Build)**

* Initial regulatory geography (US only?)
* Compliance score weighting logic
* Minimum viable checklist depth
* Pricing model (freemium vs paid)

---

## **13. Future Roadmap (Post-MVP)**

* Public compliance map
* Regulator access portal
* Advanced analytics & alerts
* Multi-truck owner accounts
* Localization and regional compliance

---

### ✅ **Next Steps**

If you want, I can:

* Convert this PRD into a **Notion / Confluence-ready doc**
* Create **user stories & acceptance criteria**
* Design **low-fidelity wireframes** per screen
* Break this into **Jira sprint tickets**

Just tell me what’s next.
