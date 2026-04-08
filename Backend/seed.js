const menuItems = [
  { name: "Margherita Pizza", description: "Fresh mozzarella, tomato sauce, basil", price: "AED 35", category: "Pizza", available: true },
  { name: "Pepperoni Pizza", description: "Pepperoni, mozzarella, tomato sauce", price: "AED 42", category: "Pizza", available: true },
  { name: "BBQ Chicken Pizza", description: "Grilled chicken, BBQ sauce, onions", price: "AED 45", category: "Pizza", available: true },
  { name: "Classic Beef Burger", description: "Beef patty, lettuce, tomato, special sauce", price: "AED 28", category: "Burgers", available: true },
  { name: "Cheese Burger", description: "Double cheese, beef patty, pickles", price: "AED 32", category: "Burgers", available: true },
  { name: "Chicken Burger", description: "Crispy chicken, mayo, lettuce", price: "AED 30", category: "Burgers", available: true },
  { name: "Caesar Salad", description: "Romaine lettuce, croutons, parmesan", price: "AED 25", category: "Salads", available: true },
  { name: "Greek Salad", description: "Feta, olives, cucumber, tomatoes", price: "AED 28", category: "Salads", available: true },
];

const databaseUrl = "https://tastyhotweb-default-rtdb.europe-west1.firebasedatabase.app";

async function seedDatabase() {
  try {
    console.log('🌱 Seeding menu items via REST API...');
    
    for (const item of menuItems) {
      const response = await fetch(`${databaseUrl}/menu_items.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          createdAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add ${item.name}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Added: ${item.name} (ID: ${data.name})`);
    }
    
    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding:', error.message);
    process.exit(1);
  }
}

seedDatabase();
