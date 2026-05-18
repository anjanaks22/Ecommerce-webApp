var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers');
const userHelper=require('../helpers/user-helpers')
const db = require('../config/connection');

const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  }else{
    res.redirect("/login")
  }
}
/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user
  console.log(user);
  let cartCount=null
  if(req.session.user){
   cartCount=await userHelper.getCartCount(req.session.user._id)
  }
  
  productHelper.getAllProducts().then((products)=>{
  
   res.render('user/view-products',{products,user,cartCount});
  })
 // res.render('index', {products,admin:false});
});
router.get('/login',(req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }else{

    res.render('user/login',{"LoginErr":req.session.userLoginErr})
   req.session.userLoginErr=false
  }
 
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
 userHelper.doSignup(req.body).then((response)=>{
  console.log(response);

  req.session.user=response
  req.session.user.loggedIn=true
  res.redirect('/')
 })
})
router.post('/login',(req,res)=>{
 userHelper.doLogin(req.body).then((response)=>{
  if(response.status){
    
    req.session.user=response.user
    req.session.userLoggedIn=true
    res.redirect('/')
  }else{
    req.session.userLoginErr="Invalid Email or Password"
    res.redirect('/login')
  }
 })
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/')
})
router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelper.getCartProducts(req.session.user.id);
  let totalValue = 0;

  console.log("Cart Products:", products);  // 🔍 Debug the product structure

  if (products.length > 0) {
     totalValue = await userHelper.getTotalAmount(req.session.user.id);
      res.render('user/cart', { products, user: req.session.user.id, totalValue, cartEmpty: false });
  } else {
      res.render('user/cart', { cartEmpty: true, user: req.session.user.id });
  }
});


router.get('/add-to-cart/:id', (req, res) => {
  if (!req.session.user) {
      return res.json({ status: false, message: "User not logged in" });
  }

  console.log("API Call: Adding to cart");
  console.log("User ID:", req.session.user.id);
  console.log("Product ID:", req.params.id);

  userHelper.addToCart(req.params.id, req.session.user.id).then(() => {
      res.json({ status: true });
  }).catch((err) => {
      console.error("Error in add-to-cart:", err);
      res.status(500).json({ status: false, message: "Error adding to cart" });
  });
});
router.post('/change-product-quantity', async (req, res, next) => {
  console.log(req.body);
  try {
      let response = await userHelper.changeProductQuantity(req.body);
      response.total = await userHelper.getTotalAmount(req.body.user);
      res.json(response);
  } catch (error) {
      console.error("Error updating product quantity:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});
router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelper.getTotalAmount(req.session.user.id);
  res.render('user/place-order', { total, user: req.session.user });
});

router.post('/place-order', async (req, res) => {
  try {
      let products = await userHelper.getCartProductList(req.body.userId);
      let totalPrice = await userHelper.getTotalAmount(req.body.userId);

      userHelper.placeOrder(req.body, products, totalPrice).then((response) => {
          if (req.body['payment-method'] === 'COD') {
              res.json({ status: true });
          } else {
              // Online payment logic can be added here (e.g., Razorpay, Stripe, PayPal)
              res.json({ status: false, message: "Online payment not implemented yet" });
          }
      });
  } catch (error) {
      console.error("❌ Error placing order:", error);
      res.status(500).json({ status: false, error: "Internal Server Error" });
  }
});

router.get('/order-success', (req, res) => {
  res.render('user/order-success', { user: req.session.user });
});

router.get('/orders', async (req, res) => {
  try {
      let orders = await userHelper.getUserOrders(req.session.user.id);
      res.render('user/orders', { user: req.session.user, orders });
  } catch (error) {
      console.error("❌ Error fetching orders:", error);
      res.status(500).send("Internal Server Error");
  }
});

router.get('/view-order-products/:id', async (req, res) => {
  try {
      let products = await userHelper.getOrderProducts(req.params.id);
      console.log("📦 Order Products:", products); // Debugging log

      res.render('user/view-order-products', { 
          user: req.session.user, // Ensure user is passed
          products 
      });
  } catch (error) {
      console.error("❌ Error fetching order products:", error);
      res.status(500).send("Error fetching order products");
  }
});
router.post('/remove-cart-item', (req, res) => {
  const { cartId, productId } = req.body;

  const connection = db.get(); // Get MySQL connection

  const deleteQuery = `DELETE FROM cart WHERE id = ? AND product_id = ?`;

  connection.query(deleteQuery, [cartId, productId], (err, result) => {
      if (err) {
          console.error("❌ Error removing cart item:", err);
          return res.json({ success: false });
      }
      
      if (result.affectedRows > 0) {
          console.log("✅ Cart item removed successfully");
          res.json({ success: true });
      } else {
          console.log("⚠️ No matching cart item found");
          res.json({ success: false });
      }
  });
});







module.exports = router;
