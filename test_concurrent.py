#!/usr/bin/env python3
"""
Test MongoDB connection race condition with concurrent requests
"""

import requests
import concurrent.futures
import time

BASE_URL = "https://nurse-eval-system.preview.emergentagent.com/api"

def make_request(i):
    """Make a single request to the config endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/config", timeout=5)
        return (i, response.status_code, response.ok)
    except Exception as e:
        return (i, 0, False, str(e))

def test_concurrent_requests():
    """Test 20 concurrent requests to verify no race condition"""
    print("Testing MongoDB connection with 20 concurrent requests...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(make_request, i) for i in range(20)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]
    
    # Check results
    success_count = sum(1 for r in results if r[2])
    fail_count = len(results) - success_count
    
    print(f"\nResults: {success_count}/20 successful, {fail_count}/20 failed")
    
    if fail_count > 0:
        print("\n❌ FAILED requests:")
        for r in results:
            if not r[2]:
                print(f"  Request {r[0]}: Status {r[1]}")
                if len(r) > 3:
                    print(f"    Error: {r[3]}")
        return False
    else:
        print("✅ All concurrent requests succeeded - no race condition!")
        return True

if __name__ == "__main__":
    success = test_concurrent_requests()
    exit(0 if success else 1)
