const request = require("supertest");
const app = require("../app");
const pool = require("../db");

let farmerUserId;
let farmerProfileId;
let secondFarmerUserId;
let buyerUserId;
let listingId;

async function createUser(phone, name, role) {
  const userResult = await pool.query(
    `
    INSERT INTO users (id, phone_number, name, role)
    VALUES (gen_random_uuid(), $1, $2, $3)
    RETURNING *
    `,
    [phone, name, role]
  );

  const user = userResult.rows[0];

  if (role === "farmer") {
    const profileResult = await pool.query(
      `
      INSERT INTO farmer_profiles (
        id, user_id, village, district, state
      )
      VALUES (
        gen_random_uuid(), $1, 'Test Village', 'Test District', 'Andhra Pradesh'
      )
      RETURNING *
      `,
      [user.id]
    );

    return {
      userId: user.id,
      profileId: profileResult.rows[0].id,
    };
  }

  const profileResult = await pool.query(
    `
    INSERT INTO buyer_profiles (
      id, user_id, business_name, business_type, address
    )
    VALUES (
      gen_random_uuid(), $1, 'Test Business', 'Retail', 'Test Address'
    )
    RETURNING *
    `,
    [user.id]
  );

  return {
    userId: user.id,
    profileId: profileResult.rows[0].id,
  };
}

beforeAll(async () => {
  const farmer = await createUser(
    "9000000001",
    "Jest Farmer",
    "farmer"
  );

  farmerUserId = farmer.userId;
  farmerProfileId = farmer.profileId;

  const secondFarmer = await createUser(
    "9000000002",
    "Jest Second Farmer",
    "farmer"
  );

  secondFarmerUserId = secondFarmer.userId;

  const buyer = await createUser(
    "9000000003",
    "Jest Buyer",
    "buyer"
  );

  buyerUserId = buyer.userId;

  const listingResult = await pool.query(
    `
    INSERT INTO listings (
      id,
      farmer_id,
      product_id,
      region,
      quantity,
      unit,
      asking_price,
      status
    )
    VALUES (
      gen_random_uuid(),
      $1,
      'p1',
      'Vijayawada',
      50,
      'kg',
      20,
      'active'
    )
    RETURNING id
    `,
    [farmerProfileId]
  );

  listingId = listingResult.rows[0].id;
});

afterAll(async () => {
  await pool.query(
    `DELETE FROM users WHERE id IN ($1, $2, $3)`,
    [farmerUserId, secondFarmerUserId, buyerUserId]
  );

  await pool.end();
});

describe("Products", () => {
  it("GET /products returns the seed product list", async () => {
    const res = await request(app).get("/products");

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.products[0]).toHaveProperty("name");
  });
});

describe("Listings", () => {
  it("GET /listings returns active listings", async () => {
    const res = await request(app).get("/listings");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.listings)).toBe(true);
  });

  it("POST /listings creates a new listing as farmer", async () => {
    const res = await request(app)
      .post("/listings")
      .set("x-user-id", farmerUserId)
      .set("x-user-role", "farmer")
      .send({
        product_id: "p2",
        region: "Vijayawada",
        quantity: 30,
        unit: "kg",
        asking_price: 18,
      });

    expect(res.status).toBe(201);
    expect(res.body.listing.status).toBe("active");
    expect(res.body.listing.product_id).toBe("p2");
    expect(res.body.listing.farmer_id).toBe(farmerProfileId);
  });

  it("POST /listings rejects an invalid body", async () => {
    const res = await request(app)
      .post("/listings")
      .send({
        product_id: "p2",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
  });

  it("POST /listings rejects an unknown product_id", async () => {
    const res = await request(app)
      .post("/listings")
      .send({
        product_id: "does-not-exist",
        region: "Guntur",
        quantity: 5,
        unit: "kg",
        asking_price: 10,
      });

    expect(res.status).toBe(400);
  });

  it("GET /listings filters by region and price_max", async () => {
    const res = await request(app)
      .get("/listings")
      .query({
        region: "Vijayawada",
        price_max: 25,
      });

    expect(res.status).toBe(200);

    res.body.listings.forEach((listing) => {
      expect(listing.region).toBe("Vijayawada");
      expect(Number(listing.asking_price)).toBeLessThanOrEqual(25);
    });
  });

  it("GET /listings supports the My Listings farmer filter", async () => {
    const res = await request(app)
      .get("/listings")
      .query({ farmer_id: "me" })
      .set("x-user-id", farmerUserId)
      .set("x-user-role", "farmer");

    expect(res.status).toBe(200);
    expect(res.body.listings.length).toBeGreaterThanOrEqual(1);

    res.body.listings.forEach((listing) => {
      expect(listing.farmer_id).toBe(farmerProfileId);
    });
  });

  it("GET /listings/:id returns detail with product info attached", async () => {
    const res = await request(app).get(`/listings/${listingId}`);

    expect(res.status).toBe(200);
    expect(res.body.listing.id).toBe(listingId);
    expect(res.body.listing.product).toHaveProperty("name");
  });

  it("GET /listings/:id returns 404 for unknown id", async () => {
    const unknownId = "00000000-0000-0000-0000-000000000000";

    const res = await request(app).get(`/listings/${unknownId}`);

    expect(res.status).toBe(404);
  });

  it("PATCH /listings/:id lets the owning farmer close a listing", async () => {
    const res = await request(app)
      .patch(`/listings/${listingId}`)
      .set("x-user-id", farmerUserId)
      .set("x-user-role", "farmer")
      .send({
        status: "sold",
      });

    expect(res.status).toBe(200);
    expect(res.body.listing.status).toBe("sold");
  });

  it("PATCH /listings/:id blocks a farmer who does not own the listing", async () => {
    const res = await request(app)
      .patch(`/listings/${listingId}`)
      .set("x-user-id", secondFarmerUserId)
      .set("x-user-role", "farmer")
      .send({
        status: "sold",
      });

    expect(res.status).toBe(403);
  });

  it("POST /listings/:id/contact logs a buyer contact", async () => {
    const res = await request(app)
      .post(`/listings/${listingId}/contact`)
      .set("x-user-id", buyerUserId)
      .set("x-user-role", "buyer")
      .send({
        channel: "whatsapp",
      });

    expect(res.status).toBe(201);
    expect(res.body.contact.channel).toBe("whatsapp");
  });
});