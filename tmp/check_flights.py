import sys
import json

data = json.load(sys.stdin)
plans = data['plans']

print('=== Beijing->New York Flight Fees ===')
for i, p in enumerate(plans):
    print(f"Plan {i+1} ({p['flightClass']}): Flight Fee = ${p['flightFee']}, Highlight = {p['highlights'][0]}")
