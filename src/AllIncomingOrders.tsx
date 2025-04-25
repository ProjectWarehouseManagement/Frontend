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
        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.6), 0px 15px 35px rgba(0, 0, 0, 0.3)',
        border: '1px solid hsla(0, 70%, 40%, 0.3)',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2 style={{
          color: '#FF5252',
          fontSize: '1.75rem',
          marginBottom: '1rem'
        }}>Error</h2>
        <p style={{ color: '#FF5252', marginBottom: '1.5rem' }}>{error}</p>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          style={{
            backgroundColor: 'hsla(220, 70%, 8%, 1)',
            color: 'white',
            padding: '12px 24px',
            fontSize: '1rem',
            border: '1px solid hsla(220, 70%, 20%, 1)',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.8)'}
          onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '256px',
        background: 'hsla(220, 30%, 10%, 0.5)',
        borderRadius: '12px',
        margin: '2rem',
        border: '1px solid hsla(220, 30%, 40%, 0.3)'
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
  
  if (orders.length === 0 && !loading) {
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
        boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.6), 0px 15px 35px rgba(0, 0, 0, 0.3)',
        border: '1px solid hsla(220, 30%, 40%, 0.3)',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2 style={{
          color: 'hsla(220, 70%, 60%, 1)',
          fontSize: '1.75rem',
          marginBottom: '1rem'
        }}>No Orders Found</h2>
        <p style={{ marginBottom: '1.5rem' }}>There are no orders to display at this time.</p>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          style={{
            backgroundColor: 'hsla(220, 70%, 8%, 1)',
            color: 'white',
            padding: '12px 24px',
            fontSize: '1rem',
            border: '1px solid hsla(220, 70%, 20%, 1)',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.8)'}
          onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
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
      }}>Orders</h1>
  
      <div style={{ marginBottom: '2rem' }}>
        {orders.map((order) => (
          <div key={order.id} style={{
            background: 'hsla(220, 30%, 10%, 0.9)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.6), 0px 15px 35px rgba(0, 0, 0, 0.3)',
            border: '1px solid hsla(220, 30%, 40%, 0.3)'
          }}>
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
                }}>Order #{order.id}</h2>
                <button
                  onClick={() => setEditingOrder(order)}
                  style={{
                    backgroundColor: 'hsla(45, 100%, 40%, 1)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 10px hsla(45, 100%, 50%, 0.8)'}
                  onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  style={{
                    backgroundColor: 'hsla(0, 70%, 40%, 1)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 10px hsla(0, 100%, 50%, 0.8)'}
                  onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  Delete
                </button>
                <span style={{ color: 'hsla(220, 30%, 70%, 1)' }}>
                  Date: {new Date(order.orderDate).toLocaleDateString()}
                </span>
                <span style={{ color: 'hsla(220, 30%, 70%, 1)' }}>
                  Provider: {order.provider.name}
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
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Product</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Quantity</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Unit Price</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Line Total</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Shipping</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Expected Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Warehouse</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Shipping to</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Subtotal</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Shipping cost</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.orderDetails.map((detail) => (
                      <tr key={detail.id} style={{
                        borderBottom: '1px solid hsla(220, 30%, 40%, 0.1)'
                      }}>
                        <td style={{ padding: '0.75rem' }}>{detail.product?.name || `Product ${detail.productId}`}</td>
                        <td style={{ padding: '0.75rem' }}>{detail.OrderQuantity}</td>
                        <td style={{ padding: '0.75rem' }}>${detail.price.toFixed(2)}</td>
                        <td style={{ padding: '0.75rem' }}>${(detail.price * detail.OrderQuantity).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem' }}>${detail.shippingCost.toFixed(2)}</td>
                        <td style={{ padding: '0.75rem' }}>{new Date(detail.ExpectedDate).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem' }}>{detail.warehouse?.name || `Warehouse ${detail.warehouseId}`}</td>
                        <td style={{ padding: '0.75rem' }}>{detail.address?.street}, {detail.address?.city}, {detail.address?.postalCode}</td>
                        <td style={{ padding: '0.75rem' }}>HUF {(detail.price * detail.OrderQuantity).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem' }}>HUF {detail.shippingCost.toFixed(2)}</td>
                        <td style={{ padding: '0.75rem' }}>HUF {(detail.price * detail.OrderQuantity + detail.shippingCost).toFixed(2)}</td>
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
                This order has no details
              </div>
            )}
          </div>
        ))}
      </div>
  
      {editingOrder && (
        <div className="modal-container" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 1050,
          backdropFilter: 'blur(5px)'
        }}>
          <div className="formWrapper" style={{
            margin: '20px 0',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem',
            borderRadius: '12px',
            background: 'hsla(220, 30%, 10%, 0.95)',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.6), 0px 15px 35px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid hsla(220, 30%, 40%, 0.3)',
            color: 'white'
          }}>
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              borderBottom: '1px solid hsla(220, 30%, 40%, 0.3)',
              paddingBottom: '1rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'white',
                margin: 0
              }}>Edit Order #{editingOrder.id}</h2>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setEditingOrder(null)}
                style={{
                  filter: 'invert(1)',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'white'
                }}
              >×</button>
            </div>
  
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h6 style={{
                    fontWeight: '600',
                    color: 'hsla(220, 30%, 70%, 1)',
                    marginBottom: '1rem',
                    fontSize: '1.1rem'
                  }}>Order Information</h6>
  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: 'white'
                    }}>Order Date</label>
                    <input
                      type="date"
                      value={editingOrder.orderDate.split('T')[0]}
                      onChange={(e) => setEditingOrder({
                        ...editingOrder,
                        orderDate: new Date(e.target.value).toISOString()
                      })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #555',
                        borderRadius: '5px',
                        fontSize: '1rem',
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
                    }}>Provider</label>
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
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #555',
                        borderRadius: '5px',
                        fontSize: '1rem',
                        backgroundColor: 'black',
                        color: 'white'
                      }}
                    >
                      {providers?.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
  
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h6 style={{
                    fontWeight: '600',
                    color: 'hsla(220, 30%, 70%, 1)',
                    marginBottom: '1rem',
                    fontSize: '1.1rem'
                  }}>Order Details</h6>
  
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
                        }}>Product</label>
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
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #555',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            backgroundColor: 'black',
                            color: 'white'
                          }}
                        >
                          <option value="">Select a product</option>
                          {products?.map((product) => (
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
                          }}>Quantity</label>
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
                              padding: '12px',
                              border: '1px solid #555',
                              borderRadius: '5px',
                              fontSize: '1rem',
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
                          }}>Unit Price (HUF)</label>
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
                              padding: '12px',
                              border: '1px solid #555',
                              borderRadius: '5px',
                              fontSize: '1rem',
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
                          }}>Shipping Cost (HUF)</label>
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
                              padding: '12px',
                              border: '1px solid #555',
                              borderRadius: '5px',
                              fontSize: '1rem',
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
                          }}>Expected Date</label>
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
                              padding: '12px',
                              border: '1px solid #555',
                              borderRadius: '5px',
                              fontSize: '1rem',
                              backgroundColor: 'black',
                              color: 'white'
                            }}
                          />
                        </div>
                      </div>
  
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          color: 'white'
                        }}>Warehouse</label>
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
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #555',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            backgroundColor: 'black',
                            color: 'white'
                          }}
                        >
                          <option value="">Select a warehouse</option>
                          {warehouses?.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </option>
                          ))}
                        </select>
                      </div>
  
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          color: 'white'
                        }}>Shipping Address</label>
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
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #555',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            backgroundColor: 'black',
                            color: 'white'
                          }}
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
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'hsla(220, 30%, 20%, 0.5)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateOrder(editingOrder.id, editingOrder)}
                style={{
                  backgroundColor: 'hsla(220, 70%, 8%, 1)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: '1px solid hsla(220, 70%, 20%, 1)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.8)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
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

export default OrdersComponent;