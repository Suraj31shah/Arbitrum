// Controller for the home route
const getHome = (req, res) => {
  res.json({
    message: 'CommitX API is running',
  });
};

module.exports = {
  getHome
};
