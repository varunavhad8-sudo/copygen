require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const result = await User.findOneAndUpdate(
    { email: 'studrycontact@gmail.com' },
    {
      plan: 'agency',
      generationsLimit: 999999,   // unlimited
      generationsUsed: 0,
    },
    { new: true }
  );

  if (!result) {
    console.log('❌ User not found: studrycontact@gmail.com');
  } else {
    console.log('✅ Plan updated successfully:');
    console.log(`   Email: ${result.email}`);
    console.log(`   Plan:  ${result.plan}`);
    console.log(`   Limit: ${result.generationsLimit}`);
  }

  await mongoose.disconnect();
  process.exit(0);
})();


