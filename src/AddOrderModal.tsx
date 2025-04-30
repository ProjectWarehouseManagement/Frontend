import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from './AuthContext';
import { api } from './environments/api';

interface BarcodeMapping {
    numericBarcode: string;
    uuidBarcode: string;
  }

interface Product {
    name: string;
    barcode: string;
    unitPrice: number;
    width: number;
    height: number;
    depth: number;
    Weight: number;
    Expiration: boolean;
    ExpirationDate?: Date | null;
  }

  interface ProductWithId extends Product {
    id: number;
  }

interface Provider {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Address {
  id: number;
  street: string;
  city: string;
  zipCode: string;
}

interface Warehouse {
  id: number;
  name: string;
}

interface ExcelProductRow {
  'Kép'?: string;
  'Cikkszám'?: string;
  'Vonalkód'?: string;
  'Megnevezés'?: string;
  'db/doboz'?: number;
  'Nettó ár (Ft)'?: number;
  'Megrendelés'?: string;
  [key: string]: any;
}

interface OrderItem {
  productId: number;
  price: number;
  shippingCost: number;
  OrderQuantity: number;
  ExpectedDate: string;
  addressId: number;
  warehouseId: number;
}

const AddOrderForm: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [providerId, setProviderId] = useState<number>(0);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<OrderItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Fetch initial data
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [providersRes, addressesRes, warehousesRes] = await Promise.all([
          api.get('/orders/provider'),
          api.get('/addresses'),
          api.get('/warehouses')
        ]);
        
        setProviders(providersRes.data);
        setAddresses(addressesRes.data);
        setWarehouses(warehousesRes.data);
        
