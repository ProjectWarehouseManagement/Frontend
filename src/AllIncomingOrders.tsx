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
      <div className="container mt-3 p-4 bg-danger bg-opacity-10 rounded shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
        <button
          onClick={() => {
            setRefreshKey(prev => prev + 1);
          }}
          className="btn btn-primary mt-3"
        >
          Try Again
        </button>
        <h2 className="text-danger mt-3 fw-semibold">Error</h2>
        <p className="mt-2 text-danger">{error}</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '256px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (orders.length === 0 && !loading) {
    return (
      <div className="container mt-3 p-4 bg-primary bg-opacity-10 rounded shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
        <h2 className="text-primary fw-semibold">No Orders Found</h2>
        <p className="mt-2 text-primary">There are no orders to display at this time.</p>
        <button
          onClick={() => {
            setRefreshKey(prev => prev + 1);
          }}
          className="btn btn-primary mt-3"
        >
          Refresh
        </button>
      </div>
    );
  }
  
  return (
    <div className="container p-3">
      <h1 className="h2 fw-bold mb-4">Orders</h1>
  
      <div className="mb-4">
        {orders.map((order) => (
          <div key={order.id} className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <h2 className="h5 fw-semibold mb-0">Order #{order.id}</h2>
                  <button
                    onClick={() => setEditingOrder(order)}
                    className="btn btn-warning btn-sm text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                  <span className="text-muted">
                    Date: {new Date(order.orderDate).toLocaleDateString()}
                  </span>
                  <span className="text-muted">Provider: {order.provider.name}</span>
                </div>
              </div>
  
              {order.orderDetails.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th className="text-nowrap">Product</th>
                          <th className="text-nowrap">Quantity</th>
                          <th className="text-nowrap">Unit Price</th>
                          <th className="text-nowrap">Line Total</th>
                          <th className="text-nowrap">Shipping</th>
                          <th className="text-nowrap">Expected Date</th>
                          <th className="text-nowrap">Warehouse</th>
                          <th className="text-nowrap">Shipping to</th>
                          <th className="text-nowrap">Subtotal</th>
                          <th className="text-nowrap">Shipping cost</th>
                          <th className="text-nowrap">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.orderDetails.map((detail) => (
                          <tr key={detail.id}>
                            <td>{detail.product?.name || `Product ${detail.productId}`}</td>
                            <td>{detail.OrderQuantity}</td>
                            <td>${detail.price.toFixed(2)}</td>
                            <td>${(detail.price * detail.OrderQuantity).toFixed(2)}</td>
                            <td>${detail.shippingCost.toFixed(2)}</td>
                            <td>{new Date(detail.ExpectedDate).toLocaleDateString()}</td>
                            <td>{detail.warehouse?.name || `Warehouse ${detail.warehouseId}`}</td>
                            <td>{detail.address?.street}, {detail.address?.city}, {detail.address?.postalCode}</td>
                            <td>HUF {(detail.price * detail.OrderQuantity).toFixed(2)}</td>
                            <td>HUF {detail.shippingCost.toFixed(2)}</td>
                            <td>HUF {(detail.price * detail.OrderQuantity + detail.shippingCost).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-3">
                  This order has no details
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
  
      {editingOrder && (
        <div className="modal d-block bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Order #{editingOrder.id}</h5>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Order Fields */}
                  <div className="col-md-6">
                    <h6 className="fw-medium text-muted">Order Information</h6>
  
                    <div className="mb-3">
                      <label className="form-label">Order Date</label>
                      <input
                        type="date"
                        value={editingOrder.orderDate.split('T')[0]}
                        onChange={(e) => setEditingOrder({
                          ...editingOrder,
                          orderDate: new Date(e.target.value).toISOString()
                        })}
                        className="form-control"
                      />
                    </div>
  
                    <div className="mb-3">
                      <label className="form-label">Provider</label>
                      <select
                        value={editingOrder.providerId}
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
                        className="form-select"
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
                  <div className="col-md-6">
                    <h6 className="fw-medium text-muted">Order Details</h6>
  
                    {editingOrder.orderDetails.map((detail, index) => (
                      <div key={detail.id} className="border p-3 rounded mb-3">
                        <div className="mb-3">
                          <label className="form-label">Product</label>
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
                            className="form-select"
                          >
                            <option value={detail.productId}>
                              {detail.product?.name || `Product ${detail.productId}`}
                            </option>
                          </select>
                        </div>
  
                        <div className="row g-2 mb-2">
                          <div className="col">
                            <label className="form-label">Quantity</label>
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
                              className="form-control"
                            />
                          </div>
  
                          <div className="col">
                            <label className="form-label">Price</label>
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
                              className="form-control"
                            />
                          </div>
                        </div>
  
                        <div className="row g-2 mb-2">
                          <div className="col">
                            <label className="form-label">Shipping Cost</label>
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
                              className="form-control"
                            />
                          </div>
  
                          <div className="col">
                            <label className="form-label">Expected Date</label>
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
                              className="form-control"
                            />
                          </div>
                        </div>
  
                        <div className="mb-2">
                          <label className="form-label">Warehouse</label>
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
                            className="form-select"
                          >
                            <option value={detail.warehouseId}>
                              {detail.warehouse?.name || `Warehouse ${detail.warehouseId}`}
                            </option>
                          </select>
                        </div>
  
                        <div>
                          <label className="form-label">Shipping Address</label>
                          <div className="row g-2">
                            <div className="col">
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
                                className="form-control"
                              />
                            </div>
                            <div className="col">
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
                                className="form-control"
                              />
                            </div>
                            <div className="col">
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
                                className="form-control"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  onClick={() => setEditingOrder(null)}
                  className="btn btn-outline-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateOrder(editingOrder.id, editingOrder)}
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
  
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn btn-primary mt-3"
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