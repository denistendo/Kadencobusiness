from django.contrib import admin
from .models import Investor, InvestorTransaction, Product, Shipment, DailySale, DailyExpense, Debtor, DebtorItem, DebtorPayment

# Register your models here.

@admin.register(Investor)
class InvestorAdmin(admin.ModelAdmin):
    list_display = ('name', 'capital_contributed', 'withdrawals', 'current_balance')
    search_fields = ('name',)

@admin.register(InvestorTransaction)
class InvestorTransactionAdmin(admin.ModelAdmin):
    list_display = ('investor', 'type', 'amount', 'date')
    list_filter = ('type', 'date')
    search_fields = ('investor__name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'current_stock', 'unit_price', 'low_stock_threshold')
    search_fields = ('name',)

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'status', 'date')
    list_filter = ('status', 'date')
    search_fields = ('product__name',)

@admin.register(DailySale)
class DailySaleAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'selling_price', 'total', 'date')
    list_filter = ('date',)
    search_fields = ('product__name',)

@admin.register(DailyExpense)
class DailyExpenseAdmin(admin.ModelAdmin):
    list_display = ('description', 'category', 'amount', 'date')
    list_filter = ('category', 'date')
    search_fields = ('description', 'category')

@admin.register(Debtor)
class DebtorAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone')
    search_fields = ('name', 'phone')

@admin.register(DebtorItem)
class DebtorItemAdmin(admin.ModelAdmin):
    list_display = ('debtor', 'description', 'quantity', 'total', 'date_taken')
    list_filter = ('date_taken',)
    search_fields = ('debtor__name', 'description')

@admin.register(DebtorPayment)
class DebtorPaymentAdmin(admin.ModelAdmin):
    list_display = ('item', 'amount', 'date')
    list_filter = ('date',)
    search_fields = ('item__description', 'item__debtor__name')
