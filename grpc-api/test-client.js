const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const packageDefinition = protoLoader.loadSync(
  path.join(__dirname, 'proto/hero.proto'),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  },
);

const heroProto = grpc.loadPackageDefinition(packageDefinition).hero;

const client = new heroProto.HeroService(
  'localhost:5003',
  grpc.credentials.createInsecure(),
);

// Test FindMany
client.findMany({}, (error, heroes) => {
  if (!error) {
    console.log('FindMany result:', heroes);
  } else {
    console.error('FindMany error:', error);
  }
});

// Test FindOne
client.findOne({ id: 1 }, (error, hero) => {
  if (!error) {
    console.log('FindOne result:', hero);
  } else {
    console.error('FindOne error:', error);
  }
});

// Test CreateHero
client.createHero({ name: 'Spider-Man' }, (error, hero) => {
  if (!error) {
    console.log('CreateHero result:', hero);
  } else {
    console.error('CreateHero error:', error);
  }
});
