from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_view, name='dashboard'),
    
    path('investors/', views.get_investors, name='investors-list'),
    path('investors/transaction/', views.add_investor_transaction, name='add-transaction'),
    
    path('stock/', views.get_stock, name='stock-list'),
    path('shipments/add/', views.add_shipment, name='add-shipment'),
    
    path('sales/', views.get_sales, name='sales-list'),
    path('sales/add/', views.add_sale, name='add-sale'),
    
    path('expenses/', views.get_expenses, name='expenses-list'),
    path('expenses/add/', views.add_expense, name='add-expense'),
    
    path('monthly-reports/', views.get_monthly_reports, name='monthly-reports'),
    
    path('debtors/', views.get_debtors, name='debtors-list'),
    path('debtors/add/', views.add_debtor_item, name='add-debtor-item'),
    path('debtors/record-payment/', views.record_debtor_payment, name='record-debtor-payment'),
    path('debtors/item/<int:item_id>/delete/', views.delete_debtor_item, name='delete-debtor-item'),
    path('debtors/item/<int:item_id>/edit/', views.edit_debtor_item, name='edit-debtor-item'),
]
