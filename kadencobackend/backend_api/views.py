from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum
from datetime import date
from decimal import Decimal
from .models import Investor, InvestorTransaction, Product, Shipment, DailySale, DailyExpense, Debtor, DebtorItem, DebtorPayment, BankTransaction
from .serializers import InvestorSerializer, ProductSerializer, ShipmentSerializer, DailySaleSerializer, DailyExpenseSerializer, DebtorSerializer, BankTransactionSerializer

@api_view(['GET'])
def dashboard_view(request):
    today = date.today()
    today_sales = DailySale.objects.filter(date=today)
    today_expenses = DailyExpense.objects.filter(date=today)

    total_sales_today = today_sales.aggregate(Sum('total'))['total__sum'] or 0
    total_expenses_today = today_expenses.aggregate(Sum('amount'))['amount__sum'] or 0

    total_sales = DailySale.objects.aggregate(Sum('total'))['total__sum'] or 0
    total_expenses = DailyExpense.objects.aggregate(Sum('amount'))['amount__sum'] or 0
    total_debt_payments = DebtorPayment.objects.aggregate(Sum('amount'))['amount__sum'] or 0

    # Group sales and expenses by month
    from django.db.models.functions import TruncMonth
    
    monthly_sales = DailySale.objects.annotate(month=TruncMonth('date')).values('month').annotate(total_sales=Sum('total')).order_by('month')
    monthly_expenses = DailyExpense.objects.annotate(month=TruncMonth('date')).values('month').annotate(total_expenses=Sum('amount')).order_by('month')
    
    # Merge and format for the frontend chart structure
    months_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    monthly_data_map = {m: {'month': m, 'sales': 0, 'expenses': 0} for m in months_order}

    for s in monthly_sales:
        if s['month'] and s['month'].year == today.year:
            m_str = s['month'].strftime('%b')  # e.g 'Jan', 'Feb'
            if m_str in monthly_data_map:
                monthly_data_map[m_str]['sales'] = s['total_sales']

    for e in monthly_expenses:
        if e['month'] and e['month'].year == today.year:
            m_str = e['month'].strftime('%b')
            if m_str in monthly_data_map:
                monthly_data_map[m_str]['expenses'] = e['total_expenses']

    # Convert to list
    monthly_data_list = list(monthly_data_map.values())
    
    # Historical Cash on Hand
    from collections import defaultdict
    historical_coh = defaultdict(lambda: {'sales': Decimal(0), 'expenses': Decimal(0), 'debt': Decimal(0)})
    
    monthly_debt = DebtorPayment.objects.annotate(month=TruncMonth('date')).values('month').annotate(total_debt=Sum('amount')).order_by('month')

    for s in monthly_sales:
        if s['month']:
            historical_coh[s['month']]['sales'] = s['total_sales']
    for e in monthly_expenses:
        if e['month']:
            historical_coh[e['month']]['expenses'] = e['total_expenses']
    for d in monthly_debt:
        if d['month']:
            historical_coh[d['month']]['debt'] = d['total_debt']

    historical_cash = []
    for m_date, data in sorted(historical_coh.items(), reverse=True):
        coh = data['sales'] + data['debt'] - data['expenses']
        historical_cash.append({
            'month_year': m_date.strftime('%B %Y'),
            'cash': coh,
            'is_current': m_date.month == today.month and m_date.year == today.year
        })

    return Response({
        'today_sales': DailySaleSerializer(today_sales, many=True).data,
        'today_expenses': DailyExpenseSerializer(today_expenses, many=True).data,
        'total_sales_today': total_sales_today,
        'total_expenses_today': total_expenses_today,
        'total_sales': total_sales,
        'total_expenses': total_expenses,
        'total_debt_payments': total_debt_payments,
        'monthly_data': monthly_data_list,
        'historical_cash': historical_cash
    })

