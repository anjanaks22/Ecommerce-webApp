const db = require('../config/connection');
const collection = require('../config/collections');
const bcrypt=require('bcrypt');
module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            try {
                const connection = db.get(); // Get MySQL connection
                userData.Password = await bcrypt.hash(userData.Password, 10); // Hash password
    
                const query = `INSERT INTO users (Name, Email, Password) VALUES (?, ?, ?)`;
                const values = [userData.Name, userData.Email, userData.Password];
    
                connection.query(query, values, (err, result) => {
                    if (err) {
                        console.error("Error inserting user:", err);
                        return reject(err);
                    }
    
                    console.log("User registered successfully");
                    resolve({ id: result.insertId, ...userData });
                });
            } catch (error) {
                console.error("Unexpected error during signup:", error);
                reject(error);
            }
        });
    }
    
,


doLogin: (userData) => {
    return new Promise((resolve, reject) => {
        const connection = db.get(); // Get MySQL connection
        const query = `SELECT * FROM users WHERE Email = ?`; // MySQL query

        connection.query(query, [userData.Email], async (err, results) => {
            if (err) {
                console.error("Error fetching user:", err);
                return reject(err);
            }

            if (results.length > 0) {
                let user = results[0]; // Get the first matching user

                // Compare hashed password
                let status = await bcrypt.compare(userData.Password, user.Password);

                if (status) {
                    console.log("Login successful");
                    resolve({ user, status: true });
                } else {
                    console.log("Login failed: Incorrect password");
                    resolve({ status: false });
                }
            } else {
                console.log("Login failed: User not found");
                resolve({ status: false });
            }
        });
    });
},
addToCart: (proId, userId) => {
    return new Promise((resolve, reject) => {
        const connection = db.get(); // Get MySQL connection

        console.log(`Checking if product ${proId} exists in cart for user ${userId}`);

        // Check if the product already exists in the cart
        const checkQuery = `SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?`;

        connection.query(checkQuery, [userId, proId], (err, result) => {
            if (err) {
                console.error("❌ Error checking cart:", err);
                return reject(err);
            }

            console.log("🔎 Cart check result:", result);

            if (result.length > 0) {
                console.log(`✅ Product exists. Increasing quantity for product ${proId}`);

                // Product exists, update quantity
                const updateQuery = `UPDATE cart SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ?`;
                connection.query(updateQuery, [userId, proId], (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error("❌ Error updating cart:", updateErr);
                        return reject(updateErr);
                    }
                    console.log("✅ Cart updated successfully");
                    resolve();
                });

            } else {
                console.log(`➕ Product does not exist. Adding to cart: ${proId}`);

                // Insert new product in cart
                const insertQuery = `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1)`;
                connection.query(insertQuery, [userId, proId], (insertErr, insertResult) => {
                    if (insertErr) {
                        console.error("❌ Error adding to cart:", insertErr);
                        return reject(insertErr);
                    }
                    console.log("✅ Product added to cart");
                    resolve();
                });
            }
        });
    });
}

