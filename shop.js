const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();
const port = 3000;

const dbConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@Katty2714',
  database: 'node-complete' 
});

dbConnection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  dbConnection.query(`
    CREATE TABLE IF NOT EXISTS candy_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candyName VARCHAR(255) NOT NULL,
      description VARCHAR(255) NOT NULL,
      price FLOAT NOT NULL,
      quantity INT NOT NULL,
      buy1 INT NOT NULL,
      buy2 INT NOT NULL,
      buy3 INT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating candy_items table:', err);
    }
  });
});

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  dbConnection.query('SELECT * FROM candy_items', (err, results) => {
    if (err) {
      console.error('Error fetching candy items from database:', err);
      res.sendStatus(500);
    } else {
      const candyItems = results;
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Products</title>
        </head>
        <body>
          <h1>Candy Shop</h1>
          <form action="/addItem" method="post">
            <label for="candyName">Candy Name:</label>
            <input type="text" name="candyName" required>
            <label for="description">Description:</label>
            <input type="text" name="description" required>
            <label for="price">Price:</label>
            <input type="number" name="price" step="0.01" required>
            <label for="quantity">Quantity:</label>
            <input type="number" name="quantity" required>
            <button type="submit">Add Item</button>
          </form>
          <hr>
      `;

      candyItems.forEach((item, index) => {
        const totalAmount = item.price * item.quantity;

        htmlContent += `
          <div>
            <h2>${item.candyName}</h2>
            <div>
              <label for="candyName">Candy Name:</label>
              <input type="text" name="candyName" value="${item.candyName}" readonly>
              <label for="description">Description:</label>
              <input type="text" name="description" value="${item.description}" readonly>
              <label for="price">Price:</label>
              <input type="number" name="price" step="0.01" value="${item.price}" readonly>
              <label for="quantity">Quantity:</label>
              <input type="number" name="quantity" value="${item.quantity}" readonly>
              <p>Total Amount: $${totalAmount.toFixed(2)}</p>
              <button onclick="buyCandy(${index}, 1)">Buy 1</button>
              <button onclick="buyCandy(${index}, 2)">Buy 2</button>
              <button onclick="buyCandy(${index}, 3)">Buy 3</button>
            </div>
          </div>
          <hr>
        `;
      });

      htmlContent += `
          <script>
            function buyCandy(index, buyAmount) {
              const quantityInput = document.getElementsByName('quantity')[index];
              const totalAmountElement = document.querySelector(\`[data-total-amount="\${index}"]\`);
              
              if (quantityInput && totalAmountElement) {
                const candyQuantity = parseInt(quantityInput.value);
                const totalAmount = parseFloat(totalAmountElement.textContent.substring(1));
                
                if (candyQuantity >= buyAmount) {
                  const newQuantity = candyQuantity - buyAmount;
                  quantityInput.value = newQuantity;
                  totalAmountElement.textContent = \`$ \${(totalAmount - buyAmount * candyItems[index].price).toFixed(2)}\`;
                  
                  // Update the database with new buy values
                  fetch('/updateBuyQuantities', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: \`index=\${index}&buyAmount=\${buyAmount}\`
                  })
                  .then(() => {
                    console.log('Buy quantities updated successfully.');
                  })
                  .catch((error) => {
                    console.error('Error updating buy quantities:', error);
                  });
                }
              }
            }
          </script>
        </body>
        </html>
      `;

      res.send(htmlContent);
    }
  });
});

app.post('/addItem', (req, res) => {
  const { candyName, description, price, quantity } = req.body;
  if (candyName && description && price && quantity) {
    const newItem = {
      candyName,
      description,
      price,
      quantity,
      buy1: 0,
      buy2: 0,
      buy3: 0
    };

    dbConnection.query('INSERT INTO candy_items SET ?', newItem, (err) => {
      if (err) {
        console.error('Error adding candy item to database:', err);
        res.sendStatus(500);
      } else {
        res.redirect('/');
      }
    });
  }
});

app.post('/updateBuyQuantities', (req, res) => {
  const { index, buyAmount } = req.body;
  if (index !== undefined && buyAmount !== undefined) {
    const item = candyItems[index];
    dbConnection.query(
      'UPDATE candy_items SET buy1 = buy1 + ?, buy2 = buy2 + ?, buy3 = buy3 + ? WHERE id = ?',
      [buyAmount, buyAmount, buyAmount, item.id],
      (err) => {
        if (err) {
          console.error('Error updating buy quantities in database:', err);
          res.sendStatus(500);
        } else {
          res.sendStatus(200);
        }
      }
    );
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
