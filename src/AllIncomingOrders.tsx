import { useState, useEffect } from 'react';
import { api } from './environments/api';
import { useAuth } from './AuthContext';
import { AxiosError } from 'axios';
import * as XLSX from 'xlsx';

// Type definitions
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
};

type Provider = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

type Address = {
  id: number;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type Warehouse = {
  id: number;
  name: string;
};

type ExcelProductRow = {
  'Megnevezés'?: string;
  'Vonalkód'?: string;
  'Nettó ár (Ft)'?: number;
};

const OrdersComponent = () => {
  // State management
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [updatingOrders, setUpdatingOrders] = useState<number[]>([]);
  const { isLoggedIn } = useAuth();

  // Fetch all necessary data
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [ordersRes, providersRes, productsRes, addressesRes, warehousesRes] = await Promise.all([
          api.get('/orders'),
          api.get('/orders/provider'),
          api.get('/products'),
          api.get('/addresses'),
          api.get('/warehouses')
        ]);

        setOrders(ordersRes.data);
        setProviders(providersRes.data);
        setProducts(productsRes.data);
        setAddresses(addressesRes.data);
        setWarehouses(warehousesRes.data);
      } catch (err) {
        setError(err instanceof AxiosError ? err.message : 'Ismeretlen hiba történt.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn, refreshKey]);

  // Handle order deletion
  const handleDeleteOrder = async (orderId: number) => {
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders(orders.filter(order => order.id !== orderId));
      setSuccess('A megrendelés sikeresen törölve.');
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'Nem sikerült törölni a megrendelést');
    }
  };

  // Handle order updates with optimistic UI
  const handleUpdateOrder = async (id: number, updatedOrder: Order) => {
    try {
      setUpdatingOrders(prev => [...prev, id]);
      
      // Optimistic UI update
      setOrders(orders.map(order => 
        order.id === id ? updatedOrder : order
      ));

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

      // Send all updates in parallel
      await Promise.all([
        api.patch(`/orders/${id}`, orderDTO),
        ...orderDetailsDTO.map(detail => {
          const { id: detailId, ...rest } = detail;
          return api.patch(`/orders/orderDetails/${detailId}`, rest);
        })
      ]);

      setSuccess('A megrendelés hozzáadása/módosítása sikeresen megtörtént.');
      setEditingOrder(null);
    } catch (err) {
      setError(err instanceof AxiosError ? err.message : 'Megrendelés hozzáadása sikertelen.');
      // Revert optimistic update on error
      setRefreshKey(prev => prev + 1);
    } finally {
      setUpdatingOrders(prev => prev.filter(orderId => orderId !== id));
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
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

  // Render error state
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
          onClick={() => setRefreshKey(prev => prev + 1)}
          style={{
            backgroundColor: 'hsla(220, 70%, 8%, 1)',
            color: 'white',
            padding: '12px 24px',
            border: '1px solid hsla(220, 70%, 20%, 1)',
            borderRadius: '20px',
            cursor: 'pointer'
          }}
        >
          Újra
        </button>
      </div>
    );
  }

  // Render empty state
  if (orders.length === 0) {
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
          A rendelés nem található
        </h2>
        <p style={{ marginBottom: '1.5rem' }}>Jelenleg nincsenek aktív rendelés(ek).</p>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          style={{
            backgroundColor: 'hsla(220, 70%, 8%, 1)',
            color: 'white',
            padding: '12px 24px',
            border: '1px solid hsla(220, 70%, 20%, 1)',
            borderRadius: '20px',
            cursor: 'pointer'
          }}
        >
          Újra töltés
        </button>
      </div>
    );
  }

  // Main render
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
        Bejövő rendelések
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
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        {orders.map((order) => (
          <div key={order.id} style={{
            background: 'hsla(220, 30%, 10%, 0.9)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.6)',
            border: '1px solid hsla(220, 30%, 40%, 0.3)',
            position: 'relative'
          }}>
            {/* Loading overlay */}
            {updatingOrders.includes(order.id) && (
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
                  Rendelés #{order.id}
                </h2>
                <button
                  onClick={() => setEditingOrder(order)}
                  style={{
                    backgroundColor: 'hsla(45, 100%, 40%, 1)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  Módosítás
                </button>
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  style={{
                    backgroundColor: 'hsla(0, 70%, 40%, 1)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  Törlés
                </button>
                <span style={{ color: 'hsla(220, 30%, 70%, 1)' }}>
                  Dátum: {new Date(order.orderDate).toLocaleDateString()}
                </span>
                <span style={{ color: 'hsla(220, 30%, 70%, 1)' }}>
                  Beszállító: {order.provider.name}
                </span>
              </div>
            </div>

            {order.orderDetails.length > 0 ? (
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
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Termék</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Mennyiség</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Ár</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Szállítási költség</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Várható szállítás</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Raktár</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Cím</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.orderDetails.map((detail) => (
                      <tr key={detail.id} style={{
                        borderBottom: '1px solid hsla(220, 30%, 40%, 0.1)'
                      }}>
                        <td style={{ padding: '0.75rem' }}>
                          {detail.product?.name || `Product ${detail.productId}`}
                        </td>
                        <td style={{ padding: '0.75rem' }}>{detail.OrderQuantity}</td>
                        <td style={{ padding: '0.75rem' }}>{detail.price.toFixed(0)} Ft</td>
                        <td style={{ padding: '0.75rem' }}>{detail.shippingCost.toFixed(0)} Ft</td>
                        <td style={{ padding: '0.75rem' }}>
                          {new Date(detail.ExpectedDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {detail.warehouse?.name || `Warehouse ${detail.warehouseId}`}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {detail.address?.street}, {detail.address?.city}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: 'hsla(220, 30%, 70%, 1)',
                padding: '1.5rem 0'
              }}>
                Nincsenek elérhető adatok ehhez a rendeléshez.
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
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
            maxWidth: '900px',
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
                Rendelés módosítása #{editingOrder.id}
              </h2>
              <button 
                onClick={() => setEditingOrder(null)}
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
                  Rendelés részletei
                </h3>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'white'
                  }}>
                    Rendelés dátuma
                  </label>
                  <input
                    type="date"
                    value={editingOrder.orderDate.split('T')[0]}
                    onChange={(e) => setEditingOrder({
                      ...editingOrder,
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

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'white'
                  }}>
                    Beszállító
                  </label>
                  <select
                    value={editingOrder.providerId}
                    onChange={(e) => {
                      const selectedProviderId = parseInt(e.target.value);
                      const selectedProvider = providers.find(p => p.id === selectedProviderId);

                      setEditingOrder({
                        ...editingOrder,
                        providerId: selectedProviderId,
                        provider: {
                          id: selectedProviderId,
                          name: selectedProvider?.name || editingOrder.provider.name
                        }
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
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '300px' }}>
                <h3 style={{
                  fontWeight: '600',
                  color: 'hsla(220, 30%, 70%, 1)',
                  marginBottom: '1rem'
                }}>
                  Rendelés adatai
                </h3>

                {editingOrder.orderDetails.map((detail, index) => (
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
                        Termék
                      </label>
                      <select
                        value={detail.productId}
                        onChange={(e) => {
                          const updatedDetails = [...editingOrder.orderDetails];
                          const selectedProductId = parseInt(e.target.value);
                          const selectedProduct = products.find(p => p.id === selectedProductId);

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
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #555',
                          borderRadius: '5px',
                          backgroundColor: 'black',
                          color: 'white'
                        }}
                      >
                        <option value="">Termék választása</option>
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
                          Mennyiség
                        </label>
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
                          Darabár (HUF)
                        </label>
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
                          Szállítási költség (HUF)
                        </label>
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
                          Várható szállítási dátum
                        </label>
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
                          Raktár
                        </label>
                        <select
                          value={detail.warehouseId}
                          onChange={(e) => {
                            const updatedDetails = [...editingOrder.orderDetails];
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

                            setEditingOrder({
                              ...editingOrder,
                              orderDetails: updatedDetails
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
                          Szállítási cím
                        </label>
                        <select
                          value={detail.addressId}
                          onChange={(e) => {
                            const updatedDetails = [...editingOrder.orderDetails];
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

                            setEditingOrder({
                              ...editingOrder,
                              orderDetails: updatedDetails
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
                              {address.street}, {address.city}
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
                onClick={() => setEditingOrder(null)}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: '1px solid hsla(220, 30%, 40%, 1)',
                  borderRadius: '20px',
                  cursor: 'pointer'
                }}
              >
                Vissza
              </button>
              <button
                onClick={() => handleUpdateOrder(editingOrder.id, editingOrder)}
                style={{
                  backgroundColor: 'hsla(220, 70%, 8%, 1)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: '1px solid hsla(220, 70%, 20%, 1)',
                  borderRadius: '20px',
                  cursor: 'pointer'
                }}
              >
                Mentés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersComponent;