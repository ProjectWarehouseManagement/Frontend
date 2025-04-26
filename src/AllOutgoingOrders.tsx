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
      <div className="error-container" style={{
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
          Próbáld Újra
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
          <span className="visually-hidden">Betöltés...</span>
        </div>
      </div>
    );
  }
  
  if (deliveries.length === 0 && !loading) {
    return (
      <div className="empty-state" style={{
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
        }}>Nem található megrendelés</h2>
        <p style={{ marginBottom: '1.5rem' }}>Jelenleg nincsenek kimenő megrendelések.</p>
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
          Újratöltés
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
        borderBottom: '1px solid hsla(220, 30%, 40%, 0.3)',
        paddingBottom: '1rem',
        color: 'white',
      }}>Kimenő Rendelések</h1>
  
      <div style={{ marginBottom: '2rem' }}>
        {deliveries.map((delivery) => (
          <div key={delivery.id} style={{
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
                }}>Rendelés #{delivery.id}</h2>
                <button
                  onClick={() => setEditingDelivery(delivery)}
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
                  Módosítás
                </button>
                <button
                  onClick={() => handleDeleteDelivery(delivery.id)}
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
                  Törlés
                </button>
                <span style={{ color: 'hsla(220, 30%, 70%, 1)' }}>
                  Dátum: {new Date(delivery.orderDate).toLocaleDateString()}
                </span>
                <span style={{ color: 'hsla(220, 30%, 70%, 1)' }}>
                  Vásárló: {delivery.user.name}
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
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Termék</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Mennyiség</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Ár/Darab</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Összeg</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Szállítás</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Várható érkezés</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Raktár</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Szállítási cím</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Összeg+ÁFA</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Szállítási költség</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Végösszeg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delivery.deliveryDetails.map((detail) => (
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
                A rendeléshez nincs megjeleníthető adat.
              </div>
            )}
          </div>
        ))}
      </div>
  
      {editingDelivery && (
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
              }}>Edit Delivery #{editingDelivery.id}</h2>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setEditingDelivery(null)}
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
                  }}>Szállítási információ</h6>
  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: 'white'
                    }}>Szállítás dátuma</label>
                    <input
                      type="date"
                      value={editingDelivery.orderDate.split('T')[0]}
                      onChange={(e) => setEditingDelivery({
                        ...editingDelivery,
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
                    }}>Vásárló</label>
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
                      {users?.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
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
                  }}>Szállítási adatok</h6>
  
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
                        }}>Termék</label>
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
                          <option value="">Válassz terméket</option>
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
                          }}>Mennyiség</label>
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
                          }}>Darabár (HUF)</label>
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
                          }}>Szállítási költség (HUF)</label>
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
                          }}>Várható Szállítás</label>
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
                        }}>Raktár</label>
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
                          <option value="">Válassz Raktárat</option>
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
                        }}>Szállítási Cím</label>
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
                          <option value="">Válasszon egy címet</option>
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
                onClick={() => setEditingDelivery(null)}
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
                Vissza
              </button>
              <button
                onClick={() => handleUpdateDelivery(editingDelivery.id, editingDelivery)}
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
                Mentés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutgoingOrdersComponent;