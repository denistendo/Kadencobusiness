import re

files = [
    'src/pages/DailySales.tsx',
    'src/pages/DailySalesDetails.tsx',
    'src/pages/DailyExpenses.tsx',
    'src/pages/DailyExpensesDetails.tsx'
]

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    content = re.sub(r'\.toLocaleString\(\)', '.toLocaleString("en-US", { maximumFractionDigits: 0 })', content)
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print("Done")
