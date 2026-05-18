# Goal Setting & Tracking Portal  
**Participant:** Soham Kulkarni  

---

## 1. Working Link  
**Live Demo URL:** [https://goal-setting-tracking-portal-mu.vercel.app/](https://goal-setting-tracking-portal-mu.vercel.app/)

---

## 2. Source Code Repository  
**GitHub Repository:** [https://github.com/sohamk005/Goal_Setting_Tracking_Portal](https://github.com/sohamk005/Goal_Setting_Tracking_Portal)

---

## 3. Architecture Diagram  
The application follows a modern serverless architecture, utilizing Next.js for the frontend and Supabase (PostgreSQL) as a Backend-as-a-Service (BaaS). For this MVP demonstration, authentication is intentionally simplified using a Context-based Identity Switcher to enable seamless role-based workflow testing and faster evaluation. 

*(See the `Architecture Diagram.png` image for visual representation).*

---

## 4. Key Features & Workflows  
- **Role-Based Workspaces**: Distinct dashboards tailored for Employees (Goal Creation), Managers (Goal Evaluation & Review), and HR Admins (Audit Trails).  
- **Frictionless Demo Identity Switcher**: A seamless dropdown toggle to instantly bounce between roles without login barriers, perfect for live demonstrations.  
- **Real-time Database Persistence**: Direct integration with Supabase PostgreSQL ensuring all goals, metric weights, and quarterly check-ins are durably saved.  
- **Automated Data Validations**: Frontend validation ensuring total goal weightage equals strictly 100% before submission to the manager.  
- **Live Audit Trails**: Administrator view that tracks database actions for organizational compliance and transparency.  

### Technology Stack 
- **Frontend**: Next.js + Tailwind CSS + Shadcn UI  
- **Backend**: Supabase  
- **Database**: PostgreSQL  
- **Hosting**: Vercel 

---

## Demo Access 
The application uses a Context-based Identity Switcher for seamless demo access. 

**Available roles:** 
- Employee  
- Manager (L1)  
- HR Admin  

Users can instantly switch between workflows from the top navigation banner without requiring authentication. 
