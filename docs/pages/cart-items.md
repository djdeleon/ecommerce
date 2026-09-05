# 🛒 Cart Items Page Specification
### <code>GET /api/cart/items</code> (<code>carts.index</code>)

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
      <td rowspan="13"><strong>Customer</strong></td>
    </tr>
    <tr>
      <td rowspan="2">Views Cart Items Page</td>
      <td rowspan="2">Render table / Loading skeleton</td>
      <td>Recalculates total summary for selected items</td>
      <td rowspan="2"><code>GET /api/cart/items</code> (<code>carts.index</code>)</td>
    </tr>
    <tr>
      <td>Fetch paginated records</td>
    </tr>
    <tr>
      <td rowspan="2">Selects / Unselects Cart Item</td>
      <td>Toggle checkbox</td>
      <td rowspan="2">Recalculates total summary for selected items</td>
      <td rowspan="2"><code>POST /api/cart/select</code> (<code>carts.store</code>)</td>
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
    
  </tbody>
</table>