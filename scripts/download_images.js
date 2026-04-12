const fs = require('fs');
const https = require('https');
const path = require('path');

const targetDir = path.join(__dirname, '../public/images');

if (!fs.existsSync(targetDir)){
    fs.mkdirSync(targetDir, { recursive: true });
}

const images = [
  { name: 'hero.png', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80' },
  { name: 'signature_chicken.png', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80' },
  { name: 'tenders.png', url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80' },
  { name: 'sandwich.png', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
  { name: 'sides.png', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80' },
  { name: 'drink.png', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80' },
  { name: 'mac_cheese.png', url: 'https://images.unsplash.com/photo-1612871689353-cccf581d667b?w=400&q=80' }
];

images.forEach(img => {
  const file = fs.createWriteStream(path.join(targetDir, img.name));
  https.get(img.url, function(response) {
    if (response.statusCode === 302 || response.statusCode === 301) {
       https.get(response.headers.location, function(res2) {
          res2.pipe(file);
       });
    } else {
       response.pipe(file);
    }
  });
});

console.log("Images downloaded.");
