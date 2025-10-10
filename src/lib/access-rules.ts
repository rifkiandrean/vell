export const accessRules = {
  roles: ['Owner', 'Manager', 'Spv F&B', 'Cashier', 'Waiter'],
  pages: ['Dashboard', 'Menu', 'Inventory', 'Orders', 'Vendors', 'Expenses', 'Reports', 'Kitchen', 'Cashier Page', 'Waiter Page'],
  permissions: {
    Owner: ['Dashboard', 'Menu', 'Inventory', 'Orders', 'Vendors', 'Expenses', 'Reports', 'Kitchen', 'Cashier Page', 'Waiter Page'],
    Manager: ['Dashboard', 'Menu', 'Inventory', 'Orders', 'Vendors', 'Expenses', 'Reports', 'Kitchen', 'Cashier Page', 'Waiter Page'],
    'Spv F&B': ['Dashboard', 'Menu', 'Inventory', 'Orders', 'Vendors', 'Expenses', 'Reports', 'Kitchen', 'Cashier Page', 'Waiter Page'],
    Cashier: ['Cashier Page', 'Reports'],
    Waiter: ['Waiter Page'],
  }
};
