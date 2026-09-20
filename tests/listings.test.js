const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");

process.env.JWT_SECRET =
  process.env.JWT_SECRET || "directlink_ai_dev_secret_change_this";

function authToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
}

describe("Listings API", () => {
  test("POST /listings - creates a listing as farmer", async () => {
    const response = await request(app)
      .post("/listings")
      .set(
        "Authorization",
        `Bearer ${authToken("farmer-1", "farmer")}`,
      )
      .send({
        product_id: "p1",
        region: "Hyderabad",
        quantity: 100,
        unit: "kg",
        asking_price: 50,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.listing).toBeDefined();
  });

  test("POST /listings - rejects invalid body", async () => {
    const response = await request(app)
      .post("/listings")
      .set(
        "Authorization",
        `Bearer ${authToken("farmer-1", "farmer")}`,
      )
      .send({
        quantity: -10,
      });

    expect(response.statusCode).toBe(400);
  });

  test("POST /listings - rejects unknown product", async () => {
    const response = await request(app)
      .post("/listings")
      .set(
        "Authorization",
        `Bearer ${authToken("farmer-1", "farmer")}`,
      )
      .send({
        product_id: "does-not-exist",
        region: "Hyderabad",
        quantity: 100,
        unit: "kg",
        asking_price: 50,
      });

    expect(response.statusCode).toBe(400);
  });

  test("GET /listings - returns public listings", async () => {
    const response = await request(app).get("/listings");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.listings)).toBe(true);
  });

  test("GET /listings - supports farmer_id=me", async () => {
    const response = await request(app)
      .get("/listings?farmer_id=me")
      .set(
        "Authorization",
        `Bearer ${authToken("farmer-1", "farmer")}`,
      );

    expect(response.statusCode).toBe(200);
  });

  test("GET /listings - rejects farmer_id=me without authentication", async () => {
    const response = await request(app).get("/listings?farmer_id=me");

    expect(response.statusCode).toBe(401);
  });

  test("GET /listings/:id - returns 404 for unknown listing", async () => {
    const response = await request(app).get("/listings/unknown-listing");

    expect(response.statusCode).toBe(404);
  });

  test("PATCH /listings/:id - updates listing status", async () => {
    const createResponse = await request(app)
      .post("/listings")
      .set(
        "Authorization",
        `Bearer ${authToken("farmer-1", "farmer")}`,
      )
      .send({
        product_id: "p1",
        region: "Hyderabad",
        quantity: 100,
        unit: "kg",
        asking_price: 50,
      });

    expect(createResponse.statusCode).toBe(201);

    const listingId = createResponse.body.listing.id;

    const response = await request(app)
      .patch(`/listings/${listingId}`)
      .set(
        "Authorization",
        `Bearer ${authToken("farmer-1", "farmer")}`,
      )
      .send({
        status: "sold",
      });

    expect(response.statusCode).toBe(200);
  });

  test("PATCH /listings/:id - rejects non-owner", async () => {
    const createResponse = await request(app)
      .post("/listings")
      .set(
        "Authorization",
        `Bearer ${authToken("farmer-1", "farmer")}`,
      )
      .send({
        product_id: "p1",
        region: "Hyderabad",
        quantity: 100,
        unit: "kg",
        asking_price: 50,
      });

    expect(createResponse.statusCode).toBe(201);

    const listingId = createResponse.body.listing.id;

    const response = await request(app)
      .patch(`/listings/${listingId}`)
      .set(
        "Authorization",
        `Bearer ${authToken("someone-else", "farmer")}`,
      )
      .send({
        status: "sold",
      });

    expect(response.statusCode).toBe(403);
  });

  test("POST /listings/:id/contact - allows buyer to contact farmer", async () => {
    const createResponse = await request(app)
      .post("/listings")
      .set(
        "Authorization",
        `Bearer ${authToken("farmer-1", "farmer")}`,
      )
      .send({
        product_id: "p1",
        region: "Hyderabad",
        quantity: 100,
        unit: "kg",
        asking_price: 50,
      });

    expect(createResponse.statusCode).toBe(201);

    const listingId = createResponse.body.listing.id;

    const response = await request(app)
      .post(`/listings/${listingId}/contact`)
      .set(
        "Authorization",
        `Bearer ${authToken("buyer-1", "buyer")}`,
      )
      .send({
        channel: "call",
      });

    expect(response.statusCode).toBe(201);
  });
});