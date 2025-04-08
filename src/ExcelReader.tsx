import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface ExcelProductRow {
  'Kép'?: string;
  'Cikkszám'?: string;
  'Vonalkód'?: string;
  'Megnevezés'?: string;
  'db/doboz'?: number;
  'Nettó ár (Ft)'?: number;
  'Megrendelés'?: string;
  [key: string]: any; // For any unexpected columns
}

interface Response extends Product {
  id: number;
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

const ExcelReader: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleUploadProducts = async () => {
    if (products.length === 0) {
      setError('No products to upload');
      return;
    }
  
    setError(null);
    setIsLoading(true);
  
    const responses: Response[] = [];
    try {
      for (const product of products) {
        const response = await fetch('http://localhost:3000/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product)
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to upload product');
        }
        const result = await response.json();
        responses.push(result);
      }
      
      setProducts([]);
      alert('Products uploaded successfully!');

      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setProducts([]);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON with header row
        const excelData: ExcelProductRow[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '', // Default empty string for empty cells
          raw: false // Get formatted strings
        });

        // Process and filter valid products
        const validProducts = excelData
          .map(convertToProduct)
          .filter((product): product is Product => product !== null);

        if (validProducts.length === 0) {
          setError('No valid products found in the file');
        } else {
          setProducts(validProducts);
        }
      } catch (error) {
        console.error('File processing error:', error);
        setError(`Failed to process Excel file: ${error instanceof Error ? error.message : String(error)}`);
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

  return (
    <div className="excel-reader">
      <h2>Import Excel</h2>
      
      <div className="file-upload">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          disabled={isLoading}
        />
      </div>

      {isLoading && <div className="loading">Processing file...</div>}
      
      {error && <div className="error">{error}</div>}

      {products.length > 0 && (
        <div className="results">
          <h3>Successfully imported {products.length} products</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Barcode</th>
                  <th>Price (Ft)</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((product, index) => (
                  <tr key={index}>
                    <td>{product.name}</td>
                    <td>{product.barcode}</td>
                    <td>{product.unitPrice}</td>
                  </tr>
                ))}
                {products.length > 5 && (
                  <tr>
                    <td colSpan={3}>... and {products.length - 5} more products</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Add this upload button */}
          <button 
            onClick={handleUploadProducts}
            disabled={isLoading || products.length === 0}
            className="upload-button"
          >
            {isLoading ? 'Uploading...' : 'Upload Products'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ExcelReader;