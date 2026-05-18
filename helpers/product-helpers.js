
const db = require('../config/connection');
const collection = require('../config/collections');

module.exports = {
    addProduct: (products, callback) => {
        console.log( products);

        const connection = db.get(); // MySQL connection

        // SQL query to insert product into the 'products' table
        const query = `INSERT INTO ${collection.PRODUCT_COLLECTION} (name, description, price ) VALUES (?, ?, ?)`;

        const values = [products.name, products.description, products.price ]; // Assuming product has these fields      
        console.log(values);
        connection.query(query, values, (err, result) => {
            if (err) {
                console.log('Error inserting product:', err);
                callback(null);
            } else {
                callback(result.insertId); // Return the ID of the inserted product
            }
        });
    },

    /*getAllProducts: () => {
        return new Promise((resolve, reject) => {
            const connection = db.get(); // MySQL connection

            // SQL query to get all products from the 'products' table
            const query = `SELECT * FROM ${collection.PRODUCT_COLLECTION}`;

            connection.query(query, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results); // Resolve with the results of the query
                }
            });
        });
    },
*/

    getAllProducts: () => {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM products`; // MySQL query to fetch all products
            db.get().query(query, (err, results) => {
                if (err) {
                    console.error("❌ Error fetching products:", err);
                    return reject(err);
                }
                resolve(results); // Return product list
            });
        });
    }
,




    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            const connection = db.get(); // ✅ Fetch the actual connection

            if (!connection) {
                console.error("Database connection is not established.");
                return reject(new Error("Database connection not available"));
            }

            const sql = "DELETE FROM products WHERE id = ?";
            
            connection.query(sql, [prodId], (err, result) => {
                if (err) {
                    console.error("SQL Error Deleting Product:", err.sqlMessage);
                    return reject(err);
                }
                if (result.affectedRows === 0) {
                    console.warn("No product found with ID:", prodId);
                    return reject(new Error("No product found with the given ID"));
                }
                console.log("Delete Success:", result);
                resolve(result);
            });
        });
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            const connection = db.get(); // Get the MySQL connection
            
            if (!connection) {
                console.error("Database connection is not established.");
                return reject(new Error("Database connection not available"));
            }

            const sql = "SELECT * FROM products WHERE id = ?";
            
            connection.query(sql, [proId], (err, results) => {
                if (err) {
                    console.error("Error fetching product details:", err);
                    return reject(err);
                }
                if (results.length === 0) {
                    console.warn("No product found with ID:", proId);
                    return reject(new Error("Product not found"));
                }
                resolve(results[0]); // Return the first product found
            });
        });
    },
    updateProduct: (proId, proDetails) => {
        return new Promise((resolve, reject) => {
            const connection = db.get(); // Get the MySQL connection
    
            if (!connection) {
                console.error("Database connection is not established.");
                return reject(new Error("Database connection not available"));
            }
    
            proDetails.Price = Number(proDetails.Price); // Ensure price is a number
    
            const sql = "UPDATE products SET Name = ?, Description = ?, Price = ? WHERE id = ?";
            const values = [proDetails.Name, proDetails.Description, proDetails.Price, proId];
    
            connection.query(sql, values, (err, result) => {
                if (err) {
                    console.error("Error updating product:", err);
                    return reject(err);
                }
                if (result.affectedRows === 0) {
                    console.warn("No product found to update with ID:", proId);
                    return reject(new Error("Product not found or no changes made"));
                }
                console.log("Update Success:", result);
                resolve(result);
            });
        });
    },
    getAllOrders: () => {
        return new Promise((resolve, reject) => {
            const connection = db.get(); // Get MySQL connection
    
            const query = `
                SELECT 
                    orders.id AS orderId, 
                    orders.user_id AS userId, 
                    orders.total_amount AS totalAmount, 
                    orders.payment_method AS paymentMethod, 
                    orders.status, 
                    orders.date, 
                    users.Name AS userName 
                FROM orders
                JOIN users ON orders.user_id = users.id 
                ORDER BY orders.date DESC
            `;
    
            connection.query(query, (err, results) => {
                if (err) {
                    console.error("❌ Error fetching orders:", err);
                    return reject(err);
                }
                resolve(results);
            });
        });
    },
    getAllUsers: () => {
        return new Promise((resolve, reject) => {
            const connection = db.get();
            
            const query = `SELECT id, Name, Email FROM users ORDER BY id DESC`;
    
            connection.query(query, (err, results) => {
                if (err) {
                    console.error("❌ Error fetching users:", err);
                    return reject(err);
                }
                resolve(results);
            });
        });
    }
    

    
    

    
    

};








