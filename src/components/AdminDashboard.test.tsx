import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import type { GameCategoryDetail, Order } from '../types';

const mockOrders: Order[] = [
  {
    id: 'order-abc123',
    category: 'mlbb_diamonds',
    packageName: 'Diamond Pack',
    amount: 1,
    priceMmk: 2800,
    gameId: 'player123',
    telegramUsername: '@adminuser',
    contactPhone: '09999999999',
    paymentMethod: 'WavePay',
    transactionId: 'tx-admin-123',
    screenshotUrl: 'https://example.com/admin-receipt.png',
    status: 'completed',
    createdAt: '2026-06-10T12:00:00Z',
    updatedAt: '2026-06-10T12:00:00Z',
    ocrVerified: true,
  },
];

const mockCatalog: GameCategoryDetail[] = [];

describe('AdminDashboard', () => {
  it('renders admin receipt download link after viewing an order receipt', async () => {
    render(
      <AdminDashboard
        orders={mockOrders}
        onRefreshOrders={() => {}}
        telegramUser="@adminuser"
        t={{
          adminTabOrders: 'Orders',
          adminDashboardHeader: 'Admin Dashboard',
        }}
        catalog={mockCatalog}
        onRefreshProducts={() => {}}
        onAdminLogout={() => {}}
      />
    );

    const ordersTab = screen.getByRole('button', { name: /orders/i });
    expect(ordersTab).toBeTruthy();
    fireEvent.click(ordersTab);

    const viewReceiptButton = await screen.findByRole('button', { name: /view receipt/i });
    expect(viewReceiptButton).toBeTruthy();
    fireEvent.click(viewReceiptButton);

    const downloadLink = await screen.findByRole('link', { name: /save offline/i });
    expect(downloadLink).toBeTruthy();
    expect(downloadLink?.getAttribute('href')).toBe(mockOrders[0].screenshotUrl);
    expect(downloadLink?.getAttribute('download')).toBe('admin-ticket-ABC123.png');
    expect(downloadLink?.getAttribute('target')).toBe('_blank');
    expect(downloadLink?.getAttribute('rel')).toBe('noreferrer');
  });
});
