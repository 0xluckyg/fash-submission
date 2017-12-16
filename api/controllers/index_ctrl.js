
exports.show = (req, res, next) => {
  return res.render('index', {
    title: 'Fash API',
    content: "This is Fash's backend."
  });
};
