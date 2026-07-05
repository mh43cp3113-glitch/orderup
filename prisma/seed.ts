import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // --- Platform super-admin (manages clients, not a member of any business) ---
  await prisma.user.upsert({
    where: { email: "superadmin@platform.com" },
    update: {},
    create: {
      name: "Platform Super Admin",
      email: "superadmin@platform.com",
      passwordHash,
      isSuperAdmin: true,
    },
  });

  // --- Client 1: Demo Restaurant (full seed data) ---
  const restaurant = await prisma.client.upsert({
    where: { slug: "demo-restaurant" },
    update: {},
    create: {
      name: "Demo Restaurant",
      slug: "demo-restaurant",
      businessType: "RESTAURANT",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@restaurant.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@restaurant.com",
      passwordHash,
      role: "ADMIN",
      clientId: restaurant.id,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@restaurant.com" },
    update: {},
    create: {
      name: "Manager User",
      email: "manager@restaurant.com",
      passwordHash,
      role: "MANAGER",
      clientId: restaurant.id,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: "cashier@restaurant.com" },
    update: {},
    create: {
      name: "Cashier User",
      email: "cashier@restaurant.com",
      passwordHash,
      role: "CASHIER",
      clientId: restaurant.id,
    },
  });

  const waiter = await prisma.user.upsert({
    where: { email: "waiter@restaurant.com" },
    update: {},
    create: {
      name: "Waiter User",
      email: "waiter@restaurant.com",
      passwordHash,
      role: "WAITER",
      clientId: restaurant.id,
    },
  });

  const chef = await prisma.user.upsert({
    where: { email: "chef@restaurant.com" },
    update: {},
    create: {
      name: "Chef User",
      email: "chef@restaurant.com",
      passwordHash,
      role: "CHEF",
      clientId: restaurant.id,
    },
  });

  const starters = await prisma.menuCategory.upsert({
    where: { id: "seed-starters" },
    update: {},
    create: { id: "seed-starters", name: "Starters", sortOrder: 1, clientId: restaurant.id },
  });

  const mains = await prisma.menuCategory.upsert({
    where: { id: "seed-mains" },
    update: {},
    create: { id: "seed-mains", name: "Main Course", sortOrder: 2, clientId: restaurant.id },
  });

  const beverages = await prisma.menuCategory.upsert({
    where: { id: "seed-beverages" },
    update: {},
    create: { id: "seed-beverages", name: "Beverages", sortOrder: 3, clientId: restaurant.id },
  });

  const flour = await prisma.ingredient.upsert({
    where: { id: "seed-ing-flour" },
    update: {},
    create: {
      id: "seed-ing-flour",
      name: "Flour",
      unit: "kg",
      quantityInStock: 25,
      reorderLevel: 5,
      costPerUnit: 40,
      clientId: restaurant.id,
    },
  });

  const pattyBeef = await prisma.ingredient.upsert({
    where: { id: "seed-ing-patty" },
    update: {},
    create: {
      id: "seed-ing-patty",
      name: "Beef Patty",
      unit: "pcs",
      quantityInStock: 100,
      reorderLevel: 20,
      costPerUnit: 60,
      clientId: restaurant.id,
    },
  });

  const cheese = await prisma.ingredient.upsert({
    where: { id: "seed-ing-cheese" },
    update: {},
    create: {
      id: "seed-ing-cheese",
      name: "Cheese Slice",
      unit: "pcs",
      quantityInStock: 8,
      reorderLevel: 15,
      costPerUnit: 10,
      clientId: restaurant.id,
    },
  });

  const burger = await prisma.menuItem.upsert({
    where: { id: "seed-item-burger" },
    update: {},
    create: {
      id: "seed-item-burger",
      name: "Classic Burger",
      description: "Juicy beef patty with cheese and fresh veggies",
      categoryId: mains.id,
      costPrice: 70,
      clientId: restaurant.id,
      variants: {
        create: [
          { name: "Small", price: 99, isDefault: false },
          { name: "Medium", price: 149, isDefault: true },
          { name: "Large", price: 199, isDefault: false },
        ],
      },
      recipeIngredients: {
        create: [
          { ingredientId: pattyBeef.id, quantityRequired: 1 },
          { ingredientId: cheese.id, quantityRequired: 1 },
          { ingredientId: flour.id, quantityRequired: 0.1 },
        ],
      },
    },
  });

  await prisma.menuItem.upsert({
    where: { id: "seed-item-fries" },
    update: {},
    create: {
      id: "seed-item-fries",
      name: "French Fries",
      description: "Crispy golden fries",
      categoryId: starters.id,
      costPrice: 30,
      clientId: restaurant.id,
      variants: { create: [{ name: "Regular", price: 79, isDefault: true }] },
    },
  });

  await prisma.menuItem.upsert({
    where: { id: "seed-item-cola" },
    update: {},
    create: {
      id: "seed-item-cola",
      name: "Cola",
      description: "Chilled soft drink",
      categoryId: beverages.id,
      costPrice: 15,
      clientId: restaurant.id,
      variants: { create: [{ name: "Regular", price: 49, isDefault: true }] },
    },
  });

  for (const name of ["T1", "T2", "T3", "T4", "T5", "T6"]) {
    await prisma.restaurantTable.upsert({
      where: { clientId_name: { clientId: restaurant.id, name } },
      update: {},
      create: { name, floor: "Floor 1", capacity: 4, clientId: restaurant.id },
    });
  }

  await prisma.customer.upsert({
    where: { clientId_phone: { clientId: restaurant.id, phone: "9876543210" } },
    update: {},
    create: {
      name: "Rahul Sharma",
      phone: "9876543210",
      email: "rahul@example.com",
      clientId: restaurant.id,
    },
  });

  const staffSeeds = [
    { phone: "9000000001", name: "Manager User", role: "MANAGER" as const, userId: manager.id, baseSalary: 45000 },
    { phone: "9000000002", name: "Cashier User", role: "CASHIER" as const, userId: cashier.id, baseSalary: 25000 },
    { phone: "9000000003", name: "Waiter User", role: "WAITER" as const, userId: waiter.id, baseSalary: 18000 },
    { phone: "9000000004", name: "Chef User", role: "CHEF" as const, userId: chef.id, baseSalary: 32000 },
    { phone: "9000000005", name: "Kitchen Helper", role: "HELPER" as const, userId: null, baseSalary: 14000 },
    { phone: "9000000006", name: "Delivery Rider", role: "DELIVERY" as const, userId: null, baseSalary: 15000 },
  ];

  const staffRecords = [];
  for (const s of staffSeeds) {
    const staff = await prisma.staff.upsert({
      where: { clientId_phone: { clientId: restaurant.id, phone: s.phone } },
      update: {},
      create: {
        name: s.name,
        phone: s.phone,
        role: s.role,
        userId: s.userId,
        baseSalary: s.baseSalary,
        clientId: restaurant.id,
      },
    });
    staffRecords.push(staff);
  }

  await prisma.attendance.upsert({
    where: { staffId_date: { staffId: staffRecords[0].id, date: new Date() } },
    update: {},
    create: {
      staffId: staffRecords[0].id,
      date: new Date(),
      clockIn: new Date(new Date().setHours(9, 0, 0, 0)),
      status: "PRESENT",
    },
  });

  await prisma.leaveRequest.create({
    data: {
      staffId: staffRecords[2].id,
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      type: "CASUAL",
      reason: "Family function",
    },
  });

  // --- Client 2: Sweet Treats Bakery (minimal, proves client isolation) ---
  const bakery = await prisma.client.upsert({
    where: { slug: "sweet-treats-bakery" },
    update: {},
    create: {
      name: "Sweet Treats Bakery",
      slug: "sweet-treats-bakery",
      businessType: "CAKE_BAKERY",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@sweettreats.com" },
    update: {},
    create: {
      name: "Priya Bakery Owner",
      email: "admin@sweettreats.com",
      passwordHash,
      role: "ADMIN",
      clientId: bakery.id,
    },
  });

  const cakesCategory = await prisma.menuCategory.upsert({
    where: { id: "seed-bakery-cakes" },
    update: {},
    create: { id: "seed-bakery-cakes", name: "Cakes", sortOrder: 1, clientId: bakery.id },
  });

  await prisma.menuItem.upsert({
    where: { id: "seed-bakery-item-chocolate-cake" },
    update: {},
    create: {
      id: "seed-bakery-item-chocolate-cake",
      name: "Chocolate Truffle Cake",
      description: "Rich chocolate sponge with truffle ganache",
      categoryId: cakesCategory.id,
      costPrice: 250,
      clientId: bakery.id,
      variants: {
        create: [
          { name: "Half kg", price: 449, isDefault: false },
          { name: "1 kg", price: 799, isDefault: true },
        ],
      },
    },
  });

  await prisma.restaurantTable.upsert({
    where: { clientId_name: { clientId: bakery.id, name: "Counter" } },
    update: {},
    create: { name: "Counter", floor: "Ground Floor", capacity: 1, clientId: bakery.id },
  });

  console.log("Seed complete.");
  console.log("Super admin:   superadmin@platform.com / password123");
  console.log("Restaurant:    admin@restaurant.com / password123");
  console.log("Bakery:        admin@sweettreats.com / password123");
  console.log("Sample burger item id:", burger.id, "waiter id:", waiter.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
