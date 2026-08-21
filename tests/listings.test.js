const request = require('supertest');
const app = require('../app');

describe('Products', () => {
  it('GET /products returns the seed product list', async () => {
    const res = await request(app).get('/products');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.products[0]).toHaveProperty('name');
  });
});

describe('Listings', () => {
  it('GET /listings returns seed listings', async () => {
    const res = await request(app).get('/listings');
    expect(res.status).toBe(200);
    expect(res.body.listings.length).toBeGreaterThanOrEqual(2);
  });

  it('POST /listings creates a new listing as farmer-1', async () => {
    const res = await request(app)
      .post('/listings')
      .set('x-user-id', 'farmer-1')
      .set('x-user-role', 'farmer')
      .send({ product_id: 'p2', region: 'Vijayawada', quantity: 30, unit: 'kg', asking_price: 18 });

    expect(res.status).toBe(201);
    expect(res.body.listing.farmer_id).toBe('farmer-1');
    expect(res.body.listing.status).toBe('active');
  });

  it('POST /listings rejects an invalid body', async () => {
    const res = await request(app)
      .post('/listings')
      .send({ product_id: 'p2' }); // missing required fields

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });

  it('POST /listings rejects an unknown product_id', async () => {
    const res = await request(app)
      .post('/listings')
      .send({ product_id: 'does-not-exist', region: 'Guntur', quantity: 5, unit: 'kg', asking_price: 10 });

    expect(res.status).toBe(400);
  });

  it('GET /listings filters by region and price_max', async () => {
    const res = await request(app).get('/listings').query({ region: 'Vijayawada', price_max: 25 });
    expect(res.status).toBe(200);
    res.body.listings.forEach((l) => {
      expect(l.region).toBe('Vijayawada');
      expect(l.asking_price).toBeLessThanOrEqual(25);
    });
  });

  it('GET /listings/:id returns detail with product info attached', async () => {
    const res = await request(app).get('/listings/l1');
    expect(res.status).toBe(200);
    expect(res.body.listing.id).toBe('l1');
    expect(res.body.listing.product).toHaveProperty('name');
  });

  it('GET /listings/:id returns 404 for unknown id', async () => {
    const res = await request(app).get('/listings/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('PATCH /listings/:id lets the owning farmer close a listing', async () => {
    const res = await request(app)
      .patch('/listings/l1')
      .set('x-user-id', 'farmer-1')
      .send({ status: 'sold' });

    expect(res.status).toBe(200);
    expect(res.body.listing.status).toBe('sold');
  });

  it('PATCH /listings/:id blocks a farmer who does not own the listing', async () => {
    const res = await request(app)
      .patch('/listings/l2')
      .set('x-user-id', 'someone-else')
      .send({ status: 'sold' });

    expect(res.status).toBe(403);
  });

  it('POST /listings/:id/contact logs a buyer contact', async () => {
    const res = await request(app)
      .post('/listings/l2/contact')
      .set('x-user-id', 'buyer-1')
      .set('x-user-role', 'buyer')
      .send({ channel: 'whatsapp' });

    expect(res.status).toBe(201);
    expect(res.body.contact.channel).toBe('whatsapp');
    expect(res.body.contact.buyer_id).toBe('buyer-1');
  });
});
