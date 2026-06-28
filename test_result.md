#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Sistema Web de Evaluación Anual del Personal de Enfermería (ISSSTECALI). Wizard de 10 pasos, cálculos automáticos (E=10,B=9,R=8,D=7), folio único, generación de PDF réplica del formato institucional. Stack del entorno: Next.js + MongoDB."

backend:
  - task: "Config CRUD (GET/PUT /api/config)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Singleton config doc with default values. GET returns config (creates default if missing). PUT upserts institutional data."

  - task: "Employees CRUD (GET/POST/PUT/DELETE /api/employees)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "UUID ids. Fields: nombre, numeroEmpleado, categoria, horario (TM/TV/TNA/TNB/JAD/JAN)."

  - task: "Evaluations CRUD + folio generation"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "POST creates evaluation from employee snapshot + generates unique sequential folio PREFIX-YEAR-000001 via counters collection (findOneAndUpdate $inc). PUT autosaves scores/attendance/anecdotario/currentStep/status. GET list returns computed general."

  - task: "PDF generation (GET /api/evaluations/:id/pdf)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js, lib/pdfGenerator.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "pdf-lib generates 4-section institutional replica: page1 evaluation matrix (6 sections, 12 months, totals/promedios, calificacion rows, promedio general, signatures), page2 attendance grid (months x days respecting leap years), page3+ anecdotario. Returns application/pdf with filename [Folio]_[NOMBRE].pdf. Verify it returns 200 + valid PDF bytes (Content-Type application/pdf)."

  - task: "Dashboard stats (GET /api/dashboard)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Returns employees count, evaluations count, completed, draft, avgGeneral, recent[]."

frontend:
  - task: "Wizard + ScoreGrid + modules UI"
    implemented: true
    working: "NA"
    file: "app/page.js, components/eval/Wizard.js, components/eval/ScoreGrid.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Not yet tested via agent. Will request user permission before frontend testing."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Config CRUD (GET/PUT /api/config)"
    - "Employees CRUD (GET/POST/PUT/DELETE /api/employees)"
    - "Evaluations CRUD + folio generation"
    - "PDF generation (GET /api/evaluations/:id/pdf)"
    - "Dashboard stats (GET /api/dashboard)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: "Backend MVP completo. Probar todos los endpoints bajo /api. Flujo clave: 1) PUT /api/config con prefijoFolio y anio; 2) POST /api/employees; 3) POST /api/evaluations {empleadoId, anio} -> debe devolver folio unico PREFIX-YEAR-000001 e incrementar secuencia en evaluaciones posteriores; 4) PUT /api/evaluations/:id con scores (estructura {sectionKey:{criterionIndex:[12 letras E/B/R/D]}}), attendance ({monthIndex:{day:code}}), anecdotario ({monthIndex:text}); 5) GET /api/evaluations/:id; 6) GET /api/evaluations/:id/pdf debe responder 200 con Content-Type application/pdf y bytes que inicien con %PDF. Verificar que NO se filtre _id de Mongo en respuestas JSON. Verificar dashboard."