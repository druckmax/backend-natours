const express = require('express');
const { getOverview, getTour } = require('../controllers/viewController');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).render('base', {
    tour: 'The Forst Hiker',
    user: 'Jonas',
  });
});

router.get('/overview', getOverview);

router.get('/tour', getTour);

module.exports = router;
