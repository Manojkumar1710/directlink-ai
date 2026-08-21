/**
 * In-memory seed data.
 *
 * This stands in for the real Postgres tables (Product, Listing) that
 * Member 5 (Database/Pricing) will own. Structure mirrors TDD Section 5.1
 * so swapping this file for a real Prisma/Sequelize repository later is a
 * drop-in change, not a rewrite (see data/repository.js).
 */

const products = [
  { id: 'p1', name: 'Tomato', category: 'Vegetable', unit: 'kg', icon_url: '/icons/tomato.png' },
  { id: 'p2', name: 'Onion', category: 'Vegetable', unit: 'kg', icon_url: '/icons/onion.png' },
  { id: 'p3', name: 'Rice (Paddy)', category: 'Grain', unit: 'kg', icon_url: '/icons/rice.png' },
  { id: 'p4', name: 'Wheat', category: 'Grain', unit: 'kg', icon_url: '/icons/wheat.png' },
  { id: 'p5', name: 'Cotton', category: 'Cash Crop', unit: 'kg', icon_url: '/icons/cotton.png' },
  { id: 'p6', name: 'Milk', category: 'Dairy', unit: 'litre', icon_url: '/icons/milk.png' },
  { id: 'p7', name: 'Banana', category: 'Fruit', unit: 'dozen', icon_url: '/icons/banana.png' },
  { id: 'p8', name: 'Mango', category: 'Fruit', unit: 'kg', icon_url: '/icons/mango.png' },
];

// A couple of sample listings so search/filter has something to return
// out of the box. farmer_id values are fake user ids from fakeAuth.
const listings = [
  {
    id: 'l1',
    farmer_id: 'farmer-1',
    product_id: 'p1',
    region: 'Vijayawada',
    quantity: 50,
    unit: 'kg',
    asking_price: 22,
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'l2',
    farmer_id: 'farmer-2',
    product_id: 'p3',
    region: 'Guntur',
    quantity: 200,
    unit: 'kg',
    asking_price: 38,
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

const contactLogs = [];

module.exports = { products, listings, contactLogs };
