const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

// 1. Configure MySQL Connection Pool using mysql2/promise (Port 3307 for XAMPP)
let db;

async function initDB() {
  try {
    // Initial connection without database to create 'retail_store' if it doesn't exist
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Empty password for XAMPP
      port: 3307    // Configured XAMPP MySQL Port
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS retail_store;`);
    await connection.end();

    // Create pool targeting the created database
    db = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'retail_store',
      port: 3307,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Create Suppliers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS Suppliers (
        SupplierID INT AUTO_INCREMENT PRIMARY KEY,
        SupplierName TEXT NOT NULL,
        ContactNumber TEXT
      );
    `);

    // Create Products table
    await db.query(`
      CREATE TABLE IF NOT EXISTS Products (
        ProductID INT AUTO_INCREMENT PRIMARY KEY,
        ProductName TEXT NOT NULL,
        Price DECIMAL(10, 2) NOT NULL,
        StockQuantity INT NOT NULL,
        SupplierID INT,
        FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID) ON DELETE SET NULL
      );
    `);

    // Create Sales table
    await db.query(`
      CREATE TABLE IF NOT EXISTS Sales (
        SaleID INT AUTO_INCREMENT PRIMARY KEY,
        ProductID INT,
        QuantitySold INT NOT NULL,
        SaleDate DATE NOT NULL,
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
      );
    `);

    console.log("Database and tables initialized successfully on port 3307.");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

initDB();

// 2. CRUD Operations for Products Table

// Create a product
app.post('/products', async (req, res) => {
  const { ProductName, Price, StockQuantity, SupplierID } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO Products (ProductName, Price, StockQuantity, SupplierID) VALUES (?, ?, ?, ?)',
      [ProductName, Price, StockQuantity, SupplierID]
    );
    res.status(201).json({ message: 'Product created successfully', productId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve all products
app.get('/products', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Products');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve a product by ID
app.get('/products/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Products WHERE ProductID = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a product
app.put('/products/:id', async (req, res) => {
  const { ProductName, Price, StockQuantity, SupplierID } = req.body;
  try {
    await db.query(
      'UPDATE Products SET ProductName = ?, Price = ?, StockQuantity = ?, SupplierID = ? WHERE ProductID = ?',
      [ProductName, Price, StockQuantity, SupplierID, req.params.id]
    );
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a product
app.delete('/products/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM Products WHERE ProductID = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CRUD Operations for Suppliers Table

// Create a supplier
app.post('/suppliers', async (req, res) => {
  const { SupplierName, ContactNumber } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO Suppliers (SupplierName, ContactNumber) VALUES (?, ?)',
      [SupplierName, ContactNumber]
    );
    res.status(201).json({ message: 'Supplier created successfully', supplierId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve all suppliers
app.get('/suppliers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Suppliers');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update supplier information
app.put('/suppliers/:id', async (req, res) => {
  const { SupplierName, ContactNumber } = req.body;
  try {
    await db.query(
      'UPDATE Suppliers SET SupplierName = ?, ContactNumber = ? WHERE SupplierID = ?',
      [SupplierName, ContactNumber, req.params.id]
    );
    res.json({ message: 'Supplier updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a supplier
app.delete('/suppliers/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM Suppliers WHERE SupplierID = ?', [req.params.id]);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Sales Management Endpoints

// Record a sale
app.post('/sales', async (req, res) => {
  const { ProductID, QuantitySold, SaleDate } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO Sales (ProductID, QuantitySold, SaleDate) VALUES (?, ?, ?)',
      [ProductID, QuantitySold, SaleDate]
    );
    res.status(201).json({ message: 'Sale recorded successfully', saleId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve all sales
app.get('/sales', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Sales');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve sales for a specific product
app.get('/sales/product/:productId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Sales WHERE ProductID = ?', [req.params.productId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Schema Alterations Endpoints

// Add Category column to Products table
app.post('/schema/add-category', async (req, res) => {
  try {
    await db.query('ALTER TABLE Products ADD COLUMN Category VARCHAR(50)');
    res.json({ message: 'Category column added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove Category column from Products table
app.post('/schema/remove-category', async (req, res) => {
  try {
    await db.query('ALTER TABLE Products DROP COLUMN Category');
    res.json({ message: 'Category column removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change ContactNumber data type to VARCHAR(15)
app.post('/schema/modify-contact-number', async (req, res) => {
  try {
    await db.query('ALTER TABLE Suppliers MODIFY COLUMN ContactNumber VARCHAR(15)');
    res.json({ message: 'ContactNumber modified to VARCHAR(15)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add NOT NULL constraint to ProductName
app.post('/schema/add-notnull-productname', async (req, res) => {
  try {
    await db.query('ALTER TABLE Products MODIFY COLUMN ProductName VARCHAR(255) NOT NULL');
    res.json({ message: 'NOT NULL constraint added to ProductName' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Data Seeding Endpoint

app.post('/seed-data', async (req, res) => {
  try {
    // a. Add Supplier 'FreshFoods'
    const [suppResult] = await db.query(
      "INSERT INTO Suppliers (SupplierName, ContactNumber) VALUES ('FreshFoods', '01001234567')"
    );
    const supplierId = suppResult.insertId;

    // b. Insert three products provided by 'FreshFoods'
    const [milkResult] = await db.query(
      "INSERT INTO Products (ProductName, Price, StockQuantity, SupplierID) VALUES ('Milk', 15.00, 50, ?)",
      [supplierId]
    );
    await db.query(
      "INSERT INTO Products (ProductName, Price, StockQuantity, SupplierID) VALUES ('Bread', 10.00, 30, ?)",
      [supplierId]
    );
    await db.query(
      "INSERT INTO Products (ProductName, Price, StockQuantity, SupplierID) VALUES ('Eggs', 20.00, 40, ?)",
      [supplierId]
    );

    // c. Add Sale record for 2 units of 'Milk' made on '2025-05-20'
    await db.query(
      "INSERT INTO Sales (ProductID, QuantitySold, SaleDate) VALUES (?, 2, '2025-05-20')",
      [milkResult.insertId]
    );

    res.json({ message: 'Initial data seeded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Update Price of 'Bread' to 25.00
app.patch('/products/update-bread-price', async (req, res) => {
  try {
    await db.query("UPDATE Products SET Price = 25.00 WHERE ProductName = 'Bread'");
    res.json({ message: "Price of Bread updated to 25.00 successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Delete Product 'Eggs'
app.delete('/products/delete-eggs', async (req, res) => {
  try {
    await db.query("DELETE FROM Products WHERE ProductName = 'Eggs'");
    res.json({ message: "Product 'Eggs' deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reporting Endpoints (9 to 13)

// 9. Total quantity sold for each product using SQL aggregate functions
app.get('/reports/total-sold', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.ProductID, p.ProductName, COALESCE(SUM(s.QuantitySold), 0) AS TotalQuantitySold
      FROM Products p
      LEFT JOIN Sales s ON p.ProductID = s.ProductID
      GROUP BY p.ProductID, p.ProductName
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Product with the highest stock quantity
app.get('/reports/highest-stock', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM Products ORDER BY StockQuantity DESC LIMIT 1
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Suppliers whose names start with 'F'
app.get('/reports/suppliers-f', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM Suppliers WHERE SupplierName LIKE 'F%'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Products that have never been sold
app.get('/reports/never-sold', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.* FROM Products p
      LEFT JOIN Sales s ON p.ProductID = s.ProductID
      WHERE s.SaleID IS NULL
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Retrieve all sales including product name, quantity sold, and sale date using JOIN
app.get('/reports/sales-details', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.ProductName, s.QuantitySold, s.SaleDate
      FROM Sales s
      JOIN Products p ON s.ProductID = p.ProductID
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Endpoint for Store Manager User & Permissions (14, 15, 16)
app.post('/admin/setup-manager-permissions', async (req, res) => {
  try {
    await db.query("CREATE USER IF NOT EXISTS 'store_manager'@'localhost' IDENTIFIED BY 'password123'");
    await db.query("GRANT SELECT, INSERT, UPDATE ON retail_store.* TO 'store_manager'@'localhost'");
    await db.query("REVOKE UPDATE ON retail_store.* FROM 'store_manager'@'localhost'");
    await db.query("GRANT DELETE ON retail_store.Sales TO 'store_manager'@'localhost'");
    await db.query("FLUSH PRIVILEGES");

    res.json({ message: "Store manager user created and permissions configured successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Express Server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});