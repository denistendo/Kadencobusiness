from django.db import models

class Investor(models.Model):
    name = models.CharField(max_length=255)
    capital_contributed = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    withdrawals = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    @property
    def current_balance(self):
        return self.capital_contributed - self.withdrawals

    def __str__(self):
        return self.name

class InvestorTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('injection', 'Injection'),
        ('contribution', 'Contribution'),
        ('withdrawal', 'Withdrawal'),
    ]
    investor = models.ForeignKey(Investor, related_name='transactions', on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField()
    date = models.DateField()

    def __str__(self):
        return f"{self.get_type_display()} - {self.amount} by {self.investor.name}"

class Product(models.Model):
    name = models.CharField(max_length=255)
    current_stock = models.IntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    low_stock_threshold = models.IntegerField(default=10)

    def __str__(self):
        return self.name

class Shipment(models.Model):
    STATUS_CHOICES = [
        ('in-transit', 'In Transit'),
        ('received', 'Received'),
        ('partial', 'Partial'),
    ]
    product = models.ForeignKey(Product, related_name='shipments', on_delete=models.CASCADE)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    transport_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estimated_sales = models.DecimalField(max_digits=12, decimal_places=2)
    estimated_profit = models.DecimalField(max_digits=12, decimal_places=2)
    supplier_name = models.CharField(max_length=255, default='System')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in-transit')

    def __str__(self):
        return f"{self.quantity} of {self.product.name}"

class DailySale(models.Model):
    product = models.ForeignKey(Product, related_name='sales', on_delete=models.CASCADE)
    quantity = models.IntegerField()
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()

    def __str__(self):
        return f"Sale: {self.quantity} of {self.product.name} on {self.date}"

class DailyExpense(models.Model):
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()

    def __str__(self):
        return f"Expense: {self.amount} for {self.category} on {self.date}"

class Debtor(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class DebtorItem(models.Model):
    debtor = models.ForeignKey(Debtor, related_name='items', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    labour = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    date_taken = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.description} by {self.debtor.name}"

class DebtorPayment(models.Model):
    item = models.ForeignKey(DebtorItem, related_name='payments', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Payment: {self.amount} for item {self.item.id}"
