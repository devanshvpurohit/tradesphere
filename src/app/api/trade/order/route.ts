import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { marketService } from '@/services/marketService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      symbol,
      quantity,
      orderSide,
      orderType,
      productType,
      limitPrice,
      triggerPrice,
      targetPrice,
      stopLoss,
    } = body;

    // Validate input
    if (!symbol || !quantity || !orderSide || !orderType || !productType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // Get current stock price
    const stockPrice = await marketService.getStockPrice(symbol);
    const currentPrice = stockPrice.price;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle different order types
    if (orderType === 'MARKET') {
      // Execute market order immediately
      return await executeMarketOrder(
        user,
        symbol,
        quantity,
        orderSide,
        productType,
        currentPrice,
        targetPrice,
        stopLoss
      );
    } else if (orderType === 'LIMIT') {
      // Check if limit order can be executed immediately
      const canExecute =
        (orderSide === 'BUY' && currentPrice <= limitPrice!) ||
        (orderSide === 'SELL' && currentPrice >= limitPrice!);

      if (canExecute) {
        return await executeMarketOrder(
          user,
          symbol,
          quantity,
          orderSide,
          productType,
          limitPrice!,
          targetPrice,
          stopLoss
        );
      } else {
        // Create pending limit order
        return await createPendingOrder(
          user.id,
          symbol,
          quantity,
          orderSide,
          orderType,
          productType,
          limitPrice,
          triggerPrice,
          targetPrice,
          stopLoss
        );
      }
    } else if (orderType === 'SL' || orderType === 'SL-M') {
      // Check if stop loss is triggered
      const isTriggered =
        (orderSide === 'BUY' && currentPrice >= triggerPrice!) ||
        (orderSide === 'SELL' && currentPrice <= triggerPrice!);

      if (isTriggered) {
        const executePrice = orderType === 'SL-M' ? currentPrice : limitPrice || currentPrice;
        return await executeMarketOrder(
          user,
          symbol,
          quantity,
          orderSide,
          productType,
          executePrice,
          targetPrice,
          stopLoss
        );
      } else {
        // Create pending stop loss order
        return await createPendingOrder(
          user.id,
          symbol,
          quantity,
          orderSide,
          orderType,
          productType,
          limitPrice,
          triggerPrice,
          targetPrice,
          stopLoss
        );
      }
    }

    return NextResponse.json({ error: 'Invalid order type' }, { status: 400 });
  } catch (error) {
    console.error('Error placing order:', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}

async function executeMarketOrder(
  user: any,
  symbol: string,
  quantity: number,
  orderSide: string,
  productType: string,
  price: number,
  targetPrice?: number,
  stopLoss?: number
) {
  const totalCost = price * quantity;

  if (orderSide === 'BUY') {
    // Check balance
    if (user.balance < totalCost) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Execute buy transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct balance
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: user.balance - totalCost },
      });

      // Update or create portfolio
      const existingPortfolio = await tx.portfolio.findUnique({
        where: {
          userId_stockSymbol: {
            userId: user.id,
            stockSymbol: symbol,
          },
        },
      });

      let portfolio;
      if (existingPortfolio) {
        const newQuantity = existingPortfolio.quantity + quantity;
        const newAvgPrice =
          (existingPortfolio.avgPrice * existingPortfolio.quantity + totalCost) / newQuantity;

        portfolio = await tx.portfolio.update({
          where: { id: existingPortfolio.id },
          data: {
            quantity: newQuantity,
            avgPrice: newAvgPrice,
          },
        });
      } else {
        portfolio = await tx.portfolio.create({
          data: {
            userId: user.id,
            stockSymbol: symbol,
            quantity,
            avgPrice: price,
          },
        });
      }

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: user.id,
          stockSymbol: symbol,
          type: 'BUY',
          quantity,
          price,
          productType,
          orderType: 'MARKET',
        },
      });

      // Create executed order record
      await tx.order.create({
        data: {
          userId: user.id,
          stockSymbol: symbol,
          type: 'BUY',
          orderType: 'MARKET',
          productType,
          quantity,
          price,
          targetPrice,
          stopLoss,
          status: 'EXECUTED',
          executedPrice: price,
          executedAt: new Date(),
        },
      });

      return { updatedUser, portfolio };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully bought ${quantity} shares of ${symbol}`,
      balance: result.updatedUser.balance,
    });
  } else {
    // SELL order
    // Check if user has enough shares
    const portfolio = await prisma.portfolio.findUnique({
      where: {
        userId_stockSymbol: {
          userId: user.id,
          stockSymbol: symbol,
        },
      },
    });

    if (!portfolio || portfolio.quantity < quantity) {
      return NextResponse.json({ error: 'Insufficient shares to sell' }, { status: 400 });
    }

    // Execute sell transaction
    const result = await prisma.$transaction(async (tx) => {
      // Add balance
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: user.balance + totalCost },
      });

      // Update or remove portfolio
      if (portfolio.quantity === quantity) {
        await tx.portfolio.delete({
          where: { id: portfolio.id },
        });
      } else {
        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: { quantity: portfolio.quantity - quantity },
        });
      }

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId: user.id,
          stockSymbol: symbol,
          type: 'SELL',
          quantity,
          price,
          productType,
          orderType: 'MARKET',
        },
      });

      // Create executed order record
      await tx.order.create({
        data: {
          userId: user.id,
          stockSymbol: symbol,
          type: 'SELL',
          orderType: 'MARKET',
          productType,
          quantity,
          price,
          targetPrice,
          stopLoss,
          status: 'EXECUTED',
          executedPrice: price,
          executedAt: new Date(),
        },
      });

      return { updatedUser };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully sold ${quantity} shares of ${symbol}`,
      balance: result.updatedUser.balance,
    });
  }
}

async function createPendingOrder(
  userId: string,
  symbol: string,
  quantity: number,
  orderSide: string,
  orderType: string,
  productType: string,
  limitPrice?: number,
  triggerPrice?: number,
  targetPrice?: number,
  stopLoss?: number
) {
  const order = await prisma.order.create({
    data: {
      userId,
      stockSymbol: symbol,
      type: orderSide,
      orderType,
      productType,
      quantity,
      price: limitPrice,
      triggerPrice,
      targetPrice,
      stopLoss,
      status: 'PENDING',
    },
  });

  return NextResponse.json({
    success: true,
    message: `${orderType} order placed successfully. It will be executed when conditions are met.`,
    orderId: order.id,
  });
}

// GET endpoint to fetch user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
