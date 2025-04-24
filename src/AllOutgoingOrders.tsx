import { useState, useEffect } from 'react';
import { api } from './environments/api';
import { useAuth } from './AuthContext';
import { AxiosError } from 'axios';

type Product = {
    id: number;
    name: string;
    unitPrice: number;
  };
  
  type Address = {
    id: number;
    street: string;
    city: string;
    postalCode: string;
  };
  
  type Warehouse = {
    id: number;
    name: string;
  };
  
  type User = {
    id: number;
    name: string;
    email: string;
  };
  
  type Delivery = {
    id: number;
    orderDate: string;
    userId: number;
    user: User;
    deliveryDetails: DeliveryDetail[];
  };
  
  type DeliveryDetail = {
    id: number;
    price: number;
    shippingCost: number;
    OrderQuantity: number;
    ExpectedDate: string;
    productId: number;
    product?: Product;
    warehouseId: number;
    warehouse?: Warehouse;
    addressId: number;
    address?: Address;
  };

const OutgoingOrdersComponent = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const { isLoggedIn } = useAuth();

  const handleDeleteDelivery = async (deliveryId: number) => {
    try {
      await api.delete(`/deliveries/${deliveryId}`);
      setDeliveries(deliveries.filter(delivery => delivery.id !== deliveryId));
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'Failed to delete delivery');
    }
  };

  const handleUpdateDelivery = async (id: number, updatedDelivery: Delivery) => {
    try {
      const deliveryDTO = {
        orderDate: updatedDelivery.orderDate,
        userId: updatedDelivery.userId,
      };

      const deliveryDetailsDTO = updatedDelivery.deliveryDetails.map(detail => ({
        id: detail.id,
        price: detail.price,
        shippingCost: detail.shippingCost,
        OrderQuantity: detail.OrderQuantity,
        ExpectedDate: detail.ExpectedDate,
        productId: detail.productId,
        addressId: detail.addressId,
        warehouseId: detail.warehouseId
      }));

      deliveryDetailsDTO.forEach(async (detail) => {
        const { id, ...rest } = detail;
        await api.patch(`/deliveries/details/${id}`, rest);
      });
      
      const response = await api.patch(`/deliveries/${id}`, deliveryDTO);
      setDeliveries(deliveries.map(delivery =>
        delivery.id === id ? response.data : delivery
      ));
      setEditingDelivery(null);
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'Failed to update delivery');
    }
  };

  const fetchDeliveries = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.get('/deliveries');
      setDeliveries(response.data);
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'An unknown error occurred');
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      setProducts([]);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/addresses');
      setAddresses(response.data);
    } catch (err) {
      setAddresses([]);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses');
      setWarehouses(response.data);
    } catch (err) {
      setWarehouses([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    fetchProducts();
    fetchAddresses();
    fetchWarehouses();
    fetchUsers();
  }, [refreshKey]);

  useEffect(() => {
    if (!isLoggedIn) {
      setDeliveries([]);
    }
  }, [isLoggedIn]);

  if (error) {
    return (
      <div className="container mt-3 p-4 bg-danger bg-opacity-10 rounded shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
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

  if (deliveries.length === 0 && !loading) {
    return (
      <div className="container mt-3 p-4 bg-primary bg-opacity-10 rounded shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
        <h2 className="text-primary fw-semibold">No Deliveries Found</h2>
        <p className="mt-2 text-primary">There are no outgoing deliveries to display at this time.</p>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="btn btn-primary mt-3"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="container p-3">
      <h1 className="h2 fw-bold mb-4">Outgoing Deliveries</h1>

      <div className="mb-4">
        {deliveries.map((delivery) => (
          <div key={delivery.id} className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <h2 className="h5 fw-semibold mb-0">Delivery #{delivery.id}</h2>
                  <button
                    onClick={() => setEditingDelivery(delivery)}
                    className="btn btn-warning btn-sm text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDelivery(delivery.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                  <span className="text-muted">
                    Date: {new Date(delivery.orderDate).toLocaleDateString()}
                  </span>
                  <span className="text-muted">Customer: {delivery.user.name}</span>
                </div>
              </div>

              {delivery.deliveryDetails.length > 0 ? (
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
                        {delivery.deliveryDetails.map((detail) => (
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
                  This delivery has no details
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editingDelivery && (
        <div className="modal d-block bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Delivery #{editingDelivery.id}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setEditingDelivery(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-medium text-muted">Delivery Information</h6>

                    <div className="mb-3">
                      <label className="form-label">Delivery Date</label>
                      <input
                        type="date"
                        value={editingDelivery.orderDate.split('T')[0]}
                        onChange={(e) => setEditingDelivery({
                          ...editingDelivery,
                          orderDate: new Date(e.target.value).toISOString()
                        })}
                        className="form-control"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Customer</label>
                      <select
                        value={editingDelivery.userId}
                        onChange={(e) => {
                          const selectedUserId = parseInt(e.target.value);
                          const selectedUser = users?.find(u => u.id === selectedUserId);

                          setEditingDelivery({
                            ...editingDelivery,
                            userId: selectedUserId,
                            user: {
                              id: selectedUserId,
                              name: selectedUser?.name || editingDelivery.user.name,
                              email: selectedUser?.email || ''
                            }
                          });
                        }}
                        className="form-select"
                      >
                        {users?.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <h6 className="fw-medium text-muted">Delivery Details</h6>

                    {editingDelivery.deliveryDetails.map((detail, index) => (
                      <div key={detail.id} className="border p-3 rounded mb-3">
                        <div className="mb-3">
                          <label className="form-label">Product</label>
                          <select
                            value={detail.productId}
                            onChange={(e) => {
                              const updatedDetails = [...editingDelivery.deliveryDetails];
                              const selectedProductId = parseInt(e.target.value);
                              const selectedProduct = products?.find(p => p.id === selectedProductId);

                              updatedDetails[index] = {
                                ...updatedDetails[index],
                                productId: selectedProductId,
                                product: selectedProduct ? {
                                    id: selectedProduct.id,
                                    name: selectedProduct.name,
                                    unitPrice: selectedProduct.unitPrice
                                  } : undefined,
                                  price: selectedProduct?.unitPrice || updatedDetails[index].price
                              };

                              setEditingDelivery({
                                ...editingDelivery,
                                deliveryDetails: updatedDetails
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
                                const updatedDetails = [...editingDelivery.deliveryDetails];
                                updatedDetails[index].OrderQuantity = parseInt(e.target.value) || 0;
                                setEditingDelivery({
                                  ...editingDelivery,
                                  deliveryDetails: updatedDetails
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
                                const updatedDetails = [...editingDelivery.deliveryDetails];
                                updatedDetails[index].price = parseFloat(e.target.value) || 0;
                                setEditingDelivery({
                                  ...editingDelivery,
                                  deliveryDetails: updatedDetails
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
                                const updatedDetails = [...editingDelivery.deliveryDetails];
                                updatedDetails[index].shippingCost = parseFloat(e.target.value) || 0;
                                setEditingDelivery({
                                  ...editingDelivery,
                                  deliveryDetails: updatedDetails
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
                                const updatedDetails = [...editingDelivery.deliveryDetails];
                                updatedDetails[index].ExpectedDate = new Date(e.target.value).toISOString();
                                setEditingDelivery({
                                  ...editingDelivery,
                                  deliveryDetails: updatedDetails
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
                              const updatedDetails = [...editingDelivery.deliveryDetails];
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

                              setEditingDelivery({
                                ...editingDelivery,
                                deliveryDetails: updatedDetails
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
                              const updatedDetails = [...editingDelivery.deliveryDetails];
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

                              setEditingDelivery({
                                ...editingDelivery,
                                deliveryDetails: updatedDetails
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
                  onClick={() => setEditingDelivery(null)}
                  className="btn btn-outline-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateDelivery(editingDelivery.id, editingDelivery)}
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

export default OutgoingOrdersComponent;