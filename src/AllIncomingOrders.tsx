import { useState, useEffect } from 'react';
import ExcelReader from './ExcelReader';
import { ProviderModal } from './ProviderModal';
import { api } from './environments/api';
import { useAuth } from './AuthContext';
import { AxiosError } from 'axios';

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

type OrderWithoutId = Omit<Order, 'id'>;

type OrderDetail = {
  id: number;
  price: number;
  shippingCost: number;
  OrderQuantity: number;
  ExpectedDate: string;
  productId: number;
  product?: {
    id: number;
    name: string;
  };
  addressId: number;
  address?: {
    id: number;
    street: string;
    city: string;
    postalCode: string;
  };
  warehouseId: number;
  warehouse?: {
    id: number;
    name: string;
  };
};

type Provider = {
  id: number;
  name: string;
  email: string;
  phone: string;
}

type address = {
  id: number;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const OrdersComponent = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [addresses, setAddresses] = useState<address[] | null>(null);
  const { isLoggedIn } = useAuth();

  const handleDeleteOrder = async (orderId: number) => {
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'Failed to delete order');
    }
  };

  // Update order function
  const handleUpdateOrder = async (id: number, updatedOrder: OrderWithoutId) => {
    try {
      const response = await api.patch(`/orders/${id}`, updatedOrder);
      setOrders(orders.map(order =>
        order.id === id ? response.data : order
      ));
      setEditingOrder(null);
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'Failed to update order');
    }
  };

  const fetchOrders = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'An unknown error occurred');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.get('/orders/provider');
      setProviders(response.data);
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'An unknown error occurred');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }

  const fetchAddresses = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.get('/addresses');
      setAddresses(response.data);
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'An unknown error occurred');
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    fetchProviders();
    fetchAddresses();
  }, [refreshKey]);

  useEffect(() => {
    if (!isLoggedIn) {
      setOrders([]);
      setProviders([]);
      setAddresses([]);
    }
  }, [isLoggedIn]);

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 rounded-lg shadow">
        <button
          onClick={() => {
            setRefreshKey(prev => prev + 1);
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
        <h2 className="text-xl font-semibold text-red-800">Error</h2>
        <p className="mt-2 text-red-600">{error}</p>

      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (orders.length === 0 && !loading) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-blue-50 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-blue-800">No Orders Found</h2>
        <p className="mt-2 text-blue-600">There are no orders to display at this time.</p>
        <button
          onClick={() => {
            setRefreshKey(prev => prev + 1);
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
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
              <div className="flex space-x-2">
                <h2 className="text-xl font-semibold">Order #{order.id}</h2>
                <button
                  onClick={() => setEditingOrder(order)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
                <p className="text-gray-600">
                  Date: {new Date(order.orderDate).toLocaleDateString()}
                </p>
                <p className="text-gray-600">Provider: {order.provider.name}</p>
              </div>
            </div>

            {order.orderDetails.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                          Product
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                          Quantity
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                          Unit Price
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                          Line Total
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                          Shipping
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                          Expected Date
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                          Warehouse
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                          Shipping to
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                          Subtotal
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                          Shipping cost
                        </th>
                        <th className="px-8 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.orderDetails.map((detail) => (
                        <tr key={detail.id}>
                          <td className="px-8 py-4 whitespace-nowrap border border-gray-200">
                            {detail.product?.name || `Product ${detail.productId}`}
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap border border-gray-200">
                            {detail.OrderQuantity}
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap border border-gray-200">
                            ${detail.price.toFixed(2)}
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap border border-gray-200">
                            ${(detail.price * detail.OrderQuantity).toFixed(2)}
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap border border-gray-200">
                            ${detail.shippingCost.toFixed(2)}
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap border border-gray-200">
                            {new Date(detail.ExpectedDate).toLocaleDateString()}
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap border border-gray-200">
                            {detail.warehouse?.name || `Warehouse ${detail.warehouseId}`}
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap border border-gray-200">
                            {detail.address?.street}, {detail.address?.city}, {detail.address?.postalCode}
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap border border-gray-200">
                            HUF {(detail.price * detail.OrderQuantity).toFixed(2)}
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap border border-gray-200">
                            HUF {detail.shippingCost.toFixed(2)}
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap border border-gray-200">
                            HUF {(detail.price * detail.OrderQuantity + detail.shippingCost).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-gray-500">
                This order has no details
              </div>
            )}
          </div>
        ))}

        {editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">Edit Order #{editingOrder.id}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Order Fields */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Order Information</h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order Date</label>
                    <input
                      type="date"
                      value={editingOrder.orderDate.split('T')[0]}
                      onChange={(e) => setEditingOrder({
                        ...editingOrder,
                        orderDate: new Date(e.target.value).toISOString()
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Provider</label>
                    <select
                      value={editingOrder.providerId}  // Add this to control the selected value
                      onChange={(e) => {
                        const selectedProviderId = parseInt(e.target.value);
                        const selectedProvider = providers?.find(p => p.id === selectedProviderId);

                        setEditingOrder({
                          ...editingOrder,
                          providerId: selectedProviderId,
                          provider: {
                            id: selectedProviderId,
                            name: selectedProvider?.name || editingOrder.provider.name
                          }
                        });
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    >
                      {providers?.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Order Details Fields */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Order Details</h4>

                  {editingOrder.orderDetails.map((detail, index) => (
                    <div key={detail.id} className="border p-3 rounded-lg">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700">Product</label>
                        <select
                          value={detail.productId}
                          onChange={(e) => {
                            const updatedDetails = [...editingOrder.orderDetails];
                            updatedDetails[index] = {
                              ...updatedDetails[index],
                              productId: parseInt(e.target.value),
                              product: {
                                ...updatedDetails[index].product,
                                id: parseInt(e.target.value),
                                name: updatedDetails[index].product?.name || 'Default Product Name'
                              }
                            };
                            setEditingOrder({
                              ...editingOrder,
                              orderDetails: updatedDetails
                            });
                          }}
                          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        >
                          <option value={detail.productId}>
                            {detail.product?.name || `Product ${detail.productId}`}
                          </option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Quantity</label>
                          <input
                            type="number"
                            value={detail.OrderQuantity}
                            onChange={(e) => {
                              const updatedDetails = [...editingOrder.orderDetails];
                              updatedDetails[index].OrderQuantity = parseInt(e.target.value);
                              setEditingOrder({
                                ...editingOrder,
                                orderDetails: updatedDetails
                              });
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={detail.price}
                            onChange={(e) => {
                              const updatedDetails = [...editingOrder.orderDetails];
                              updatedDetails[index].price = parseFloat(e.target.value);
                              setEditingOrder({
                                ...editingOrder,
                                orderDetails: updatedDetails
                              });
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Shipping Cost</label>
                          <input
                            type="number"
                            step="0.01"
                            value={detail.shippingCost}
                            onChange={(e) => {
                              const updatedDetails = [...editingOrder.orderDetails];
                              updatedDetails[index].shippingCost = parseFloat(e.target.value);
                              setEditingOrder({
                                ...editingOrder,
                                orderDetails: updatedDetails
                              });
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Expected Date</label>
                          <input
                            type="date"
                            value={detail.ExpectedDate.split('T')[0]}
                            onChange={(e) => {
                              const updatedDetails = [...editingOrder.orderDetails];
                              updatedDetails[index].ExpectedDate = new Date(e.target.value).toISOString();
                              setEditingOrder({
                                ...editingOrder,
                                orderDetails: updatedDetails
                              });
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700">Warehouse</label>
                        <select
                          value={detail.warehouseId}
                          onChange={(e) => {
                            const updatedDetails = [...editingOrder.orderDetails];
                            updatedDetails[index] = {
                              ...updatedDetails[index],
                              warehouseId: parseInt(e.target.value),
                              warehouse: {
                                ...updatedDetails[index].warehouse,
                                id: parseInt(e.target.value),
                                name: updatedDetails[index].warehouse?.name || 'Default Warehouse Name'
                              }
                            };
                            setEditingOrder({
                              ...editingOrder,
                              orderDetails: updatedDetails
                            });
                          }}
                          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        >
                          <option value={detail.warehouseId}>
                            {detail.warehouse?.name || `Warehouse ${detail.warehouseId}`}
                          </option>
                        </select>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700">Shipping Address</label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <input
                            type="text"
                            placeholder="Street"
                            value={detail.address?.street || ''}
                            onChange={(e) => {
                              const updatedDetails = [...editingOrder.orderDetails];
                              updatedDetails[index].address = {
                                ...(updatedDetails[index].address || { id: 0, city: '', postalCode: '' }),
                                street: e.target.value
                              };
                              setEditingOrder({
                                ...editingOrder,
                                orderDetails: updatedDetails
                              });
                            }}
                            className="border border-gray-300 rounded-md p-2"
                          />
                          <input
                            type="text"
                            placeholder="City"
                            value={detail.address?.city || ''}
                            onChange={(e) => {
                              const updatedDetails = [...editingOrder.orderDetails];
                              updatedDetails[index].address = {
                                ...(updatedDetails[index].address || { id: 0, street: '', postalCode: '' }),
                                city: e.target.value
                              };
                              setEditingOrder({
                                ...editingOrder,
                                orderDetails: updatedDetails
                              });
                            }}
                            className="border border-gray-300 rounded-md p-2"
                          />
                          <input
                            type="text"
                            placeholder="Postal Code"
                            value={detail.address?.postalCode || ''}
                            onChange={(e) => {
                              const updatedDetails = [...editingOrder.orderDetails];
                              updatedDetails[index].address = {
                                ...(updatedDetails[index].address || { id: 0, street: '', city: '' }),
                                postalCode: e.target.value
                              };
                              setEditingOrder({
                                ...editingOrder,
                                orderDetails: updatedDetails
                              });
                            }}
                            className="border border-gray-300 rounded-md p-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 border border-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateOrder(editingOrder.id, editingOrder)}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4"
      >
        Add Provider
      </button>

      <ProviderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
};

export default OrdersComponent;