,
getCartProducts: (userId) => {
    return new Promise((resolve, reject) => {
        const connection = db.get(); // Get MySQL connection

        const query = `
            SELECT cart.id AS cartId, cart.quantity, 
                   products.id AS productId, products.name, products.description, products.price
            FROM cart
            JOIN products ON cart.product_id = products.id
            WHERE cart.user_id = ?
        `;

        connection.query(query, [userId], (err, results) => {
            if (err) {
                console.error("❌ Error fetching cart products:", err);
                return reject(err);
            }

            // Map results to include product object
            let formattedProducts = results.map(item => ({
                id: item.cartId, // Cart entry ID
                quantity: item.quantity,
                product: {
                    id: item.productId,
                    name: item.name,
                    description: item.description,
                    price: item.price
                }
            }));

            console.log("🛒 Formatted Cart Products:", formattedProducts);  // Debugging

            resolve(formattedProducts);
        });
    });
}
,
getCartCount: (userId) => {
    return new Promise((resolve, reject) => {
        const connection = db.get(); // Get MySQL connection

        const query = `SELECT COUNT(*) AS count FROM cart WHERE user_id = ?`;

        connection.query(query, [userId], (err, results) => {
            if (err) {
                console.error("Error fetching cart count:", err);
                return reject(err);
            }
            resolve(results[0].count);
        });
    });
},
changeProductQuantity:(details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
        const connection = db.get(); // Get MySQL connection

        if (details.count === -1 && details.quantity === 1) {
            // Remove product from cart
            const deleteQuery = `DELETE FROM cart WHERE id = ? AND product_id = ?`;

            connection.query(deleteQuery, [details.cart, details.product], (err, result) => {
                if (err) {
                    console.error("❌ Error removing product from cart:", err);
                    return reject(err);
                }
                resolve({ removeProduct: true });
            });

        } else {
            // Update product quantity
            const updateQuery = `UPDATE cart SET quantity = quantity + ? WHERE id = ? AND product_id = ?`;

            connection.query(updateQuery, [details.count, details.cart, details.product], (err, result) => {
                if (err) {
                    console.error("❌ Error updating cart quantity:", err);
                    return reject(err);
                }
                resolve({ status: true });
            });
        }
    });
},
 getTotalAmount:(userId) => {
    return new Promise((resolve, reject) => {
        const connection = db.get(); // Get MySQL connection

        const query = `
            SELECT SUM(cart.quantity * products.price) AS total
            FROM cart
            JOIN products ON cart.product_id = products.id
            WHERE cart.user_id = ?
        `;

        connection.query(query, [userId], (err, results) => {
            if (err) {
                console.error("❌ Error fetching total amount:", err);
                return reject(err);
            }

            // If no cart items, return 0
            const total = results[0].total || 0;
            resolve(total);
        });
    });
},
placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
        console.log(order, products, total);
        let status = order['payment-method'] === 'COD' ? 'placed' : 'pending';

        const connection = db.get();
        const orderQuery = `INSERT INTO orders (user_id, mobile, address, pincode, payment_method, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        connection.query(orderQuery, [order.userId, order.mobile, order.address, order.pincode, order['payment-method'], total, status], (err, result) => {
            if (err) {
                console.error("❌ Error placing order:", err);
                return reject(err);
            }

            let orderId = result.insertId;
            console.log("✅ Order placed, Order ID:", orderId);

            // Insert each product into order_items table
            let orderItemsQuery = `INSERT INTO order_items (order_id, product_id, quantity) VALUES ?`;
            let orderItemsValues = products.map(product => [orderId, product.product_id, product.quantity]);

            connection.query(orderItemsQuery, [orderItemsValues], (err, result) => {
                if (err) {
                    console.error("❌ Error inserting order items:", err);
                    return reject(err);
                }

                // Delete user's cart after placing order
                let deleteCartQuery = `DELETE FROM cart WHERE user_id = ?`;
                connection.query(deleteCartQuery, [order.userId], (err, result) => {
                    if (err) {
                        console.error("❌ Error clearing cart:", err);
                        return reject(err);
                    }

                    console.log("✅ Cart cleared after order");
                    resolve();
                });
            });
        });
    });
},

getCartProductList: (userId) => {
    return new Promise((resolve, reject) => {
        const connection = db.get();
        let query = `SELECT product_id, quantity FROM cart WHERE user_id = ?`;

        connection.query(query, [userId], (err, results) => {
            if (err) {
                console.error("❌ Error fetching cart products:", err);
                return reject(err);
            }
            resolve(results);
        });
    });
},

getUserOrders: (userId) => {
    return new Promise((resolve, reject) => {
        const connection = db.get();
        let query = `SELECT * FROM orders WHERE user_id = ? ORDER BY date DESC`;

        connection.query(query, [userId], (err, results) => {
            if (err) {
                console.error("❌ Error fetching user orders:", err);
                return reject(err);
            }
            resolve(results);
        });
    });
},

getOrderProducts: (orderId) => {
    return new Promise((resolve, reject) => {
        const connection = db.get();
        let query = `
            SELECT oi.quantity, p.id AS product_id, p.name, p.description, p.price
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `;

        connection.query(query, [orderId], (err, results) => {
            if (err) {
                console.error("❌ Error fetching order products:", err);
                return reject(err);
            }
            console.log("🛍 Order Products Fetched:", results); // Debugging log
            resolve(results);
        });
    });
},
removeCartItem: (cartId, productId) => {
    return new Promise((resolve, reject) => {
        const connection = db.get(); // Get MySQL connection

        const deleteQuery = `DELETE FROM cart WHERE id = ? AND product_id = ?`;

        connection.query(deleteQuery, [cartId, productId], (err, result) => {
            if (err) {
                console.error("❌ Error removing cart item:", err);
                return reject(err);
            }

            if (result.affectedRows > 0) {
                console.log("✅ Cart item removed successfully");
                resolve(result);
            } else {
                console.log("⚠️ No matching cart item found");
                resolve(null);
            }
        });
    });
}












}