require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const session = require("express-session");
const stripe = require("stripe")(process.env.STRIPE_KEY);

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// SESSION
app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
  })
);
// DATABASE
const db = mysql.createConnection({
  host: process.env.RDS_HOSTNAME,
  port: process.env.RDS_PORT,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME,
});

// Function to check if item is in cart
function isProductInCart(cart, id) {
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id == id) {
      return true;
    }
  }
  return false;
}
// Function to add all of the userQuantitys with same product_id togeather
function countAndCombineProducts(cart) {
  let productCount = {};
  cart.forEach(function (item) {
    if (!productCount[item.products_id]) {
      productCount[item.products_id] = {
        products_id: item.products_id,
        userQuantity: item.userQuantity,
      };
    } else {
      productCount[item.products_id].userQuantity += item.userQuantity;
    }
  });
  let result = [];
  for (let key in productCount) {
    result.push(productCount[key]);
  }
  return result;
}

function settingPrices(combinedCart, cart, callback) {
  db.query("SELECT * from prices", function (err, results) {
    if (err) throw err;
    results.forEach(function (items) {
      for (let i = 0; i < combinedCart.length; i++) {
        if (items.products_id === combinedCart[i].products_id) {
          if (combinedCart[i].userQuantity <= 9) {
            for (let j = 0; j < cart.length; j++) {
              if (cart[j].products_id === items.products_id) {
                cart[j].price = parseInt(items.unit1);
              }
            }
          } else if (
            combinedCart[i].userQuantity >= 10 &&
            combinedCart[i].userQuantity <= 24
          ) {
            for (let j = 0; j < cart.length; j++) {
              if (cart[j].products_id === items.products_id) {
                cart[j].price = parseInt(items.unit2);
              }
            }
          } else if (
            combinedCart[i].userQuantity >= 25 &&
            combinedCart[i].userQuantity <= 49
          ) {
            for (let j = 0; j < cart.length; j++) {
              if (cart[j].products_id === items.products_id) {
                cart[j].price = parseInt(items.unit3);
              }
            }
          } else if (
            combinedCart[i].userQuantity >= 50 &&
            combinedCart[i].userQuantity <= 99
          ) {
            for (let j = 0; j < cart.length; j++) {
              if (cart[j].products_id === items.products_id) {
                cart[j].price = parseInt(items.unit4);
              }
            }
          } else if (
            combinedCart[i].userQuantity >= 100 &&
            combinedCart[i].userQuantity <= 249
          ) {
            for (let j = 0; j < cart.length; j++) {
              if (cart[j].products_id === items.products_id) {
                cart[j].price = parseInt(items.unit5);
              }
            }
          } else if (
            combinedCart[i].userQuantity >= 250 &&
            combinedCart[i].userQuantity <= 499
          ) {
            for (let j = 0; j < cart.length; j++) {
              if (cart[j].products_id === items.products_id) {
                cart[j].price = parseInt(items.unit6);
              }
            }
          } else if (
            combinedCart[i].userQuantity >= 500 &&
            combinedCart[i].userQuantity <= 999
          ) {
            for (let j = 0; j < cart.length; j++) {
              if (cart[j].products_id === items.products_id) {
                cart[j].price = parseInt(items.unit7);
              }
            }
          } else if (combinedCart[i].userQuantity >= 1000) {
            for (let j = 0; j < cart.length; j++) {
              if (cart[j].products_id === items.products_id) {
                cart[j].price = parseInt(items.unit8);
              }
            }
          }
        }
      }
    });
    callback();
  });
}

function calculateCartTotal(cart) {
  let total = 0;
  for (let i = 0; i < cart.length; i++) {
    total += cart[i].price * cart[i].userQuantity;
  }
  return total;
}
// ______________________________________________________Cart count
app.use(function (req, res, next) {
  // Retrieve the cart data from the session
  const cart = req.session.cart || [];

  // Count the number of items in the cart
  const cartCount = cart.reduce((acc, item) => acc + 1, 0);

  // Add the cart count to the locals object
  res.locals.cartCount = cartCount;

  // Call the next middleware
  next();
});
// ______________________________________________________RETURNS POLICY
app.get("/returns", function (req, res) {
  res.render("returns");
});
// ______________________________________________________PRIVACY POLICY
app.get("/privacy", function (req, res) {
  res.render("privacy");
});
// ______________________________________________________PRIVACY POLICY
app.get("/terms-and-conditions", function (req, res) {
  res.render("terms");
});
// ______________________________________________________index-legends
app.get("/", function (req, res) {
  db.query(
    "SELECT * FROM variants WHERE (products_id) = 'IGET-LEGEND'",
    function (err, result) {
      if (err) throw err;
      res.render("legend", { result: result });
    }
  );
});
// _______________________________________________________________bar
app.get("/bar", function (req, res) {
  db.query(
    "SELECT * FROM variants WHERE (products_id) = 'IGET-BAR'",
    function (err, result) {
      if (err) throw err;
      res.render("bar", { result: result });
    }
  );
});
// _____________________________________________________WHOLESALE
app.get("/wholesale", function (req, res) {
  res.render("wholesale");
});
// _____________________________________________________ERROR/EMPTY-CART
app.get("/error", function (req, res) {
  res.render("error");
});

// _____________________________________________________CONTACT
app.get("/contact", function (req, res) {
  res.render("contact");
});

