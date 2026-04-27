const router = require('express').Router();
const auth = require('../middleware/auth');
const { getAll, create, update, remove } = 
  require('../controllers/clientController');
const clientLimiter = require('../middleware/clientLimiter');

router.get('/', auth, getAll);
router.post('/', auth, clientLimiter, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);

module.exports = router;


