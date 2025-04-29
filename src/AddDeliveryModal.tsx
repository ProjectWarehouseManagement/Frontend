import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from './environments/api';

interface Product {
  id: number;
  name: string;
  barcode: string;
  unitPrice: number;
}

interface Inventory {
  id: number;
  quantity: number;
  product: Product;
  warehouseId: number; // Added warehouseId to Inventory
}

interface Warehouse {
  id: number;
  name: string;
  address: string;
}

interface Address {
  id: number;
  street: string;
  city: string;
  postalCode: string;
}

interface DeliveryItem {
  inventoryId: number;
  productId: number;
  productName: string;
  quantity: number;
  warehouseId: number;
  sellingPrice: number;
}

const AddDeliveryModal = () => {
  const { isLoggedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<DeliveryItem[]>([]);

  // Fetch warehouses and addresses on load
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [warehousesRes, addressesRes] = await Promise.all([
          api.get('/warehouses'),
          api.get('/addresses')
        ]);
        
        setWarehouses(warehousesRes.data);
        setAddresses(addressesRes.data);
        
        if (addressesRes.data.length > 0) {
          setSelectedAddressId(addressesRes.data[0].id);
        }
      } catch (err) {
        setError('Nem sikerült betölteni az adatokat.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [isLoggedIn]);

  // Fetch all inventories on load
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchInventories = async () => {
      try {
        setIsLoading(true);
        // Get inventories from all warehouses
        const inventoriesPromises = warehouses.map(warehouse => 
          api.get(`/warehouses/${warehouse.id}/inventories`)
        );
        const inventoriesResults = await Promise.all(inventoriesPromises);
        const allInventories = inventoriesResults.flatMap((res, index) => 
          res.data.map((inv: any) => ({
            ...inv,
            warehouseId: warehouses[index].id // Add warehouseId to each inventory
          }))
        );
        setInventories(allInventories);
      } catch (err) {
        setError('Nem sikerült betölteni a leltárt.');
      } finally {
        setIsLoading(false);
      }
    };

    if (warehouses.length > 0) {
      fetchInventories();
    }
  }, [isLoggedIn, warehouses]);

  // Filtered inventories based on search and available stock
  const filteredInventories = inventories.filter(inv =>
    (inv.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.product.barcode.toLowerCase().includes(searchTerm.toLowerCase())) &&
    inv.quantity > 0
  );

  const addProductToDelivery = (inventory: Inventory) => {
    if (selectedProducts.some(p => p.inventoryId === inventory.id)) {
      setError('Ez a termék már benne van a rendelésben.');
      return;
    }

    if (inventory.quantity <= 0) {
      setError('Ez a termék jelenleg nincs készleten.');
      return;
    }

    setSelectedProducts(prev => [
      ...prev,
      {
        inventoryId: inventory.id,
        productId: inventory.product.id,
        productName: inventory.product.name,
        quantity: 1,
        warehouseId: inventory.warehouseId, // Use the inventory's warehouseId
        sellingPrice: inventory.product.unitPrice
      }
    ]);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof DeliveryItem, value: any) => {
    setSelectedProducts(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedProducts.length === 0) {
      setError('Adjon hozzá legalább egy terméket a rendeléshez.');
      return;
    }

    if (!selectedAddressId) {
      setError('Válasszon egy szállítási címet.');
      return;
    }

    // Check inventory quantities for each product in their respective warehouses
    for (const item of selectedProducts) {
      try {
        const inventoryRes = await api.get(`/warehouses/${item.warehouseId}/inventories`);
        const inventory = inventoryRes.data.find((inv: any) => inv.id === item.inventoryId);
        
        if (!inventory || item.quantity > inventory.quantity) {
          const warehouseName = warehouses.find(w => w.id === item.warehouseId)?.name || 'ismeretlen';
          setError(`Nincs elegendő ${item.productName} raktáron a(z) ${warehouseName} raktárban.`);
          return;
        }
      } catch (err) {
        setError(`Nem sikerült ellenőrizni a készletet a ${item.productName} termékhez.`);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create delivery
      const res = await api.post('/deliveries', {
        deliveryDate: new Date(deliveryDate).toISOString(),
        addressId: selectedAddressId
      });

      // Add all delivery items in parallel
      await Promise.all(selectedProducts.map(item => 
        api.post('/deliveries/details', {
          price: item.sellingPrice,
          shippingCost: 1,
          OrderQuantity: item.quantity,
          ExpectedDate: new Date(new Date(deliveryDate).setDate(new Date(deliveryDate).getDate() + 2)).toISOString(),
          productId: item.productId,
          warehouseId: item.warehouseId,
          addressId: selectedAddressId,
          deliveryId: res.data.id
        })
      ));

      setSuccess('A kimenő rendelés sikeresen létrejött!');
      resetForm();
    } catch (error) {
      setError(`A rendelés létrehozása sikertelen volt: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProducts([]);
    setSearchTerm('');
    setSelectedAddressId(addresses.length > 0 ? addresses[0].id : null);
  };

  const formatAddress = (address: Address) => {
    return `${address.street}, ${address.city}, ${address.postalCode}`;
  };

  const getWarehouseName = (warehouseId: number) => {
    return warehouses.find(w => w.id === warehouseId)?.name || 'Ismeretlen raktár';
  };

  return (
    <div style={{
      marginTop: '50px',
      padding: '2rem',
      background: 'radial-gradient(at 50% 50%, hsla(220, 30%, 15%, 1), hsla(220, 30%, 5%, 1))',
      boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.6)',
      border: '1px solid hsla(220, 30%, 40%, 0.3)',
      color: 'white',
      minHeight: '100vh'
    }}>
      <h2 style={{
        fontSize: '1.75rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        color: 'white',
        borderBottom: '1px solid hsla(220, 30%, 40%, 0.3)',
        paddingBottom: '0.75rem'
      }}>
        Kimenő rendelés létrehozása
      </h2>

      {error && (
        <div style={{
          backgroundColor: 'hsla(0, 70%, 40%, 0.2)',
          border: '1px solid hsla(0, 70%, 40%, 1)',
          color: 'hsla(0, 70%, 70%, 1)',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

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

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'white'
            }}>
              Rendelés dátuma
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              required
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
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'white'
            }}>
              Szállítási Cím
            </label>
            <select
              value={selectedAddressId ?? ''}
              onChange={(e) => setSelectedAddressId(Number(e.target.value))}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #555',
                borderRadius: '5px',
                backgroundColor: 'black',
                color: 'white'
              }}
            >
              {addresses.map(address => (
                <option key={address.id} value={address.id}>
                  {formatAddress(address)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'white'
          }}>
            Termék keresése
          </label>
          <input
            type="text"
            placeholder="Keresés név vagy vonalkód alapján."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
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

        <div style={{
          display: 'flex',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            flex: 1,
            minWidth: '300px',
            background: 'hsla(220, 30%, 15%, 0.5)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid hsla(220, 30%, 40%, 0.3)'
          }}>
            <h5 style={{
              fontSize: '1.1rem',
              marginBottom: '1rem',
              color: 'white'
            }}>
              Elérhető termékek ({filteredInventories.length})
            </h5>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '0.5rem'
            }}>
              {filteredInventories.map(inv => (
                <div key={inv.id} style={{
                  background: 'hsla(220, 30%, 20%, 0.5)',
                  borderRadius: '6px',
                  padding: '1rem',
                  border: '1px solid hsla(220, 30%, 40%, 0.3)'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{inv.product.name}</h4>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: 'hsla(220, 30%, 70%, 1)' }}>
                      Raktár: {getWarehouseName(inv.warehouseId)}
                    </p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: 'hsla(220, 30%, 70%, 1)' }}>Vonalkód: {inv.product.barcode}</p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: 'hsla(220, 30%, 70%, 1)' }}>Készleten: {inv.quantity} db</p>
                    <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: 'hsla(220, 30%, 70%, 1)' }}>Ár: {inv.product.unitPrice} Ft</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addProductToDelivery(inv)}
                    disabled={selectedProducts.some(p => p.inventoryId === inv.id)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: selectedProducts.some(p => p.inventoryId === inv.id) 
                        ? 'hsla(220, 30%, 30%, 1)' 
                        : 'hsla(220, 70%, 8%, 1)',
                      color: 'white',
                      border: '1px solid hsla(220, 70%, 20%, 1)',
                      borderRadius: '4px',
                      cursor: selectedProducts.some(p => p.inventoryId === inv.id) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Hozzáadás a rendeléshez
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            flex: 1,
            minWidth: '300px',
            background: 'hsla(220, 30%, 15%, 0.5)',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid hsla(220, 30%, 40%, 0.3)'
          }}>
            <h5 style={{
              fontSize: '1.1rem',
              marginBottom: '1rem',
              color: 'white'
            }}>
              Rendelt termékek: ({selectedProducts.length})
            </h5>
            {selectedProducts.length > 0 ? (
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
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Raktár</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Mennyiség</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Ár (Ft)</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.map((item, index) => {
                      const inventory = inventories.find(inv => inv.id === item.inventoryId);
                      const maxQuantity = inventory?.quantity || 0;

                      return (
                        <tr key={index} style={{
                          borderBottom: '1px solid hsla(220, 30%, 40%, 0.1)'
                        }}>
                          <td style={{ padding: '0.75rem' }}>{item.productName}</td>
                          <td style={{ padding: '0.75rem' }}>{getWarehouseName(item.warehouseId)}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <input
                              type="number"
                              min="1"
                              max={maxQuantity}
                              value={item.quantity}
                              onChange={(e) => updateProduct(index, 'quantity', Number(e.target.value))}
                              required
                              style={{
                                width: '80px',
                                padding: '0.5rem',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                backgroundColor: 'black',
                                color: 'white'
                              }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.sellingPrice}
                              onChange={(e) => updateProduct(index, 'sellingPrice', Number(e.target.value))}
                              required
                              style={{
                                width: '100px',
                                padding: '0.5rem',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                backgroundColor: 'black',
                                color: 'white'
                              }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <button
                              type="button"
                              onClick={() => removeProduct(index)}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: 'hsla(0, 70%, 40%, 1)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Eltávolítás
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{
                textAlign: 'center',
                color: 'hsla(220, 30%, 70%, 1)',
                padding: '1.5rem 0'
              }}>
                Még nincs termék hozzáadva a rendeléshez.
              </p>
            )}
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
            type="button"
            onClick={resetForm}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: 'white',
              border: '1px solid hsla(220, 70%, 20%, 1)',
              borderRadius: '20px',
              cursor: 'pointer'
            }}
          >
            Összes törlése
          </button>
          <button
            type="submit"
            disabled={isLoading || selectedProducts.length === 0}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: selectedProducts.length === 0 
                ? 'transparent'
                : 'hsla(220, 70%, 8%, 1)',
              color: 'white',
              border: '1px solid hsla(220, 70%, 20%, 1)',
              borderRadius: '20px',
              cursor: selectedProducts.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Rendelés létrehozása...' : 'Rendelés létrehozása'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDeliveryModal;