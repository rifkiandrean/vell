
import type { MenuItem, Topping, SugarLevel } from './types';

export const ALL_TOPPINGS: Topping[] = [
  { id: 't1', name: 'Extra Shot', price: 8000 },
  { id: 't2', name: 'Oat Milk', price: 6000 },
  { id: 't3', name: 'Almond Milk', price: 6000 },
  { id: 't4', name: 'Whipped Cream', price: 5000 },
  { id: 't5', name: 'Caramel Drizzle', price: 5000 },
  { id: 't6', name: 'Chocolate Sauce', price: 5000 },
  { id: 't7', name: 'Avocado', price: 10000 },
];

export const ALL_SUGAR_LEVELS: SugarLevel[] = ['Less Sugar', 'Normal', 'Extra Sugar'];

export const MENU_DATA: MenuItem[] = [
  {
    id: 'n1',
    name: 'Espresso',
    description: 'A classic single shot of intense, aromatic coffee.',
    price: 25000,
    category: 'Coffee Based',
    image: 'espresso',
    customizations: {
      sugarLevels: ALL_SUGAR_LEVELS,
      toppings: [ALL_TOPPINGS[0]],
    },
  },
  {
    id: 'n2',
    name: 'Cappuccino',
    description: 'A perfect balance of espresso, steamed milk, and a thick layer of foam.',
    price: 35000,
    category: 'Coffee Based',
    image: 'cappuccino',
    customizations: {
      sugarLevels: ALL_SUGAR_LEVELS,
      toppings: [ALL_TOPPINGS[1], ALL_TOPPINGS[2], ALL_TOPPINGS[4], ALL_TOPPINGS[5]],
    },
  },
  {
    id: 'n3',
    name: 'Iced Latte',
    description: 'Chilled espresso with milk, served over ice. A refreshing classic.',
    price: 38000,
    category: 'Coffee Based',
    image: 'iced-latte',
    customizations: {
      sugarLevels: ALL_SUGAR_LEVELS,
      toppings: [ALL_TOPPINGS[0], ALL_TOPPINGS[1], ALL_TOPPINGS[2], ALL_TOPPINGS[4], ALL_TOPPINGS[5]],
    },
  },
  {
    id: 'n4',
    name: 'Mocha',
    description: 'Rich espresso and chocolate sauce mixed with steamed milk.',
    price: 40000,
    category: 'Coffee Based',
    image: 'mocha',
    customizations: {
      sugarLevels: ALL_SUGAR_LEVELS,
      toppings: [ALL_TOPPINGS[3], ALL_TOPPINGS[5]],
    },
  },
  {
    id: 's1',
    name: 'Turkey Club Sandwich',
    description: 'Classic triple-decker with turkey, bacon, lettuce, and tomato.',
    price: 65000,
    category: 'Food',
    image: 'turkey-sandwich',
    customizations: {
        toppings: [ALL_TOPPINGS[6]]
    },
  },
  {
    id: 's2',
    name: 'Avocado Toast',
    description: 'Smashed avocado on toasted sourdough, topped with chili flakes.',
    price: 55000,
    category: 'Food',
    image: 'avocado-toast',
    customizations: {},
  },
  {
    id: 's3',
    name: 'Quiche Lorraine',
    description: 'A savory tart with bacon, eggs, and cheese in a flaky crust.',
    price: 50000,
    category: 'Food',
    image: 'quiche-lorraine',
    customizations: {},
  },
  {
    id: 'd1',
    name: 'Chocolate Chip Cookie',
    description: 'A warm, gooey, classic chocolate chip cookie, baked fresh.',
    price: 20000,
    category: 'Desserts',
    image: 'chocolate-cookie',
    customizations: {},
  },
  {
    id: 'd2',
    name: 'Blueberry Muffin',
    description: 'A fluffy muffin packed with juicy blueberries, with a crumbly top.',
    price: 28000,
    category: 'Desserts',
    image: 'blueberry-muffin',
    customizations: {},
  },
  {
    id: 'd3',
    name: 'Croissant',
    description: 'A buttery, flaky, and light pastry, perfect with any coffee.',
    price: 22000,
    category: 'Desserts',
    image: 'croissant',
    customizations: {},
  },
];
