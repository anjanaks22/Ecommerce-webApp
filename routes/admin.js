var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers');

// Hardcoded admin credentials
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123"; 

// Middleware to verify admin session
const verifyAdminLogin = (req, res, next) => {
    if (req.session.adminLoggedIn) {
        next();
    } else {
        res.redirect('/admin/login');
    }
};
// Admin login page
router.get('/login', (req, res) => {
    if (req.session.adminLoggedIn) {
        return res.redirect('/admin');
    }
    res.render('admin/login', { loginErr: req.session.adminLoginErr, hideHeader: true }); // 👈 Pass hideHeader: true
    req.session.adminLoginErr = false;
  });
  
  
  // Handle admin login
  router.post('/login', (req, res) => {
      const { email, password } = req.body;
      
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          req.session.adminLoggedIn = true;
          res.redirect('/admin');
      } else {
          req.session.adminLoginErr = "Invalid Email or Password";
          res.redirect('/admin/login');
      }
  });
  
  // Admin logout
  router.get('/logout', (req, res) => {
      req.session.destroy();
      res.redirect('/admin/login');
  });
  
/* GET users listing. */
// Dashboard - Show All Products
router.get('/', verifyAdminLogin, async (req, res) => {
    try {
        let products = await productHelper.getAllProducts(); // Fetch from MySQL
        res.render('admin/view-products', { admin: true, products });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching products");
    }
});

// View Products Page
router.get('/view-products', verifyAdminLogin, async (req, res) => {
    try {
        let products = await productHelper.getAllProducts();
        res.render('admin/view-products', { admin: true, products });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching products");
    }
});


router.get('/add-product',function(req,res){
  res.render('admin/add-product',{ admin: true, layout: "layout" })
})
/*router.post('/add-product',(req,res)=>{
   //console.log(req.body);
 //console.log(req.files);

productHelper.addProduct(req.body,(id)=>{
 let image=req.files.image_path
 console.log(id);
 image.mv('./public/product-images/'+id+'.jpg',(err)=>{
  if(!err){
    res.render("admin/add-product")
  }else{
   console.log(err);
  }
 })
    

  
})


})
*/

router.post('/add-product', (req, res) => {
  // Ensure file upload is available
  if (req.files && req.files.image_path) {
      const image = req.files.image_path; // File from form input with name 'image'
      
      // Proceed with adding the product to the database
      productHelper.addProduct(req.body, (id) => {
          if (!id) {
              return res.status(500).send('Error adding product');
          }

          // Move the uploaded image to a folder named after the product id
          const imagePath = './public/product-images/' + id + '.jpg';
          image.mv(imagePath, (err) => {
              if (err) {
                  console.log('Error moving image: ', err);
                  return res.status(500).send('Error uploading image.');
              } else {
                  // Optionally, update image path in database if needed
                  
                      res.render("admin/add-product",{ admin: true, layout: "layout"} )
                  
                   }
                  
                  // Update product in DB with the image URL
                 /* productHelper.updateProductImagePath(id, imageUrl, (updateErr) => {
                      if (updateErr) {
                          console.log(updateErr);
                          return res.status(500).send('Error updating image path.');
                      } else {
                          // Successfully added product and image
                          res.redirect('/admin'); // Redirect to the admin products view page
                      }
                  });*/
              })
          });
      }
  /*} else {
      // Handle the case where no file is uploaded
      console.log('No file uploaded!');
      res.status(400).send('No file uploaded.');
  }*/
});

//delete
router.get('/delete-product/:id', verifyAdminLogin, async (req, res) => {
    let proId = req.params.id;

    console.log("Attempting to delete product with ID:", proId);

    // Ensure proId is a valid number
    if (isNaN(proId)) {
        console.error("Invalid Product ID:", proId);
        return res.status(400).send("Invalid Product ID");
    }

    try {
        await productHelper.deleteProduct(proId);
        console.log("Product deleted successfully, redirecting...");
        res.redirect('/admin');
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send("Error deleting product: " + error.message);
    }
});

// Edit product page
router.get('/edit-product/:id', verifyAdminLogin, async (req, res) => {
    let product = await productHelper.getProductDetails(req.params.id);
    res.render('admin/edit-product', { product, admin: true, layout: "layout"  });
});

// Handle product editing
router.post('/edit-product/:id', verifyAdminLogin, (req, res) => {
    let id = req.params.id;
    req.body.Price = Number(req.body.Price);

    productHelper.updateProduct(id, req.body).then(() => {
        if (req.files && req.files.Image) {
            let image = req.files.Image;
            image.mv('./public/product-images/' + id + '.jpg', () => {
                res.redirect('/admin');
            });
        } else {
            res.redirect('/admin');
        }
    });
});
router.get('/orders', async (req, res) => {
    try {
        let orders = await productHelper.getAllOrders(); // Fetch orders from MySQL
        res.render('admin/view-orders', { orders, admin: true, layout: "layout" });
    } catch (err) {
        console.error("❌ Error fetching orders:", err);
        res.status(500).send("Error fetching orders");
    }
});

router.get('/users', async (req, res) => {
    try {
        let users = await productHelper.getAllUsers(); // Fetch users from MySQL
        res.render('admin/view-users', { users, admin: true, layout: 'layout' });
    } catch (err) {
        console.error("❌ Error fetching users:", err);
        res.status(500).send("Error fetching users");
    }
});



module.exports = router;