// _____________________________________________________REVIEWS
app.get("/reviews", function (req, res) {
  res.render("reviews");
});

// ______________________________________________________remove item
app.post("/remove-item", (req, res) => {
  const itemId = req.body.id;

  // retrieve cart from session
  const cart = req.session.cart || [];

  // remove item from cart based on its ID
  const updatedCart = cart.filter((item) => item.id !== itemId);

  // store updated cart in session
  req.session.cart = updatedCart;
  res.redirect("/cart");
});
// ______________________________________________________cart update quantity
app.post("/update-cart", (req, res) => {
  // Get the item id and updated quantity from the request body
  const itemId = req.body.id;
  const updatedQuantity = req.body[`quantity-${itemId}`];
  cart = req.session.cart;

  // Update the cart item with the new quantity
  const cartItem = cart.find((item) => item.id === itemId);
  cartItem.userQuantity = parseInt(updatedQuantity);
  // Redirect back to the cart page
  res.redirect("/cart");
});
// _____________________________________________________CART
app.post("/cart", function (req, res) {
  // Store body variables
  var id = req.body.id;
  var products_id = req.body.products_id;
  var flavor = req.body.flavor;
  var image = req.body.image;
  var userQuantity = parseInt(req.body.userQuantity);
  var price = 0;
  var stock = parseInt(req.body.stock);

  // product info
  var product = {
    id: id,
    stock: stock,
    products_id: products_id,
    flavor: flavor,
    image: image,
    price: price,
    userQuantity: userQuantity,
  };

  // Check if the session has a property for the cart
  if (!req.session.cart) {
    // If not, initialize the cart as an empty array
    req.session.cart = [];
  }

  // Add items to cart
  if (req.session.cart) {
    var cart = req.session.cart;

    if (!isProductInCart(cart, id)) {
      cart.push(product);
    }
  } else {
    req.session.cart = [product];
    var cart = req.session.cart;
  }
  // return to cart page
  res.redirect("/cart");
});

app.get("/cart", function (req, res) {
  if (!req.session.cart) {
    return res.redirect("/error");
  }

  let combinedCart = countAndCombineProducts(req.session.cart);
  var cart = req.session.cart;
  settingPrices(combinedCart, cart, function () {
    res.render("cart", { cart: cart });
  });
});
// ______________________________________________________Checkout
app.post("/create-checkout-session", async (req, res) => {
  const cart = req.session.cart; // get cart from session

  const lineItems = cart.map((item) => {
    return {
      price_data: {
        currency: "aud",
        product_data: {
          name: item.products_id, // use the name of the item in the cart
          description: item.flavor,
        },
        unit_amount: item.price * 100, // convert to cents
      },
      quantity: item.userQuantity, // use the quantity of the item in the cart
    };
  });

  // Call calculateCartTotal function to get the total value of the cart
  const cartTotal = calculateCartTotal(cart);

  // Determine shipping cost based on cart total
  let shippingCost = 1000;
  if (cartTotal >= 100) {
    shippingCost = 0;
  }
  const session = await stripe.checkout.sessions.create({
    shipping_address_collection: { allowed_countries: ["AU"] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: shippingCost, currency: "aud" },
          display_name: "Standard shipping",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 3 },
            maximum: { unit: "business_day", value: 7 },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 1500, currency: "aud" },
          display_name: "Express shipping",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 1 },
            maximum: { unit: "business_day", value: 3 },
          },
        },
      },
    ],
    line_items: lineItems, // use the array of line items created from the cart
    mode: "payment",
    success_url: process.env.WEB_ADDI + "/success",
    cancel_url: process.env.WEB_ADDI + "/cancel",
    metadata: {},
  });
  res.redirect(303, session.url);
});

// ______________________________________________________SUCCESS
app.get("/success", function (req, res) {
  const cart = req.session.cart || [];

  if (cart.length === 0) {
    // handle empty cart case
    return res.redirect("/");
  }

  cart.forEach(function (item) {
    // Retrieve current stock level of variant
    db.query(
      "SELECT stock FROM variants WHERE id = ?",
      [item.id],
      function (err, results) {
        if (err) throw err;

        // Subtract userQuantity from current stock level
        const currentStockLevel = results[0].stock;
        const newStockLevel = currentStockLevel - item.userQuantity;

        // Update database with new stock level
        db.query(
          "UPDATE variants SET stock = ? WHERE id = ?",
          [newStockLevel, item.id],
          function (err, result) {
            if (err) throw err;
          }
        );
      }
    );
  });

  req.session.destroy(function (err) {
    if (err) {
      console.error("Failed to destroy session: ", err);
    }
    res.render("success");
  });
});
// ______________________________________________________CANCEL
app.get("/cancel", function (req, res) {
  res.redirect("/cart");
});

// ______________________________________________________BUY ONE PAGE
app.get("/:productId", function (req, res) {
  const variantsId = req.params.productId;
  db.query(
    "SELECT tag, flavor, variants.products_id, sweet, cool, image, variants.id, unit1, stock  FROM products, variants, prices WHERE variants.id = '" +
      variantsId +
      "' AND products.id = variants.products_id AND prices.products_id = variants.products_id",
    function (err, result) {
      if (err) throw err;
      res.render("buyOnePage", { result: result });
    }
  );
});
// ______________________________________________________LISTENING
app.listen(5000, () => {
  console.log("Server up");
});
