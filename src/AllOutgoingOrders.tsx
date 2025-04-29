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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '256px',
        background: 'hsla(220, 30%, 10%, 0.5)'
      }}>
        <div className="spinner-border" style={{ 
          color: 'hsla(220, 70%, 60%, 1)',
          width: '3rem',
          height: '3rem'
        }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        padding: '2rem',
        borderRadius: '12px',
        background: 'hsla(220, 30%, 10%, 0.9)',
        maxWidth: '500px',
        margin: '2rem auto',
        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.6)',
        border: '1px solid hsla(0, 70%, 40%, 0.3)',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#FF5252', marginBottom: '1rem' }}>Error</h2>
        <p style={{ color: '#FF5252', marginBottom: '1.5rem' }}>{error}</p>
        <button
          onClick={fetchData}
          style={{
            backgroundColor: 'hsla(220, 70%, 8%, 1)',
            color: 'white',
            padding: '12px 24px',
            border: '1px solid hsla(220, 70%, 20%, 1)',
            borderRadius: '20px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (deliveries.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        padding: '2rem',
        borderRadius: '12px',
        background: 'hsla(220, 30%, 10%, 0.9)',
        maxWidth: '500px',
        margin: '2rem auto',
        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.6)',
        border: '1px solid hsla(220, 30%, 40%, 0.3)',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2 style={{ color: 'hsla(220, 70%, 60%, 1)', marginBottom: '1rem' }}>
          No Deliveries Found
        </h2>
        <p style={{ marginBottom: '1.5rem' }}>There are currently no outgoing deliveries.</p>
        <button
          onClick={fetchData}
          style={{
            backgroundColor: 'hsla(220, 70%, 8%, 1)',
            color: 'white',
            padding: '12px 24px',
            border: '1px solid hsla(220, 70%, 20%, 1)',
            borderRadius: '20px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: '50px',
      padding: '2rem',
      background: 'radial-gradient(at 50% 50%, hsla(220, 30%, 15%, 1), hsla(220, 30%, 5%, 1))',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '2rem',
        color: 'white',
        borderBottom: '1px solid hsla(220, 30%, 40%, 0.3)',
        paddingBottom: '1rem'
      }}>
        Outgoing Deliveries
      </h1>

      {success && (
        <div style={{
          backgroundColor: 'hsla(120, 100%, 25%, 0.2)',
          border: '1px solid #4CAF50',
          color: '#4CAF50',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          {success}
          <button
            onClick={() => setSuccess(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#4CAF50',
              marginLeft: '1rem',
              cursor: 'pointer',
              float: 'right'
            }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        {deliveries.map((delivery) => (
          <div key={delivery.id} style={{
            background: 'hsla(220, 30%, 10%, 0.9)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.6)',
            border: '1px solid hsla(220, 30%, 40%, 0.3)',
            position: 'relative'
          }}>
            {/* Loading overlay */}
            {updatingDeliveries.includes(delivery.id) && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
                borderRadius: '12px'
              }}>
                <div className="spinner-border" style={{ 
                  color: 'hsla(220, 70%, 60%, 1)',
                  width: '3rem',
                  height: '3rem'
                }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'center'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  margin: 0,
                  color: 'hsla(220, 70%, 60%, 1)'
                }}>
                  Delivery #{delivery.id}
                </h2>
                <button
                  onClick={() => setEditingDelivery(delivery)}
                  style={{
                    backgroundColor: 'hsla(45, 100%, 40%, 1)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteDelivery(delivery.id)}
                  style={{
                    backgroundColor: 'hsla(0, 70%, 40%, 1)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
                <span style={{ color: 'hsla(220, 30%, 70%, 1)' }}>
                  Date: {new Date(delivery.orderDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {delivery.deliveryDetails.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  color: 'white'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: 'hsla(220, 30%, 20%, 0.5)',
                      borderBottom: '1px solid hsla(220, 30%, 40%, 0.3)'
                    }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Product</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Quantity</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Unit Price</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Total</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Shipping</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Expected Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Warehouse</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Address</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Total + VAT</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Shipping Cost</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Final Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delivery.deliveryDetails.map((detail) => {
                      const product = products.find(p => p.id === detail.productId);
                      const address = addresses.find(a => a.id === detail.addressId);
                      const warehouse = warehouses.find(w => w.id === detail.warehouseId);
                      const total = detail.price * detail.OrderQuantity;
                      const totalWithVat = total * 1.27;
                      const finalTotal = totalWithVat + detail.shippingCost;

                      return (
                        <tr key={detail.id} style={{
                          borderBottom: '1px solid hsla(220, 30%, 40%, 0.1)'
                        }}>
                          <td style={{ padding: '0.75rem' }}>
                            {product?.name || `Product ${detail.productId}`}
                          </td>
                          <td style={{ padding: '0.75rem' }}>{detail.OrderQuantity}</td>
                          <td style={{ padding: '0.75rem' }}>HUF {detail.price.toFixed(2)}</td>
                          <td style={{ padding: '0.75rem' }}>HUF {total.toFixed(2)}</td>
                          <td style={{ padding: '0.75rem' }}>HUF {detail.shippingCost.toFixed(2)}</td>
                          <td style={{ padding: '0.75rem' }}>
                            {new Date(detail.ExpectedDate).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {warehouse?.name || `Warehouse ${detail.warehouseId}`}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {address
                              ? `${address.street}, ${address.city}, ${address.postalCode}`
                              : `Address ${detail.addressId}`
                            }
                          </td>
                          <td style={{ padding: '0.75rem' }}>HUF {totalWithVat.toFixed(2)}</td>
                          <td style={{ padding: '0.75rem' }}>HUF {detail.shippingCost.toFixed(2)}</td>
                          <td style={{ padding: '0.75rem' }}>HUF {finalTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: 'hsla(220, 30%, 70%, 1)',
                padding: '1.5rem 0'
              }}>
                No details available for this delivery.
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Delivery Modal */}
      {editingDelivery && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 1050
        }}>
          <div style={{
            background: 'hsla(220, 30%, 10%, 0.95)',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.6)',
            border: '1px solid hsla(220, 30%, 40%, 0.3)',
            color: 'white'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              borderBottom: '1px solid hsla(220, 30%, 40%, 0.3)',
              paddingBottom: '1rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                Edit Delivery #{editingDelivery.id}
              </h2>
              <button 
                onClick={() => setEditingDelivery(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h3 style={{
                  fontWeight: '600',
                  color: 'hsla(220, 30%, 70%, 1)',
                  marginBottom: '1rem'
                }}>
                  Delivery Information
                </h3>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'white'
                  }}>
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={editingDelivery.orderDate.split('T')[0]}
                    onChange={(e) => setEditingDelivery({
                      ...editingDelivery,
                      orderDate: new Date(e.target.value).toISOString()
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #555',
                      borderRadius: '5px',
                      backgroundColor: 'black',
                      color: 'white'
                    }}
                  />
                </div>
              </div>

              <div style={{ flex: 2, minWidth: '600px' }}>
                <h3 style={{
                  fontWeight: '600',
                  color: 'hsla(220, 30%, 70%, 1)',
                  marginBottom: '1rem'
                }}>
                  Delivery Details
                </h3>

                {editingDelivery.deliveryDetails.map((detail, index) => (
                  <div key={detail.id} style={{
                    border: '1px solid hsla(220, 30%, 40%, 0.3)',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    background: 'hsla(220, 30%, 15%, 0.5)'
                  }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        color: 'white'
                      }}>
                        Product
                      </label>
                      <select
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
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #555',
                          borderRadius: '5px',
                          backgroundColor: 'black',
                          color: 'white'
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

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          color: 'white'
                        }}>
                          Quantity
                        </label>
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
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #555',
                            borderRadius: '5px',
                            backgroundColor: 'black',
                            color: 'white'
                          }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          color: 'white'
                        }}>
                          Unit Price (HUF)
                        </label>
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
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #555',
                            borderRadius: '5px',
                            backgroundColor: 'black',
                            color: 'white'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          color: 'white'
                        }}>
                          Shipping Cost (HUF)
                        </label>
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
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #555',
                            borderRadius: '5px',
                            backgroundColor: 'black',
                            color: 'white'
                          }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          color: 'white'
                        }}>
                          Expected Date
                        </label>
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
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #555',
                            borderRadius: '5px',
                            backgroundColor: 'black',
                            color: 'white'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          color: 'white'
                        }}>
                          Warehouse
                        </label>
                        <select
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
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #555',
                            borderRadius: '5px',
                            backgroundColor: 'black',
                            color: 'white'
                          }}
                        >
                          <option value="">Select a warehouse</option>
                          {warehouses.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          color: 'white'
                        }}>
                          Shipping Address
                        </label>
                        <select
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
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #555',
                            borderRadius: '5px',
                            backgroundColor: 'black',
                            color: 'white'
                          }}
                        >
                          <option value="">Select an address</option>
                          {addresses.map((address) => (
                            <option key={address.id} value={address.id}>
                              {address.street}, {address.city}, {address.postalCode}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid hsla(220, 30%, 40%, 0.3)'
            }}>
              <button
                onClick={() => setEditingDelivery(null)}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: '1px solid hsla(220, 30%, 40%, 1)',
                  borderRadius: '20px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateDelivery(editingDelivery.id, editingDelivery)}
                style={{
                  backgroundColor: 'hsla(220, 70%, 8%, 1)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: '1px solid hsla(220, 70%, 20%, 1)',
                  borderRadius: '20px',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutgoingOrdersComponent;