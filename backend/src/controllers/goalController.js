// Controller for goal-related requests
const getGoals = (req, res) => {
  const goals = [
    {
      id: 1,
      title: 'Finish the CredStreak MVP',
      stake: 50,
      deadline: '2026-08-31',
      status: 'active'
    },
    {
      id: 2,
      title: 'Write 5 blog posts about the product',
      stake: 25,
      deadline: '2026-09-15',
      status: 'pending'
    },
    {
      id: 3,
      title: 'Launch a demo for the hackathon',
      stake: 75,
      deadline: '2026-10-01',
      status: 'active'
    }
  ];

  res.json(goals);
};

module.exports = {
  getGoals
};
