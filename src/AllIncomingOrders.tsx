import { useState, useEffect } from 'react';
import ExcelReader from './ExcelReader';
import { ProviderModal } from './ProviderModal';

type Order = {
  id: number;
  orderDate: string;
  providerId: number;
  provider: {
    id: number;
    name: string;
  };
  orderDetails: OrderDetail[];
};

type OrderDetail = {
  id: number;
  price: number;
  shippingCost: number;
  OrderQuantity: number;
  ExpectedDate: string;
  productId: number;
  product?: { // Added optional product property
    id: number;
    name: string;
  };
  addressId: number;
  address?: { // Added optional address property
    id: number;
    street: string;
    city: string;
    zipCode: string;
  };
  warehouseId: number;
  warehouse?: { // Added optional warehouse property
    id: number;
    name: string;
  };
};

const OrdersComponent = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:3000/orders', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401) {
          setAuthError(true);
          setError('Please log in to view orders');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-red-800">Authentication Required</h2>
        <p className="mt-2 text-red-600">You need to be logged in to view orders.</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-red-800">Error</h2>
        <p className="mt-2 text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-blue-50 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-blue-800">No Orders Found</h2>
        <p className="mt-2 text-blue-600">There are no orders to display at this time.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      
      <div className="space-y-8">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Order #{order.id}</h2>
                <p className="text-gray-600">
                  Date: {new Date(order.orderDate).toLocaleDateString()}
                </p>
                <p className="text-gray-600">Provider: {order.provider.name}</p>
              </div>
            </div>

            {order.orderDetails.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Line Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Shipping
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expected Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Warehouse
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.orderDetails.map((detail) => (
                        <tr key={detail.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {detail.product?.name || `Product ${detail.productId}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {detail.OrderQuantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            ${detail.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            ${(detail.price * detail.OrderQuantity).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            ${detail.shippingCost.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(detail.ExpectedDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {detail.warehouse?.name || `Warehouse ${detail.warehouseId}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div>
                    {order.orderDetails[0]?.address && (
                      <p className="text-sm text-gray-600">
                        Shipping to: {order.orderDetails[0].address.street}, {order.orderDetails[0].address.city}, {order.orderDetails[0].address.zipCode}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      Subtotal: $
                      {order.orderDetails.reduce(
                        (sum, detail) => sum + (detail.price * detail.OrderQuantity),
                        0
                      ).toFixed(2)}
                    </p>
                    <p className="font-semibold">
                      Shipping: $
                      {order.orderDetails.reduce(
                        (sum, detail) => sum + detail.shippingCost,
                        0
                      ).toFixed(2)}
                    </p>
                    <p className="font-semibold text-lg mt-1">
                      Order Total: $
                      {order.orderDetails.reduce(
                        (sum, detail) => sum + (detail.price * detail.OrderQuantity) + detail.shippingCost,
                        0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-gray-500">
                This order has no details
              </div>
            )}
          </div>
        ))}
      </div>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Add Provider
      </button>

      <ProviderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)} // Trigger data refresh
      />
      <ExcelReader />
    </div>
  );
};

export default OrdersComponent;