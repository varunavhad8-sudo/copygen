const router = require('express').Router();
const auth = require('../middleware/auth');
const { getAll, create, update, remove, use } = 
  require('../controllers/templateController');

router.get('/', auth, getAll);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);
router.post('/:id/use', auth, use);

module.exports = router;