        if (providersRes.data.length > 0) {
          setProviderId(providersRes.data[0].id);
        }
      } catch (err) {
        setError('Nem sikerült betölteni a kezdeti adatokat');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn]);

  const convertToProduct = (row: ExcelProductRow): Product | null => {
    try {
      const name = String(row['Megnevezés'] || '').trim();
      const barcode = String(row['Vonalkód'] || '').trim();
      const unitPrice = Math.max(0, Math.round(Number(row['Nettó ár (Ft)'] || 0)));
  
      if (!name || !barcode || unitPrice <= 0) {
        return null;
      }
  
      return {
        name: name,
        barcode: barcode,
        unitPrice: unitPrice,
        width: 0,
        height: 0,
        depth: 0,
        Weight: 0,
        Expiration: false,
        ExpirationDate: null
      };
    } catch (error) {
      console.error('Error converting row:', row, error);
      return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    setIsLoading(true);
    setError(null);
    setSuccess(null);
  
    const reader = new FileReader();
  
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        const excelData: ExcelProductRow[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false
        });
  
        const validProducts = excelData
          .map(convertToProduct)
          .filter((product): product is Product => product !== null);
    
        const checkResults = await Promise.all(
            validProducts.map(product => 
              api.get(`/products/byBarcode?barcode=${product.barcode}`)
              .then(res => ({
                exists: true,
                product: res.data,
                barcode: product.barcode
              })).catch(() => ({
                exists: false,
                product: null,
                barcode: product.barcode
              }))
            )
          );

        const productsToUpload: Product[] = [];
        const existingProducts: ProductWithId[] = [];
        const newMappings: BarcodeMapping[] = [];

        checkResults.forEach((result) => {
            if (result.exists && result.product) {
              const productData = Array.isArray(result.product) 
                ? result.product[0] 
                : result.product;
              
              if (productData) {
                existingProducts.push(productData);
                newMappings.push({
                  numericBarcode: result.barcode,
                  uuidBarcode: productData.barcode
                });
              } else {
                productsToUpload.push({
                  ...convertToProduct({ barcode: result.barcode } as ExcelProductRow)!,
                  barcode: result.barcode
                });
              }
            } else {
              const prod = validProducts.find(product => product.barcode === result.barcode);
              if (prod && prod.name) {
                productsToUpload.push({
                  ...prod,
                  barcode: result.barcode
                });
              } else {
                console.error('Érvénytelen termékadatok:', prod);
              }
            }
          });

          productsToUpload.forEach(product => {
            console.log('Feltöltendő termék:', product);
          });
  
          const uploadResponses = await Promise.all(
            productsToUpload.map(product => 
              api.post<ProductWithId>('/products', {
                ...product,
                barcode: product.barcode // Send numeric barcode separately
              })
            )
          );

          uploadResponses.forEach((response, index) => {
            newMappings.push({
              numericBarcode: productsToUpload[index].barcode,
              uuidBarcode: response.data.barcode
            });
          });

          const newProducts = uploadResponses.map(response => response.data);
          const allProducts = [...existingProducts, ...newProducts];
  
          setProducts(allProducts);
        
        setSuccess(
            `${newProducts.length} új, ` +
            `${existingProducts.length} meglévő termék hozzáadásra került`
          );
      } catch (error) {
        setError(`A termékek feltöltése sikertelen: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    };
  
    reader.onerror = () => {
      setError('Error reading file');
      setIsLoading(false);
    };
  
    reader.readAsArrayBuffer(file);
  };

  const addProductToOrder = (product: ProductWithId) => {
    console.log(product)
    setSelectedProducts(prev => [
      ...prev,
      {
        productId: product.id,
        price: product.unitPrice,
        shippingCost: 0,
        OrderQuantity: 1,
        ExpectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        addressId: addresses[0]?.id || 0,
        warehouseId: warehouses[0]?.id || 0
      }
    ]);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof OrderItem, value: any) => {
    setSelectedProducts(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!providerId || selectedProducts.length === 0) {
      setError('Kérjük, válasszon egy beszállítót és legalább egy terméket.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const isoOrderDate = new Date(orderDate).toISOString();
      
      const orderResponse = await api.post('/orders', {
        orderDate: isoOrderDate,
        providerId
      });
      
      const orderId = orderResponse.data.id;
      
      await Promise.all(
        selectedProducts.map(product => 
          api.post('/orders/orderDetails', {
            ...product,
            ExpectedDate: new Date(product.ExpectedDate).toISOString(),
            orderId
          })
        )
      );
      
      setSuccess('A rendelés létre hozása sikeres!');
      resetForm();
    } catch (error) {
      setError(`A rendelést nem sikerült létre hozni: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProducts([]);
    setProducts([]);
    setOrderDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div style={{
      marginTop: '50px',
      padding: '2rem',
      background: 'radial-gradient(at 50% 50%, hsla(220, 30%, 15%, 1), hsla(220, 30%, 5%, 1))',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h2 style={{
        fontSize: '1.75rem',
        fontWeight: 'bold',
        marginBottom: '2rem',
        color: 'white',
        borderBottom: '1px solid hsla(220, 30%, 40%, 0.3)',
        paddingBottom: '0.5rem'
      }}>Megrendelés Hozzáadása</h2>
      
      {error && (
        <div style={{
          backgroundColor: 'hsla(0, 100%, 30%, 0.2)',
          border: '1px solid #FF5252',
          color: '#FF5252',
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
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'white'
              }}>Rendelés dátuma</label>
              <input
                type="date"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #555',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  backgroundColor: 'black',
                  color: 'white'
                }}
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'white'
              }}>Beszállitó</label>
              <select
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #555',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  backgroundColor: 'black',
                  color: 'white'
                }}
                value={providerId}
                onChange={(e) => setProviderId(Number(e.target.value))}
                disabled={isLoading || providers.length === 0}
                required
              >
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
  
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'white'
            }}>Termékek feltöltése Excelből</label>
            <input
              type="file"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #555',
                borderRadius: '5px',
                fontSize: '1rem',
                backgroundColor: 'black',
                color: 'white'
              }}
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
            <div style={{
              fontSize: '0.875rem',
              color: 'hsla(220, 30%, 70%, 1)',
              marginTop: '0.25rem'
            }}>
              Tölts fel egy Excel fájlt a termék vonalkódjaival.
            </div>
          </div>
        </div>
  
        {products.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h5 style={{
              fontSize: '1.25rem',
              marginBottom: '1rem',
              color: 'hsla(220, 70%, 60%, 1)'
            }}>Elérhető termékek</h5>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                color: 'white',
                marginBottom: '1.5rem'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: 'hsla(220, 30%, 20%, 0.5)',
                    borderBottom: '1px solid hsla(220, 30%, 40%, 0.3)'
                  }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Termék neve</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Vonalkód</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Ár</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} style={{
                      borderBottom: '1px solid hsla(220, 30%, 40%, 0.1)'
                    }}>
                      <td style={{ padding: '0.75rem' }}>{product.name}</td>
                      <td style={{ padding: '0.75rem' }}>{product.barcode}</td>
                      <td style={{ padding: '0.75rem' }}>{product.unitPrice} Ft</td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          style={{
                            backgroundColor: selectedProducts.some(p => p.productId === product.id) ? 
                              'hsla(220, 30%, 30%, 1)' : 'hsla(220, 70%, 8%, 1)',
                            color: 'white',
                            padding: '0.375rem 0.75rem',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: selectedProducts.some(p => p.productId === product.id) ? 'default' : 'pointer',
                            fontSize: '0.875rem',
                            opacity: selectedProducts.some(p => p.productId === product.id) ? 0.5 : 1
                          }}
                          onClick={() => addProductToOrder(product)}
                          disabled={selectedProducts.some(p => p.productId === product.id)}
                        >
                          Hozzáadás a rendeléshez
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
  
        {selectedProducts.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h5 style={{
              fontSize: '1.25rem',
              marginBottom: '1rem',
              color: 'hsla(220, 70%, 60%, 1)'
            }}>Rendelés tételei</h5>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                color: 'white',
                marginBottom: '1.5rem'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: 'hsla(220, 30%, 20%, 0.5)',
                    borderBottom: '1px solid hsla(220, 30%, 40%, 0.3)'
                  }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Termék neve</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Ár (Ft)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Szállítási költség (Ft)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Mennyiség</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Várható szállítási dátum</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Cím</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Raktár</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <tr key={index} style={{
                        borderBottom: '1px solid hsla(220, 30%, 40%, 0.1)'
                      }}>
                        <td style={{ padding: '0.75rem' }}>{product?.name || 'Product'}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="number"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #555',
                              borderRadius: '5px',
                              fontSize: '1rem',
                              backgroundColor: 'black',
                              color: 'white'
                            }}
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateProduct(index, 'price', Number(e.target.value))}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="number"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #555',
                              borderRadius: '5px',
                              fontSize: '1rem',
                              backgroundColor: 'black',
                              color: 'white'
                            }}
                            min="0"
                            step="1"
                            value={item.shippingCost}
                            onChange={(e) => updateProduct(index, 'shippingCost', Number(e.target.value))}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="number"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #555',
                              borderRadius: '5px',
                              fontSize: '1rem',
                              backgroundColor: 'black',
                              color: 'white'
                            }}
                            min="1"
                            value={item.OrderQuantity}
                            onChange={(e) => updateProduct(index, 'OrderQuantity', Number(e.target.value))}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="date"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #555',
                              borderRadius: '5px',
                              fontSize: '1rem',
                              backgroundColor: 'black',
                              color: 'white'
                            }}
                            value={item.ExpectedDate}
                            onChange={(e) => updateProduct(index, 'ExpectedDate', e.target.value)}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <select
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #555',
                              borderRadius: '5px',
                              fontSize: '1rem',
                              backgroundColor: 'black',
                              color: 'white'
                            }}
                            value={item.addressId}
                            onChange={(e) => updateProduct(index, 'addressId', Number(e.target.value))}
                            required
                          >
                            {addresses.map(address => (
                              <option key={address.id} value={address.id}>
                                {address.street}, {address.city}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <select
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #555',
                              borderRadius: '5px',
                              fontSize: '1rem',
                              backgroundColor: 'black',
                              color: 'white'
                            }}
                            value={item.warehouseId}
                            onChange={(e) => updateProduct(index, 'warehouseId', Number(e.target.value))}
                            required
                          >
                            {warehouses.map(warehouse => (
                              <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            style={{
                              backgroundColor: 'hsla(0, 70%, 40%, 1)',
                              color: 'white',
                              padding: '0.375rem 0.75rem',
                              border: 'none',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                            onClick={() => removeProduct(index)}
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
          </div>
        )}
  
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <button 
            style={{
              backgroundColor: 'hsla(220, 70%, 8%, 1)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: '1px solid hsla(220, 70%, 20%, 1)',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              opacity: isLoading ? 0.5 : 1,
            }}
            onClick={resetForm}
            disabled={isLoading}
          >
            Visszaállítás
          </button>
          <button
            style={{
              backgroundColor: 'hsla(220, 70%, 8%, 1)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: '1px solid hsla(220, 70%, 20%, 1)',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              opacity: isLoading || selectedProducts.length === 0 ? 0.5 : 1,
            }}
            type="submit"
            disabled={isLoading || selectedProducts.length === 0}
          >
            {isLoading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid white',
                  borderRadius: '50%',
                  borderTopColor: 'white',
                  animation: 'spin 1s linear infinite',
                  marginRight: '0.5rem'
                }}></span>
                Rendelés létrehozása...
              </>
            ) : (
              'Rendelés létrehozása'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};


export default AddOrderForm;