@api_view(['GET'])
def get_monthly_reports(request):
    # Sends all sales and expenses so the frontend can filter by month, 
    # matching how the frontend 'MonthlyReports.tsx' logic works right now.
    sales = DailySale.objects.all()
    expenses = DailyExpense.objects.all()
    
    # We can reuse the monthly_data structure calculated in dashboard_view
    from django.db.models.functions import TruncMonth
    monthly_sales = DailySale.objects.annotate(month=TruncMonth('date')).values('month').annotate(total_sales=Sum('total')).order_by('month')
    monthly_expenses = DailyExpense.objects.annotate(month=TruncMonth('date')).values('month').annotate(total_expenses=Sum('amount')).order_by('month')
    
    months_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    monthly_data_map = {m: {'month': m, 'sales': 0, 'expenses': 0} for m in months_order}
    
    for s in monthly_sales:
        m_str = s['month'].strftime('%b')
        if m_str in monthly_data_map:
            monthly_data_map[m_str]['sales'] = s['total_sales']
            
    for e in monthly_expenses:
        m_str = e['month'].strftime('%b')
        if m_str in monthly_data_map:
            monthly_data_map[m_str]['expenses'] = e['total_expenses']

    monthly_data_list = list(monthly_data_map.values())
        
    return Response({
        'sales': DailySaleSerializer(sales, many=True).data,
        'expenses': DailyExpenseSerializer(expenses, many=True).data,
        'monthly_data': monthly_data_list
    })

@api_view(['GET'])
def get_investors(request):
    investors = Investor.objects.all()
    serializer = InvestorSerializer(investors, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def add_investor_transaction(request):
    investor_id = request.data.get('investor_id')
    trans_type = request.data.get('type')
    amount = request.data.get('amount')
    description = request.data.get('description', '')
    
    try:
        investor = Investor.objects.get(id=investor_id)
        # Create transaction
        InvestorTransaction.objects.create(
            investor=investor,
            type=trans_type,
            amount=amount,
            description=description,
            date=date.today()
        )
        
        # Update investor totals
        if trans_type in ['injection', 'contribution']:
            investor.capital_contributed += Decimal(str(amount))
        elif trans_type == 'withdrawal':
            investor.withdrawals += Decimal(str(amount))
        investor.save()
        
        return Response({'status': 'success'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_stock(request):
    products = Product.objects.all()
    shipments = Shipment.objects.all().order_by('-date')[:500]
    return Response({
        'products': ProductSerializer(products, many=True).data,
        'shipments': ShipmentSerializer(shipments, many=True).data
    })

@api_view(['POST'])
def add_shipment(request):
    data = request.data
    try:
        product, _ = Product.objects.get_or_create(
            name=data['product_name'],
            defaults={'unit_price': data['unit_price'], 'low_stock_threshold': 10}
        )
        
        # Calculate estimates
        qty = float(data['quantity'])
        u_price = float(data['unit_price'])
        t_cost = float(data['transport_cost'] or 0)
        
        # Assuming selling price is roughly unit_price * 1.2
        est_sales = qty * (u_price * 1.2)
        est_profit = est_sales - (qty * u_price) - t_cost

        shipment = Shipment.objects.create(
            product=product,
            quantity=qty,
            unit_price=u_price,
            transport_cost=t_cost,
            estimated_sales=est_sales,
            estimated_profit=est_profit,
            supplier_name=data.get('supplier_name', 'System'),
            date=date.today(),
            status=data['status']
        )
        
        if data['status'] == 'received':
            product.current_stock += qty
            product.save()
            
        return Response({'status': 'success', 'shipment_id': shipment.id})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def edit_shipment(request, shipment_id):
    data = request.data
    try:
        shipment = Shipment.objects.get(id=shipment_id)
        
        # Revert old stock impact
        if shipment.status == 'received':
            old_product = shipment.product
            old_product.current_stock -= shipment.quantity
            old_product.save()

        # Update product if it changed
        product, _ = Product.objects.get_or_create(
            name=data.get('product_name', old_product.name),
            defaults={'unit_price': data.get('unit_price', shipment.unit_price), 'low_stock_threshold': 10}
        )
        
        qty = float(data.get('quantity', shipment.quantity))
        u_price = float(data.get('unit_price', shipment.unit_price))
        t_cost = float(data.get('transport_cost', shipment.transport_cost))
        
        est_sales = qty * (u_price * 1.2)
        est_profit = est_sales - (qty * u_price) - t_cost
        
        shipment.product = product
        shipment.quantity = qty
        shipment.unit_price = u_price
        shipment.transport_cost = t_cost
        shipment.estimated_sales = est_sales
        shipment.estimated_profit = est_profit
        shipment.supplier_name = data.get('supplier_name', shipment.supplier_name)
        status_val = data.get('status', shipment.status)
        shipment.status = status_val
        shipment.save()
        
        # Apply new stock impact
        if status_val == 'received':
            product.current_stock += qty
            product.save()
            
        return Response({'status': 'success'})
    except Shipment.DoesNotExist:
        return Response({'error': 'Shipment not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_shipment(request, shipment_id):
    try:
        shipment = Shipment.objects.get(id=shipment_id)
        
        if shipment.status == 'received':
            product = shipment.product
            product.current_stock -= shipment.quantity
            product.save()
            
        shipment.delete()
        return Response({'status': 'success'})
    except Shipment.DoesNotExist:
        return Response({'error': 'Shipment not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_sales(request):
    sales = DailySale.objects.select_related('product').all().order_by('-date')[:500]
    return Response(DailySaleSerializer(sales, many=True).data)

@api_view(['POST'])
def add_sale(request):
    data = request.data
    try:
        product, _ = Product.objects.get_or_create(
            name=data['product_name'],
            defaults={'unit_price': data['selling_price'], 'low_stock_threshold': 10}
        )
        qty = float(data['quantity'])

        sale = DailySale.objects.create(
            product=product,
            quantity=qty,
            selling_price=data['selling_price'],
            total=data['total'],
            date=date.today()
        )
        
        product.current_stock -= qty
        product.save()
        
        return Response({'status': 'success', 'sale_id': sale.id})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def edit_sale(request, sale_id):
    data = request.data
    try:
        sale = DailySale.objects.get(id=sale_id)
        
        # Revert old stock impact
        old_product = sale.product
        old_product.current_stock += sale.quantity
        old_product.save()

        # Update product if it changed
        product, _ = Product.objects.get_or_create(
            name=data.get('product_name', old_product.name),
            defaults={'unit_price': data.get('selling_price', sale.selling_price), 'low_stock_threshold': 10}
        )
        
        qty = float(data.get('quantity', sale.quantity))
        
        sale.product = product
        sale.quantity = qty
        sale.selling_price = data.get('selling_price', sale.selling_price)
        sale.total = data.get('total', sale.total)
        sale.save()
        
        # Apply new stock impact
        product.current_stock -= qty
        product.save()
        
        return Response({'status': 'success'})
    except DailySale.DoesNotExist:
        return Response({'error': 'Sale not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_sale(request, sale_id):
    try:
        sale = DailySale.objects.get(id=sale_id)
        
        product = sale.product
        product.current_stock += sale.quantity
        product.save()
        
        sale.delete()
        return Response({'status': 'success'})
    except DailySale.DoesNotExist:
        return Response({'error': 'Sale not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_expenses(request):
    expenses = DailyExpense.objects.all().order_by('-date')[:500]
    return Response(DailyExpenseSerializer(expenses, many=True).data)

@api_view(['POST'])
def add_expense(request):
    data = request.data
    try:
        expense = DailyExpense.objects.create(
            category=data['category'],
            description=data.get('description', ''),
            amount=data['amount'],
            date=data.get('date', date.today())
        )
        return Response({'status': 'success', 'expense_id': expense.id})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def edit_expense(request, expense_id):
    data = request.data
    try:
        expense = DailyExpense.objects.get(id=expense_id)
        
        if 'category' in data:
            expense.category = data['category']
        if 'description' in data:
            expense.description = data['description']
        if 'amount' in data:
            expense.amount = data['amount']
        
        expense.save()
        return Response({'status': 'success'})
    except DailyExpense.DoesNotExist:
        return Response({'error': 'Expense not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_expense(request, expense_id):
    try:
        expense = DailyExpense.objects.get(id=expense_id)
        expense.delete()
        return Response({'status': 'success'})
    except DailyExpense.DoesNotExist:
        return Response({'error': 'Expense not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_debtors(request):
    debtors = Debtor.objects.all()
    return Response({"debtors": DebtorSerializer(debtors, many=True).data})

@api_view(['POST'])
def add_debtor_item(request):
    data = request.data
    try:
        debtor, _ = Debtor.objects.get_or_create(
            name=data['name'], 
            defaults={'phone': data.get('phone', '')}
        )
        
        # If phone is updated
        if data.get('phone') and debtor.phone != data['phone']:
            debtor.phone = data['phone']
            debtor.save()

        qty = float(data['quantity'])
        u_price = float(data['unit_price'])
        labour = float(data.get('labour', 0))
        total = (qty * u_price) + labour

        item = DebtorItem.objects.create(
            debtor=debtor,
            description=data['description'],
            quantity=qty,
            unit_price=u_price,
            labour=labour,
            total=total
        )
        return Response({'status': 'success', 'debtor_id': debtor.id, 'item_id': item.id})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def record_debtor_payment(request):
    data = request.data
    try:
        item = DebtorItem.objects.get(id=data['item_id'])
        payment = DebtorPayment.objects.create(
            item=item,
            amount=data['amount']
        )
        return Response({'status': 'success', 'payment_id': payment.id})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def edit_debtor_payment(request, payment_id):
    data = request.data
    try:
        payment = DebtorPayment.objects.get(id=payment_id)
        if 'amount' in data:
            payment.amount = data['amount']
        payment.save()
        return Response({'status': 'success'})
    except DebtorPayment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_debtor_payment(request, payment_id):
    try:
        payment = DebtorPayment.objects.get(id=payment_id)
        payment.delete()
        return Response({'status': 'success'})
    except DebtorPayment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_debtor_item(request, item_id):
    try:
        item = DebtorItem.objects.get(id=item_id)
        debtor = item.debtor
        item.delete()

        # Check if the debtor has any items left. If not, delete the debtor entirely.
        if debtor.items.count() == 0:
            debtor.delete()

        return Response({'status': 'success'})
    except DebtorItem.DoesNotExist:
        return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def edit_debtor_item(request, item_id):
    data = request.data
    try:
        item = DebtorItem.objects.get(id=item_id)
        
        # We only allow editing the specific item quantities/prices
        # If the user needs to actually move an item to another person, they should delete and recreate.
        if 'description' in data:
            item.description = data['description']
            
        qty = float(data.get('quantity', item.quantity))
        u_price = float(data.get('unit_price', item.unit_price))
        labour = float(data.get('labour', item.labour))
        
        item.quantity = qty
        item.unit_price = u_price
        item.labour = labour
        item.total = (qty * u_price) + labour
        
        item.save()
        return Response({'status': 'success', 'item_id': item.id})
    except DebtorItem.DoesNotExist:
        return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_bank_transactions(request):
    transactions = BankTransaction.objects.all().order_by('-date', '-id')
    
    total_deposits = transactions.filter(type='deposit').aggregate(Sum('amount'))['amount__sum'] or 0
    total_withdrawals = transactions.filter(type='withdrawal').aggregate(Sum('amount'))['amount__sum'] or 0
    total_balance = total_deposits - total_withdrawals

    return Response({
        'transactions': BankTransactionSerializer(transactions, many=True).data,
        'total_balance': total_balance,
        'total_deposits': total_deposits,
        'total_withdrawals': total_withdrawals
    })

@api_view(['POST'])
def add_bank_transaction(request):
    data = request.data
    try:
        transaction = BankTransaction.objects.create(
            type=data['type'],
            amount=data['amount'],
            description=data.get('description', ''),
            date=data.get('date', date.today())
        )
        return Response({'status': 'success', 'transaction_id': transaction.id})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
def edit_bank_transaction(request, transaction_id):
    data = request.data
    try:
        transaction = BankTransaction.objects.get(id=transaction_id)
        if 'type' in data:
            transaction.type = data['type']
        if 'amount' in data:
            transaction.amount = data['amount']
        if 'description' in data:
            transaction.description = data['description']
        if 'date' in data:
            transaction.date = data['date']
        
        transaction.save()
        return Response({'status': 'success'})
    except BankTransaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_bank_transaction(request, transaction_id):
    try:
        transaction = BankTransaction.objects.get(id=transaction_id)
        transaction.delete()
        return Response({'status': 'success'})
    except BankTransaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
