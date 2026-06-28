#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for Nursing Annual Evaluation System
Tests all endpoints under /api with focus on:
- Config CRUD
- Employees CRUD
- Evaluations CRUD + folio generation
- PDF generation (critical feature)
- Dashboard stats
- MongoDB connection stability
- No ObjectId leaks
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Base URL from environment
BASE_URL = "https://nurse-eval-system.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def log_test(test_num: int, description: str):
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST {test_num}: {description}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}")

def log_pass(message: str):
    print(f"{Colors.GREEN}✅ PASS: {message}{Colors.RESET}")

def log_fail(message: str):
    print(f"{Colors.RED}❌ FAIL: {message}{Colors.RESET}")

def log_info(message: str):
    print(f"{Colors.YELLOW}ℹ️  INFO: {message}{Colors.RESET}")

def check_no_mongo_id(data: Any, path: str = "root") -> bool:
    """Recursively check that no _id field exists in response"""
    if isinstance(data, dict):
        if '_id' in data:
            log_fail(f"Found MongoDB _id field at {path}")
            return False
        for key, value in data.items():
            if not check_no_mongo_id(value, f"{path}.{key}"):
                return False
    elif isinstance(data, list):
        for i, item in enumerate(data):
            if not check_no_mongo_id(item, f"{path}[{i}]"):
                return False
    return True

