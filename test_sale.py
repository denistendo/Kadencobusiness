import urllib.request
import json
import urllib.error

data = json.dumps({
    'product_name': 'RED G.NUTS', 
    'quantity': 10, 
    'selling_price': 5000,
    'total': 50000
}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/api/sales/add/', data=data, headers={'Content-Type': 'application/json'})

try:
    print(urllib.request.urlopen(req).read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.read().decode('utf-8'))
