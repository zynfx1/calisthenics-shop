import { Router } from 'express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import cartRoutes from './cart.routes';
import categoryRoutes from './categories.routes';
import orderRoutes from './orders.routes';
import productRoutes from './products.routes';
import uploadRoutes from './uploads.routes';
import userRoutes from './users.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/uploads', uploadRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);

export default router;
