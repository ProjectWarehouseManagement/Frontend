import { useState, useEffect } from 'react';
import { api } from './environments/api';
import { useAuth } from './AuthContext';
import { AxiosError } from 'axios';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";

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

type Delivery = {
  id: number;
  orderDate: string;
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
  const [success, setSuccess] = useState<string | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [updatingDeliveries, setUpdatingDeliveries] = useState<number[]>([]);
  const { isLoggedIn } = useAuth();

  // Fetch all data in parallel
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [deliveriesRes, productsRes, addressesRes, warehousesRes] = await Promise.all([
        api.get('/deliveries'),
        api.get('/products'),
        api.get('/addresses'),
        api.get('/warehouses'),
        api.get('/users')
      ]);

      setDeliveries(deliveriesRes.data);
      setProducts(productsRes.data);
      setAddresses(addressesRes.data);

      setWarehouses(warehousesRes.data);
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    } else {
      setDeliveries([]);
    }
  }, [isLoggedIn]);

  const handleDeleteDelivery = async (deliveryId: number) => {
    try {
      await api.delete(`/deliveries/${deliveryId}`);
      setDeliveries(deliveries.filter(delivery => delivery.id !== deliveryId));
      setSuccess('Delivery deleted successfully');
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'Failed to delete delivery');
    }
  };

  const handleUpdateDelivery = async (id: number, updatedDelivery: Delivery) => {
    try {
      setUpdatingDeliveries(prev => [...prev, id]);

      // Optimistic update
      setDeliveries(deliveries.map(delivery =>
        delivery.id === id ? updatedDelivery : delivery
      ));

      const deliveryDTO = {
        orderDate: updatedDelivery.orderDate,
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

      // Process all updates in parallel
      await Promise.all([
        api.patch(`/deliveries/${id}`, deliveryDTO),
        ...deliveryDetailsDTO.map(detail => {
          const { id: detailId, ...rest } = detail;
          return api.patch(`/deliveries/details/${detailId}`, rest);
        })
      ]);

      setSuccess('Delivery updated successfully');
      setEditingDelivery(null);
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'Failed to update delivery');
      // Revert on error
      fetchData();
    } finally {
      setUpdatingDeliveries(prev => prev.filter(deliveryId => deliveryId !== id));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '256px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="alert alert-danger text-center mx-auto" style={{ maxWidth: '500px' }}>
        <h2 className="h4">Error</h2>
        <p>{error}</p>
        <button
          className="btn btn-primary"
          onClick={fetchData}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (deliveries.length === 0) {
    return (
      <div className="alert alert-info text-center mx-auto" style={{ maxWidth: '500px' }}>
        <h2 className="h4">No Deliveries Found</h2>
        <p>There are currently no outgoing deliveries.</p>
        <button
          className="btn btn-primary"
          onClick={fetchData}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="mb-4 text-white border-bottom pb-2">Outgoing Deliveries</h1>

      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess(null)}
          />
        </div>
      )}

      <div className="mb-4">
        {deliveries.map((delivery) => (
          <div
            key={delivery.id}
            className="card mb-4 bg-dark text-white"
            style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            <div className="card-body position-relative">
              {/* Loading overlay */}
              {updatingDeliveries.includes(delivery.id) && (
                <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex justify-content-center align-items-center bg-dark bg-opacity-50 rounded">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <h2 className="h5 mb-0 text-primary">Delivery #{delivery.id}</h2>
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => setEditingDelivery(delivery)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteDelivery(delivery.id)}
                  >
                    Delete
                  </button>
                  <span className="text-muted">
                    Date: {new Date(delivery.orderDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {delivery.deliveryDetails.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-dark table-hover">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Shipping</th>
                        <th>Expected Date</th>
                        <th>Warehouse</th>
                        <th>Address</th>
                        <th>Total + VAT</th>
                        <th>Shipping Cost</th>
                        <th>Final Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {delivery.deliveryDetails.map((detail) => {
                        // Find the related entities
                        const product = products.find(p => p.id === detail.productId);
                        const address = addresses.find(a => a.id === detail.addressId);
                        const warehouse = warehouses.find(w => w.id === detail.warehouseId);

                        return (
                          <tr key={detail.id}>
                            <td>{product?.name || `Product ${detail.productId}`}</td>
                            <td>{detail.OrderQuantity}</td>
                            <td>HUF {detail.price.toFixed(2)}</td>
                            <td>HUF {(detail.price * detail.OrderQuantity).toFixed(2)}</td>
                            <td>HUF {detail.shippingCost.toFixed(2)}</td>
                            <td>{new Date(detail.ExpectedDate).toLocaleDateString()}</td>
                            <td>{warehouse?.name || `Warehouse ${detail.warehouseId}`}</td>
                            <td>
                              {address
                                ? `${address.street}, ${address.city}, ${address.postalCode}`
                                : `Address ${detail.addressId}`
                              }
                            </td>
                            <td>HUF {(detail.price * detail.OrderQuantity * 1.27).toFixed(2)}</td>
                            <td>HUF {detail.shippingCost.toFixed(2)}</td>
                            <td>HUF {(detail.price * detail.OrderQuantity * 1.27 + detail.shippingCost).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-3 text-muted">
                  No details available for this delivery.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Delivery Modal */}
      {editingDelivery && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header border-secondary">
                <h2 className="modal-title h5">Edit Delivery #{editingDelivery.id}</h2>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditingDelivery(null)}
                />
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <h3 className="h6 text-muted mb-3">Delivery Information</h3>

                    <div className="mb-3">
                      <label className="form-label">Delivery Date</label>
                      <input
                        type="date"
                        className="form-control bg-black text-white border-secondary"
                        value={editingDelivery.orderDate.split('T')[0]}
                        onChange={(e) => setEditingDelivery({
                          ...editingDelivery,
                          orderDate: new Date(e.target.value).toISOString()
                        })}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <h3 className="h6 text-muted mb-3">Delivery Details</h3>

                    {editingDelivery.deliveryDetails.map((detail, index) => (
                      <div key={detail.id} className="card mb-3 bg-dark border-secondary">
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label">Product</label>
                            <select
                              className="form-select bg-black text-white border-secondary"
                              value={detail.productId}
                              onChange={(e) => {
                                const updatedDetails = [...editingDelivery.deliveryDetails];
                                const selectedProductId = parseInt(e.target.value);
                                const selectedProduct = products.find(p => p.id === selectedProductId);

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
                            >
                              <option value="">Select a product</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} (HUF {product.unitPrice.toFixed(2)})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="row g-3 mb-3">
                            <div className="col-md-6">
                              <label className="form-label">Quantity</label>
                              <input
                                type="number"
                                min="1"
                                className="form-control bg-black text-white border-secondary"
                                value={detail.OrderQuantity}
                                onChange={(e) => {
                                  const updatedDetails = [...editingDelivery.deliveryDetails];
                                  updatedDetails[index].OrderQuantity = parseInt(e.target.value) || 0;
                                  setEditingDelivery({
                                    ...editingDelivery,
                                    deliveryDetails: updatedDetails
                                  });
                                }}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Unit Price (HUF)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control bg-black text-white border-secondary"
                                value={detail.price}
                                onChange={(e) => {
                                  const updatedDetails = [...editingDelivery.deliveryDetails];
                                  updatedDetails[index].price = parseFloat(e.target.value) || 0;
                                  setEditingDelivery({
                                    ...editingDelivery,
                                    deliveryDetails: updatedDetails
                                  });
                                }}
                              />
                            </div>
                          </div>

                          <div className="row g-3 mb-3">
                            <div className="col-md-6">
                              <label className="form-label">Shipping Cost (HUF)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="form-control bg-black text-white border-secondary"
                                value={detail.shippingCost}
                                onChange={(e) => {
                                  const updatedDetails = [...editingDelivery.deliveryDetails];
                                  updatedDetails[index].shippingCost = parseFloat(e.target.value) || 0;
                                  setEditingDelivery({
                                    ...editingDelivery,
                                    deliveryDetails: updatedDetails
                                  });
                                }}
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Expected Delivery</label>
                              <input
                                type="date"
                                className="form-control bg-black text-white border-secondary"
                                value={detail.ExpectedDate.split('T')[0]}
                                onChange={(e) => {
                                  const updatedDetails = [...editingDelivery.deliveryDetails];
                                  updatedDetails[index].ExpectedDate = new Date(e.target.value).toISOString();
                                  setEditingDelivery({
                                    ...editingDelivery,
                                    deliveryDetails: updatedDetails
                                  });
                                }}
                              />
                            </div>
                          </div>

                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="form-label">Warehouse</label>
                              <select
                                className="form-select bg-black text-white border-secondary"
                                value={detail.warehouseId}
                                onChange={(e) => {
                                  const updatedDetails = [...editingDelivery.deliveryDetails];
                                  const selectedWarehouseId = parseInt(e.target.value);
                                  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

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
                              >
                                <option value="">Select warehouse</option>
                                {warehouses.map((warehouse) => (
                                  <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Shipping Address</label>
                              <select
                                className="form-select bg-black text-white border-secondary"
                                value={detail.addressId}
                                onChange={(e) => {
                                  const updatedDetails = [...editingDelivery.deliveryDetails];
                                  const selectedAddressId = parseInt(e.target.value);
                                  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

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
                              >
                                <option value="">Select address</option>
                                {addresses.map((address) => (
                                  <option key={address.id} value={address.id}>
                                    {address.street}, {address.city}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setEditingDelivery(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleUpdateDelivery(editingDelivery.id, editingDelivery)}
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