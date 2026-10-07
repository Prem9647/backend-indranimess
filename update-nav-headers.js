const fs = require('fs');
const path = require('path');

const stacks = [
  'AdminCustomersStack',
  'AdminMenuStack',
  'AdminTablesStack',
  'ManagerBillingStack',
  'ManagerCustomersStack',
  'ManagerMenuStack',
  'ManagerTablesStack',
];

const navDir = path.join(__dirname, '../client/src/navigation');

for (const stack of stacks) {
  const file = path.join(navDir, `${stack}.js`);
  let content = fs.readFileSync(file, 'utf8');

  // Move headerRight from screenOptions into the shared spread, and remove it from individual screen options
  content = content.replace(
    /screenOptions=\{PAGE_HEADER_SCREEN_OPTIONS\}/g,
    'screenOptions={{ ...PAGE_HEADER_SCREEN_OPTIONS, headerRight: () => <LogoutButton /> }}'
  );
  content = content.replace(
    /options=\{isWide \? \{ headerShown: false \} : \{ title: "([^"]+)", headerRight: \(\) => <LogoutButton \/> \}\}/g,
    'options={isWide ? { headerShown: false } : { title: "$1" }}'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated ${stack}.js`);
}
