from rest_framework import serializers
from .models import Investor, InvestorTransaction, Product, Shipment, DailySale, DailyExpense, Debtor, DebtorItem, DebtorPayment, BankTransaction

class InvestorTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestorTransaction
        fields = '__all__'

class InvestorSerializer(serializers.ModelSerializer):
    current_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    transactions = InvestorTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Investor
        fields = ['id', 'name', 'capital_contributed', 'withdrawals', 'current_balance', 'transactions']

class ShipmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Shipment
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    shipments = ShipmentSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

class DailySaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = DailySale
        fields = '__all__'

class DailyExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyExpense
        fields = '__all__'

class DebtorPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DebtorPayment
        fields = '__all__'

class DebtorItemSerializer(serializers.ModelSerializer):
    payments = DebtorPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = DebtorItem
        fields = '__all__'

class DebtorSerializer(serializers.ModelSerializer):
    items = DebtorItemSerializer(many=True, read_only=True)

    class Meta:
        model = Debtor
        fields = ['id', 'name', 'phone', 'items']

class BankTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankTransaction
        fields = '__all__'
