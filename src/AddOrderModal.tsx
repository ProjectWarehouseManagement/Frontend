import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner, Alert, Table } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { useAuth } from './AuthContext';
import { api } from './environments/api';
import { all } from 'axios';

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
  const [barcodeMappings, setBarcodeMappings] = useState<BarcodeMapping[]>([]);

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
        setError('Failed to load initial data');
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
              // Product exists - handle both single object and array responses
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
              // Product needs to be uploaded
              const prod = validProducts.find(product => product.barcode === result.barcode);
              if (prod && prod.name) {
                productsToUpload.push({
                  ...prod,
                  barcode: result.barcode
                });
              } else {
                console.error('Invalid product data:', prod);
              }
            }
          });

          productsToUpload.forEach(product => {
            console.log('Product to upload:', product);
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
  
          setBarcodeMappings(prev => [...prev, ...newMappings]);
          setProducts(allProducts);
        
        setSuccess(
            `${newProducts.length} new products uploaded, ` +
            `${existingProducts.length} existing products loaded`
          );
      } catch (error) {
        setError(`Failed to process or upload products: ${error instanceof Error ? error.message : String(error)}`);
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
      setError('Please select a provider and at least one product');
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
      
      setSuccess('Order created successfully!');
      resetForm();
    } catch (error) {
      setError(`Failed to create order: ${error instanceof Error ? error.message : String(error)}`);
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
    <div className="container p-4">
      <h2 className="mb-4">Create New Order</h2>
      
      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-4" role="alert">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="orderDate" className="form-label">Order Date</label>
              <input
                type="date"
                className="form-control"
                id="orderDate"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label htmlFor="provider" className="form-label">Provider</label>
              <select
                className="form-select"
                id="provider"
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
  
        <div className="row mb-4">
          <div className="col">
            <div className="mb-3">
              <label htmlFor="productUpload" className="form-label">Upload Products from Excel</label>
              <input
                type="file"
                className="form-control"
                id="productUpload"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
              <div className="form-text">
                Upload an Excel file with product barcodes
              </div>
            </div>
          </div>
        </div>
  
        {products.length > 0 && (
          <div className="row mb-4">
            <div className="col">
              <h5>Available Products</h5>
              <div className="table-responsive">
                <table className="table table-striped table-bordered">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Barcode</th>
                      <th>Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.barcode}</td>
                        <td>{product.unitPrice} Ft</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => addProductToOrder(product)}
                            disabled={selectedProducts.some(p => p.productId === product.id)}
                          >
                            Add to Order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
  
        {selectedProducts.length > 0 && (
          <div className="row mb-4">
            <div className="col">
              <h5>Order Items</h5>
              <div className="table-responsive">
                <table className="table table-striped table-bordered">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price (Ft)</th>
                      <th>Shipping (Ft)</th>
                      <th>Quantity</th>
                      <th>Expected Date</th>
                      <th>Address</th>
                      <th>Warehouse</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.map((item, index) => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <tr key={index}>
                          <td>{product?.name || 'Product'}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateProduct(index, 'price', Number(e.target.value))}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              min="0"
                              step="0.01"
                              value={item.shippingCost}
                              onChange={(e) => updateProduct(index, 'shippingCost', Number(e.target.value))}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              min="1"
                              value={item.OrderQuantity}
                              onChange={(e) => updateProduct(index, 'OrderQuantity', Number(e.target.value))}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control"
                              value={item.ExpectedDate}
                              onChange={(e) => updateProduct(index, 'ExpectedDate', e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <select
                              className="form-select"
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
                          <td>
                            <select
                              className="form-select"
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
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => removeProduct(index)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
  
        <div className="d-flex justify-content-between mt-4">
          <button 
            className="btn btn-secondary"
            onClick={resetForm}
            disabled={isLoading}
          >
            Reset Form
          </button>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={isLoading || selectedProducts.length === 0}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span className="ms-2">Creating Order...</span>
              </>
            ) : (
              'Create Order'
            )}
          </button>
        </div>
      </form>
    </div>
)};


export default AddOrderForm;