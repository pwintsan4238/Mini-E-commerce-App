import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import OrderHistory from './OrderHistory';
import type { Order } from '../types';

const mockOrders: Order[] = [
  {
    id: 'order-abc123',
    category: 'tiktok_coins',
    packageName: 'Starter Pack',
    amount: 1,
    priceMmk: 1500,
    gameId: '123456',
    telegramUsername: '@testuser',
    contactPhone: '09999999999',
    paymentMethod: 'KBZPay',
    transactionId: 'tx-abc123',
    screenshotUrl: 'https://example.com/receipt.png',
    status: 'completed',
    createdAt: '2026-06-10T12:00:00Z',
    updatedAt: '2026-06-10T12:00:00Z',
  },
];

describe('OrderHistory', () => {
  it('renders a receipt download link after viewing a receipt', async () => {
    render(
      <OrderHistory
        orders={mockOrders}
        telegramUser="@testuser"
        t={{
          ordersHeader: 'Order History',
          viewReceipt: 'View Receipt',
        }}
      />
    );

    const viewReceiptButton = screen.getByRole('button', { name: /view receipt/i });
    expect(viewReceiptButton).toBeTruthy();

    fireEvent.click(viewReceiptButton);

    const downloadLink = await screen.findByRole('link', { name: /save offline/i });
    expect(downloadLink).toBeTruthy();
    expect(downloadLink?.getAttribute('href')).toBe(mockOrders[0].screenshotUrl);
    expect(downloadLink?.getAttribute('download')).toBe('ticket-ABC123.png');
    expect(downloadLink?.getAttribute('target')).toBe('_blank');
    expect(downloadLink?.getAttribute('rel')).toBe('noreferrer');
  });
});
