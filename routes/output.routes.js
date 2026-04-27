const router = require('express').Router();
const auth = require('../middleware/auth');
const { getAll, getOne, 
        updateStatus, deleteOutput } = 
  require('../controllers/outputController');

router.get('/', auth, getAll);
router.get('/:id', auth, getOne);
router.put('/:id', auth, updateStatus);
router.delete('/:id', auth, deleteOutput);

module.exports = router;


