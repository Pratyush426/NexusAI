const bcrypt = require('bcryptjs');

async function test() {
  try {
    const pass = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pass, salt);
    console.log('Hash created:', hash);
    const match = await bcrypt.compare(pass, hash);
    console.log('Match:', match);
  } catch (err) {
    console.error('Error during bcrypt test:', err);
  }
}

test();
