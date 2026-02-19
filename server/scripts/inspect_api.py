import requests

try:
    response = requests.get('http://localhost:3000/api/calculations/eos/aggregated?fiscalYearEnd=2024-12-31')
    data = response.json()
    print("Summary keys:", data['summary'].keys())
    print("Total Leave Deductions:", data['summary'].get('totalLeaveDeductions'))
    print("Total Other Deductions:", data['summary'].get('totalOtherDeductions'))
except Exception as e:
    print(e)
