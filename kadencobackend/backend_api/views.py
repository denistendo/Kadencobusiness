from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum
from datetime import date
from .models import Investor, InvestorTransaction, Product, Shipment, DailySale, DailyExpense, Debtor, DebtorItem, DebtorPayment
from .serializers import InvestorSerializer, ProductSerializer, ShipmentSerializer, DailySaleSerializer, DailyExpenseSerializer, DebtorSerializer

@api_view(['GET'])
def dashboard_view(request):
    today = date.today()
    today_sales = DailySale.objects.filter(date=today)
    today_expenses = DailyExpense.objects.filter(date=today)

    total_sales_today = today_sales.aggregate(Sum('total'))['total__sum'] or 0
    total_expenses_today = today_expenses.aggregate(Sum('amount'))['amount__sum'] or 0

    total_sales = DailySale.objects.aggregate(Sum('total'))['total__sum'] or 0
    total_expenses = DailyExpense.objects.aggregate(Sum('amount'))['amount__sum'] or 0

    # Group sales and expenses by month
    from django.db.models.functions import TruncMonth
    
    monthly_sales = DailySale.objects.annotate(month=TruncMonth('date')).values('month').annotate(total_sales=Sum('total')).order_by('month')
    monthly_expenses = DailyExpense.objects.annotate(month=TruncMonth('date')).values('month').annotate(total_expenses=Sum('amount')).order_by('month')
    
    # Merge and format for the frontend chart structure
    monthly_data_map = {}
    for s in monthly_sales:
        m_str = s['month'].strftime('%b')  # e.g 'Jan', 'Feb'
        if m_str not in monthly_data_map:
            monthly_data_map[m_str] = {'month': m_str, 'sales': 0, 'expenses': 0}
        monthly_data_map[m_str]['sales'] = s['total_sales']

    for e in monthly_expenses:
        m_str = e['month'].strftime('%b')
        if m_str not in monthly_data_map:
            monthly_data_map[m_str] = {'month': m_str, 'sales': 0, 'expenses': 0}
        monthly_data_map[m_str]['expenses'] = e['total_expenses']

    # Convert to list and ensure a minimal set of months exists if empty
    monthly_data_list = list(monthly_data_map.values())
    if not monthly_data_list:
        monthly_data_list = [
            {'month': 'Jan', 'sales': 0, 'expenses': 0},
            {'month': 'Feb', 'sales': 0, 'expenses': 0},
            {'month': 'Mar', 'sales': 0, 'expenses': 0},
            {'month': 'Apr', 'sales': 0, 'expenses': 0},
        ]


    return Response({
        'today_sales': DailySaleSerializer(today_sales, many=True).data,
        'today_expenses': DailyExpenseSerializer(today_expenses, many=True).data,
        'total_sales_today': total_sales_today,
        'total_expenses_today': total_expenses_today,
        'total_sales': total_sales,
        'total_expenses': total_expenses,
        'monthly_data': monthly_data_list
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
    
    monthly_data_map = {}
    for s in monthly_sales:
        m_str = s['month'].strftime('%b')
        if m_str not in monthly_data_map:
            monthly_data_map[m_str] = {'month': m_str, 'sales': 0, 'expenses': 0}
        monthly_data_map[m_str]['sales'] = s['total_sales']
    for e in monthly_expenses:
        m_str = e['month'].strftime('%b')
        if m_str not in monthly_data_map:
            monthly_data_map[m_str] = {'month': m_str, 'sales': 0, 'expenses': 0}
        monthly_data_map[m_str]['expenses'] = e['total_expenses']

    monthly_data_list = list(monthly_data_map.values())
    if not monthly_data_list:
        monthly_data_list = [{'month': 'Jan', 'sales': 0, 'expenses': 0}]
        
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
        if trans_type == 'injection':
            investor.capital_contributed += float(amount)
        elif trans_type == 'withdrawal':
            investor.withdrawals += float(amount)
        investor.save()
        
        return Response({'status': 'success'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_stock(request):
    products = Product.objects.all()
    shipments = Shipment.objects.all().order_by('-date')[:10]
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
            date=date.today(),
            status=data['status']
        )
        
        if data['status'] == 'received':
            product.current_stock += qty
            product.save()
            
        return Response({'status': 'success', 'shipment_id': shipment.id})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_sales(request):
    sales = DailySale.objects.all().order_by('-date')[:50]
    return Response(DailySaleSerializer(sales, many=True).data)

@api_view(['POST'])
def add_sale(request):
    data = request.data
    try:
        product = Product.objects.get(name=data['product_name'])
        qty = float(data['quantity'])
        
        if product.current_stock < qty:
            return Response({'error': 'Not enough stock'}, status=status.HTTP_400_BAD_REQUEST)

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

@api_view(['GET'])
def get_expenses(request):
    expenses = DailyExpense.objects.all().order_by('-date')[:50]
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
