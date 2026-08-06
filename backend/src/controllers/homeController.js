// Controller for the home route
const getHome = (req, res) => {
  res.json({
    message: 'CredStreak Backend Running'
  });
};

module.exports = {
  getHome
};
