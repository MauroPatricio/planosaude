import mongoose from 'mongoose';

async function checkDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/planosaude');
    console.log('Connected to DB');

    const TenantSchema = new mongoose.Schema({ name: String });
    const UserSchema = new mongoose.Schema({ name: String, role: String, tenant: mongoose.Schema.Types.ObjectId });
    const ClientSchema = new mongoose.Schema({ name: String });

    const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema);

    const tenantCount = await Tenant.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const superAdminCount = await User.countDocuments({ role: 'superAdmin' });
    const clientCount = await Client.countDocuments();

    console.log('--- DB Check ---');
    console.log('Tenants:', tenantCount);
    console.log('Admins:', adminCount);
    console.log('SuperAdmins:', superAdminCount);
    console.log('Clients:', clientCount);

    if (tenantCount === 0) {
      console.log('RESULT: NO_TENANTS');
    } else if (adminCount === 0 && superAdminCount === 0) {
      console.log('RESULT: NO_ADMINS');
    } else {
      console.log('RESULT: OK');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error checking DB:', err);
    process.exit(1);
  }
}

checkDB();
