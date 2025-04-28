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
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
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
        
        if (warehousesRes.data.length > 0) {
          setSelectedWarehouseId(warehousesRes.data[0].id);
        }
        if (addressesRes.data.length > 0) {
          setSelectedAddressId(addressesRes.data[0].id);
        }
      } catch (err) {
        setError('Failed to load initial data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [isLoggedIn]);

  // Fetch inventories when warehouse changes
  useEffect(() => {
    if (!selectedWarehouseId) return;

    const fetchInventories = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/warehouses/${selectedWarehouseId}/inventories`);
        setInventories(response.data);
      } catch (err) {
        setError('Failed to load inventories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventories();
  }, [selectedWarehouseId]);

  // Filtered inventories based on search and available stock
  const filteredInventories = inventories.filter(inv =>
    (inv.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.product.barcode.toLowerCase().includes(searchTerm.toLowerCase())) &&
    inv.quantity > 0  // Only include products with available stock
  );

  const addProductToDelivery = (inventory: Inventory) => {
    if (selectedProducts.some(p => p.inventoryId === inventory.id)) {
      setError('This product is already in the delivery');
      return;
    }

    if (inventory.quantity <= 0) {
      setError('No available stock for this product');
      return;
    }

    setSelectedProducts(prev => [
      ...prev,
      {
        inventoryId: inventory.id,
        productId: inventory.product.id,
        productName: inventory.product.name,
        quantity: 1,
        warehouseId: selectedWarehouseId!,
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
      setError('Please add at least one product to the delivery');
      return;
    }

    if (!selectedAddressId) {
      setError('Please select a delivery address');
      return;
    }

    // Check inventory quantities
    for (const item of selectedProducts) {
      const inventory = inventories.find(inv => inv.id === item.inventoryId);
      if (!inventory || item.quantity > inventory.quantity) {
        setError(`Not enough stock for ${item.productName}`);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      // Find the selected address
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      if (!selectedAddress) {
        throw new Error('Selected address not found');
      }

      const res = await api.post('/deliveries', {
        deliveryDate: new Date(deliveryDate).toISOString(),
      });

      selectedProducts.forEach(async (item) => {
        await api.post('/deliveries/details', {
          price: item.sellingPrice,
          shippingCost: 1,
          OrderQuantity: item.quantity,
          ExpectedDate: new Date(new Date(deliveryDate).setDate(new Date(deliveryDate).getDate() + 2)).toISOString(),
          productId: item.productId,
          warehouseId: item.warehouseId,
          addressId: selectedAddressId,
          deliveryId: res.data.id
        });
      });

      setSuccess('Outgoing delivery created successfully!');
      resetForm();
    } catch (error) {
      setError(`Failed to create delivery: ${error instanceof Error ? error.message : String(error)}`);
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

  return (
    <div className="delivery-form-container">
      <h2>Outgoing Delivery Creation</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="delivery-form">
        <div className="form-row">
          <div className="form-group">
            <label>Delivery Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Delivery Address</label>
            <select
              value={selectedAddressId ?? ''}
              onChange={(e) => setSelectedAddressId(Number(e.target.value))}
              required
            >
              {addresses.map(address => (
                <option key={address.id} value={address.id}>
                  {formatAddress(address)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Warehouse</label>
            <select
              value={selectedWarehouseId ?? ''}
              onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
              required
            >
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rest of the form remains the same */}
        <div className="product-search">
          <label>Search Products</label>
          <input
            type="text"
            placeholder="Search by name or barcode"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="products-section">
          <div className="available-products">
            <h5>Available Products ({filteredInventories.length})</h5>
            <div className="product-grid">
              {filteredInventories.map(inv => (
                <div key={inv.id} className="product-card">
                  <div className="product-info">
                    <h4>{inv.product.name}</h4>
                    <p>Barcode: {inv.product.barcode}</p>
                    <p>Stock: {inv.quantity}</p>
                    <p>Price: {inv.product.unitPrice} Ft</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addProductToDelivery(inv)}
                    disabled={selectedProducts.some(p => p.inventoryId === inv.id)}
                  >
                    Add to Delivery
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="selected-products">
            <h5>Delivery Items ({selectedProducts.length})</h5>
            {selectedProducts.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price (Ft)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((item, index) => {
                    const inventory = inventories.find(inv => inv.id === item.inventoryId);
                    const maxQuantity = inventory?.quantity || 0;

                    return (
                      <tr key={index}>
                        <td>{item.productName}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            max={maxQuantity}
                            value={item.quantity}
                            onChange={(e) => updateProduct(index, 'quantity', Number(e.target.value))}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.sellingPrice}
                            onChange={(e) => updateProduct(index, 'sellingPrice', Number(e.target.value))}
                            required
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="remove-button"
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
            ) : (
              <p className="empty-message">No products added to delivery yet</p>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="reset-button"
            onClick={resetForm}
            disabled={isLoading}
          >
            Clear All
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading || selectedProducts.length === 0}
          >
            {isLoading ? 'Creating Delivery...' : 'Create Delivery'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDeliveryModal;