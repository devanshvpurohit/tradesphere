import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/firebase/auth-helper';
import { firebaseDb } from '@/lib/firebase/db';
import { marketService } from '@/services/marketService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      symbol,
      quantity,
      orderSide,
      orderType,
      productType = 'MIS',
      limitPrice,
      triggerPrice,
      targetPrice,
      stopLoss,
    } = body;

    if (!symbol || !quantity || !orderSide || !orderType) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // Ensure user profile exists
    const userProfile = await firebaseDb.getUser(user.id, user.email);

    // Get current live price
    const stockQuote = await marketService.getStockPrice(symbol);
    const currentPrice = stockQuote.price;

    // Check if order can execute immediately
    let shouldExecuteImmediately = orderType === 'MARKET';

    if (orderType === 'LIMIT' && limitPrice) {
      if (orderSide === 'BUY' && currentPrice <= limitPrice) {
        shouldExecuteImmediately = true;
      } else if (orderSide === 'SELL' && currentPrice >= limitPrice) {
        shouldExecuteImmediately = true;
      }
    }

    if (shouldExecuteImmediately) {
      const executionPrice = orderType === 'LIMIT' && limitPrice ? limitPrice : currentPrice;
      const totalAmount = executionPrice * qty;

      if (orderSide === 'BUY') {
        if (userProfile.balance < totalAmount) {
          return NextResponse.json(
            { error: `Insufficient balance: Required ₹${totalAmount.toLocaleString('en-IN')}, Available ₹${userProfile.balance.toLocaleString('en-IN')}` },
            { status: 400 }
          );
        }

        const tradeResult = await firebaseDb.executeBuy(
          user.id,
          symbol,
          qty,
          executionPrice,
          productType,
          orderType
        );

        if (!tradeResult.success) {
          return NextResponse.json({ error: tradeResult.message }, { status: 400 });
        }

        const order = await firebaseDb.createOrder({
          userId: user.id,
          stockSymbol: symbol,
          type: 'BUY',
          orderType,
          productType,
          quantity: qty,
          price: limitPrice || executionPrice,
          triggerPrice,
          targetPrice,
          stopLoss,
          status: 'EXECUTED',
          executedPrice: executionPrice,
          executedAt: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: `Buy order filled for ${qty} shares of ${symbol} at ₹${executionPrice.toFixed(2)}`,
          order,
          balance: tradeResult.balance,
        });
      } else {
        // SELL
        const holding = await firebaseDb.getHolding(user.id, symbol);
        if (!holding || holding.quantity < qty) {
          return NextResponse.json(
            { error: `Insufficient holdings. You have ${holding?.quantity || 0} shares of ${symbol}` },
            { status: 400 }
          );
        }

        const tradeResult = await firebaseDb.executeSell(
          user.id,
          symbol,
          qty,
          executionPrice,
          productType,
          orderType
        );

        if (!tradeResult.success) {
          return NextResponse.json({ error: tradeResult.message }, { status: 400 });
        }

        const order = await firebaseDb.createOrder({
          userId: user.id,
          stockSymbol: symbol,
          type: 'SELL',
          orderType,
          productType,
          quantity: qty,
          price: limitPrice || executionPrice,
          triggerPrice,
          targetPrice,
          stopLoss,
          status: 'EXECUTED',
          executedPrice: executionPrice,
          executedAt: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: `Sell order filled for ${qty} shares of ${symbol} at ₹${executionPrice.toFixed(2)}`,
          order,
          balance: tradeResult.balance,
        });
      }
    } else {
      // Pending Limit or Stop-Loss Order
      if (orderSide === 'BUY') {
        const requiredBalance = (limitPrice || currentPrice) * qty;
        if (userProfile.balance < requiredBalance) {
          return NextResponse.json(
            { error: 'Insufficient balance to place limit order' },
            { status: 400 }
          );
        }
      } else {
        const holding = await firebaseDb.getHolding(user.id, symbol);
        if (!holding || holding.quantity < qty) {
          return NextResponse.json(
            { error: `Insufficient shares in portfolio to place sell order` },
            { status: 400 }
          );
        }
      }

      const order = await firebaseDb.createOrder({
        userId: user.id,
        stockSymbol: symbol,
        type: orderSide,
        orderType,
        productType,
        quantity: qty,
        price: limitPrice || null,
        triggerPrice: triggerPrice || null,
        targetPrice: targetPrice || null,
        stopLoss: stopLoss || null,
        status: 'PENDING',
      });

      return NextResponse.json({
        success: true,
        message: `${orderType} ${orderSide} order placed successfully! Status: PENDING`,
        order,
      });
    }
  } catch (error: any) {
    console.error('Error placing order:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while placing order' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';

    const orders = await firebaseDb.getOrders(user.id, status);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const cancelled = await firebaseDb.cancelOrder(user.id, orderId);

    if (cancelled) {
      return NextResponse.json({ success: true, message: 'Order cancelled successfully' });
    } else {
      return NextResponse.json({ error: 'Order not found or cannot be cancelled' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