def test_1_get_config():
    """Test 1: GET /api/config -> 200, returns config object (no _id)"""
    log_test(1, "GET /api/config - Should return config with defaults, no _id")
    
    try:
        response = requests.get(f"{BASE_URL}/config", timeout=10)
        log_info(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail(f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        log_info(f"Response: {json.dumps(data, indent=2)}")
        
        # Check no _id field
        if not check_no_mongo_id(data):
            return False
        
        # Check required fields
        required_fields = ['id', 'unidadMedica', 'claveUnidad', 'anio', 'prefijoFolio']
        for field in required_fields:
            if field not in data:
                log_fail(f"Missing required field: {field}")
                return False
        
        log_pass("Config retrieved successfully with all required fields, no _id")
        return True
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False

def test_2_put_config():
    """Test 2: PUT /api/config with test data -> 200, returns updated config"""
    log_test(2, "PUT /api/config - Update config with test data")
    
    test_config = {
        "unidadMedica": "HOSPITAL DE PRUEBA",
        "claveUnidad": "46100",
        "supervisor": "SUP TEST",
        "jefatura": "JEFE TEST",
        "anio": 2026,
        "prefijoFolio": "HGE"
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/config",
            json=test_config,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        log_info(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail(f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        log_info(f"Response: {json.dumps(data, indent=2)}")
        
        # Check no _id
        if not check_no_mongo_id(data):
            return False
        
        # Verify updates
        for key, value in test_config.items():
            if data.get(key) != value:
                log_fail(f"Field {key}: expected {value}, got {data.get(key)}")
                return False
        
        log_pass("Config updated successfully with all values reflected")
        return True
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False

def test_3_post_employee():
    """Test 3: POST /api/employees -> 200, returns employee with UUID id (no _id)"""
    log_test(3, "POST /api/employees - Create employee with valid data")
    
    employee_data = {
        "nombre": "MARIA LOPEZ",
        "numeroEmpleado": "12345",
        "categoria": "Enfermera General",
        "horario": "TM"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/employees",
            json=employee_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        log_info(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail(f"Expected 200, got {response.status_code}")
            log_info(f"Response: {response.text}")
            return False, None
        
        data = response.json()
        log_info(f"Response: {json.dumps(data, indent=2)}")
        
        # Check no _id
        if not check_no_mongo_id(data):
            return False, None
        
        # Check UUID id exists
        if 'id' not in data:
            log_fail("Missing 'id' field")
            return False, None
        
        # Verify it's a UUID (contains hyphens, 36 chars)
        if len(data['id']) != 36 or data['id'].count('-') != 4:
            log_fail(f"ID doesn't look like UUID: {data['id']}")
            return False, None
        
        # Verify data
        for key, value in employee_data.items():
            if data.get(key) != value:
                log_fail(f"Field {key}: expected {value}, got {data.get(key)}")
                return False, None
        
        log_pass(f"Employee created successfully with UUID: {data['id']}")
        return True, data['id']
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False, None

def test_4_post_employee_missing_fields():
    """Test 4: POST /api/employees missing required fields -> 400"""
    log_test(4, "POST /api/employees - Missing required fields should return 400")
    
    invalid_data = {
        "numeroEmpleado": "99999"
        # Missing 'nombre'
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/employees",
            json=invalid_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        log_info(f"Status: {response.status_code}")
        log_info(f"Response: {response.text}")
        
        if response.status_code != 400:
            log_fail(f"Expected 400, got {response.status_code}")
            return False
        
        log_pass("Correctly rejected invalid employee data with 400")
        return True
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False

def test_5_get_employees():
    """Test 5: GET /api/employees -> 200, array with no _id fields"""
    log_test(5, "GET /api/employees - List all employees")
    
    try:
        response = requests.get(f"{BASE_URL}/employees", timeout=10)
        log_info(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail(f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        log_info(f"Found {len(data)} employees")
        
        if not isinstance(data, list):
            log_fail("Response is not an array")
            return False
        
        # Check no _id in any employee
        if not check_no_mongo_id(data):
            return False
        
        # Verify MARIA LOPEZ is in the list
        maria = next((e for e in data if e.get('nombre') == 'MARIA LOPEZ'), None)
        if not maria:
            log_fail("Previously created employee 'MARIA LOPEZ' not found in list")
            return False
        
        log_pass(f"Employees list retrieved successfully ({len(data)} employees), no _id fields")
        return True
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False

def test_6_post_evaluation(employee_id: str):
    """Test 6: POST /api/evaluations -> 200, folio HGE-2026-000001, snapshot fields"""
    log_test(6, "POST /api/evaluations - Create evaluation with folio generation")
    
    eval_data = {
        "empleadoId": employee_id,
        "anio": 2026
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/evaluations",
            json=eval_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        log_info(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail(f"Expected 200, got {response.status_code}")
            log_info(f"Response: {response.text}")
            return False, None, None
        
        data = response.json()
        log_info(f"Response: {json.dumps(data, indent=2)}")
        
        # Check no _id
        if not check_no_mongo_id(data):
            return False, None, None
        
        # Check folio format: HGE-2026-XXXXXX
        folio = data.get('folio', '')
        if not folio.startswith('HGE-2026-'):
            log_fail(f"Folio doesn't match expected pattern: {folio}")
            return False, None, None
        
        # Extract sequence number
        parts = folio.split('-')
        if len(parts) != 3:
            log_fail(f"Folio format incorrect: {folio}")
            return False, None, None
        
        seq_str = parts[2]
        if len(seq_str) != 6 or not seq_str.isdigit():
            log_fail(f"Folio sequence not 6 digits: {seq_str}")
            return False, None, None
        
        seq_num = int(seq_str)
        log_info(f"Folio sequence number: {seq_num}")
        
        # Check snapshot fields
        snapshot_fields = {
            'empleadoNombre': 'MARIA LOPEZ',
            'numeroEmpleado': '12345',
            'categoria': 'Enfermera General',
            'horario': 'TM'
        }
        
        for field, expected in snapshot_fields.items():
            if data.get(field) != expected:
                log_fail(f"Snapshot field {field}: expected {expected}, got {data.get(field)}")
                return False, None, None
        
        log_pass(f"Evaluation created with folio {folio}, all snapshot fields correct")
        return True, data['id'], seq_num
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False, None, None

def test_7_post_second_evaluation(employee_id: str, first_seq: int):
    """Test 7: POST second evaluation -> folio should increment to HGE-2026-000002"""
    log_test(7, "POST /api/evaluations - Second evaluation should increment folio")
    
    eval_data = {
        "empleadoId": employee_id,
        "anio": 2026
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/evaluations",
            json=eval_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        log_info(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail(f"Expected 200, got {response.status_code}")
            return False, None
        
        data = response.json()
        folio = data.get('folio', '')
        log_info(f"Second evaluation folio: {folio}")
        
        # Extract sequence
        parts = folio.split('-')
        if len(parts) != 3:
            log_fail(f"Folio format incorrect: {folio}")
            return False, None
        
        seq_num = int(parts[2])
        expected_seq = first_seq + 1
        
        if seq_num != expected_seq:
            log_fail(f"Folio sequence: expected {expected_seq}, got {seq_num}")
            return False, None
        
        log_pass(f"Folio correctly incremented to {folio}")
        return True, data['id']
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False, None

def test_8_post_evaluation_invalid_employee():
    """Test 8: POST /api/evaluations with invalid empleadoId -> 404"""
    log_test(8, "POST /api/evaluations - Invalid employee ID should return 404")
    
    eval_data = {
        "empleadoId": "00000000-0000-0000-0000-000000000000",
        "anio": 2026
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/evaluations",
            json=eval_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        log_info(f"Status: {response.status_code}")
        log_info(f"Response: {response.text}")
        
        if response.status_code != 404:
            log_fail(f"Expected 404, got {response.status_code}")
            return False
        
        log_pass("Correctly rejected invalid employee ID with 404")
        return True
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False

def test_9_put_evaluation(eval_id: str):
    """Test 9: PUT /api/evaluations/<id> with scores -> 200, persists data"""
    log_test(9, "PUT /api/evaluations/<id> - Update with scores/attendance/anecdotario")
    
    update_data = {
        "scores": {
            "competencias": {
                "0": ["E", "B", "R", "D", "E", "B", "R", "D", "E", "B", "R", "D"]
            }
        },
        "attendance": {
            "0": {"1": "A", "2": "F"}
        },
        "anecdotario": {
            "0": "Observacion enero"
        },
        "currentStep": 5,
        "status": "borrador"
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/evaluations/{eval_id}",
            json=update_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        log_info(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail(f"Expected 200, got {response.status_code}")
            log_info(f"Response: {response.text}")
            return False
        
        data = response.json()
        log_info(f"Updated evaluation returned")
        
        # Check no _id
        if not check_no_mongo_id(data):
            return False
        
        # Verify updates
        if data.get('currentStep') != 5:
            log_fail(f"currentStep not updated: {data.get('currentStep')}")
            return False
        
        if data.get('status') != 'borrador':
            log_fail(f"status not updated: {data.get('status')}")
            return False
        
        log_pass("Evaluation updated successfully")
        return True
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False

def test_10_get_evaluation(eval_id: str):
    """Test 10: GET /api/evaluations/<id> -> 200, returns persisted data"""
    log_test(10, "GET /api/evaluations/<id> - Retrieve evaluation with persisted data")
    
    try:
        response = requests.get(f"{BASE_URL}/evaluations/{eval_id}", timeout=10)
        log_info(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail(f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Check no _id
        if not check_no_mongo_id(data):
            return False
        
        # Verify persisted data
        if not data.get('scores', {}).get('competencias', {}).get('0'):
            log_fail("Scores not persisted")
            return False
        
        if not data.get('attendance', {}).get('0'):
            log_fail("Attendance not persisted")
            return False
        
        if data.get('anecdotario', {}).get('0') != "Observacion enero":
            log_fail("Anecdotario not persisted")
            return False
        
        log_pass("Evaluation retrieved with all persisted data intact")
        return True
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False

def test_11_get_evaluations_list():
    """Test 11: GET /api/evaluations -> 200, list with computed 'general' field"""
    log_test(11, "GET /api/evaluations - List with computed general scores")
    
    try:
        response = requests.get(f"{BASE_URL}/evaluations", timeout=10)
        log_info(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail(f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        log_info(f"Found {len(data)} evaluations")
        
        if not isinstance(data, list):
            log_fail("Response is not an array")
            return False
        
        # Check no _id
        if not check_no_mongo_id(data):
            return False
        
        # Check for general field in evaluations with scores
        has_general = False
        for ev in data:
            if 'general' in ev:
                has_general = True
                log_info(f"Evaluation {ev.get('folio')} has general score: {ev['general']}")
        
        if has_general:
            log_pass("Evaluations list includes computed general scores")
        else:
            log_info("No evaluations with general scores yet (may be expected)")
        
        return True
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False

def test_12_get_evaluation_pdf(eval_id: str):
    """Test 12: GET /api/evaluations/<id>/pdf -> 200, Content-Type: application/pdf, valid PDF"""
    log_test(12, "GET /api/evaluations/<id>/pdf - CRITICAL: PDF generation")
    
    try:
        response = requests.get(f"{BASE_URL}/evaluations/{eval_id}/pdf", timeout=30)
        log_info(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail(f"Expected 200, got {response.status_code}")
            log_info(f"Response: {response.text[:500]}")
            return False
        
        # Check Content-Type header
        content_type = response.headers.get('Content-Type', '')
        log_info(f"Content-Type: {content_type}")
        
        if 'application/pdf' not in content_type:
            log_fail(f"Expected Content-Type: application/pdf, got {content_type}")
            return False
        
        # Check Content-Disposition header
        content_disp = response.headers.get('Content-Disposition', '')
        log_info(f"Content-Disposition: {content_disp}")
        
        if 'HGE-2026-' not in content_disp or 'MARIA_LOPEZ' not in content_disp:
            log_fail(f"Filename doesn't match expected pattern: {content_disp}")
            return False
        
        # Check PDF magic bytes
        pdf_bytes = response.content
        log_info(f"PDF size: {len(pdf_bytes)} bytes")
        
        if len(pdf_bytes) < 100:
            log_fail(f"PDF too small: {len(pdf_bytes)} bytes")
            return False
        
        # Check for PDF signature
        if not pdf_bytes.startswith(b'%PDF'):
            log_fail("Response doesn't start with %PDF signature")
            log_info(f"First 20 bytes: {pdf_bytes[:20]}")
            return False
        
        log_pass(f"✨ PDF generated successfully! Size: {len(pdf_bytes)} bytes, valid PDF format")
        return True
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False

def test_13_get_dashboard():
    """Test 13: GET /api/dashboard -> 200, correct counts"""
    log_test(13, "GET /api/dashboard - Statistics")
    
    try:
        response = requests.get(f"{BASE_URL}/dashboard", timeout=10)
        log_info(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail(f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        log_info(f"Dashboard: {json.dumps(data, indent=2)}")
        
        # Check required fields
        required = ['employees', 'evaluations', 'completed', 'draft', 'avgGeneral', 'recent']
        for field in required:
            if field not in data:
                log_fail(f"Missing field: {field}")
                return False
        
        # Verify counts are numbers
        if not isinstance(data['employees'], int):
            log_fail(f"employees should be int, got {type(data['employees'])}")
            return False
        
        if not isinstance(data['evaluations'], int):
            log_fail(f"evaluations should be int, got {type(data['evaluations'])}")
            return False
        
        # Verify recent is array
        if not isinstance(data['recent'], list):
            log_fail(f"recent should be array, got {type(data['recent'])}")
            return False
        
        log_pass(f"Dashboard stats: {data['employees']} employees, {data['evaluations']} evaluations")
        return True
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False

def test_14_delete_evaluation(eval_id: str):
    """Test 14: DELETE /api/evaluations/<id> -> 200, then GET -> 404"""
    log_test(14, "DELETE /api/evaluations/<id> - Delete and verify")
    
    try:
        # Delete
        response = requests.delete(f"{BASE_URL}/evaluations/{eval_id}", timeout=10)
        log_info(f"Delete status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail(f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        if not data.get('success'):
            log_fail(f"Delete didn't return success: {data}")
            return False
        
        # Verify it's gone
        response = requests.get(f"{BASE_URL}/evaluations/{eval_id}", timeout=10)
        log_info(f"GET after delete status: {response.status_code}")
        
        if response.status_code != 404:
            log_fail(f"Expected 404 after delete, got {response.status_code}")
            return False
        
        log_pass("Evaluation deleted successfully and verified")
        return True
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False

def test_15_delete_employee(employee_id: str):
    """Test 15: DELETE /api/employees/<id> -> 200"""
    log_test(15, "DELETE /api/employees/<id> - Delete employee")
    
    try:
        response = requests.delete(f"{BASE_URL}/employees/{employee_id}", timeout=10)
        log_info(f"Status: {response.status_code}")
        
        if response.status_code != 200:
            log_fail(f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        if not data.get('success'):
            log_fail(f"Delete didn't return success: {data}")
            return False
        
        log_pass("Employee deleted successfully")
        return True
        
    except Exception as e:
        log_fail(f"Exception: {str(e)}")
        return False

def main():
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}NURSING ANNUAL EVALUATION SYSTEM - BACKEND API TEST SUITE{Colors.RESET}")
    print(f"{Colors.BLUE}Base URL: {BASE_URL}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    results = []
    
    # Test 1: GET config
    results.append(("Test 1: GET /api/config", test_1_get_config()))
    
    # Test 2: PUT config
    results.append(("Test 2: PUT /api/config", test_2_put_config()))
    
    # Test 3: POST employee
    success, employee_id = test_3_post_employee()
    results.append(("Test 3: POST /api/employees", success))
    
    if not employee_id:
        log_fail("Cannot continue without employee_id")
        print_summary(results)
        sys.exit(1)
    
    # Test 4: POST employee missing fields
    results.append(("Test 4: POST /api/employees (invalid)", test_4_post_employee_missing_fields()))
    
    # Test 5: GET employees
    results.append(("Test 5: GET /api/employees", test_5_get_employees()))
    
    # Test 6: POST evaluation (first)
    success, eval_id_1, seq_1 = test_6_post_evaluation(employee_id)
    results.append(("Test 6: POST /api/evaluations (first)", success))
    
    if not eval_id_1:
        log_fail("Cannot continue without eval_id_1")
        print_summary(results)
        sys.exit(1)
    
    # Test 7: POST evaluation (second - folio increment)
    success, eval_id_2 = test_7_post_second_evaluation(employee_id, seq_1)
    results.append(("Test 7: POST /api/evaluations (second)", success))
    
    # Test 8: POST evaluation invalid employee
    results.append(("Test 8: POST /api/evaluations (invalid)", test_8_post_evaluation_invalid_employee()))
    
    # Test 9: PUT evaluation
    results.append(("Test 9: PUT /api/evaluations/<id>", test_9_put_evaluation(eval_id_1)))
    
    # Test 10: GET evaluation
    results.append(("Test 10: GET /api/evaluations/<id>", test_10_get_evaluation(eval_id_1)))
    
    # Test 11: GET evaluations list
    results.append(("Test 11: GET /api/evaluations", test_11_get_evaluations_list()))
    
    # Test 12: GET PDF (CRITICAL)
    results.append(("Test 12: GET /api/evaluations/<id>/pdf", test_12_get_evaluation_pdf(eval_id_1)))
    
    # Test 13: GET dashboard
    results.append(("Test 13: GET /api/dashboard", test_13_get_dashboard()))
    
    # Test 14: DELETE evaluation
    results.append(("Test 14: DELETE /api/evaluations/<id>", test_14_delete_evaluation(eval_id_1)))
    
    # Clean up second evaluation if it exists
    if eval_id_2:
        requests.delete(f"{BASE_URL}/evaluations/{eval_id_2}", timeout=10)
    
    # Test 15: DELETE employee
    results.append(("Test 15: DELETE /api/employees/<id>", test_15_delete_employee(employee_id)))
    
    print_summary(results)
    
    # Exit with error code if any test failed
    if not all(r[1] for r in results):
        sys.exit(1)

def print_summary(results):
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST SUMMARY{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = f"{Colors.GREEN}✅ PASS{Colors.RESET}" if result else f"{Colors.RED}❌ FAIL{Colors.RESET}"
        print(f"{status} - {test_name}")
    
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    if passed == total:
        print(f"{Colors.GREEN}ALL TESTS PASSED: {passed}/{total}{Colors.RESET}")
    else:
        print(f"{Colors.RED}TESTS FAILED: {total - passed}/{total} failed, {passed}/{total} passed{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")

if __name__ == "__main__":
    main()
