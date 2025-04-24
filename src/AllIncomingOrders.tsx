import { useState, useEffect } from 'react';
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

type Product = {
  id: number;
  name: string;
  barcode: string;
  unitPrice: number;
  width: number;
  height: number;
  depth: number;
  Weight: number;
  Expiration: boolean;
  ExpirationDate?: String;
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

type Warehouse = {
  id: number;
  name: string;
}

const OrdersComponent = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null); // Assuming you have a Product type defined somewhere
  const [addresses, setAddresses] = useState<address[] | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[] | null>(null); // Assuming you have a Warehouse type defined somewhere
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
  const handleUpdateOrder = async (id: number, updatedOrder: Order) => {
    try {
      const orderDTO = {
        orderDate: updatedOrder.orderDate,
        providerId: updatedOrder.providerId,
      };

      const orderDetailsDTO = updatedOrder.orderDetails.map(detail => ({
        id: detail.id,
        price: detail.price,
        shippingCost: detail.shippingCost,
        OrderQuantity: detail.OrderQuantity,
        ExpectedDate: detail.ExpectedDate,
        productId: detail.productId,
        addressId: detail.addressId,
        warehouseId: detail.warehouseId
      }));

      //const WarehouseResponse = await api.patch(`/orders/warehouse/${id}`, warehouseDTO);
      //await api.patch(`/orders/address/${id}`, addressDTO);
      orderDetailsDTO.forEach(async (detail) => {
        const { id, ...rest } = detail;
        await api.patch(`/orders/orderDetails/${id}`, rest);
      });
      const OrderResponse = await api.patch(`/orders/${id}`, orderDTO);
      setOrders(orders.map(order =>
        order.id === id ? OrderResponse.data : order
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

  const fetchWarehouses = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.get('/warehouses');
      setWarehouses(response.data);
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'An unknown error occurred');
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  }

  const fetchProducts = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'An unknown error occurred');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    fetchProviders();
    fetchAddresses();
    fetchWarehouses();
    fetchProducts();
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
                              const selectedProductId = parseInt(e.target.value);
                              const selectedProduct = products?.find(p => p.id === selectedProductId);

                              updatedDetails[index] = {
                                ...updatedDetails[index],
                                productId: selectedProductId,
                                product: selectedProduct ? {
                                  id: selectedProduct.id,
                                  name: selectedProduct.name
                                } : undefined,
                                price: selectedProduct?.unitPrice || updatedDetails[index].price
                              };

                              setEditingOrder({
                                ...editingOrder,
                                orderDetails: updatedDetails
                              });
                            }}
                            className="form-select"
                          >
                            <option value="">Select a product</option>
                            {products?.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} (HUF {product.unitPrice.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="row g-2 mb-2">
                          <div className="col">
                            <label className="form-label">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              value={detail.OrderQuantity}
                              onChange={(e) => {
                                const updatedDetails = [...editingOrder.orderDetails];
                                updatedDetails[index].OrderQuantity = parseInt(e.target.value) || 0;
                                setEditingOrder({
                                  ...editingOrder,
                                  orderDetails: updatedDetails
                                });
                              }}
                              className="form-control"
                            />
                          </div>

                          <div className="col">
                            <label className="form-label">Unit Price (HUF)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={detail.price}
                              onChange={(e) => {
                                const updatedDetails = [...editingOrder.orderDetails];
                                updatedDetails[index].price = parseFloat(e.target.value) || 0;
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
                            <label className="form-label">Shipping Cost (HUF)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={detail.shippingCost}
                              onChange={(e) => {
                                const updatedDetails = [...editingOrder.orderDetails];
                                updatedDetails[index].shippingCost = parseFloat(e.target.value) || 0;
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
                              const selectedWarehouseId = parseInt(e.target.value);
                              const selectedWarehouse = warehouses?.find(w => w.id === selectedWarehouseId);

                              updatedDetails[index] = {
                                ...updatedDetails[index],
                                warehouseId: selectedWarehouseId,
                                warehouse: selectedWarehouse ? {
                                  id: selectedWarehouse.id,
                                  name: selectedWarehouse.name
                                } : undefined
                              };

                              setEditingOrder({
                                ...editingOrder,
                                orderDetails: updatedDetails
                              });
                            }}
                            className="form-select"
                          >
                            <option value="">Select a warehouse</option>
                            {warehouses?.map((warehouse) => (
                              <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-2">
                          <label className="form-label">Shipping Address</label>
                          <select
                            value={detail.addressId}
                            onChange={(e) => {
                              const updatedDetails = [...editingOrder.orderDetails];
                              const selectedAddressId = parseInt(e.target.value);
                              const selectedAddress = addresses?.find(a => a.id === selectedAddressId);

                              updatedDetails[index] = {
                                ...updatedDetails[index],
                                addressId: selectedAddressId,
                                address: selectedAddress ? {
                                  id: selectedAddress.id,
                                  street: selectedAddress.street,
                                  city: selectedAddress.city,
                                  postalCode: selectedAddress.postalCode
                                } : undefined
                              };

                              setEditingOrder({
                                ...editingOrder,
                                orderDetails: updatedDetails
                              });
                            }}
                            className="form-select"
                          >
                            <option value="">Select an address</option>
                            {addresses?.map((address) => (
                              <option key={address.id} value={address.id}>
                                {address.street}, {address.city}, {address.postalCode}
                              </option>
                            ))}
                          </select>
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
    </div>
  );
};

export default OrdersComponent;