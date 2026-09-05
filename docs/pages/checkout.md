# 🛒 Checkout Page Specification
### <code>GET /api/checkout</code> (<code>checkouts.index</code>)

<table>
  <thead>
    <tr>
      <th rowspan="2">Actor</th>
      <th rowspan="2">Action</th>
      <th colspan="2">Side Effect</th>
      <th rowspan="2">Trigger (Route)</th>
    </tr>
    <tr>
      <th>Frontend</th>
      <th>Backend</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="18"><strong>Customer</strong></td>
    </tr>
    <tr>
      <td rowspan="3">Checkouts selected cart items</td>
      <td rowspan="3">Render table / Loading skeleton</td>
      <td>Recalculates total summary for selected items</td>
      <td rowspan="3"><code>GET /api/checkout</code> (<code>checkouts.index</code>)</td>
    </tr>
    <tr>
      <td>Retrieves payment methods</td>
    </tr>
      <td>Fetch paginated records</td>
    <tr>
    </tr>
    <tr>
      <td rowspan="2">Chooses payment method</td>
      <td>Toggle checkbox</td>
      <td rowspan="2">N/A</td>
      <td rowspan="2">N/A</td>
    </tr>
    <tr>
      <td>Update local selection state</td>
    </tr>
    <tr>
      <td rowspan="2">Increments / Decrements selected item's quantity</td>
      <td>Update input counter</td>
      <td>Update <code>cart_items.quantity</code></td>
      <td rowspan="2"><code>PUT /api/cart/items/{id}</code> (<code>carts.update</code>)</td>
    </tr>
    <tr>
      <td>Disable button during request</td>
      <td>Recalculate cart items</td>
    </tr>
    <tr>
      <td rowspan="2">Increments / Decrements unselected item's quantity</td>
      <td>Update input counter</td>
      <td>Update <code>cart_items.quantity</code></td>
      <td rowspan="2"><code>PUT /api/cart/items/{id}</code> (<code>carts.update</code>)</td>
    </tr>
    <tr>
      <td>Disable button during request</td>
      <td>No need to recalculate cart items</td>
    </tr>
    <tr>
      <td rowspan="2">Removes Selected Items</td>
      <td>Remove row from list</td>
      <td>Delete record from <code>cart_items</code></td>
      <td rowspan="2"><code>DELETE /api/cart/items</code> (<code>carts.destroy</code>)</td>
    </tr>
    <tr>
      <td>No need confirmation modal</td>
      <td>Recalculate cart items</td>
    </tr>
    <tr>
      <td rowspan="2">Removes Unselected Items</td>
      <td>Remove row from list</td>
      <td>Delete record from <code>cart_items</code></td>
      <td rowspan="2"><code>DELETE /api/cart/items</code> (<code>carts.destroy</code>)</td>
    </tr>
    <tr>
      <td>No need confirmation modal</td>
      <td>No need to recalculate cart items</td>
    </tr>
    <tr>
      <td rowspan="3">Places the order</td>
      <td rowspan="3">Redirects to the Payment page</td>
      <td>Records the order in the <code>orders</code> table</td>
      <td rowspan="3"><code>POST /api/orders/place</code> (<code>orders.place</code>)</td>
    </tr>
    <tr>
      <td>Records the order items with a 'to_pay' status in the <code>order_items</code> table</td>
    </tr>
    <tr>
      <td>Records the order payment with a 'pending' status in the <code>order_payments</code> table</td>
    </tr>
  </tbody>
</table>